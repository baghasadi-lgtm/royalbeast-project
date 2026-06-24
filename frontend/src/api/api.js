import axios from 'axios';

const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_URL = import.meta.env.VITE_API_URL || `http://${defaultHost}:5001/api`;

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const handle = (promise) =>
  promise
    .then((res) => res.data)
    .catch((error) => {
      let msg = error.response?.data?.error || error.message;
      if (!error.response && error.message === 'Network Error') {
        msg = `Tidak bisa connect ke server (${API_URL}). Pastikan backend jalan & satu WiFi.`;
      }
      console.error('API Error:', msg, API_URL);
      throw new Error(msg);
    });

export const api = {
  setToken(token) {
    if (token) {
      client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common.Authorization;
    }
  },

  // Auth
  login: (username, password) => handle(client.post('/auth/login', { username, password })),
  getMe: () => handle(client.get('/auth/me')),
  changePassword: (currentPassword, newPassword) =>
    handle(client.post('/auth/change-password', { currentPassword, newPassword })),
  updateNotificationPreference: (enabled) =>
    handle(client.patch('/auth/notifications', { enabled })),

  // Settings
  getQrisSetting: () => handle(client.get('/settings/qris')),
  updateQrisSetting: async (formData) => {
    const response = await client.put('/settings/qris', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Users (owner)
  getUsers: () => handle(client.get('/users')),
  createUser: (data) => handle(client.post('/users', data)),
  deleteUser: (id) => handle(client.delete(`/users/${id}`)),
  resetUserPassword: (id, newPassword) =>
    handle(client.post(`/users/${id}/reset-password`, { newPassword })),

  // Queue
  getCurrentQueue: () => handle(client.get('/orders/queue')),
  getPublicQueueBoard: () => handle(client.get('/orders/queue/board')),
  trackQueue: (queueNumber) => handle(client.get(`/orders/track/${queueNumber}`)),
  getReceipt: (queueNumber) => handle(client.get(`/orders/receipt/${queueNumber}`)),

  // Services
  getServices: () => handle(client.get('/services')),
  getServiceById: (id) => handle(client.get(`/services/${id}`)),
  createService: (data) => handle(client.post('/services', data)),
  updateService: (id, data) => handle(client.put(`/services/${id}`, data)),
  deleteService: (id) => handle(client.delete(`/services/${id}`)),

  // Kapsters
  getKapsters: () => handle(client.get('/kapsters')),
  getKapsterById: (id) => handle(client.get(`/kapsters/${id}`)),
  getKapstersByService: (serviceId) => handle(client.get(`/prices/service/${serviceId}`)),
  createKapster: (data) => handle(client.post('/kapsters', data)),
  updateKapsterMeta: (id, data) => handle(client.patch(`/kapsters/${id}`, data)),
  updateKapster: async (id, formData) => {
    const response = await client.put(`/kapsters/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteKapster: (id) => handle(client.delete(`/kapsters/${id}`)),

  // Prices
  getPricesByKapster: (kapsterId) => handle(client.get(`/prices/kapster/${kapsterId}`)),
  getKapsterServiceCatalog: (kapsterId) => handle(client.get(`/prices/kapster/${kapsterId}/catalog`)),
  toggleKapsterService: (kapsterId, serviceId, enabled) =>
    handle(client.post(`/prices/kapster/${kapsterId}/toggle/${serviceId}`, { enabled })),
  updatePrice: (kapsterId, serviceId, data) => handle(client.put(`/prices/${kapsterId}/${serviceId}`, data)),
  requestPriceChange: (kapsterId, serviceId, harga_jual) =>
    handle(client.post(`/prices/${kapsterId}/${serviceId}/request`, { harga_jual })),
  getPendingApprovals: () => handle(client.get('/prices/pending')),
  approvePriceChange: (kapsterId, serviceId, approved) =>
    handle(client.post(`/prices/${kapsterId}/${serviceId}/approve`, { approved })),

  // Products
  getProducts: (params) => handle(client.get('/products', { params })),
  getProductById: (id) => handle(client.get(`/products/${id}`)),
  createProduct: (data) => handle(client.post('/products', data)),
  updateProduct: (id, data) => handle(client.put(`/products/${id}`, data)),
  deleteProduct: (id) => handle(client.delete(`/products/${id}`)),

  // Orders
  checkout: (payload) => handle(client.post('/orders/checkout', payload)),
  getAllOrders: () => handle(client.get('/orders')),
  getActiveOrders: (params) => handle(client.get('/orders/active', { params })),
  updateOrderStatus: (id, status) => handle(client.patch(`/orders/${id}/status`, { status })),
  getOrderHistory: (params) => handle(client.get('/orders/history', { params })),
  getPaymentStatus: (id) => handle(client.get(`/payments/status/${id}`)),
  confirmCashPayment: (id) => handle(client.post(`/payments/${id}/confirm-cash`)),
  simulateQrisPayment: (id) => handle(client.post(`/payments/${id}/simulate-qris`)),

  // Dashboard
  getOwnerDashboard: () => handle(client.get('/dashboard/owner')),
  getKapsterDashboard: () => handle(client.get('/dashboard/kapster')),
  getCashTransactions: () => handle(client.get('/dashboard/cash')),
  createCashTransaction: (data) => handle(client.post('/dashboard/cash', data)),

  // Accounting (owner only)
  getFinanceSummary: () => handle(client.get('/accounting/summary')),
  getAccounts: () => handle(client.get('/accounting/accounts')),
  getJournals: (params) => handle(client.get('/accounting/journals', { params })),
  postJournal: (data) => handle(client.post('/accounting/journals', data)),
  getLedger: (params) => handle(client.get('/accounting/ledger', { params })),
  getTrialBalance: (params) => handle(client.get('/accounting/trial-balance', { params })),
  getIncomeStatement: (params) => handle(client.get('/accounting/income-statement', { params })),
  getBalanceSheet: (params) => handle(client.get('/accounting/balance-sheet', { params })),

  // Push (owner)
  getVapidPublicKey: () => handle(client.get('/push/vapid-public-key')),
  subscribePush: (subscription) => handle(client.post('/push/subscribe', { subscription })),
  unsubscribePush: (endpoint) => handle(client.post('/push/unsubscribe', { endpoint })),
  testPush: () => handle(client.post('/push/test')),
  /** @deprecated use testPush */
  testOwnerPush: () => handle(client.post('/push/test')),
  getFixedAssets: () => handle(client.get('/accounting/fixed-assets')),
  createFixedAsset: (data) => handle(client.post('/accounting/fixed-assets', data)),
  getExpenseCategories: () => handle(client.get('/accounting/expense-categories')),
  postOperationalExpense: (data) => handle(client.post('/accounting/expenses', data)),
  postCapitalInjection: (data) => handle(client.post('/accounting/capital', data)),
  postPrive: (data) => handle(client.post('/accounting/prive', data)),
  getDiscounts: () => handle(client.get('/dashboard/discounts')),
  createDiscount: (data) => handle(client.post('/dashboard/discounts', data)),
  deleteDiscount: (id) => handle(client.delete(`/dashboard/discounts/${id}`)),
};

export const mockAPI = api;
