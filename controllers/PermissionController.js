const PermissionRepository = require('../repositories/PermissionRepository');
const Response = require('../utils/response');

class PermissionController {
  constructor() {
    this.permissionRepository = new PermissionRepository();
  }

  /**
   * 获取权限列表
   * @param {Object} ctx - Koa上下文
   */
  async getPermissions(ctx) {
    try {
      const { page, pageSize, name, code, type, parent_id, status } = ctx.request.query;

      if (page && pageSize) {
        // 分页查询
        const filters = {};
        if (name) filters.name = name;
        if (code) filters.code = code;
        if (type) filters.type = type;
        if (parent_id !== undefined) filters.parent_id = parseInt(parent_id);
        if (status !== undefined) filters.status = parseInt(status);

        const result = await this.permissionRepository.findPaginated(
          parseInt(page),
          parseInt(pageSize),
          filters
        );

        Response.page(ctx, result.list, result.total, page, pageSize, '获取权限列表成功');
      } else {
        // 获取所有启用的权限
        const permissions = await this.permissionRepository.findAllEnabled();
        Response.success(ctx, permissions, '获取权限列表成功');
      }

    } catch (error) {
      console.error('获取权限列表失败:', error);
      Response.error(ctx, '获取权限列表失败', -1, 500);
    }
  }

  /**
   * 获取权限树形结构
   * @param {Object} ctx - Koa上下文
   */
  async getPermissionTree(ctx) {
    try {
      const tree = await this.permissionRepository.getPermissionTree();
      Response.success(ctx, tree, '获取权限树成功');
    } catch (error) {
      console.error('获取权限树失败:', error);
      Response.error(ctx, '获取权限树失败', -1, 500);
    }
  }

  /**
   * 根据ID获取权限详情
   * @param {Object} ctx - Koa上下文
   */
  async getPermissionById(ctx) {
    try {
      const { id } = ctx.params;
      const permission = await this.permissionRepository.findById(id);

      if (!permission) {
        return Response.error(ctx, '权限不存在', -1, 404);
      }

      Response.success(ctx, permission, '获取权限详情成功');

    } catch (error) {
      console.error('获取权限详情失败:', error);
      Response.error(ctx, '获取权限详情失败', -1, 500);
    }
  }

  /**
   * 创建权限
   * @param {Object} ctx - Koa上下文
   */
  async createPermission(ctx) {
    try {
      const permissionData = ctx.request.body;

      // 检查权限代码是否已存在
      const existingPermission = await this.permissionRepository.findByCode(permissionData.code);
      if (existingPermission) {
        return Response.error(ctx, '权限代码已存在', -1, 400);
      }

      // 如果设置了父权限，检查父权限是否存在
      if (permissionData.parent_id && permissionData.parent_id > 0) {
        const parentPermission = await this.permissionRepository.findById(permissionData.parent_id);
        if (!parentPermission) {
          return Response.error(ctx, '父权限不存在', -1, 400);
        }
      }

      const permission = await this.permissionRepository.create(permissionData);
      Response.success(ctx, permission, '创建权限成功');

    } catch (error) {
      console.error('创建权限失败:', error);
      Response.error(ctx, '创建权限失败', -1, 500);
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

      // 检查权限是否存在
      const existingPermission = await this.permissionRepository.findById(id);
      if (!existingPermission) {
        return Response.error(ctx, '权限不存在', -1, 404);
      }

      // 如果更新父权限，检查父权限是否存在且不能设置为自己
      if (updateData.parent_id !== undefined) {
        if (updateData.parent_id > 0) {
          if (updateData.parent_id === parseInt(id)) {
            return Response.error(ctx, '不能将自己设置为父权限', -1, 400);
          }
          const parentPermission = await this.permissionRepository.findById(updateData.parent_id);
          if (!parentPermission) {
            return Response.error(ctx, '父权限不存在', -1, 400);
          }
        }
      }

      const permission = await this.permissionRepository.update(id, updateData);
      Response.success(ctx, permission, '更新权限成功');

    } catch (error) {
      console.error('更新权限失败:', error);
      Response.error(ctx, '更新权限失败', -1, 500);
    }
  }

  /**
   * 删除权限
   * @param {Object} ctx - Koa上下文
   */
  async deletePermission(ctx) {
    try {
      const { id } = ctx.params;

      // 检查权限是否存在
      const existingPermission = await this.permissionRepository.findById(id);
      if (!existingPermission) {
        return Response.error(ctx, '权限不存在', -1, 404);
      }

      // 检查是否有子权限
      const childrenCount = await this.permissionRepository.getChildrenCount(id);
      if (childrenCount > 0) {
        return Response.error(ctx, '该权限下还有子权限，无法删除', -1, 400);
      }

      const result = await this.permissionRepository.delete(id);
      if (result) {
        Response.success(ctx, null, '删除权限成功');
      } else {
        Response.error(ctx, '删除权限失败', -1, 400);
      }

    } catch (error) {
      console.error('删除权限失败:', error);
      Response.error(ctx, '删除权限失败', -1, 500);
    }
  }
}

module.exports = PermissionController;