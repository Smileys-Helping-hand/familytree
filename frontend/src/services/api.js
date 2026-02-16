import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/refresh', { refreshToken });
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const familyAPI = {
  getAll: () => api.get('/families'),
  getOne: (id) => api.get(`/families/${id}`),
  create: (data) => api.post('/families', data),
  update: (id, data) => api.put(`/families/${id}`, data),
  delete: (id) => api.delete(`/families/${id}`),
  inviteMember: (id, email, role) => api.post(`/families/${id}/invite`, { email, role }),
  joinFamily: (token) => api.post('/families/join', { token }),
  removeMember: (familyId, userId) => api.delete(`/families/${familyId}/members/${userId}`),
  updateMemberRole: (familyId, userId, role) => api.put(`/families/${familyId}/members/${userId}/role`, { role })
};

export const memberAPI = {
  getAll: (familyId) => api.get(`/members/family/${familyId}`),
  getOne: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  getTree: (familyId) => api.get(`/members/family/${familyId}/tree`),
  addRelationship: (data) => api.post('/members/relationship', data),
  removeRelationship: (data) => api.delete('/members/relationship', { data })
};

export const memoryAPI = {
  getAll: (familyId) => api.get(`/memories/family/${familyId}`),
  getOne: (id) => api.get(`/memories/${id}`),
  create: (formData) => api.post('/memories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/memories/${id}`, data),
  delete: (id) => api.delete(`/memories/${id}`),
  like: (id) => api.post(`/memories/${id}/like`),
  addComment: (id, text) => api.post(`/memories/${id}/comment`, { text }),
};

export const eventAPI = {
  getAll: (familyId) => api.get(`/events/family/${familyId}`),
  getUpcoming: () => api.get('/events/upcoming'),
  getOne: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  rsvp: (id, status) => api.post(`/events/${id}/rsvp`, { status }),
};

export const activityAPI = {
  getRecent: (params = {}) => api.get('/activity', { params })
};

export const subscriptionAPI = {
  getStatus: () => api.get('/subscriptions/status'),
  createCheckout: (tier) => api.post('/subscriptions/create-checkout', { tier }),
  cancel: () => api.post('/subscriptions/cancel'),
};

export default api;
