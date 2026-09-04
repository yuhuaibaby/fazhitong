// API 配置
const API_BASE = 'http://localhost:3002/api';

// 通用请求方法
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `请求失败 (${res.status})`);
  }

  return res.json();
}

// API 方法
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// 用户 API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
};

// 合同 API
export const contractAPI = {
  list: () => api.get('/contracts'),
  review: (data) => api.post('/contracts/review', data),
};

// 律所 API
export const lawFirmAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/law-firms${query ? '?' + query : ''}`);
  },
  detail: (id) => api.get(`/law-firms/${id}`),
};

// 律师 API
export const lawyerAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/lawyers${query ? '?' + query : ''}`);
  },
  detail: (id) => api.get(`/lawyers/${id}`),
};

// 咨询 API
export const consultationAPI = {
  list: () => api.get('/consultations'),
  create: (data) => api.post('/consultations', data),
  getMessages: (id) => api.get(`/consultations/${id}/messages`),
  sendMessage: (id, data) => api.post(`/consultations/${id}/messages`, data),
};

// 订单 API
export const orderAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders${query ? '?' + query : ''}`);
  },
  detail: (id) => api.get(`/orders/${id}`),
};

// 待办 API
export const todoAPI = {
  list: () => api.get('/todos'),
};

// 文书 API
export const documentAPI = {
  generate: (data) => api.post('/documents/generate', data),
};

// 合规 API
export const complianceAPI = {
  check: (data) => api.post('/compliance/check', data),
};

// 统计 API
export const statsAPI = {
  get: () => api.get('/stats'),
};

// 消息 API
export const messageAPI = {
  list: () => api.get('/messages'),
};
