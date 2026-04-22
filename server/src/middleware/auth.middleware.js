// auth.middleware.js — Protects routes that require login
// This runs BEFORE the controller on protected routes
// If token is invalid, request is blocked here

const { verifyAccessToken } = require('../config/jwt');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    // Frontend sends: "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // 2. Extract just the token part
    const token = authHeader.split(' ')[1];

    // 3. Verify token — throws error if expired or invalid
    const decoded = verifyAccessToken(token);
    // console.log('🔍 DECODED TOKEN:', decoded);

    // 4. Find user in DB — confirm they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true } // Never select password
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // 5. Attach user to request — controllers can access via req.user
    req.user = user;
    next(); // Move to the next function (controller)

  } catch (error) {
       console.error('❌ Auth middleware error:', error.message); 
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };