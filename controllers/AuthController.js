const logger = require('../utils/logger');
const authService = require('../services/AuthService');
const Response = require('../utils/response');

class AuthController {
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

      const result = await authService.login(email, password, clientIp);
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
      const result = await authService.getCurrentUser(userId);
      Response.success(ctx, result, '获取用户信息成功');
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      Response.error(ctx, error.message || '获取用户信息失败', -1, 500);
    }
  }

  /**
   * 用户注册
   * @param {Object} ctx - Koa上下文
   */
  async register(ctx) {
    try {
      const userData = ctx.request.body;
      const clientIp =
        ctx.request.ip ||
        ctx.request.header['x-forwarded-for'] ||
        ctx.request.socket.remoteAddress;

      const result = await authService.register(userData, clientIp);
      Response.success(ctx, result, '注册信息已提交');
    } catch (error) {
      logger.error('注册失败:', error);
      Response.error(ctx, error.message || '注册失败', -1, 400);
    }
  }

  /**
   * 验证邮箱
   * @param {Object} ctx - Koa上下文
   */
  async verifyEmail(ctx) {
    try {
      const { email, code } = ctx.request.body;
      const result = await authService.verifyEmail(email, code);
      Response.success(ctx, result, '邮箱验证成功');
    } catch (error) {
      logger.error('邮箱验证失败:', error);
      Response.error(ctx, error.message || '邮箱验证失败', -1, 400);
    }
  }

  /**
   * 重新发送验证邮件
   * @param {Object} ctx - Koa上下文
   */
  async resendVerificationEmail(ctx) {
    try {
      const { email } = ctx.request.body;
      await authService.resendVerificationEmail(email);
      Response.success(ctx, null, '验证邮件已重新发送');
    } catch (error) {
      logger.error('重新发送验证邮件失败:', error);
      Response.error(ctx, error.message || '发送失败', -1, 400);
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
      
      await authService.changePassword(userId, old_password, new_password);
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

// 导出实例
module.exports = new AuthController();