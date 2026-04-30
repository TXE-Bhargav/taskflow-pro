const authservice = require('../services/auth.service');

const register = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await authservice.register(name, email, password);
        res.status(201).json({
            message: "Registration success , Please verify your email",
            data: {
                name: user.name,
                email: user.email,
                // we send token in email , if require we send it on response further
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ status: 'error', message: 'Token is required' });
        }
        const result = await authservice.verifyEmail(token);
        res.status(200).json({ status: 'success', result, message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const result = await authservice.login({ email, password });
        res.status(200).json({
            message: 'Login successful',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user

        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const logout = async (req, res) => {
    try {
        const result = await authservice.logout(req.user.id);
        res.status(200).json({ message: result.message });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }
        const result = await authservice.refreshAccessToken(token);
        res.status(200).json({
            message: 'Token refreshed successfully',
            accessToken: result.accessToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        await authservice.forgotPassword(email);
        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        await authservice.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    register,
    verifyEmail,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword
};
