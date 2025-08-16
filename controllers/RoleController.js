const RoleService = require('../services/RoleService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class RoleController {
  constructor() {
    this.roleService = new RoleService();
  }

  /**
   * 获取角色列表
   * @param {Object} ctx - Koa上下文
   */
  async getRoles(ctx) {
    try {
      const { page, pageSize, name, code, status } = ctx.request.query;

      const filters = {};
      if (name) filters.name = name;
      if (code) filters.code = code;
      if (status !== undefined) filters.status = parseInt(status);

      const result = await this.roleService.getRoles(
        page ? parseInt(page) : null,
        pageSize ? parseInt(pageSize) : null,
        filters
      );

      if (page && pageSize) {
        Response.page(ctx, result.list, result.total, page, pageSize, '获取角色列表成功');
      } else {
        Response.success(ctx, result.list, '获取角色列表成功');
      }
    } catch (error) {
      logger.error('获取角色列表失败:', error);
      Response.error(ctx, error.message || '获取角色列表失败', -1, 500);
    }
  }

  /**
   * 根据ID获取角色详情
   * @param {Object} ctx - Koa上下文
   */
  async getRoleById(ctx) {
    try {
      const { id } = ctx.params;
      const result = await this.roleService.getRoleById(id);
      Response.success(ctx, result, '获取角色详情成功');
    } catch (error) {
      logger.error('获取角色详情失败:', error);
      Response.error(ctx, error.message || '获取角色详情失败', -1, 500);
    }
  }

  /**
   * 创建角色
   * @param {Object} ctx - Koa上下文
   */
  async createRole(ctx) {
    try {
      const roleData = ctx.request.body;
      const role = await this.roleService.createRole(roleData);
      Response.success(ctx, role, '创建角色成功');
    } catch (error) {
      logger.error('创建角色失败:', error);
      Response.error(ctx, error.message || '创建角色失败', -1, 500);
    }
  }

  /**
   * 更新角色信息
   * @param {Object} ctx - Koa上下文
   */
  async updateRole(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      const role = await this.roleService.updateRole(id, updateData);
      Response.success(ctx, role, '更新角色成功');
    } catch (error) {
      logger.error('更新角色失败:', error);
      Response.error(ctx, error.message || '更新角色失败', -1, 500);
    }
  }

  /**
   * 删除角色
   * @param {Object} ctx - Koa上下文
   */
  async deleteRole(ctx) {
    try {
      const { id } = ctx.params;
      
      await this.roleService.deleteRole(id);
      Response.success(ctx, null, '删除角色成功');
    } catch (error) {
      logger.error('删除角色失败:', error);
      Response.error(ctx, error.message || '删除角色失败', -1, 500);
    }
  }

  /**
   * 为角色分配权限
   * @param {Object} ctx - Koa上下文
   */
  async assignPermissions(ctx) {
    try {
      const { id } = ctx.params;
      const { permission_ids } = ctx.request.body;
      
      await this.roleService.assignPermissions(id, permission_ids);
      Response.success(ctx, null, '分配权限成功');
    } catch (error) {
      logger.error('分配权限失败:', error);
      Response.error(ctx, error.message || '分配权限失败', -1, 500);
    }
  }
}

module.exports = RoleController;
