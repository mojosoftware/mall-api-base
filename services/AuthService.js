const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const userRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');

class AuthService {
  /**
   * 用户登录
   * @param {String} email - 邮箱
   * @param {String} password - 密码
   * @param {String} clientIp - 客户端IP
   * @returns {Object} 登录结果
   */
  async login(email, password, clientIp) {
    // 查找用户
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status === 0) {
      throw new Error('用户已被禁用');
    }

    // 验证密码
    const isValidPassword = await userRepository.verifyPassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间和IP
    await userRepository.updateLastLogin(user.id, clientIp);

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // 获取用户角色和权限
    const roles = await userRepository.getUserRoles(user.id);
    const permissions = await userRepository.getUserPermissions(user.id);

    // 获取用户信息（不包含密码）
    const userInfo = await userRepository.findUserById(user.id);

    return {
      user: userInfo,
      token,
      roles,
      permissions
    };
  }

  /**
   * 获取当前用户信息
   * @param {Number} userId - 用户ID
   * @returns {Object} 用户信息
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户角色和权限
    const roles = await userRepository.getUserRoles(userId);
    const permissions = await userRepository.getUserPermissions(userId);

    return {
      user,
      roles,
      permissions
    };
  }

  /**
   * 修改密码
   * @param {Number} userId - 用户ID
   * @param {String} oldPassword - 旧密码
   * @param {String} newPassword - 新密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    // 获取用户信息（包含密码）
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isValidOldPassword = await userRepository.verifyPassword(
      oldPassword,
      user.password
    );
    if (!isValidOldPassword) {
      throw new Error('旧密码错误');
    }

    // 更新密码
    await userRepository.updatePassword(userId, newPassword);
  }
}

// 导出实例
module.exports = new AuthService();