import api from './api';

export const projectService = {

  getAll: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/projects`);
    return res.data;
  },

  create: async (workspaceId, data) => {
    const res = await api.post(`/workspaces/${workspaceId}/projects`, data);
    return res.data;
  },

  update: async (projectId, data) => {
    const res = await api.put(`/projects/${projectId}`, data);
    return res.data;
  },

  delete: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  }
};