const Response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (error) {
    logger.error('服务器错误:', error);

    // 数据库连接错误
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ER_ACCESS_DENIED_ERROR'
    ) {
      return Response.error(ctx, '数据库连接失败', -1, 500);
    }

    // 数据库查询错误
    if (error.code && error.code.startsWith('ER_')) {
      return Response.error(ctx, '数据库操作失败', -1, 500);
    }

    // 参数验证错误
    if (error.name === 'ValidationError') {
      return Response.error(ctx, error.message, -1, 400);
    }

    // JWT相关错误
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return Response.error(ctx, '认证失败', -1, 401);
    }

    // 默认服务器错误
    Response.error(ctx, '服务器内部错误', -1, 500);
  }
}

module.exports = errorHandler;
