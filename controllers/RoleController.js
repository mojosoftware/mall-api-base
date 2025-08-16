const RoleRepository = require('../repositories/RoleRepository');
const PermissionRepository = require('../repositories/PermissionRepository');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class RoleController {
  constructor() {
    this.roleRepository = new RoleRepository();
    this.permissionRepository = new PermissionRepository();
  }

  /**
   * 获取角色列表
   * @param {Object} ctx - Koa上下文
   */
  async getRoles(ctx) {
    try {
      const { page, pageSize, name, code, status } = ctx.request.query;

      if (page && pageSize) {
        // 分页查询
        const filters = {};
        if (name) filters.name = name;
        if (code) filters.code = code;
        if (status !== undefined) filters.status = parseInt(status);

        const result = await this.roleRepository.findPaginated(
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
          '获取角色列表成功'
        );
      } else {
        // 获取所有启用的角色
        const roles = await this.roleRepository.findAllEnabled();
        Response.success(ctx, roles, '获取角色列表成功');
      }
    } catch (error) {
      logger.error('获取角色列表失败:', error);
      Response.error(ctx, '获取角色列表失败', -1, 500);
    }
  }

  /**
   * 根据ID获取角色详情
   * @param {Object} ctx - Koa上下文
   */
  async getRoleById(ctx) {
    try {
      const { id } = ctx.params;
      const role = await this.roleRepository.findById(id);

      if (!role) {
        return Response.error(ctx, '角色不存在', -1, 404);
      }

      // 获取角色权限
      const permissions = await this.roleRepository.getRolePermissions(id);

      Response.success(ctx, { role, permissions }, '获取角色详情成功');
    } catch (error) {
      logger.error('获取角色详情失败:', error);
      Response.error(ctx, '获取角色详情失败', -1, 500);
    }
  }

  /**
   * 创建角色
   * @param {Object} ctx - Koa上下文
   */
  async createRole(ctx) {
    try {
      const roleData = ctx.request.body;

      // 检查角色代码是否已存在
      const existingRole = await this.roleRepository.findByCode(roleData.code);
      if (existingRole) {
        return Response.error(ctx, '角色代码已存在', -1, 400);
      }

      const role = await this.roleRepository.create(roleData);
      Response.success(ctx, role, '创建角色成功');
    } catch (error) {
      logger.error('创建角色失败:', error);
      Response.error(ctx, '创建角色失败', -1, 500);
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

      // 检查角色是否存在
      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole) {
        return Response.error(ctx, '角色不存在', -1, 404);
      }

      const role = await this.roleRepository.update(id, updateData);
      Response.success(ctx, role, '更新角色成功');
    } catch (error) {
      logger.error('更新角色失败:', error);
      Response.error(ctx, '更新角色失败', -1, 500);
    }
  }

  /**
   * 删除角色
   * @param {Object} ctx - Koa上下文
   */
  async deleteRole(ctx) {
    try {
      const { id } = ctx.params;

      // 检查角色是否存在
      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole) {
        return Response.error(ctx, '角色不存在', -1, 404);
      }

      // 检查是否有用户使用该角色
      const userCount = await this.roleRepository.getUserCount(id);
      if (userCount > 0) {
        return Response.error(ctx, '该角色下还有用户，无法删除', -1, 400);
      }

      const result = await this.roleRepository.delete(id);
      if (result) {
        Response.success(ctx, null, '删除角色成功');
      } else {
        Response.error(ctx, '删除角色失败', -1, 400);
      }
    } catch (error) {
      logger.error('删除角色失败:', error);
      Response.error(ctx, '删除角色失败', -1, 500);
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

      // 检查角色是否存在
      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole) {
        return Response.error(ctx, '角色不存在', -1, 404);
      }

      // 验证权限是否都存在
      for (const permissionId of permission_ids) {
        const permission =
          await this.permissionRepository.findById(permissionId);
        if (!permission) {
          return Response.error(ctx, `权限ID ${permissionId} 不存在`, -1, 400);
        }
      }

      await this.roleRepository.assignPermissions(id, permission_ids);
      Response.success(ctx, null, '分配权限成功');
    } catch (error) {
      logger.error('分配权限失败:', error);
      Response.error(ctx, '分配权限失败', -1, 500);
    }
  }
}

module.exports = RoleController;
