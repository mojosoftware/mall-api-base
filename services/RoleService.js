const roleRepository = require('../repositories/RoleRepository');
const permissionRepository = require('../repositories/PermissionRepository');

class RoleService {
  /**
   * 获取角色列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 角色列表和总数
   */
  async getRoles(page, pageSize, filters) {
    if (page && pageSize) {
      return await roleRepository.findRolesPaginated(page, pageSize, filters);
    } else {
      const roles = await roleRepository.findAllEnabled();
      return { list: roles, total: roles.length };
    }
  }

  /**
   * 根据ID获取角色详情
   * @param {Number} id - 角色ID
   * @returns {Object} 角色详情
   */
  async getRoleById(id) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error('角色不存在');
    }

    // 获取角色权限
    const permissions = await roleRepository.getRolePermissions(id);

    return { role, permissions };
  }

  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Object} 创建的角色信息
   */
  async createRole(roleData) {
    // 检查角色代码是否已存在
    const existingRole = await roleRepository.findByCode(roleData.code);
    if (existingRole) {
      throw new Error('角色代码已存在');
    }

    return await roleRepository.create(roleData);
  }

  /**
   * 更新角色信息
   * @param {Number} id - 角色ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的角色信息
   */
  async updateRole(id, updateData) {
    // 检查角色是否存在
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 如果更新代码，检查是否已存在
    if (updateData.code && updateData.code !== existingRole.code) {
      const isCodeExists = await roleRepository.isCodeExists(updateData.code, id);
      if (isCodeExists) {
        throw new Error('角色代码已存在');
      }
    }

    return await roleRepository.updateById(id, updateData);
  }

  /**
   * 删除角色
   * @param {Number} id - 角色ID
   * @returns {Boolean} 是否删除成功
   */
  async deleteRole(id) {
    // 检查角色是否存在
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 检查是否有用户使用该角色
    const userCount = await roleRepository.getUserCount(id);
    if (userCount > 0) {
      throw new Error('该角色下还有用户，无法删除');
    }

    const result = await roleRepository.destroyById(id);
    return result > 0;
  }

  /**
   * 为角色分配权限
   * @param {Number} id - 角色ID
   * @param {Array} permissionIds - 权限ID数组
   */
  async assignPermissions(id, permissionIds) {
    // 检查角色是否存在
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 验证权限是否都存在
    for (const permissionId of permissionIds) {
      const permission = await permissionRepository.findById(permissionId);
      if (!permission) {
        throw new Error(`权限ID ${permissionId} 不存在`);
      }
    }

    await roleRepository.assignPermissions(id, permissionIds);
  }
}

// 导出实例
module.exports = new RoleService();