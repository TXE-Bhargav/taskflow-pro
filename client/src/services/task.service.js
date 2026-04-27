import api from './api';

export const taskService = {

  getByProject: async (projectId) => {
    const res = await api.get(`/tasks/project/${projectId}`);
    return res.data;
  },

  getById: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data;
  },

  create: async (projectId, data) => {
    const res = await api.post(`/tasks/project/${projectId}`, data);
    return res.data;
  },

  update: async (taskId, data) => {
    const res = await api.put(`/tasks/${taskId}`, data);
    return res.data;
  },

  move: async (taskId, data) => {
    const res = await api.patch(`/tasks/${taskId}/move`, data);
    return res.data;
  },

  delete: async (taskId) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  },

  addComment: async (taskId, content) => {
    const res = await api.post(`/tasks/${taskId}/comments`, { content });
    return res.data;
  }
};