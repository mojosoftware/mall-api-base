const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserRepository {
  /**
   * 根据ID查找用户
   * @param {Number} id - 用户ID
   * @returns {Object|null} 用户信息
   */
  async findById(id) {
    const [rows] = await promisePool.execute(
      'SELECT id, username, email, real_name, phone, avatar, status, last_login_time, last_login_ip, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * 根据用户名查找用户
   * @param {String} username - 用户名
   * @returns {Object|null} 用户信息
   */
  async findByUsername(username) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  }

  /**
   * 根据邮箱查找用户
   * @param {String} email - 邮箱
   * @returns {Object|null} 用户信息
   */
  async findByEmail(email) {
    const [rows] = await promisePool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户信息
   */
  async create(userData) {
    const { username, email, password, real_name, phone, avatar } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await promisePool.execute(
      'INSERT INTO users (username, email, password, real_name, phone, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, real_name, phone, avatar]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新用户信息
   * @param {Number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object|null} 更新后的用户信息
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
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * 删除用户
   * @param {Number} id - 用户ID
   * @returns {Boolean} 是否删除成功
   */
  async delete(id) {
    const [result] = await promisePool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 分页查询用户列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} filters - 过滤条件
   * @returns {Object} 用户列表和总数
   */
  async findPaginated(page = 1, pageSize = 10, filters = {}) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (filters.username) {
      whereClause += ' AND username LIKE ?';
      values.push(`%${filters.username}%`);
    }

    if (filters.email) {
      whereClause += ' AND email LIKE ?';
      values.push(`%${filters.email}%`);
    }

    if (filters.status !== undefined) {
      whereClause += ' AND status = ?';
      values.push(filters.status);
    }

    // 查询总数
    const [countRows] = await promisePool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      values
    );
    const total = countRows[0].total;

    // 查询数据
    const [rows] = await promisePool.execute(
      `SELECT id, username, email, real_name, phone, avatar, status, last_login_time, last_login_ip, created_at, updated_at 
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    );

    return { list: rows, total };
  }

  /**
   * 更新最后登录时间和IP
   * @param {Number} id - 用户ID
   * @param {String} ip - 登录IP
   */
  async updateLastLogin(id, ip) {
    await promisePool.execute(
      'UPDATE users SET last_login_time = NOW(), last_login_ip = ? WHERE id = ?',
      [ip, id]
    );
  }

  /**
   * 获取用户的角色列表
   * @param {Number} userId - 用户ID
   * @returns {Array} 角色列表
   */
  async getUserRoles(userId) {
    const [rows] = await promisePool.execute(
      `SELECT r.id, r.name, r.code, r.description, r.status 
       FROM roles r 
       INNER JOIN user_roles ur ON r.id = ur.role_id 
       WHERE ur.user_id = ? AND r.status = 1`,
      [userId]
    );
    return rows;
  }

  /**
   * 获取用户的权限列表
   * @param {Number} userId - 用户ID
   * @returns {Array} 权限列表
   */
  async getUserPermissions(userId) {
    const [rows] = await promisePool.execute(
      `SELECT DISTINCT p.id, p.name, p.code, p.type, p.path, p.method, p.parent_id 
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ? AND p.status = 1
       ORDER BY p.sort_order, p.id`,
      [userId]
    );
    return rows;
  }

  /**
   * 为用户分配角色
   * @param {Number} userId - 用户ID
   * @param {Array} roleIds - 角色ID数组
   */
  async assignRoles(userId, roleIds) {
    // 开启事务
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // 删除现有角色关联
      await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

      // 添加新的角色关联
      if (roleIds.length > 0) {
        const values = roleIds.map(roleId => [userId, roleId]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
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
   * 验证密码
   * @param {String} password - 明文密码
   * @param {String} hashedPassword - 哈希密码
   * @returns {Boolean} 是否匹配
   */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = UserRepository;