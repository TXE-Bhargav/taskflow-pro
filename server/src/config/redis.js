// redis.js — Redis connection configuration
// Redis is an in-memory data store — extremely fast
// We use it as a job queue for background tasks

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,

  // Retry connection if Redis restarts
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => console.log('✅ Redis connected successfully!'));
redis.on('error',   (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;