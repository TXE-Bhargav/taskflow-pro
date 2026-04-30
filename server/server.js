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

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
}); Z

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use("/api", routes);

require('./src/config/socket')(io);

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Something went wrong' });
});

app.get('/', (req, res) => {
    res.json({
        message: '🚀 TaskFlow Pro API is running!'
    });
})

const PORT = process.env.PORT || 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL connected successfully!');

        server.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();