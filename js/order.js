/* ============================================
   MangoFlow — Order Form Logic
   Handles product selection, cart, and submission
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── State ──
  const cart = new Map(); // productId -> { product, boxSize, quantity }
  let currentStep = 1;

  // ── DOM Refs ──
  const productGrid = document.getElementById('product-grid');
  const productConfigs = document.getElementById('product-configs');
  const summaryBody = document.getElementById('order-summary-body');
  const orderSummary = document.getElementById('order-summary');
  const btnToStep2 = document.getElementById('btn-to-step-2');
  const btnBackTo1 = document.getElementById('btn-back-to-1');
  const customerForm = document.getElementById('customer-form');
  const navbar = document.getElementById('navbar');

  // ── Render Product Cards ──
  function renderProducts() {
    productGrid.innerHTML = PRODUCTS.map(product => `
      <div class="mango-card animate-in" data-product-id="${product.id}" id="mango-card-${product.id}">
        <div class="check-icon">✓</div>
        ${product.tag ? `<span class="badge badge-pending" style="position:absolute; top:16px; right:48px; font-size:0.65rem;">${product.tag}</span>` : ''}
        <span class="mango-emoji">${product.emoji}</span>
        <div class="mango-name">${product.name}</div>
        <div class="mango-urdu">${product.urdu}</div>
        <p class="mango-desc">${product.description}</p>
        <div class="mango-price">From ${formatCurrency(Math.min(product.prices['5kg'], product.prices['10kg']))}</div>
      </div>
    `).join('');

    // Attach click handlers
    productGrid.querySelectorAll('.mango-card').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        toggleProduct(productId);
      });
    });
  }

  // ── Toggle Product Selection ──
  function toggleProduct(productId) {
    const card = document.getElementById(`mango-card-${productId}`);

    if (cart.has(productId)) {
      // Deselect
      cart.delete(productId);
      card.classList.remove('selected');
    } else {
      // Select with defaults
      const product = PRODUCTS.find(p => p.id === productId);
      cart.set(productId, {
        product,
        boxSize: '5kg',
        quantity: 1
      });
      card.classList.add('selected');
    }

    renderProductConfigs();
    updateSummary();
    updateStepButton();
  }

  // ── Render Box Size + Quantity for Selected Products ──
  function renderProductConfigs() {
    if (cart.size === 0) {
      productConfigs.innerHTML = '';
      return;
    }

    productConfigs.innerHTML = Array.from(cart.entries()).map(([id, item]) => {
      const p = item.product;
      return `
        <div class="card card-body mt-md animate-in" id="config-${id}">
          <div class="flex items-center justify-between" style="margin-bottom: var(--space-md);">
            <div class="flex items-center gap-md">
              <span style="font-size:1.5rem;">${p.emoji}</span>
              <div>
                <strong>${p.name}</strong>
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 8px;">${p.urdu}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-lg" style="flex-wrap: wrap;">
            <div>
              <label class="form-label" style="margin-bottom: 8px;">Box Size</label>
              <div class="box-selector">
                <div class="box-option ${item.boxSize === '5kg' ? 'selected' : ''}"
                     data-product="${id}" data-size="5kg">
                  <div class="box-weight">5 kg</div>
                  <div class="box-price">${formatCurrency(p.prices['5kg'])}</div>
                  <div class="box-count">${p.pieces['5kg']}</div>
                </div>
                <div class="box-option ${item.boxSize === '10kg' ? 'selected' : ''}"
                     data-product="${id}" data-size="10kg">
                  <div class="box-weight">10 kg</div>
                  <div class="box-price">${formatCurrency(p.prices['10kg'])}</div>
                  <div class="box-count">${p.pieces['10kg']}</div>
                </div>
              </div>
            </div>

            <div>
              <label class="form-label" style="margin-bottom: 8px;">Quantity (boxes)</label>
              <div class="quantity-control">
                <button type="button" data-product="${id}" data-action="decrease">−</button>
                <span class="qty-value" id="qty-${id}">${item.quantity}</span>
                <button type="button" data-product="${id}" data-action="increase">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach box size handlers
    productConfigs.querySelectorAll('.box-option').forEach(option => {
      option.addEventListener('click', () => {
        const productId = option.dataset.product;
        const size = option.dataset.size;
        const item = cart.get(productId);
        if (item) {
          item.boxSize = size;
          renderProductConfigs();
          updateSummary();
        }
      });
    });

    // Attach quantity handlers
    productConfigs.querySelectorAll('.quantity-control button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.product;
        const action = btn.dataset.action;
        const item = cart.get(productId);
        if (item) {
          if (action === 'increase' && item.quantity < 20) {
            item.quantity++;
          } else if (action === 'decrease' && item.quantity > 1) {
            item.quantity--;
          }
          document.getElementById(`qty-${productId}`).textContent = item.quantity;
          updateSummary();
        }
      });
    });
  }

  // ── Update Order Summary ──
  function updateSummary() {
    if (cart.size === 0) {
      summaryBody.innerHTML = `
        <div class="order-summary-empty">
          <span class="empty-icon">🥭</span>
          <p>Select your favourite mangoes to get started!</p>
        </div>
      `;
      // Remove footer if exists
      const existingFooter = orderSummary.querySelector('.order-summary-footer');
      if (existingFooter) existingFooter.remove();
      return;
    }

    let total = 0;
    const itemsHtml = Array.from(cart.entries()).map(([id, item]) => {
      const subtotal = item.product.prices[item.boxSize] * item.quantity;
      total += subtotal;
      return `
        <div class="order-item">
          <div>
            <div class="order-item-name">${item.product.emoji} ${item.product.name}</div>
            <div class="order-item-details">${item.boxSize} box × ${item.quantity}</div>
            <span class="order-item-remove" data-product="${id}">Remove</span>
          </div>
          <div class="order-item-price">${formatCurrency(subtotal)}</div>
        </div>
      `;
    }).join('');

    summaryBody.innerHTML = itemsHtml;

    // Add/update footer
    let footer = orderSummary.querySelector('.order-summary-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'order-summary-footer';
      orderSummary.appendChild(footer);
    }
    footer.innerHTML = `
      <div class="order-total">
        <span class="order-total-label">Total</span>
        <span class="order-total-value">${formatCurrency(total)}</span>
      </div>
    `;

    // Attach remove handlers
    summaryBody.querySelectorAll('.order-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.product;
        cart.delete(productId);
        const card = document.getElementById(`mango-card-${productId}`);
        if (card) card.classList.remove('selected');
        renderProductConfigs();
        updateSummary();
        updateStepButton();
      });
    });
  }

  // ── Update Step Button State ──
  function updateStepButton() {
    btnToStep2.disabled = cart.size === 0;
  }

  // ── Step Navigation ──
  function goToStep(step) {
    currentStep = step;

    // Update step indicator
    document.querySelectorAll('#step-indicator .step').forEach(s => {
      const sStep = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (sStep === step) s.classList.add('active');
      if (sStep < step) s.classList.add('completed');
    });

    // Show/hide content
    document.getElementById('step-1-content').classList.toggle('hidden', step !== 1);
    document.getElementById('step-2-content').classList.toggle('hidden', step !== 2);
    document.getElementById('step-3-content').classList.toggle('hidden', step !== 3);

    // Show/hide order summary on confirmation
    document.getElementById('order-summary-wrapper').classList.toggle('hidden', step === 3);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Step 1 → Step 2
  btnToStep2.addEventListener('click', () => {
    if (cart.size > 0) {
      goToStep(2);
    }
  });

  // Step 2 → Step 1
  btnBackTo1.addEventListener('click', () => {
    goToStep(1);
  });

  // ── Form Validation & Submission ──
  customerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate
    const fields = [
      { id: 'customer-name', validate: v => v.trim().length >= 2 },
      { id: 'customer-phone', validate: v => v.trim().length >= 7 },
      { id: 'customer-address', validate: v => v.trim().length >= 3 },
      { id: 'customer-city', validate: v => v.trim().length >= 2 },
      { id: 'customer-postcode', validate: v => v.trim().length >= 3 }
    ];

    let valid = true;
    fields.forEach(f => {
      const input = document.getElementById(f.id);
      if (!f.validate(input.value)) {
        input.classList.add('error');
        valid = false;
      } else {
        input.classList.remove('error');
      }
    });

    if (!valid) return;

    // Build order data
    const items = Array.from(cart.entries()).map(([id, item]) => ({
      productId: id,
      name: item.product.name,
      boxSize: item.boxSize,
      quantity: item.quantity,
      pricePerBox: item.product.prices[item.boxSize],
      subtotal: item.product.prices[item.boxSize] * item.quantity
    }));

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    const orderData = {
      customer: {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        address: document.getElementById('customer-address').value.trim(),
        city: document.getElementById('customer-city').value.trim(),
        postcode: document.getElementById('customer-postcode').value.trim(),
        notes: document.getElementById('customer-notes').value.trim()
      },
      items,
      total
    };

    // Save to localStorage
    const order = OrderStore.addOrder(orderData);

    // Show confirmation
    showConfirmation(order);
    goToStep(3);
  });

  // ── Show Confirmation Screen ──
  function showConfirmation(order) {
    const itemsList = order.items.map(i =>
      `<div class="detail-row">
        <span class="detail-label">${i.name} (${i.boxSize} × ${i.quantity})</span>
        <span class="detail-value">${formatCurrency(i.subtotal)}</span>
      </div>`
    ).join('');

    document.getElementById('confirmation-screen').innerHTML = `
      <div class="confirmation-icon">✓</div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you, ${order.customer.name}! Your mangoes are on their way 🥭</p>

      <div class="order-id-box">${order.id}</div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-xl);">
        Save this order ID for your records
      </p>

      <div class="payment-info">
        <h4>📋 Order Summary</h4>
        ${itemsList}
        <div class="detail-row" style="border-top: 2px solid rgba(0,0,0,0.06); padding-top: var(--space-sm); margin-top: var(--space-sm);">
          <span class="detail-label" style="font-weight:700; color: var(--text);">Total</span>
          <span class="detail-value" style="font-size: 1.15rem; color: var(--green-deep);">${formatCurrency(order.total)}</span>
        </div>
      </div>

      <div class="payment-info">
        <h4>💷 Payment Details</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: var(--space-md);">
          Please transfer the total amount to the following account:
        </p>
        <div class="detail-row">
          <span class="detail-label">Bank</span>
          <span class="detail-value">Barclays</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account Name</span>
          <span class="detail-value">Fruit Mandi</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Sort Code</span>
          <span class="detail-value">XX-XX-XX</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account No</span>
          <span class="detail-value">XXXXXXXX</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reference</span>
          <span class="detail-value" style="color: var(--gold-dark); font-weight:700;">${order.id}</span>
        </div>
      </div>

      <div class="flex gap-md justify-center" style="flex-wrap: wrap;">
        <a href="${getWhatsAppLink('4403074583132', `Hi! I just placed order ${order.id} for mangoes. My name is ${order.customer.name}.`)}"
           target="_blank" class="btn btn-whatsapp btn-lg">
          💬 Confirm on WhatsApp
        </a>
        <button class="btn btn-secondary btn-lg" onclick="location.reload()">
          🥭 Place Another Order
        </button>
      </div>

      <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: var(--space-xl);">
        Delivery within 3-5 working days after payment confirmation.<br>
        For any questions, WhatsApp us at <a href="https://wa.me/4403074583132" style="color: var(--green-deep); font-weight: 600;">03074583132</a>
      </p>
    `;
  }

  // ── Navbar scroll effect ──
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ── Clear validation on input ──
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
    });
  });

  // ── Initialize ──
  renderProducts();
  updateSummary();
  updateStepButton();
});
