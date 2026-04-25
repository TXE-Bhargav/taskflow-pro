import api from './api';

export const authService = {

    register: async (userData) => {
        const res = await api.post('/auth/register', userData);
        return res;
    },

    login: async (credentials) => {
        const res = await api.post('/auth/login', credentials);

        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        return res;
    },

    logout: async () => {
        await api.post('/auth/logout');
        localStorage.clear();

    },

    verifyEmail: async (token) => {
        const res = await api.post(`/auth/verify-email?token=${token}`);
        return res;
    },
    forgotPassword: async (email) => {
        const res = await api.post('/auth/forgot-password', { email });
        return res.data;
    },

    resetPassword: async (token, newPassword) => {
        const res = await api.post('/auth/reset-password', { token, newPassword });
        return res.data;
    }
}