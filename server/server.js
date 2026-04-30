const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./src/config/prisma');
const http = require('http');
const { Server } = require('socket.io');
const routes = require('./src/routes/index');
const redis = require('./src/config/redis');
require('./src/config/emailQueue');

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ========================
   CORS CONFIGURATION
======================== */
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow Postman / mobile
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
}));

/* ========================
   SOCKET.IO
======================== */
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

/* ========================
   MIDDLEWARES
======================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to request
app.use((req, res, next) => {
    req.io = io;
    next();
});

/* ========================
   ROUTES
======================== */
app.use('/api', routes);

require('./src/config/socket')(io);

/* ========================
   ERROR HANDLER
======================== */
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: err.message || 'Something went wrong' });
});

/* ========================
   HEALTH CHECK
======================== */
app.get('/', (req, res) => {
    res.json({
        message: '🚀 TaskFlow Pro API is running!'
    });
});

/* ========================
   SERVER START (IMPORTANT)
======================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

/* ========================
   DATABASE CONNECTION
======================== */
async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL connected successfully!');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

connectDB();