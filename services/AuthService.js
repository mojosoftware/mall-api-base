const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const userRepository = require('../repositories/UserRepository');
const emailService = require('./EmailService');
const redis = require('../config/redis');
const crypto = require('crypto');
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
   * 用户注册
   * @param {Object} userData - 用户数据
   * @param {String} clientIp - 客户端IP
   * @returns {Object} 注册结果
   */
  async register(userData, clientIp) {
    const { username, email, password, real_name, phone } = userData;

    // 检查用户名是否已存在
    const existingUserByUsername = await userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('邮箱已存在');
    }

    // 生成验证码
    const verificationCode = this.generateVerificationCode();
    
    // 将用户数据和验证码存储到Redis（10分钟过期）
    const tempUserKey = `temp_user:${email}`;
    const tempUserData = {
      username,
      email,
      password,
      real_name,
      phone,
      verificationCode,
      clientIp,
      createdAt: new Date().toISOString()
    };
    
    await redis.setex(tempUserKey, 600, JSON.stringify(tempUserData)); // 10分钟过期

    // 发送验证邮件
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(email)}&code=${verificationCode}`;
    await emailService.sendVerificationEmail(email, username, verificationCode, verificationUrl);

    return {
      message: '注册信息已提交，请查收验证邮件',
      email: email
    };
  }

  /**
   * 验证邮箱
   * @param {String} email - 邮箱
   * @param {String} code - 验证码
   * @returns {Object} 验证结果
   */
  async verifyEmail(email, code) {
    const tempUserKey = `temp_user:${email}`;
    const tempUserDataStr = await redis.get(tempUserKey);
    
    if (!tempUserDataStr) {
      throw new Error('验证码已过期或无效');
    }

    const tempUserData = JSON.parse(tempUserDataStr);
    
    if (tempUserData.verificationCode !== code) {
      throw new Error('验证码错误');
    }

    // 创建用户
    const user = await userRepository.createUser({
      username: tempUserData.username,
      email: tempUserData.email,
      password: tempUserData.password,
      real_name: tempUserData.real_name,
      phone: tempUserData.phone
    });

    // 删除临时数据
    await redis.del(tempUserKey);

    // 发送欢迎邮件
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    await emailService.sendWelcomeEmail(email, tempUserData.username, loginUrl);

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // 获取用户信息（不包含密码）
    const userInfo = await userRepository.findUserById(user.id);

    return {
      user: userInfo,
      token,
      message: '邮箱验证成功，注册完成'
    };
  }

  /**
   * 重新发送验证邮件
   * @param {String} email - 邮箱
   */
  async resendVerificationEmail(email) {
    const tempUserKey = `temp_user:${email}`;
    const tempUserDataStr = await redis.get(tempUserKey);
    
    if (!tempUserDataStr) {
      throw new Error('注册信息已过期，请重新注册');
    }

    const tempUserData = JSON.parse(tempUserDataStr);
    
    // 生成新的验证码
    const newVerificationCode = this.generateVerificationCode();
    tempUserData.verificationCode = newVerificationCode;
    
    // 更新Redis中的数据
    await redis.setex(tempUserKey, 600, JSON.stringify(tempUserData));

    // 发送验证邮件
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(email)}&code=${newVerificationCode}`;
    await emailService.sendVerificationEmail(email, tempUserData.username, newVerificationCode, verificationUrl);
  }

  /**
   * 生成6位数字验证码
   * @returns {String} 验证码
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
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