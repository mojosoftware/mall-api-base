const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class UserController {
  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }

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

      const result = await this.userRepository.findPaginated(
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
      Response.error(ctx, '获取用户列表失败', -1, 500);
    }
  }

  /**
   * 根据ID获取用户详情
   * @param {Object} ctx - Koa上下文
   */
  async getUserById(ctx) {
    try {
      const { id } = ctx.params;
      const user = await this.userRepository.findById(id);

      if (!user) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 获取用户角色
      const roles = await this.userRepository.getUserRoles(id);

      Response.success(ctx, { user, roles }, '获取用户详情成功');
    } catch (error) {
      logger.error('获取用户详情失败:', error);
      Response.error(ctx, '获取用户详情失败', -1, 500);
    }
  }

  /**
   * 创建用户
   * @param {Object} ctx - Koa上下文
   */
  async createUser(ctx) {
    try {
      const userData = ctx.request.body;

      // 检查用户名是否已存在
      const existingUserByUsername = await this.userRepository.findByUsername(
        userData.username
      );
      if (existingUserByUsername) {
        return Response.error(ctx, '用户名已存在', -1, 400);
      }

      // 检查邮箱是否已存在
      const existingUserByEmail = await this.userRepository.findByEmail(
        userData.email
      );
      if (existingUserByEmail) {
        return Response.error(ctx, '邮箱已存在', -1, 400);
      }

      const user = await this.userRepository.create(userData);
      Response.success(ctx, user, '创建用户成功');
    } catch (error) {
      logger.error('创建用户失败:', error);
      Response.error(ctx, '创建用户失败', -1, 500);
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

      // 检查用户是否存在
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 如果更新邮箱，检查是否已存在
      if (updateData.email && updateData.email !== existingUser.email) {
        const existingUserByEmail = await this.userRepository.findByEmail(
          updateData.email
        );
        if (existingUserByEmail) {
          return Response.error(ctx, '邮箱已存在', -1, 400);
        }
      }

      const user = await this.userRepository.update(id, updateData);
      Response.success(ctx, user, '更新用户成功');
    } catch (error) {
      logger.error('更新用户失败:', error);
      Response.error(ctx, '更新用户失败', -1, 500);
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

      // 不能删除自己
      if (parseInt(id) === currentUserId) {
        return Response.error(ctx, '不能删除自己', -1, 400);
      }

      // 检查用户是否存在
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      const result = await this.userRepository.delete(id);
      if (result) {
        Response.success(ctx, null, '删除用户成功');
      } else {
        Response.error(ctx, '删除用户失败', -1, 400);
      }
    } catch (error) {
      logger.error('删除用户失败:', error);
      Response.error(ctx, '删除用户失败', -1, 500);
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

      // 检查用户是否存在
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 验证角色是否都存在
      for (const roleId of role_ids) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          return Response.error(ctx, `角色ID ${roleId} 不存在`, -1, 400);
        }
      }

      await this.userRepository.assignRoles(id, role_ids);
      Response.success(ctx, null, '分配角色成功');
    } catch (error) {
      logger.error('分配角色失败:', error);
      Response.error(ctx, '分配角色失败', -1, 500);
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

      // 检查用户是否存在
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return Response.error(ctx, '用户不存在', -1, 404);
      }

      // 更新密码
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(new_password, 10);

      await this.userRepository.update(id, {
        password: hashedPassword
      });

      Response.success(ctx, null, '重置密码成功');
    } catch (error) {
      logger.error('重置密码失败:', error);
      Response.error(ctx, '重置密码失败', -1, 500);
    }
  }
}

module.exports = UserController;
