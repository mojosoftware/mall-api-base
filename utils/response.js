/**
 * 统一响应格式
 */
class Response {
  /**
   * 成功响应
   * @param {Object} ctx - Koa上下文
   * @param {*} data - 响应数据
   * @param {String} message - 响应消息
   * @param {Number} code - 业务状态码
   */
  static success(ctx, data = null, message = '操作成功', code = 0) {
    ctx.status = 200;
    ctx.body = {
      code,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 失败响应
   * @param {Object} ctx - Koa上下文
   * @param {String} message - 错误消息
   * @param {Number} code - 业务状态码
   * @param {Number} status - HTTP状态码
   */
  static error(ctx, message = '操作失败', code = -1, status = 400) {
    ctx.status = status;
    ctx.body = {
      code,
      message,
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 分页响应
   * @param {Object} ctx - Koa上下文
   * @param {Array} list - 数据列表
   * @param {Number} total - 总数量
   * @param {Number} page - 当前页
   * @param {Number} pageSize - 每页大小
   * @param {String} message - 响应消息
   */
  static page(ctx, list = [], total = 0, page = 1, pageSize = 10, message = '查询成功') {
    ctx.status = 200;
    ctx.body = {
      code: 0,
      message,
      data: {
        list,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = Response;