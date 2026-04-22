const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateAccessToken = (user) => {
    return jwt.sign(
        { user },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { user },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};


const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};