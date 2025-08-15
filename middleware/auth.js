const { verifyToken } = require("../config/jwt");
const UserRepository = require("../repositories/UserRepository");
const Response = require("../utils/response");

/**
 * JWT认证中间件
 */
async function authenticate(ctx, next) {
  try {
    const authHeader = ctx.headers.authorization;

    if (!authHeader) {
      return Response.error(ctx, "缺少认证令牌", -1, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return Response.error(ctx, "认证令牌格式错误", -1, 401);
    }

    // 验证JWT令牌
    const decoded = verifyToken(token);

    // 查询用户信息
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return Response.error(ctx, "用户不存在", -1, 401);
    }

    if (user.status === 0) {
      return Response.error(ctx, "用户已被禁用", -1, 401);
    }

    // 将用户信息添加到上下文中
    ctx.state.user = user;
    ctx.state.userId = user.id;

    await next();
  } catch (error) {
    console.error("认证失败:", error);
    return Response.error(ctx, "认证失败", -1, 401);
  }
}

module.exports = {
  authenticate,
};
