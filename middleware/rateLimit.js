const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const Response = require('../utils/response');

/**
 * 限流中间件
 * @param {Object} options 配置选项
 * @param {Number} options.windowMs 时间窗口(毫秒)
 * @param {Number} options.max 最大请求次数
 * @param {String} options.message 限流提示信息
 * @param {Function} options.keyGenerator 生成限流key的函数
 */
const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100, // 最大100次请求
    message = '请求过于频繁，请稍后再试',
    keyGenerator = (ctx) => `rate_limit:${ctx.ip}`,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (ctx, next) => {
    try {
      const redis = redisClient.getClient();
      const key = keyGenerator(ctx);
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const redisKey = `${key}:${window}`;

      // 获取当前窗口的请求次数
      const current = await redis.get(redisKey);
      const requests = current ? parseInt(current) : 0;

      // 检查是否超过限制
      if (requests >= max) {
        logger.warn('请求限流触发:', {
          ip: ctx.ip,
          url: ctx.url,
          method: ctx.method,
          requests,
          limit: max
        });

        // 设置响应头
        ctx.set('X-RateLimit-Limit', max);
        ctx.set('X-RateLimit-Remaining', 0);
        ctx.set('X-RateLimit-Reset', new Date(now + windowMs));

        Response.error(ctx, message, 429, 429);
        return;
      }

      // 执行请求
      await next();

      // 根据配置决定是否计数
      const shouldCount = !skipSuccessfulRequests || 
                         (!skipFailedRequests && ctx.status >= 400);

      if (shouldCount) {
        // 增加计数
        const newCount = await redis.incr(redisKey);
        
        // 设置过期时间（仅在第一次设置时）
        if (newCount === 1) {
          await redis.expire(redisKey, Math.ceil(windowMs / 1000));
        }

        // 设置响应头
        ctx.set('X-RateLimit-Limit', max);
        ctx.set('X-RateLimit-Remaining', Math.max(0, max - newCount));
        ctx.set('X-RateLimit-Reset', new Date(now + windowMs));

        logger.debug('请求计数更新:', {
          ip: ctx.ip,
          url: ctx.url,
          count: newCount,
          limit: max
        });
      }

    } catch (error) {
      logger.error('限流中间件错误:', error);
      // 限流失败时不阻塞请求，继续执行
      await next();
    }
  };
};

/**
 * 严格限流中间件（用于敏感操作）
 */
const strictRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 5, // 最大5次请求
    message: '操作过于频繁，请5分钟后再试',
    ...options
  });
};

/**
 * API限流中间件
 */
const apiRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 最大1000次请求
    message: 'API请求过于频繁，请稍后再试',
    ...options
  });
};

/**
 * 登录限流中间件
 */
const loginRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 最大10次登录尝试
    message: '登录尝试过于频繁，请15分钟后再试',
    keyGenerator: (ctx) => `login_limit:${ctx.ip}`,
    skipSuccessfulRequests: true, // 成功登录不计数
    ...options
  });
};

module.exports = {
  rateLimit,
  strictRateLimit,
  apiRateLimit,
  loginRateLimit
};