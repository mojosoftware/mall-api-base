const Redis = require('ioredis');
require('dotenv').config();

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

// 创建Redis实例
const redis = new Redis(redisConfig);

// 连接事件监听
redis.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redis.on('error', (err) => {
  console.error('❌ Redis连接错误:', err.message);
});

redis.on('close', () => {
  console.log('🔌 Redis连接已关闭');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis重新连接中...');
});

module.exports = redis;