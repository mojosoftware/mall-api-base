const UserRepository = require('../repositories/UserRepository');
const RoleRepository = require('../repositories/RoleRepository');
const bcrypt = require('bcryptjs');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }

  /**
   * 获取用户列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 用户列表和总数
   */
  async getUsers(page, pageSize, filters) {
    return await this.userRepository.findPaginated(page, pageSize, filters);
  }

  /**
   * 根据ID获取用户详情
   * @param {Number} id - 用户ID
   * @returns {Object} 用户详情
   */
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户角色
    const roles = await this.userRepository.getUserRoles(id);

    return { user, roles };
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户信息
   */
  async createUser(userData) {
    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findByUsername(
      userData.username
    );
    if (existingUserByUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findByEmail(
      userData.email
    );
    if (existingUserByEmail) {
      throw new Error('邮箱已存在');
    }

    return await this.userRepository.create(userData);
  }

  /**
   * 更新用户信息
   * @param {Number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的用户信息
   */
  async updateUser(id, updateData) {
    // 检查用户是否存在
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 如果更新邮箱，检查是否已存在
    if (updateData.email && updateData.email !== existingUser.email) {
      const existingUserByEmail = await this.userRepository.findByEmail(
        updateData.email
      );
      if (existingUserByEmail) {
        throw new Error('邮箱已存在');
      }
    }

    return await this.userRepository.update(id, updateData);
  }

  /**
   * 删除用户
   * @param {Number} id - 用户ID
   * @param {Number} currentUserId - 当前用户ID
   * @returns {Boolean} 是否删除成功
   */
  async deleteUser(id, currentUserId) {
    // 不能删除自己
    if (parseInt(id) === currentUserId) {
      throw new Error('不能删除自己');
    }

    // 检查用户是否存在
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    const result = await this.userRepository.delete(id);
    if (!result) {
      throw new Error('删除用户失败');
    }

    return result;
  }

  /**
   * 为用户分配角色
   * @param {Number} id - 用户ID
   * @param {Array} roleIds - 角色ID数组
   */
  async assignRoles(id, roleIds) {
    // 检查用户是否存在
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 验证角色是否都存在
    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`角色ID ${roleId} 不存在`);
      }
    }

    await this.userRepository.assignRoles(id, roleIds);
  }

  /**
   * 重置用户密码
   * @param {Number} id - 用户ID
   * @param {String} newPassword - 新密码
   */
  async resetPassword(id, newPassword) {
    // 检查用户是否存在
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, {
      password: hashedPassword
    });
  }
}

module.exports = UserService;