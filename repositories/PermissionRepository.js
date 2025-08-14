const { promisePool } = require('../config/database');

class PermissionRepository {
  /**
   * 根据ID查找权限
   * @param {Number} id - 权限ID
   * @returns {Object|null} 权限信息
   */
  async findById(id) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM permissions WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 根据代码查找权限
   * @param {String} code - 权限代码
   * @returns {Object|null} 权限信息
   */
  async findByCode(code) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM permissions WHERE code = ?',
      [code]
    );
    return rows[0] || null;
  }

  /**
   * 创建权限
   * @param {Object} permissionData - 权限数据
   * @returns {Object} 创建的权限信息
   */
  async create(permissionData) {
    const { name, code, type, parent_id, path, method, icon, sort_order } = permissionData;

    const [result] = await promisePool.execute(
      'INSERT INTO permissions (name, code, type, parent_id, path, method, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, type, parent_id || 0, path, method, icon, sort_order || 0]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新权限信息
   * @param {Number} id - 权限ID
   * @param {Object} updateData - 更新数据
   * @returns {Object|null} 更新后的权限信息
   */
  async update(id, updateData) {
    const fields = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await promisePool.execute(
      `UPDATE permissions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 删除权限
   * @param {Number} id - 权限ID
   * @returns {Boolean} 是否删除成功
   */
  async delete(id) {
    const [result] = await promisePool.execute(
      'DELETE FROM permissions WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 分页查询权限列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 权限列表和总数
   */
  async findPaginated(page = 1, pageSize = 10, filters = {}) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (filters.name) {
      whereClause += ' AND name LIKE ?';
      values.push(`%${filters.name}%`);
    }

    if (filters.code) {
      whereClause += ' AND code LIKE ?';
      values.push(`%${filters.code}%`);
    }

    if (filters.type) {
      whereClause += ' AND type = ?';
      values.push(filters.type);
    }

    if (filters.parent_id !== undefined) {
      whereClause += ' AND parent_id = ?';
      values.push(filters.parent_id);
    }

    if (filters.status !== undefined) {
      whereClause += ' AND status = ?';
      values.push(filters.status);
    }

    // 查询总数
    const [countRows] = await promisePool.execute(
      `SELECT COUNT(*) as total FROM permissions ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    // 查询数据
    const [rows] = await promisePool.execute(
      `SELECT * FROM permissions ${whereClause} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  }

  /**
   * 获取权限树形结构
   * @returns {Array} 权限树
   */
  async getPermissionTree() {
    const [rows] = await promisePool.execute(
      'SELECT * FROM permissions WHERE status = 1 ORDER BY sort_order ASC, id ASC'
    );

    return this.buildTree(rows, 0);
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
        if (children.length > 0) {
          permission.children = children;
        }
        tree.push(permission);
      }
    });

    return tree;
  }

  /**
   * 获取所有启用的权限
   * @returns {Array} 权限列表
   */
  async findAllEnabled() {
    const [rows] = await promisePool.execute(
      'SELECT * FROM permissions WHERE status = 1 ORDER BY sort_order ASC, id ASC'
    );
    return rows;
  }

  /**
   * 根据路径和方法查找权限
   * @param {String} path - 路径
   * @param {String} method - HTTP方法
   * @returns {Array} 权限列表
   */
  async findByPathAndMethod(path, method) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM permissions WHERE path = ? AND method = ? AND status = 1',
      [path, method]
    );
    return rows;
  }

  /**
   * 获取子权限数量
   * @param {Number} parentId - 父权限ID
   * @returns {Number} 子权限数量
   */
  async getChildrenCount(parentId) {
    const [rows] = await promisePool.execute(
      'SELECT COUNT(*) as count FROM permissions WHERE parent_id = ?',
      [parentId]
    );
    return rows[0].count;
  }

  /**
   * 检查权限代码是否已存在
   * @param {String} code - 权限代码
   * @param {Number} excludeId - 排除的权限ID
   * @returns {Boolean} 是否已存在
   */
  async isCodeExists(code, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM permissions WHERE code = ?';
    const values = [code];

    if (excludeId) {
      sql += ' AND id != ?';
      values.push(excludeId);
    }

    const [rows] = await promisePool.execute(sql, values);
    return rows[0].count > 0;
  }
}

module.exports = PermissionRepository;