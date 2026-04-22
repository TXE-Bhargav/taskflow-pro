const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./src/config/prisma');
const routes = require('./src/routes/index');

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}))

app.use(express.json());

app.use("/api", routes);

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

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();