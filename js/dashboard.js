/* ============================================
   MangoFlow — Dashboard Logic
   Order management, filtering, and actions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM Refs ──
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterPayment = document.getElementById('filter-payment');
  const filterSort = document.getElementById('filter-sort');
  const ordersTbody = document.getElementById('orders-tbody');
  const orderCount = document.getElementById('order-count');
  const emptyState = document.getElementById('empty-state');
  const tableWrapper = document.querySelector('.table-scroll');
  const btnExport = document.getElementById('btn-export-csv');
  const btnSeed = document.getElementById('btn-seed-data');
  const modal = document.getElementById('order-modal');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const navbar = document.getElementById('navbar');

  // ── Status Config ──
  const STATUS_CONFIG = {
    pending: { label: 'Pending', class: 'badge-pending', next: 'confirmed', nextLabel: '✓ Confirm' },
    confirmed: { label: 'Confirmed', class: 'badge-confirmed', next: 'shipped', nextLabel: '📦 Mark Shipped' },
    shipped: { label: 'Shipped', class: 'badge-shipped', next: 'delivered', nextLabel: '🏠 Mark Delivered' },
    delivered: { label: 'Delivered', class: 'badge-delivered', next: null, nextLabel: null },
    cancelled: { label: 'Cancelled', class: 'badge-cancelled', next: null, nextLabel: null }
  };

  // ── Render Stats ──
  function renderStats() {
    const stats = OrderStore.getStats();
    animateValue('stat-total', stats.total);
    animateValue('stat-pending', stats.pending);
    animateValue('stat-confirmed', stats.confirmed + stats.shipped);
    document.getElementById('stat-revenue').textContent = formatCurrency(stats.revenue);
  }

  // ── Animate stat value ──
  function animateValue(elementId, endValue) {
    const el = document.getElementById(elementId);
    const duration = 600;
    const startTime = performance.now();
    const startValue = parseInt(el.textContent) || 0;

    if (startValue === endValue) {
      el.textContent = endValue;
      return;
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(startValue + (endValue - startValue) * eased);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // ── Get current filters ──
  function getFilters() {
    return {
      search: searchInput.value.trim(),
      status: filterStatus.value,
      paymentStatus: filterPayment.value,
      sort: filterSort.value
    };
  }

  // ── Render Orders Table ──
  function renderOrders() {
    const filters = getFilters();
    const orders = OrderStore.getOrders(filters);

    orderCount.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
      ordersTbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      tableWrapper.style.display = 'none';
      return;
    }

    emptyState.classList.add('hidden');
    tableWrapper.style.display = 'block';

    ordersTbody.innerHTML = orders.map(order => {
      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
      const itemsPreview = order.items.map(i => `${i.name} (${i.boxSize}×${i.quantity})`).join(', ');

      return `
        <tr data-order-id="${order.id}">
          <td>
            <strong style="color: var(--green-deep); cursor: pointer;" class="order-id-link"
                    data-order-id="${order.id}">${order.id}</strong>
          </td>
          <td>
            <div class="customer-name">${escapeHtml(order.customer.name)}</div>
            <div class="customer-phone">${escapeHtml(order.customer.phone)}</div>
          </td>
          <td class="hide-mobile">
            <div class="order-items-preview" title="${escapeHtml(itemsPreview)}">
              ${escapeHtml(itemsPreview)}
            </div>
          </td>
          <td>
            <span class="order-total">${formatCurrency(order.total)}</span>
          </td>
          <td>
            <span class="badge badge-dot ${statusConfig.class}">
              ${statusConfig.label}
            </span>
          </td>
          <td class="hide-mobile">
            <span class="badge badge-dot badge-${order.paymentStatus}">
              ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
          </td>
          <td class="hide-mobile">
            <span class="order-date" title="${formatFullDate(order.createdAt)}">
              ${formatDate(order.createdAt)}
            </span>
          </td>
          <td>
            <div class="actions">
              <button class="btn-icon" title="View details" data-action="view" data-order-id="${order.id}">
                👁️
              </button>
              <a href="${getWhatsAppLink(order.customer.phone, `Assalam o Alaikum ${order.customer.name}! Regarding your mango order ${order.id}...`)}"
                 target="_blank" class="btn-icon" title="WhatsApp">
                💬
              </a>
              ${statusConfig.next ? `
                <button class="btn btn-sm btn-green" data-action="advance-status"
                        data-order-id="${order.id}" data-next-status="${statusConfig.next}">
                  ${statusConfig.nextLabel}
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row event handlers
    attachRowHandlers();
  }

  // ── Attach handlers to table rows ──
  function attachRowHandlers() {
    // View detail
    ordersTbody.querySelectorAll('[data-action="view"], .order-id-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.orderId;
        openOrderModal(orderId);
      });
    });

    // Advance status
    ordersTbody.querySelectorAll('[data-action="advance-status"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.orderId;
        const nextStatus = btn.dataset.nextStatus;
        OrderStore.updateStatus(orderId, nextStatus);
        renderOrders();
        renderStats();
        showToast(`Order ${orderId} → ${STATUS_CONFIG[nextStatus].label}`);
      });
    });
  }

  // ── Open Order Detail Modal ──
  function openOrderModal(orderId) {
    const order = OrderStore.getOrder(orderId);
    if (!order) return;

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

    modalTitle.textContent = `Order ${order.id}`;

    modalBody.innerHTML = `
      <div class="order-detail-grid">
        <div class="detail-section">
          <h4>👤 Customer</h4>
          <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value">${escapeHtml(order.customer.name)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">${escapeHtml(order.customer.phone)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Address</span>
            <span class="detail-value">${escapeHtml(order.customer.address)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">City</span>
            <span class="detail-value">${escapeHtml(order.customer.city)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Postcode</span>
            <span class="detail-value">${escapeHtml(order.customer.postcode)}</span>
          </div>
          ${order.customer.notes ? `
            <div class="detail-row">
              <span class="detail-label">Notes</span>
              <span class="detail-value" style="font-style: italic;">${escapeHtml(order.customer.notes)}</span>
            </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4>📦 Order Items</h4>
          ${order.items.map(i => `
            <div class="detail-row">
              <span class="detail-label">${i.name} (${i.boxSize} × ${i.quantity})</span>
              <span class="detail-value">${formatCurrency(i.subtotal)}</span>
            </div>
          `).join('')}
          <div class="detail-row" style="border-top: 2px solid rgba(0,0,0,0.08); padding-top: 8px; margin-top: 8px;">
            <span class="detail-label" style="font-weight:700; color: var(--text);">Total</span>
            <span class="detail-value" style="font-size: 1.15rem; color: var(--green-deep);">${formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: var(--space-lg); display: flex; gap: var(--space-md); flex-wrap: wrap;">
        <div>
          <label class="form-label">Order Status</label>
          <select class="filter-select" id="modal-status-select" style="width: auto;">
            ${Object.entries(STATUS_CONFIG).map(([key, val]) =>
              `<option value="${key}" ${key === order.status ? 'selected' : ''}>${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Payment Status</label>
          <select class="filter-select" id="modal-payment-select" style="width: auto;">
            <option value="unpaid" ${order.paymentStatus === 'unpaid' ? 'selected' : ''}>Unpaid</option>
            <option value="paid" ${order.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
          </select>
        </div>
      </div>

      <div style="margin-top: var(--space-md); font-size: 0.8rem; color: var(--text-muted);">
        Created: ${formatFullDate(order.createdAt)} • Updated: ${formatFullDate(order.updatedAt)}
      </div>
    `;

    modalFooter.innerHTML = `
      <a href="${getWhatsAppLink(order.customer.phone, `Assalam o Alaikum ${order.customer.name}! Regarding your mango order ${order.id}...`)}"
         target="_blank" class="btn btn-whatsapp btn-sm">
        💬 WhatsApp Customer
      </a>
      <button class="btn btn-danger btn-sm" id="modal-delete-btn">🗑️ Delete</button>
      <button class="btn btn-primary btn-sm" id="modal-save-btn">💾 Save Changes</button>
    `;

    // Show modal
    modal.classList.add('active');

    // Save handler
    document.getElementById('modal-save-btn').addEventListener('click', () => {
      const newStatus = document.getElementById('modal-status-select').value;
      const newPayment = document.getElementById('modal-payment-select').value;
      OrderStore.updateStatus(orderId, newStatus);
      OrderStore.updatePayment(orderId, newPayment);
      closeModal();
      renderOrders();
      renderStats();
      showToast(`Order ${orderId} updated`);
    });

    // Delete handler
    document.getElementById('modal-delete-btn').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
        OrderStore.deleteOrder(orderId);
        closeModal();
        renderOrders();
        renderStats();
        showToast(`Order ${orderId} deleted`, 'warning');
      }
    });
  }

  // ── Close Modal ──
  function closeModal() {
    modal.classList.remove('active');
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ── Filter Change Handlers ──
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(renderOrders, 300);
  });

  filterStatus.addEventListener('change', renderOrders);
  filterPayment.addEventListener('change', renderOrders);
  filterSort.addEventListener('change', renderOrders);

  // ── Export CSV ──
  btnExport.addEventListener('click', () => {
    OrderStore.exportCSV(getFilters());
    showToast('Orders exported as CSV');
  });

  // ── Seed Demo Data ──
  btnSeed.addEventListener('click', () => {
    if (OrderStore.getOrders().length > 0) {
      if (!confirm('This will clear existing orders and load demo data. Continue?')) return;
      OrderStore.clearAll();
    }
    OrderStore.seedDemoData();
    renderOrders();
    renderStats();
    showToast('🌱 Demo data loaded!');
  });

  // ── Navbar scroll effect ──
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ── HTML Escape ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Initialize ──
  renderStats();
  renderOrders();
});
