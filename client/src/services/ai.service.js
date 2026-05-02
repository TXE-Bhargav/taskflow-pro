// ai.service.js — All AI feature API calls

import api from './api';

export const aiService = {

  breakdownTask: async (goal, projectContext) => {
    const res = await api.post('/ai/breakdown', { goal, projectContext });
    return res.data;
  },

  improveDescription: async (title, description) => {
    const res = await api.post('/ai/improve', { title, description });
    return res.data;
  },

  suggestDueDate: async (title, description, teamSize = 1) => {
    const res = await api.post('/ai/suggest-date', { title, description, teamSize });
    return res.data;
  },

  generateStandup: async () => {
    const res = await api.get('/ai/standup');
    return res.data;
  },

  prioritizeTasks: async (projectId) => {
    const res = await api.get(`/ai/prioritize/${projectId}`);
    return res.data;
  },

  // Returns { tasks: [{ title, description, priority, dueDate }] }
  generateTasksFromIdea: async ({ rawIdea, projectName, count = 5 }) => {
    const res = await api.post('/ai/generate-tasks', { rawIdea, projectName, count });
    return res.data;
  },
};