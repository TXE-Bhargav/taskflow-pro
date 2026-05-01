const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { queueVerificationEmail, queueResetEmail } = require('../config/emailQueue');


// ─── REGISTER ───────────────────────────────────────────────
const register = async (name, email, password) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            verifyToken
        }
    });

     queueVerificationEmail(email, name, verifyToken);

    return { message: 'Registration successful! Please verify your email.' };
};

// ─── VERIFY EMAIL ────────────────────────────────────────────
const verifyEmail = async (token) => {

    // Find user with this token
    const user = await prisma.user.findFirst({
        where: { verifyToken: token }
    });

    // Token not found — either invalid or already used
    if (!user) {
        return {
            status: 'already_verified',
            message: 'This email is already verified! You can log in.'
        };
    }

    // Token found — verify the user now
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verifyToken: null
        }
    });

    return {
        status: 'verified',
        message: 'Email verified successfully! You can now log in.'
    };
};

// ─── LOGIN ───────────────────────────────────────────────────
const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email ');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid password');

    if (!user.isVerified) throw new Error('Please verify your email before logging in');

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            refreshToken
        }
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
}

// ─── LOGOUT ─────────────────────────────────────────────────
const logout = async (userId) => {

    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null }
    });

    return { message: 'Logged out successfully' };
};

// ─── REFRESH TOKEN ───────────────────────────────────────────

const refreshAccessToken = async (token) => {
    const decode = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: decode.userId } });
    if (!user || user.refreshToken !== token) {
        throw new Error('Invalid refresh token');
    }

    const accessToken = generateAccessToken(user.id);
    return { accessToken };
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────

const forgotPassword = async (email) => {

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExp }
    });

     queueResetEmail(email, user.name, resetToken);

    return { message: 'If that email exists, a reset link has been sent.' };
};

// ─── RESET PASSWORD ──────────────────────────────────────────

const resetPassword = async (token, newPassword) => {

    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExp: { gt: new Date() } // gt = greater than = not expired
        }
    });

    if (!user) throw new Error('Invalid or expired reset link');

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExp: null
        }
    });

    return { message: 'Password reset successful! You can now log in.' };
};

module.exports = {
    register,
    verifyEmail,
    login,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword
};
