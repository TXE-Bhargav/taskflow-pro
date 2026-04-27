import api from './api';

export const workspaceService = {

  getAll: async () => {
    const res = await api.get('/workspaces');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/workspaces/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/workspaces', data);
    return res.data;
  },

  inviteMember: async (workspaceId, email, role = 'MEMBER') => {
    const res = await api.post(`/workspaces/${workspaceId}/invite`, { email, role });
    return res.data;
  }
};