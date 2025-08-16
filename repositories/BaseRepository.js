const { Op } = require('sequelize');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * 根据ID查找记录
   * @param {Number} id - 记录ID
   * @param {Object} options - 查询选项
   * @returns {Object|null} 记录信息
   */
  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  /**
   * 根据条件查找单条记录
   * @param {Object} where - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object|null} 记录信息
   */
  async findOne(where, options = {}) {
    return await this.model.findOne({
      where,
      ...options
    });
  }

  /**
   * 根据条件查找所有记录
   * @param {Object} where - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Array} 记录列表
   */
  async findAll(where = {}, options = {}) {
    return await this.model.findAll({
      where,
      ...options
    });
  }

  /**
   * 分页查询
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页数量
   * @param {Object} where - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} 分页结果
   */
  async findPaginated(page = 1, pageSize = 10, where = {}, options = {}) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const result = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      ...options
    });

    return {
      list: result.rows,
      total: result.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(result.count / pageSize)
    };
  }

  /**
   * 创建记录
   * @param {Object} data - 创建数据
   * @param {Object} options - 创建选项
   * @returns {Object} 创建的记录
   */
  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  /**
   * 批量创建记录
   * @param {Array} dataArray - 创建数据数组
   * @param {Object} options - 创建选项
   * @returns {Array} 创建的记录列表
   */
  async bulkCreate(dataArray, options = {}) {
    return await this.model.bulkCreate(dataArray, options);
  }

  /**
   * 更新记录
   * @param {Object} data - 更新数据
   * @param {Object} where - 更新条件
   * @param {Object} options - 更新选项
   * @returns {Array} [affectedCount, affectedRows]
   */
  async update(data, where, options = {}) {
    return await this.model.update(data, {
      where,
      ...options
    });
  }

  /**
   * 根据ID更新记录
   * @param {Number} id - 记录ID
   * @param {Object} data - 更新数据
   * @param {Object} options - 更新选项
   * @returns {Object|null} 更新后的记录
   */
  async updateById(id, data, options = {}) {
    await this.model.update(data, {
      where: { id },
      ...options
    });
    return await this.findById(id);
  }

  /**
   * 删除记录
   * @param {Object} where - 删除条件
   * @param {Object} options - 删除选项
   * @returns {Number} 删除的记录数
   */
  async destroy(where, options = {}) {
    return await this.model.destroy({
      where,
      ...options
    });
  }

  /**
   * 根据ID删除记录
   * @param {Number} id - 记录ID
   * @param {Object} options - 删除选项
   * @returns {Number} 删除的记录数
   */
  async destroyById(id, options = {}) {
    return await this.model.destroy({
      where: { id },
      ...options
    });
  }

  /**
   * 统计记录数
   * @param {Object} where - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Number} 记录数
   */
  async count(where = {}, options = {}) {
    return await this.model.count({
      where,
      ...options
    });
  }

  /**
   * 检查记录是否存在
   * @param {Object} where - 查询条件
   * @returns {Boolean} 是否存在
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * 构建模糊查询条件
   * @param {String} field - 字段名
   * @param {String} value - 查询值
   * @returns {Object} 查询条件
   */
  buildLikeCondition(field, value) {
    return {
      [field]: {
        [Op.like]: `%${value}%`
      }
    };
  }

  /**
   * 构建范围查询条件
   * @param {String} field - 字段名
   * @param {Array} range - 范围值 [min, max]
   * @returns {Object} 查询条件
   */
  buildRangeCondition(field, range) {
    const [min, max] = range;
    const condition = {};
    
    if (min !== undefined && min !== null) {
      condition[Op.gte] = min;
    }
    
    if (max !== undefined && max !== null) {
      condition[Op.lte] = max;
    }
    
    return {
      [field]: condition
    };
  }

  /**
   * 构建IN查询条件
   * @param {String} field - 字段名
   * @param {Array} values - 值数组
   * @returns {Object} 查询条件
   */
  buildInCondition(field, values) {
    return {
      [field]: {
        [Op.in]: values
      }
    };
  }
}

module.exports = BaseRepository;