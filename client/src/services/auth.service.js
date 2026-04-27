import api from './api';

export const authService = {

    register: async (userData) => {
        const res = await api.post('/auth/register', userData);
        return res.data;
    },

    login: async (credentials) => {
        const res = await api.post('/auth/login', credentials);

        // res.data = { message, accessToken, refreshToken, user }
        const { accessToken, refreshToken, user } = res.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Return user so LoginPage can update Zustand store
        return { user };
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        localStorage.clear();
    },

    verifyEmail: async (token) => {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        return res.data;
    },

    forgotPassword: async (email) => {
        const res = await api.post('/auth/forgot-password', { email });
        return res.data;
    },

    resetPassword: async (token, newPassword) => {
        const res = await api.post('/auth/reset-password', { token, newPassword });
        return res.data;
    }
};