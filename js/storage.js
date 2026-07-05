/* ============================================
   MangoFlow — Data Layer (localStorage)
   Clean API for order management
   ============================================ */

const STORAGE_KEY = 'mangoflow_orders';
const SETTINGS_KEY = 'mangoflow_settings';

// ── Product Catalog ──
const PRODUCTS = [
  {
    id: 'sindhri',
    name: 'Sindhri',
    urdu: 'سندھری',
    emoji: '🥭',
    description: 'The King of Mangoes — Large, sweet, fiber-free with golden yellow skin. Most popular export variety.',
    prices: { '5kg': 30, '10kg': 55 },
    pieces: { '5kg': '6–8 mangoes', '10kg': '14–18 mangoes' },
    tag: 'Most Popular'
  },
  {
    id: 'chaunsa',
    name: 'Chaunsa',
    urdu: 'چونسا',
    emoji: '🥭',
    description: 'Aromatic and incredibly juicy with a rich, honey-like sweetness. A true Pakistani classic.',
    prices: { '5kg': 32, '10kg': 58 },
    pieces: { '5kg': '8–10 mangoes', '10kg': '16–22 mangoes' },
    tag: 'Premium'
  },
  {
    id: 'anwar-ratol',
    name: 'Anwar Ratol',
    urdu: 'انور ریٹول',
    emoji: '🥭',
    description: 'Small but intensely sweet. Known as the "sweetest mango in the world" — a true delicacy.',
    prices: { '5kg': 35, '10kg': 65 },
    pieces: { '5kg': '14–18 mangoes', '10kg': '28–36 mangoes' },
    tag: 'Sweetest'
  },
  {
    id: 'langra',
    name: 'Langra',
    urdu: 'لنگڑا',
    emoji: '🥭',
    description: 'Tangy-sweet with a unique flavor profile. Green skin even when ripe — don\'t let the color fool you!',
    prices: { '5kg': 28, '10kg': 50 },
    pieces: { '5kg': '6–8 mangoes', '10kg': '12–16 mangoes' },
    tag: 'Unique'
  }
];

