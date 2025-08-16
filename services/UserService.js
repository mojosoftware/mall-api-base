const userRepository = require('../repositories/UserRepository');
const roleRepository = require('../repositories/RoleRepository');

class UserService {
  /**
   * 获取用户列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 用户列表和总数
   */
  async getUsers(page, pageSize, filters) {
    return await userRepository.findUsersPaginated(page, pageSize, filters);
  }

  /**
   * 根据ID获取用户详情
   * @param {Number} id - 用户ID
   * @returns {Object} 用户详情
   */
  async getUserById(id) {
    const user = await userRepository.findUserById(id);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户角色
    const roles = await userRepository.getUserRoles(id);

    return { user, roles };
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户信息
   */
  async createUser(userData) {
    // 检查用户名是否已存在
    const existingUserByUsername = await userRepository.findByUsername(
      userData.username
    );
    if (existingUserByUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await userRepository.findByEmail(
      userData.email
    );
    if (existingUserByEmail) {
      throw new Error('邮箱已存在');
    }

    const user = await userRepository.createUser(userData);
    return await userRepository.findUserById(user.id);
  }

  /**
   * 更新用户信息
   * @param {Number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的用户信息
   */
  async updateUser(id, updateData) {
    // 检查用户是否存在
    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 如果更新邮箱，检查是否已存在
    if (updateData.email && updateData.email !== existingUser.email) {
      const existingUserByEmail = await userRepository.findByEmail(
        updateData.email
      );
      if (existingUserByEmail) {
        throw new Error('邮箱已存在');
      }
    }

    await userRepository.updateById(id, updateData);
    return await userRepository.findUserById(id);
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
    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    const result = await userRepository.destroyById(id);
    return result > 0;
  }

  /**
   * 为用户分配角色
   * @param {Number} id - 用户ID
   * @param {Array} roleIds - 角色ID数组
   */
  async assignRoles(id, roleIds) {
    // 检查用户是否存在
    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 验证角色是否都存在
    for (const roleId of roleIds) {
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`角色ID ${roleId} 不存在`);
      }
    }

    await userRepository.assignRoles(id, roleIds);
  }

  /**
   * 重置用户密码
   * @param {Number} id - 用户ID
   * @param {String} newPassword - 新密码
   */
  async resetPassword(id, newPassword) {
    // 检查用户是否存在
    const existingUser = await userRepository.findUserById(id);
    if (!existingUser) {
      throw new Error('用户不存在');
    }

    await userRepository.updatePassword(id, newPassword);
  }
}

// 导出实例
module.exports = new UserService();