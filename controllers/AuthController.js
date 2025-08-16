const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const UserRepository = require('../repositories/UserRepository');
const Response = require('../utils/response');

class AuthController {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * 用户登录
   * @param {Object} ctx - Koa上下文
   */
  async login(ctx) {
    try {
      const { email, password } = ctx.request.body;

      // 查找用户
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return Response.error(ctx, '用户名或密码错误', -1, 400);
      }

      // 检查用户状态
      if (user.status === 0) {
        return Response.error(ctx, '用户已被禁用', -1, 400);
      }

      // 验证密码
      const isValidPassword = await this.userRepository.verifyPassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        return Response.error(ctx, '用户名或密码错误', -1, 400);
      }

      // 更新最后登录时间和IP
      const clientIp =
        ctx.request.ip ||
        ctx.request.header['x-forwarded-for'] ||
        ctx.request.socket.remoteAddress;
      await this.userRepository.updateLastLogin(user.id, clientIp);

      // 生成JWT令牌
      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email
      });

      // 获取用户角色和权限
      const roles = await this.userRepository.getUserRoles(user.id);
      const permissions = await this.userRepository.getUserPermissions(user.id);

      // 移除密码字段
      delete user.password;

      Response.success(
        ctx,
        {
          user,
          token,
          roles,
          permissions
        },
        '登录成功'
      );
    } catch (error) {
      logger.error('登录失败:', error);
      Response.error(ctx, '登录失败', -1, 500);
    }
  }

  /**
   * 获取当前用户信息
   * @param {Object} ctx - Koa上下文
   */
  async getCurrentUser(ctx) {
    try {
      const userId = ctx.state.userId;
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 获取用户角色和权限
      const roles = await this.userRepository.getUserRoles(userId);
      const permissions = await this.userRepository.getUserPermissions(userId);

      Response.success(
        ctx,
        {
          user,
          roles,
          permissions
        },
        '获取用户信息成功'
      );
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      Response.error(ctx, '获取用户信息失败', -1, 500);
    }
  }

  /**
   * 修改密码
   * @param {Object} ctx - Koa上下文
   */
  async changePassword(ctx) {
    try {
      const userId = ctx.state.userId;
      const { old_password, new_password } = ctx.request.body;

      // 获取用户信息
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 验证旧密码
      const isValidOldPassword = await this.userRepository.verifyPassword(
        old_password,
        user.password
      );
      if (!isValidOldPassword) {
        return Response.error(ctx, '旧密码错误', -1, 400);
      }

      // 更新密码
      const bcrypt = require('bcryptjs');
      const hashedNewPassword = await bcrypt.hash(new_password, 10);

      await this.userRepository.update(userId, {
        password: hashedNewPassword
      });

      Response.success(ctx, null, '密码修改成功');
    } catch (error) {
      logger.error('修改密码失败:', error);
      Response.error(ctx, '修改密码失败', -1, 500);
    }
  }

  /**
   * 退出登录
   * @param {Object} ctx - Koa上下文
   */
  async logout(ctx) {
    try {
      // 实际应用中可以将token加入黑名单
      Response.success(ctx, null, '退出登录成功');
    } catch (error) {
      logger.error('退出登录失败:', error);
      Response.error(ctx, '退出登录失败', -1, 500);
    }
  }
}

module.exports = AuthController;
