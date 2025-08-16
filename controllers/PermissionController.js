const PermissionService = require('../services/PermissionService');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class PermissionController {
  constructor() {
    this.permissionService = new PermissionService();
  }

  /**
   * 获取权限列表
   * @param {Object} ctx - Koa上下文
   */
  async getPermissions(ctx) {
    try {
      const { page, pageSize, name, code, type, parent_id, status } =
        ctx.request.query;

      const filters = {};
      if (name) filters.name = name;
      if (code) filters.code = code;
      if (type) filters.type = type;
      if (parent_id !== undefined) filters.parent_id = parseInt(parent_id);
      if (status !== undefined) filters.status = parseInt(status);

      const result = await this.permissionService.getPermissions(
        page ? parseInt(page) : null,
        pageSize ? parseInt(pageSize) : null,
        filters
      );

      if (page && pageSize) {
        Response.page(ctx, result.list, result.total, page, pageSize, '获取权限列表成功');
      } else {
        Response.success(ctx, result.list, '获取权限列表成功');
      }
    } catch (error) {
      logger.error('获取权限列表失败:', error);
      Response.error(ctx, error.message || '获取权限列表失败', -1, 500);
    }
  }

  /**
   * 获取权限树形结构
   * @param {Object} ctx - Koa上下文
   */
  async getPermissionTree(ctx) {
    try {
      const tree = await this.permissionService.getPermissionTree();
      Response.success(ctx, tree, '获取权限树成功');
    } catch (error) {
      logger.error('获取权限树失败:', error);
      Response.error(ctx, error.message || '获取权限树失败', -1, 500);
    }
  }

  /**
   * 根据ID获取权限详情
   * @param {Object} ctx - Koa上下文
   */
  async getPermissionById(ctx) {
    try {
      const { id } = ctx.params;
      const permission = await this.permissionService.getPermissionById(id);
      Response.success(ctx, permission, '获取权限详情成功');
    } catch (error) {
      logger.error('获取权限详情失败:', error);
      Response.error(ctx, error.message || '获取权限详情失败', -1, 500);
    }
  }

  /**
   * 创建权限
   * @param {Object} ctx - Koa上下文
   */
  async createPermission(ctx) {
    try {
      const permissionData = ctx.request.body;
      const permission = await this.permissionService.createPermission(permissionData);
      Response.success(ctx, permission, '创建权限成功');
    } catch (error) {
      logger.error('创建权限失败:', error);
      Response.error(ctx, error.message || '创建权限失败', -1, 500);
    }
  }

  /**
   * 更新权限信息
   * @param {Object} ctx - Koa上下文
   */
  async updatePermission(ctx) {
    try {
      const { id } = ctx.params;
      const updateData = ctx.request.body;
      const permission = await this.permissionService.updatePermission(id, updateData);
      Response.success(ctx, permission, '更新权限成功');
    } catch (error) {
      logger.error('更新权限失败:', error);
      Response.error(ctx, error.message || '更新权限失败', -1, 500);
    }
  }

  /**
   * 删除权限
   * @param {Object} ctx - Koa上下文
   */
  async deletePermission(ctx) {
    try {
      const { id } = ctx.params;
      
      await this.permissionService.deletePermission(id);
      Response.success(ctx, null, '删除权限成功');
    } catch (error) {
      logger.error('删除权限失败:', error);
      Response.error(ctx, error.message || '删除权限失败', -1, 500);
    }
  }
}

module.exports = PermissionController;
