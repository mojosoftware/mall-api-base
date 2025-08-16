const BaseRepository = require('./BaseRepository');
const { Role, Permission, User } = require('../models');
const { Op } = require('sequelize');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  /**
   * 根据代码查找角色
   * @param {String} code - 角色代码
   * @returns {Object|null} 角色信息
   */
  async findByCode(code) {
    return await this.findOne({ code });
  }

  /**
   * 分页查询角色列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 角色列表和总数
   */
  async findRolesPaginated(page = 1, pageSize = 10, filters = {}) {
    const where = {};

    if (filters.name) {
      Object.assign(where, this.buildLikeCondition('name', filters.name));
    }

    if (filters.code) {
      Object.assign(where, this.buildLikeCondition('code', filters.code));
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    return await this.findPaginated(page, pageSize, where, {
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 获取所有启用的角色
   * @returns {Array} 角色列表
   */
  async findAllEnabled() {
    return await this.findAll({ status: 1 }, {
      order: [['created_at', 'ASC']]
    });
  }

  /**
   * 获取角色的权限列表
   * @param {Number} roleId - 角色ID
   * @returns {Array} 权限列表
   */
  async getRolePermissions(roleId) {
    const role = await this.findById(roleId, {
      include: [{
        model: Permission,
        as: 'permissions',
        where: { status: 1 },
        required: false,
        through: { attributes: [] },
        order: [['sort_order', 'ASC'], ['id', 'ASC']]
      }]
    });

    return role ? role.permissions : [];
  }

  /**
   * 为角色分配权限
   * @param {Number} roleId - 角色ID
   * @param {Array} permissionIds - 权限ID数组
   */
  async assignPermissions(roleId, permissionIds) {
    const role = await this.findById(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    const permissions = await Permission.findAll({
      where: { id: { [Op.in]: permissionIds } }
    });

    await role.setPermissions(permissions);
  }

  /**
   * 获取拥有该角色的用户数量
   * @param {Number} roleId - 角色ID
   * @returns {Number} 用户数量
   */
  async getUserCount(roleId) {
    const role = await this.findById(roleId, {
      include: [{
        model: User,
        as: 'users',
        through: { attributes: [] }
      }]
    });

    return role ? role.users.length : 0;
  }

  /**
   * 检查角色代码是否已存在
   * @param {String} code - 角色代码
   * @param {Number} excludeId - 排除的角色ID
   * @returns {Boolean} 是否已存在
   */
  async isCodeExists(code, excludeId = null) {
    const where = { code };
    
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return await this.exists(where);
  }
}

// 导出实例
module.exports = new RoleRepository();