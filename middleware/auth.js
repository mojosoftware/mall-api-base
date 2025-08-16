const { verifyToken } = require('../config/jwt');
const logger = require('../utils/logger');
const userRepository = require('../repositories/UserRepository');
const Response = require('../utils/response');

/**
 * JWT认证中间件
 */
async function authenticate(ctx, next) {
  try {
    // 获取token
    let token = ctx.header.authorization || ctx.cookies.get('token');

    if (!token) {
      logger.warn(ctx, '未授权访问 - 缺少认证令牌');
      Response.error(ctx, '未提供认证令牌', -1, 401);
      return;
    }

    // 如果token带有Bearer前缀，去掉该前缀
    if (token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    // 验证token格式
    if (!token || typeof token !== 'string' || token.trim() === '') {
      logger.warn(ctx, '无效的认证令牌格式');
      Response.error(ctx, '无效的认证令牌格式', -1, 401);
      return;
    }

    // 验证token
    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn(ctx, 'JWT令牌验证失败');
      Response.error(ctx, '认证令牌无效或已过期', -1, 401);
      return;
    }

    const user = await userRepository.findById(decoded.id);

    if (!user || user.status === 0) {
      return Response.error(ctx, '用户不存在或已被禁用', -1, 401);
    }

    ctx.state.user = user;
    ctx.state.userId = user.id;

    await next();
  } catch (error) {
    logger.error('认证失败:', error);
    return Response.error(ctx, '认证失败', -1, 401);
  }
}

module.exports = { authenticate };
