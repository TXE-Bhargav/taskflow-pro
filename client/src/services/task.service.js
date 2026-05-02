// task.service.js — All task API calls

import api from './api';

export const taskService = {

  getByProject: async (projectId) => {
    const res = await api.get(`/tasks/project/${projectId}`);
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    return [];
  },

  createTask: async (projectId, data) => {
    const res = await api.post(`/tasks/project/${projectId}`, data);
    return res.data?.data || res.data;
  },

  getTask: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data?.data || res.data;
  },

  updateTask: async (taskId, data) => {
    const res = await api.put(`/tasks/${taskId}`, data);
    return res.data?.data || res.data;
  },

  assignTask: async (taskId, assigneeId) => {
    const res = await api.put(`/tasks/${taskId}`, { assigneeId: assigneeId ?? null });
    return res.data?.data || res.data;
  },

  deleteTask: async (taskId) => {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
  },

  addComment: async (taskId, content, workspaceId) => {
    const res = await api.post(`/tasks/${taskId}/comments`, { content, workspaceId });
    return res.data?.data || res.data;
  },

  createSubtask: async (projectId, data) => {
    const res = await api.post(`/tasks/project/${projectId}`, data);
    return res.data?.data || res.data;
  },

  moveTask: async (taskId, status, workspaceId) => {
    const res = await api.patch(`/tasks/${taskId}/move`, { status, position: 0, workspaceId });
    return res.data?.data || res.data;
  },
};