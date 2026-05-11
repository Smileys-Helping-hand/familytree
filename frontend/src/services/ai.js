import api from './api';

export const aiAPI = {
  generateTree: (prompt, familyId) =>
    api.post('/ai/generate-tree', { prompt, familyId }),
};
