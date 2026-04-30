import api from './api';

export const analyticsService = {

  getDashboard: async (workspaceId) => {
    const res = await api.get(`/analytics/dashboard/${workspaceId}`);
    return res.data;
  },

  getPersonalStats: async () => {
    const res = await api.get('/analytics/personal');
    return res.data;
  },
};