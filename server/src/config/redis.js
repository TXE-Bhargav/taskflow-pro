const Redis = require('ioredis');

const redis = process.env.NODE_ENV === 'production'
  ? new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false }
    })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT  || 6379,
    });

redis.on('connect', () => console.log('✅ Redis connected!'));
redis.on('error',   (e) => console.error('❌ Redis error:', e.message));

module.exports = redis;