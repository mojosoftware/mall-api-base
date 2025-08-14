const { promisePool } = require('../config/database');

class RoleRepository {
  /**
   * 根据ID查找角色
   * @param {Number} id - 角色ID
   * @returns {Object|null} 角色信息
   */
  async findById(id) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 根据代码查找角色
   * @param {String} code - 角色代码
   * @returns {Object|null} 角色信息
   */
  async findByCode(code) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM roles WHERE code = ?',
      [code]
    );
    return rows[0] || null;
  }

  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Object} 创建的角色信息
   */
  async create(roleData) {
    const { name, code, description } = roleData;

    const [result] = await promisePool.execute(
      'INSERT INTO roles (name, code, description) VALUES (?, ?, ?)',
      [name, code, description]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新角色信息
   * @param {Number} id - 角色ID
   * @param {Object} updateData - 更新数据
   * @returns {Object|null} 更新后的角色信息
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
      `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 删除角色
   * @param {Number} id - 角色ID
   * @returns {Boolean} 是否删除成功
   */
  async delete(id) {
    const [result] = await promisePool.execute(
      'DELETE FROM roles WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 分页查询角色列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 角色列表和总数
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

    if (filters.status !== undefined) {
      whereClause += ' AND status = ?';
      values.push(filters.status);
    }

    // 查询总数
    const [countRows] = await promisePool.execute(
      `SELECT COUNT(*) as total FROM roles ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    // 查询数据
    const [rows] = await promisePool.execute(
      `SELECT * FROM roles ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  }

  /**
   * 获取所有启用的角色
   * @returns {Array} 角色列表
   */
  async findAllEnabled() {
    const [rows] = await promisePool.execute(
      'SELECT * FROM roles WHERE status = 1 ORDER BY created_at ASC'
    );
    return rows;
  }

  /**
   * 获取角色的权限列表
   * @param {Number} roleId - 角色ID
   * @returns {Array} 权限列表
   */
  async getRolePermissions(roleId) {
    const [rows] = await promisePool.execute(
      `SELECT p.id, p.name, p.code, p.type, p.path, p.method, p.parent_id, p.icon, p.sort_order 
       FROM permissions p 
       INNER JOIN role_permissions rp ON p.id = rp.permission_id 
       WHERE rp.role_id = ? AND p.status = 1 
       ORDER BY p.sort_order, p.id`,
      [roleId]
    );
    return rows;
  }

  /**
   * 为角色分配权限
   * @param {Number} roleId - 角色ID
   * @param {Array} permissionIds - 权限ID数组
   */
  async assignPermissions(roleId, permissionIds) {
    // 开启事务
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // 删除现有权限关联
      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      // 添加新的权限关联
      if (permissionIds.length > 0) {
        const values = permissionIds.map(permissionId => [roleId, permissionId]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取拥有该角色的用户数量
   * @param {Number} roleId - 角色ID
   * @returns {Number} 用户数量
   */
  async getUserCount(roleId) {
    const [rows] = await promisePool.execute(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [roleId]
    );
    return rows[0].count;
  }
}

module.exports = RoleRepository;