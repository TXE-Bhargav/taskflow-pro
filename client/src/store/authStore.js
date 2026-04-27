import { create } from 'zustand';

// Safely parse user from localStorage
const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    // Check for null, undefined string, or empty string
    if (!user || user === 'undefined' || user === 'null') return null;
    return JSON.parse(user);
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token || token === 'undefined' || token === 'null') return null;
  return token;
};

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!getStoredToken(),

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  }
}));

export default useAuthStore;