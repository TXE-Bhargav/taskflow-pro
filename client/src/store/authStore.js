// authStore.js — Global auth state using Zustand
// Zustand is simpler than Redux — just a function that returns state + actions
// Any component can read/update this state without prop drilling

import { create } from 'zustand';

const useAuthStore = create((set) => ({

  // Initial state — read from localStorage so user stays logged in on refresh
  user:           JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  // Actions — functions that update state
  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;