// ── OrderStore API ──
const OrderStore = {
  // Get all orders from localStorage
  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load orders:', e);
      return [];
    }
  },

  // Save orders to localStorage
  _save(orders) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders:', e);
    }
  },

  // Generate a unique order ID (FM-XXXXX)
  _generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'FM-';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  },

  // Add a new order
  addOrder(orderData) {
    const orders = this._load();
    const order = {
      id: this._generateId(),
      ...orderData,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.unshift(order); // newest first
    this._save(orders);
    return order;
  },

  // Get single order by ID
  getOrder(id) {
    const orders = this._load();
    return orders.find(o => o.id === id) || null;
  },

  // Get orders with optional filters
  getOrders(filters = {}) {
    let orders = this._load();

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      orders = orders.filter(o => o.status === filters.status);
    }

    // Filter by payment status
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      orders = orders.filter(o => o.paymentStatus === filters.paymentStatus);
    }

    // Search by name, phone, or order ID
    if (filters.search) {
      const q = filters.search.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        o.customer.city.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filters.sort === 'oldest') {
      orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filters.sort === 'total-high') {
      orders.sort((a, b) => b.total - a.total);
    } else if (filters.sort === 'total-low') {
      orders.sort((a, b) => a.total - b.total);
    } else {
      // Default: newest first
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return orders;
  },

  // Update order status
  updateStatus(id, status) {
    const orders = this._load();
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this._save(orders);
      return order;
    }
    return null;
  },

  // Update payment status
  updatePayment(id, paymentStatus) {
    const orders = this._load();
    const order = orders.find(o => o.id === id);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
      this._save(orders);
      return order;
    }
    return null;
  },

  // Delete order
  deleteOrder(id) {
    let orders = this._load();
    orders = orders.filter(o => o.id !== id);
    this._save(orders);
  },

  // Get aggregate stats
  getStats() {
    const orders = this._load();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0),
      paid: orders.filter(o => o.paymentStatus === 'paid').length,
      unpaid: orders.filter(o => o.paymentStatus === 'unpaid').length,
      todayOrders: orders.filter(o => {
        const today = new Date().toDateString();
        return new Date(o.createdAt).toDateString() === today;
      }).length
    };
  },

  // Export orders as CSV
  exportCSV(filters = {}) {
    const orders = this.getOrders(filters);
    const headers = [
      'Order ID', 'Date', 'Customer Name', 'Phone', 'Address',
      'City', 'Postcode', 'Items', 'Total (£)', 'Status',
      'Payment', 'Notes'
    ];

    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleDateString('en-GB'),
      o.customer.name,
      o.customer.phone,
      o.customer.address,
      o.customer.city,
      o.customer.postcode,
      o.items.map(i => `${i.name} (${i.boxSize}×${i.quantity})`).join('; '),
      o.total.toFixed(2),
      o.status,
      o.paymentStatus,
      o.customer.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mangoflow-orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // Seed realistic demo data
  seedDemoData() {
    // Only seed if no orders exist
    if (this._load().length > 0) return;

    const names = [
      'Ahmed Khan', 'Fatima Malik', 'Usman Ali', 'Zainab Hussain',
      'Bilal Ahmed', 'Ayesha Siddiqui', 'Imran Shah', 'Sana Riaz',
      'Tariq Mehmood', 'Nadia Butt', 'Kamran Iqbal', 'Hina Javed',
      'Waseem Akram', 'Rabia Noor', 'Faisal Qureshi'
    ];

    const phones = [
      '+44 7412 345678', '+44 7523 456789', '+44 7634 567890',
      '+44 7745 678901', '+44 7856 789012', '+44 7967 890123',
      '+44 7478 901234', '+44 7589 012345', '+44 7690 123456',
      '+44 7401 234567', '+44 7512 345678', '+44 7623 456789',
      '+44 7734 567890', '+44 7845 678901', '+44 7956 789012'
    ];

    const cities = [
      'Glasgow', 'Glasgow', 'Glasgow', 'London', 'London',
      'Birmingham', 'Manchester', 'Bradford', 'Leeds', 'Glasgow',
      'Edinburgh', 'London', 'Glasgow', 'Manchester', 'Birmingham'
    ];

    const addresses = [
      '24 Victoria Road', '15 Queen Street', '8 Park Avenue',
      '42 High Street', '31 Station Road', '7 Mill Lane',
      '19 Church Street', '55 King Street', '3 Castle Road',
      '28 Bridge Street', '11 Market Square', '66 George Street',
      '14 Main Road', '9 Albert Drive', '37 Windsor Terrace'
    ];

    const postcodes = [
      'G42 8YL', 'G12 9AB', 'G41 3PQ', 'E1 6AN', 'W12 7SB',
      'B11 1AR', 'M14 5PT', 'BD7 3AH', 'LS8 2HG', 'G51 1DA',
      'EH6 8ES', 'N1 5QJ', 'G32 7HW', 'M16 0RA', 'B28 9EW'
    ];

    const statuses = [
      'pending', 'pending', 'pending', 'confirmed', 'confirmed',
      'confirmed', 'shipped', 'shipped', 'delivered', 'delivered',
      'delivered', 'pending', 'confirmed', 'shipped', 'cancelled'
    ];

    const paymentStatuses = [
      'unpaid', 'paid', 'unpaid', 'paid', 'paid',
      'unpaid', 'paid', 'paid', 'paid', 'paid',
      'paid', 'unpaid', 'paid', 'paid', 'unpaid'
    ];

    const demoOrders = names.map((name, i) => {
      // Randomly pick 1-3 mango varieties
      const numItems = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
      const selectedProducts = shuffled.slice(0, numItems);

      const items = selectedProducts.map(p => {
        const boxSize = Math.random() > 0.4 ? '10kg' : '5kg';
        const quantity = Math.floor(Math.random() * 3) + 1;
        return {
          productId: p.id,
          name: p.name,
          boxSize,
          quantity,
          pricePerBox: p.prices[boxSize],
          subtotal: p.prices[boxSize] * quantity
        };
      });

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);

      // Random dates in the last 7 days
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);

      return {
        id: `FM-${String(10001 + i).slice(1)}${String.fromCharCode(65 + i)}`,
        customer: {
          name: name,
          phone: phones[i],
          address: addresses[i],
          city: cities[i],
          postcode: postcodes[i],
          notes: i % 4 === 0 ? 'Please deliver in the evening after 6 PM' :
                 i % 5 === 0 ? 'Ring the bell twice, ground floor flat' : ''
        },
        items,
        total,
        status: statuses[i],
        paymentStatus: paymentStatuses[i],
        createdAt: date.toISOString(),
        updatedAt: date.toISOString()
      };
    });

    this._save(demoOrders);
    console.log(`✅ Seeded ${demoOrders.length} demo orders`);
  },

  // Clear all orders (for development)
  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ── Utility: Format currency ──
function formatCurrency(amount) {
  return `£${Number(amount).toFixed(2)}`;
}

// ── Utility: Format date ──
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  if (diffHours < 48) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// ── Utility: Format full date ──
function formatFullDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Utility: WhatsApp click-to-chat ──
function getWhatsAppLink(phone, message = '') {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}${message ? '?text=' + encoded : ''}`;
}

// ── Utility: Show toast notification ──
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span> ${message}`;
  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
