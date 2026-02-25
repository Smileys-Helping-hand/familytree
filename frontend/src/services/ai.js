import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const aiAPI = {
  generateTree: (prompt, familyId) =>
    axios.post(`${API_BASE}/ai/generate-tree`, { prompt, familyId }),
};

export const memberAPI = {
  getAll: (familyId) => axios.get(`${API_BASE}/members?familyId=${familyId}`),
  add: (familyId, data) => axios.post(`${API_BASE}/members`, { ...data, familyId }),
  update: (memberId, data) => axios.put(`${API_BASE}/members/${memberId}`, data),
  remove: (memberId) => axios.delete(`${API_BASE}/members/${memberId}`),
  addRelationship: (data) => axios.post(`${API_BASE}/members/relationship`, data),
  removeRelationship: (data) => axios.delete(`${API_BASE}/members/relationship`, { data }),
};

export const familyAPI = {
  getAll: () => axios.get(`${API_BASE}/families`),
  inviteMember: (familyId, email, role) => axios.post(`${API_BASE}/families/${familyId}/invite`, { email, role }),
};
