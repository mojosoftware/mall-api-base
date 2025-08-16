const userService = require('../services/UserService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class UserController {
  /**
   * 获取用户列表
   * @param {Object} ctx - Koa上下文
   */
  async getUsers(ctx) {
    try {
      const {
        page = 1,
        pageSize = 10,
        username,
        email,
        status
      } = ctx.request.query;

      const filters = {};
      if (username) filters.username = username;
      if (email) filters.email = email;
      if (status !== undefined) filters.status = parseInt(status);

      const result = await userService.getUsers(
        parseInt(page),
        parseInt(pageSize),
        filters
      );

      Response.page(
        ctx,
        result.list,
        result.total,
        page,
        pageSize,
        '获取用户列表成功'
      );
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      Response.error(ctx, error.message || '获取用户列表失败', -1, 500);
    }
  }

  /**
   * 根据ID获取用户详情
   * @param {Object} ctx - Koa上下文
   */
  async getUserById(ctx) {
    try {
      const { id } = ctx.params;
      const result = await userService.getUserById(id);
      Response.success(ctx, result, '获取用户详情成功');
    } catch (error) {
      logger.error('获取用户详情失败:', error);
      Response.error(ctx, error.message || '获取用户详情失败', -1, 500);
    }
  }

  /**
   * 创建用户
   * @param {Object} ctx - Koa上下文
   */
  async createUser(ctx) {
    try {
      const userData = ctx.request.body;
      const user = await userService.createUser(userData);
      Response.success(ctx, user, '创建用户成功');
    } catch (error) {
      logger.error('创建用户失败:', error);
      Response.error(ctx, error.message || '创建用户失败', -1, 500);
    }
  }

  /**
   * 更新用户信息
   * @param {Object} ctx - Koa上下文
   */
  async updateUser(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      const user = await userService.updateUser(id, updateData);
      Response.success(ctx, user, '更新用户成功');
    } catch (error) {
      logger.error('更新用户失败:', error);
      Response.error(ctx, error.message || '更新用户失败', -1, 500);
    }
  }

  /**
   * 删除用户
   * @param {Object} ctx - Koa上下文
   */
  async deleteUser(ctx) {
    try {
      const { id } = ctx.params;
      const currentUserId = ctx.state.userId;
      
      await userService.deleteUser(id, currentUserId);
      Response.success(ctx, null, '删除用户成功');
    } catch (error) {
      logger.error('删除用户失败:', error);
      Response.error(ctx, error.message || '删除用户失败', -1, 500);
    }
  }

  /**
   * 为用户分配角色
   * @param {Object} ctx - Koa上下文
   */
  async assignRoles(ctx) {
    try {
      const { id } = ctx.params;
      const { role_ids } = ctx.request.body;
      
      await userService.assignRoles(id, role_ids);
      Response.success(ctx, null, '分配角色成功');
    } catch (error) {
      logger.error('分配角色失败:', error);
      Response.error(ctx, error.message || '分配角色失败', -1, 500);
    }
  }

  /**
   * 重置用户密码
   * @param {Object} ctx - Koa上下文
   */
  async resetPassword(ctx) {
    try {
      const { id } = ctx.params;
      const { new_password } = ctx.request.body;
      
      await userService.resetPassword(id, new_password);
      Response.success(ctx, null, '重置密码成功');
    } catch (error) {
      logger.error('重置密码失败:', error);
      Response.error(ctx, error.message || '重置密码失败', -1, 500);
    }
  }
}

// 导出实例
module.exports = new UserController();