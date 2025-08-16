const BaseRepository = require('./BaseRepository');
const { User, Role, Permission } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * 根据用户名查找用户
   * @param {String} username - 用户名
   * @returns {Object|null} 用户信息
   */
  async findByUsername(username) {
    return await this.findOne({ username });
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email - 邮箱
   * @returns {Object|null} 用户信息
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户信息
   */
  async createUser(userData) {
    const { password, ...otherData } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await this.create({
      ...otherData,
      password: hashedPassword
    });
  }

  /**
   * 分页查询用户列表（排除密码字段）
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 用户列表和总数
   */
  async findUsersPaginated(page = 1, pageSize = 10, filters = {}) {
    const where = {};

    if (filters.username) {
      Object.assign(where, this.buildLikeCondition('username', filters.username));
    }

    if (filters.email) {
      Object.assign(where, this.buildLikeCondition('email', filters.email));
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    return await this.findPaginated(page, pageSize, where, {
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 根据ID获取用户详情（排除密码）
   * @param {Number} id - 用户ID
   * @returns {Object|null} 用户信息
   */
  async findUserById(id) {
    return await this.findById(id, {
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * 更新最后登录时间和IP
   * @param {Number} id - 用户ID
   * @param {String} ip - 登录IP
   */
  async updateLastLogin(id, ip) {
    await this.updateById(id, {
      last_login_time: new Date(),
      last_login_ip: ip
    });
  }

  /**
   * 获取用户的角色列表
   * @param {Number} userId - 用户ID
   * @returns {Array} 角色列表
   */
  async getUserRoles(userId) {
    const user = await this.findById(userId, {
      include: [{
        model: Role,
        as: 'roles',
        where: { status: 1 },
        required: false,
        through: { attributes: [] }
      }]
    });

    return user ? user.roles : [];
  }

  /**
   * 获取用户的权限列表
   * @param {Number} userId - 用户ID
   * @returns {Array} 权限列表
   */
  async getUserPermissions(userId) {
    const user = await this.findById(userId, {
      include: [{
        model: Role,
        as: 'roles',
        where: { status: 1 },
        required: false,
        through: { attributes: [] },
        include: [{
          model: Permission,
          as: 'permissions',
          where: { status: 1 },
          required: false,
          through: { attributes: [] }
        }]
      }]
    });

    if (!user || !user.roles) return [];

    // 去重权限
    const permissionMap = new Map();
    user.roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          permissionMap.set(permission.id, permission);
        });
      }
    });

    return Array.from(permissionMap.values());
  }

  /**
   * 为用户分配角色
   * @param {Number} userId - 用户ID
   * @param {Array} roleIds - 角色ID数组
   */
  async assignRoles(userId, roleIds) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const roles = await Role.findAll({
      where: { id: { [Op.in]: roleIds } }
    });

    await user.setRoles(roles);
  }

  /**
   * 验证密码
   * @param {String} password - 明文密码
   * @param {String} hashedPassword - 哈希密码
   * @returns {Boolean} 是否匹配
   */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 更新用户密码
   * @param {Number} id - 用户ID
   * @param {String} newPassword - 新密码
   */
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.updateById(id, { password: hashedPassword });
  }
}

// 导出实例
module.exports = new UserRepository();