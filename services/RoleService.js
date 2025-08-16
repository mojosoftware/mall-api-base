const RoleRepository = require('../repositories/RoleRepository');
const PermissionRepository = require('../repositories/PermissionRepository');

class RoleService {
  constructor() {
    this.roleRepository = new RoleRepository();
    this.permissionRepository = new PermissionRepository();
  }

  /**
   * 获取角色列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 角色列表和总数
   */
  async getRoles(page, pageSize, filters) {
    if (page && pageSize) {
      return await this.roleRepository.findPaginated(page, pageSize, filters);
    } else {
      const roles = await this.roleRepository.findAllEnabled();
      return { list: roles, total: roles.length };
    }
  }

  /**
   * 根据ID获取角色详情
   * @param {Number} id - 角色ID
   * @returns {Object} 角色详情
   */
  async getRoleById(id) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new Error('角色不存在');
    }

    // 获取角色权限
    const permissions = await this.roleRepository.getRolePermissions(id);

    return { role, permissions };
  }

  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Object} 创建的角色信息
   */
  async createRole(roleData) {
    // 检查角色代码是否已存在
    const existingRole = await this.roleRepository.findByCode(roleData.code);
    if (existingRole) {
      throw new Error('角色代码已存在');
    }

    return await this.roleRepository.create(roleData);
  }

  /**
   * 更新角色信息
   * @param {Number} id - 角色ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的角色信息
   */
  async updateRole(id, updateData) {
    // 检查角色是否存在
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    return await this.roleRepository.update(id, updateData);
  }

  /**
   * 删除角色
   * @param {Number} id - 角色ID
   * @returns {Boolean} 是否删除成功
   */
  async deleteRole(id) {
    // 检查角色是否存在
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 检查是否有用户使用该角色
    const userCount = await this.roleRepository.getUserCount(id);
    if (userCount > 0) {
      throw new Error('该角色下还有用户，无法删除');
    }

    const result = await this.roleRepository.delete(id);
    if (!result) {
      throw new Error('删除角色失败');
    }

    return result;
  }

  /**
   * 为角色分配权限
   * @param {Number} id - 角色ID
   * @param {Array} permissionIds - 权限ID数组
   */
  async assignPermissions(id, permissionIds) {
    // 检查角色是否存在
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('角色不存在');
    }

    // 验证权限是否都存在
    for (const permissionId of permissionIds) {
      const permission = await this.permissionRepository.findById(permissionId);
      if (!permission) {
        throw new Error(`权限ID ${permissionId} 不存在`);
      }
    }

    await this.roleRepository.assignPermissions(id, permissionIds);
  }
}

module.exports = RoleService;