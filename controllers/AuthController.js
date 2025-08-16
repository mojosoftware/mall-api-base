const logger = require('../utils/logger');
const AuthService = require('../services/AuthService');
const Response = require('../utils/response');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 用户登录
   * @param {Object} ctx - Koa上下文
   */
  async login(ctx) {
    try {
      const { email, password } = ctx.request.body;
      const clientIp =
        ctx.request.ip ||
        ctx.request.header['x-forwarded-for'] ||
        ctx.request.socket.remoteAddress;

      const result = await this.authService.login(email, password, clientIp);
      Response.success(ctx, result, '登录成功');
    } catch (error) {
      logger.error('登录失败:', error);
      Response.error(ctx, error.message || '登录失败', -1, 500);
    }
  }

  /**
   * 获取当前用户信息
   * @param {Object} ctx - Koa上下文
   */
  async getCurrentUser(ctx) {
    try {
      const userId = ctx.state.userId;
      const result = await this.authService.getCurrentUser(userId);
      Response.success(ctx, result, '获取用户信息成功');
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      Response.error(ctx, error.message || '获取用户信息失败', -1, 500);
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
      
      await this.authService.changePassword(userId, old_password, new_password);
      Response.success(ctx, null, '密码修改成功');
    } catch (error) {
      logger.error('修改密码失败:', error);
      Response.error(ctx, error.message || '修改密码失败', -1, 500);
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
