/**
 * 自定义CORS中间件
 */
function customCors(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders = [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    credentials = false,
    maxAge = 86400 // 24小时
  } = options;

  return async (ctx, next) => {
    const requestOrigin = ctx.request.header.origin;

    // 设置CORS头部
    if (origin === '*') {
      ctx.set('Access-Control-Allow-Origin', '*');
    } else if (typeof origin === 'string') {
      ctx.set('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        ctx.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else if (typeof origin === 'function') {
      const allowedOrigin = origin(requestOrigin);
      if (allowedOrigin) {
        ctx.set('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    ctx.set('Access-Control-Allow-Methods', methods.join(', '));
    ctx.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    ctx.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    ctx.set('Access-Control-Max-Age', maxAge.toString());

    if (credentials) {
      ctx.set('Access-Control-Allow-Credentials', 'true');
    }

    // 处理预检请求
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    await next();
  };
}

module.exports = customCors;