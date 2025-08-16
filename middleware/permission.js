const UserRepository = require('../repositories/UserRepository');
const Response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 权限验证中间件
 * @param {String|Array} requiredPermissions - 必需的权限代码
 * @returns {Function} Koa中间件函数
 */
function requirePermission(requiredPermissions) {
  return async (ctx, next) => {
    try {
      const userId = ctx.state.userId;

      if (!userId) {
        return Response.error(ctx, '用户未认证', -1, 401);
      }

      // 标准化权限参数
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // 获取用户权限
      const userRepository = new UserRepository();
      const userPermissions = await userRepository.getUserPermissions(userId);

      // 提取权限代码数组
      const userPermissionCodes = userPermissions.map((p) => p.code);

      // 检查是否拥有所需权限
      const hasPermission = permissions.some((permission) =>
        userPermissionCodes.includes(permission)
      );

      if (!hasPermission) {
        return Response.error(ctx, '权限不足', -1, 403);
      }

      await next();
    } catch (error) {
      logger.error('权限验证失败:', error);
      return Response.error(ctx, '权限验证失败', -1, 500);
    }
  };
}

/**
 * 超级管理员权限验证中间件
 */
async function requireSuperAdmin(ctx, next) {
  try {
    const userId = ctx.state.userId;

    if (!userId) {
      return Response.error(ctx, '用户未认证', -1, 401);
    }

    const userRepository = new UserRepository();
    const userRoles = await userRepository.getUserRoles(userId);

    const isSuperAdmin = userRoles.some((role) => role.code === 'super_admin');

    if (!isSuperAdmin) {
      return Response.error(ctx, '需要超级管理员权限', -1, 403);
    }

    await next();
  } catch (error) {
    logger.error('超级管理员权限验证失败:', error);
    return Response.error(ctx, '权限验证失败', -1, 500);
  }
}

/**
 * 角色验证中间件
 * @param {String|Array} requiredRoles - 必需的角色代码
 * @returns {Function} Koa中间件函数
 */
function requireRole(requiredRoles) {
  return async (ctx, next) => {
    try {
      const userId = ctx.state.userId;

      if (!userId) {
        return Response.error(ctx, '用户未认证', -1, 401);
      }

      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      const userRepository = new UserRepository();
      const userRoles = await userRepository.getUserRoles(userId);

      const userRoleCodes = userRoles.map((r) => r.code);

      const hasRole = roles.some((role) => userRoleCodes.includes(role));

      if (!hasRole) {
        return Response.error(ctx, '角色权限不足', -1, 403);
      }

      await next();
    } catch (error) {
      logger.error('角色验证失败:', error);
      return Response.error(ctx, '角色验证失败', -1, 500);
    }
  };
}

module.exports = {
  requirePermission,
  requireSuperAdmin,
  requireRole
};
