const logger = require('../utils/logger');

/**
 * 请求日志中间件
 */
function requestLogger() {
  return async (ctx, next) => {
    const start = Date.now();
    const { method, url, ip } = ctx.request;
    const userAgent = ctx.request.header['user-agent'] || '';
    const userId = ctx.state.userId || 'anonymous';

    // 记录请求开始
    logger.info(`[${userId}] ${method} ${url} - ${ip} - ${userAgent}`);

    try {
      await next();
      
      const duration = Date.now() - start;
      const { status } = ctx.response;
      
      // 记录请求完成
      logger.info(`[${userId}] ${method} ${url} - ${status} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - start;
      
      // 记录请求错误
      logger.error(`[${userId}] ${method} ${url} - ERROR - ${duration}ms - ${error.message}`);
      throw error;
    }
  };
}

module.exports = requestLogger;