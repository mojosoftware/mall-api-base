const PermissionRepository = require('../repositories/PermissionRepository');

class PermissionService {
  constructor() {
    this.permissionRepository = new PermissionRepository();
  }

  /**
   * 获取权限列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 权限列表和总数
   */
  async getPermissions(page, pageSize, filters) {
    if (page && pageSize) {
      return await this.permissionRepository.findPaginated(page, pageSize, filters);
    } else {
      const permissions = await this.permissionRepository.findAllEnabled();
      return { list: permissions, total: permissions.length };
    }
  }

  /**
   * 获取权限树形结构
   * @returns {Array} 权限树
   */
  async getPermissionTree() {
    return await this.permissionRepository.getPermissionTree();
  }

  /**
   * 根据ID获取权限详情
   * @param {Number} id - 权限ID
   * @returns {Object} 权限详情
   */
  async getPermissionById(id) {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new Error('权限不存在');
    }

    return permission;
  }

  /**
   * 创建权限
   * @param {Object} permissionData - 权限数据
   * @returns {Object} 创建的权限信息
   */
  async createPermission(permissionData) {
    // 检查权限代码是否已存在
    const existingPermission = await this.permissionRepository.findByCode(
      permissionData.code
    );
    if (existingPermission) {
      throw new Error('权限代码已存在');
    }

    // 如果设置了父权限，检查父权限是否存在
    if (permissionData.parent_id && permissionData.parent_id > 0) {
      const parentPermission = await this.permissionRepository.findById(
        permissionData.parent_id
      );
      if (!parentPermission) {
        throw new Error('父权限不存在');
      }
    }

    return await this.permissionRepository.create(permissionData);
  }

  /**
   * 更新权限信息
   * @param {Number} id - 权限ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的权限信息
   */
  async updatePermission(id, updateData) {
    // 检查权限是否存在
    const existingPermission = await this.permissionRepository.findById(id);
    if (!existingPermission) {
      throw new Error('权限不存在');
    }

    // 如果更新父权限，检查父权限是否存在且不能设置为自己
    if (updateData.parent_id !== undefined) {
      if (updateData.parent_id > 0) {
        if (updateData.parent_id === parseInt(id)) {
          throw new Error('不能将自己设置为父权限');
        }
        const parentPermission = await this.permissionRepository.findById(
          updateData.parent_id
        );
        if (!parentPermission) {
          throw new Error('父权限不存在');
        }
      }
    }

    return await this.permissionRepository.update(id, updateData);
  }

  /**
   * 删除权限
   * @param {Number} id - 权限ID
   * @returns {Boolean} 是否删除成功
   */
  async deletePermission(id) {
    // 检查权限是否存在
    const existingPermission = await this.permissionRepository.findById(id);
    if (!existingPermission) {
      throw new Error('权限不存在');
    }

    // 检查是否有子权限
    const childrenCount = await this.permissionRepository.getChildrenCount(id);
    if (childrenCount > 0) {
      throw new Error('该权限下还有子权限，无法删除');
    }

    const result = await this.permissionRepository.delete(id);
    if (!result) {
      throw new Error('删除权限失败');
    }

    return result;
  }
}

module.exports = PermissionService;