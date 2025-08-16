const redis = require('../config/redis');
const Response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 限流算法类型
 */
const RATE_LIMIT_TYPES = {
  FIXED_WINDOW: 'fixed_window',
  SLIDING_WINDOW: 'sliding_window',
  TOKEN_BUCKET: 'token_bucket'
};

/**
 * 固定窗口限流算法
 * @param {String} key - 限流键
 * @param {Number} limit - 限制次数
 * @param {Number} window - 时间窗口(秒)
 * @returns {Object} 限流结果
 */
async function fixedWindowRateLimit(key, limit, window) {
  const pipeline = redis.pipeline();
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / window)}`;

  pipeline.incr(windowKey);
  pipeline.expire(windowKey, window);
  
  const results = await pipeline.exec();
  const count = results[0][1];

  return {
    allowed: count <= limit,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    resetTime: Math.ceil(now / window) * window
  };
}

/**
 * 滑动窗口限流算法
 * @param {String} key - 限流键
 * @param {Number} limit - 限制次数
 * @param {Number} window - 时间窗口(秒)
 * @returns {Object} 限流结果
 */
async function slidingWindowRateLimit(key, limit, window) {
  const now = Date.now();
  const windowStart = now - window * 1000;
  
  const pipeline = redis.pipeline();
  
  // 移除过期的记录
  pipeline.zremrangebyscore(key, 0, windowStart);
  // 添加当前请求
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  // 获取当前窗口内的请求数
  pipeline.zcard(key);
  // 设置过期时间
  pipeline.expire(key, window);
  
  const results = await pipeline.exec();
  const count = results[2][1];

  return {
    allowed: count <= limit,
    count,
    limit,
    remaining: Math.max(0, limit - count),
    resetTime: Math.floor((now + window * 1000) / 1000)
  };
}

/**
 * 令牌桶限流算法
 * @param {String} key - 限流键
 * @param {Number} capacity - 桶容量
 * @param {Number} refillRate - 令牌补充速率(每秒)
 * @returns {Object} 限流结果
 */
async function tokenBucketRateLimit(key, capacity, refillRate) {
  const now = Date.now() / 1000;
  
  // 获取当前桶状态
  const bucketData = await redis.hmget(key, 'tokens', 'lastRefill');
  let tokens = parseFloat(bucketData[0]) || capacity;
  let lastRefill = parseFloat(bucketData[1]) || now;
  
  // 计算需要补充的令牌数
  const timePassed = now - lastRefill;
  const tokensToAdd = timePassed * refillRate;
  tokens = Math.min(capacity, tokens + tokensToAdd);
  
  const allowed = tokens >= 1;
  
  if (allowed) {
    tokens -= 1;
  }
  
  // 更新桶状态
  await redis.hmset(key, 'tokens', tokens, 'lastRefill', now);
  await redis.expire(key, Math.ceil(capacity / refillRate) + 60);
  
  return {
    allowed,
    tokens: Math.floor(tokens),
    capacity,
    resetTime: Math.floor(now + (capacity - tokens) / refillRate)
  };
}

/**
 * 创建限流中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Koa中间件函数
 */
function createRateLimiter(options = {}) {
  const {
    type = RATE_LIMIT_TYPES.FIXED_WINDOW,
    windowMs = 60 * 1000, // 1分钟
    max = 100, // 最大请求数
    keyGenerator = (ctx) => ctx.ip, // 键生成器
    skipSuccessfulRequests = false, // 是否跳过成功请求
    skipFailedRequests = false, // 是否跳过失败请求
    onLimitReached = null, // 达到限制时的回调
    message = '请求过于频繁，请稍后再试',
    headers = true // 是否添加限流头部
  } = options;

  return async (ctx, next) => {
    try {
      // 生成限流键
      const key = `rate_limit:${keyGenerator(ctx)}`;
      const window = Math.floor(windowMs / 1000);
      
      let result;
      
      // 根据算法类型执行限流
      switch (type) {
        case RATE_LIMIT_TYPES.SLIDING_WINDOW:
          result = await slidingWindowRateLimit(key, max, window);
          break;
        case RATE_LIMIT_TYPES.TOKEN_BUCKET:
          result = await tokenBucketRateLimit(key, max, options.refillRate || 1);
          break;
        default:
          result = await fixedWindowRateLimit(key, max, window);
      }
      
      // 设置响应头
      if (headers) {
        ctx.set('X-RateLimit-Limit', max.toString());
        ctx.set('X-RateLimit-Remaining', (result.remaining || result.tokens || 0).toString());
        ctx.set('X-RateLimit-Reset', result.resetTime.toString());
      }
      
      // 检查是否超过限制
      if (!result.allowed) {
        if (onLimitReached) {
          await onLimitReached(ctx, result);
        }
        
        logger.warn(`限流触发 - IP: ${ctx.ip}, Key: ${key}, Count: ${result.count || 'N/A'}`);
        
        ctx.set('Retry-After', Math.ceil((result.resetTime - Date.now() / 1000)).toString());
        return Response.error(ctx, message, -1, 429);
      }
      
      // 执行下一个中间件
      await next();
      
      // 根据配置决定是否计入限流
      const shouldSkip = 
        (skipSuccessfulRequests && ctx.status < 400) ||
        (skipFailedRequests && ctx.status >= 400);
        
      if (shouldSkip && type === RATE_LIMIT_TYPES.FIXED_WINDOW) {
        // 对于固定窗口，如果需要跳过，则减少计数
        const windowKey = `${key}:${Math.floor(Date.now() / 1000 / window)}`;
        await redis.decr(windowKey);
      }
      
    } catch (error) {
      logger.error('限流中间件错误:', error);
      // 限流失败时不阻塞请求
      await next();
    }
  };
}

/**
 * 预定义的限流配置
 */
const rateLimitConfigs = {
  // 严格限流 - 用于登录等敏感接口
  strict: {
    type: RATE_LIMIT_TYPES.SLIDING_WINDOW,
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  
  // 中等限流 - 用于API接口
  moderate: {
    type: RATE_LIMIT_TYPES.FIXED_WINDOW,
    windowMs: 60 * 1000, // 1分钟
    max: 60, // 最多60次
    message: 'API调用过于频繁，请稍后再试'
  },
  
  // 宽松限流 - 用于一般接口
  loose: {
    type: RATE_LIMIT_TYPES.TOKEN_BUCKET,
    windowMs: 60 * 1000, // 1分钟
    max: 100, // 桶容量100
    refillRate: 2, // 每秒补充2个令牌
    message: '请求过于频繁，请稍后再试'
  }
};

/**
 * 创建基于用户的限流中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Koa中间件函数
 */
function createUserRateLimiter(options = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (ctx) => {
      const userId = ctx.state.userId;
      return userId ? `user:${userId}` : `ip:${ctx.ip}`;
    }
  });
}

/**
 * 创建基于接口的限流中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Koa中间件函数
 */
function createEndpointRateLimiter(options = {}) {
  return createRateLimiter({
    ...options,
    keyGenerator: (ctx) => {
      const userId = ctx.state.userId;
      const endpoint = `${ctx.method}:${ctx.path}`;
      return userId ? `user:${userId}:${endpoint}` : `ip:${ctx.ip}:${endpoint}`;
    }
  });
}

module.exports = {
  createRateLimiter,
  createUserRateLimiter,
  createEndpointRateLimiter,
  rateLimitConfigs,
  RATE_LIMIT_TYPES
};