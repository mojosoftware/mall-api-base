const BaseRepository = require('./BaseRepository');
const { Permission } = require('../models');
const { Op } = require('sequelize');

class PermissionRepository extends BaseRepository {
  constructor() {
    super(Permission);
  }

  /**
   * 根据代码查找权限
   * @param {String} code - 权限代码
   * @returns {Object|null} 权限信息
   */
  async findByCode(code) {
    return await this.findOne({ code });
  }

  /**
   * 分页查询权限列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 权限列表和总数
   */
  async findPermissionsPaginated(page = 1, pageSize = 10, filters = {}) {
    const where = {};

    if (filters.name) {
      Object.assign(where, this.buildLikeCondition('name', filters.name));
    }

    if (filters.code) {
      Object.assign(where, this.buildLikeCondition('code', filters.code));
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.parent_id !== undefined) {
      where.parent_id = filters.parent_id;
    }

    if (filters.status !== undefined) {
      where.status = filters.status;
    }

    return await this.findPaginated(page, pageSize, where, {
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
  }

  /**
   * 获取权限树形结构
   * @returns {Array} 权限树
   */
  async getPermissionTree() {
    const permissions = await this.findAll({ status: 1 }, {
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    return this.buildTree(permissions, 0);
  }

  /**
   * 构建权限树形结构
   * @param {Array} permissions - 权限数组
   * @param {Number} parentId - 父权限ID
   * @returns {Array} 权限树
   */
  buildTree(permissions, parentId = 0) {
    const tree = [];

    permissions.forEach(permission => {
      if (permission.parent_id === parentId) {
        const children = this.buildTree(permissions, permission.id);
        const permissionData = permission.toJSON();
        
        if (children.length > 0) {
          permissionData.children = children;
        }
        
        tree.push(permissionData);
      }
    });

    return tree;
  }

  /**
   * 获取所有启用的权限
   * @returns {Array} 权限列表
   */
  async findAllEnabled() {
    return await this.findAll({ status: 1 }, {
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
  }

  /**
   * 根据路径和方法查找权限
   * @param {String} path - 路径
   * @param {String} method - HTTP方法
   * @returns {Array} 权限列表
   */
  async findByPathAndMethod(path, method) {
    return await this.findAll({
      path,
      method,
      status: 1
    });
  }

  /**
   * 获取子权限数量
   * @param {Number} parentId - 父权限ID
   * @returns {Number} 子权限数量
   */
  async getChildrenCount(parentId) {
    return await this.count({ parent_id: parentId });
  }

  /**
   * 检查权限代码是否已存在
   * @param {String} code - 权限代码
   * @param {Number} excludeId - 排除的权限ID
   * @returns {Boolean} 是否已存在
   */
  async isCodeExists(code, excludeId = null) {
    const where = { code };
    
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return await this.exists(where);
  }

  /**
   * 获取权限的所有子权限（递归）
   * @param {Number} parentId - 父权限ID
   * @returns {Array} 子权限ID数组
   */
  async getAllChildrenIds(parentId) {
    const children = await this.findAll({ parent_id: parentId });
    let childrenIds = children.map(child => child.id);

    // 递归获取子权限的子权限
    for (const child of children) {
      const subChildren = await this.getAllChildrenIds(child.id);
      childrenIds = childrenIds.concat(subChildren);
    }

    return childrenIds;
  }
}

// 导出实例
module.exports = new PermissionRepository();