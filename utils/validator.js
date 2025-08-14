const Joi = require('joi');

/**
 * 验证中间件生成器
 * @param {Object} schema - Joi验证模式
 * @param {String} source - 验证数据源 (body/query/params)
 * @returns {Function} Koa中间件函数
 */
function validateSchema(schema, source = 'body') {
  return async (ctx, next) => {
    try {
      const data = ctx.request[source] || ctx[source];
      const { error, value } = schema.validate(data, {
        allowUnknown: false,
        abortEarly: false
      });

      if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        ctx.status = 400;
        ctx.body = {
          code: -1,
          message: '参数验证失败',
          errors: errorMessages,
          timestamp: new Date().toISOString()
        };
        return;
      }

      ctx.request[source] = value;
      await next();
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        code: -1,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
      };
    }
  };
}

// 通用验证规则
const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10)
  }),
  
  id: Joi.object({
    id: Joi.number().integer().min(1).required()
  })
};

// 用户相关验证规则
const userSchemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(50).required()
  }),
  
  create: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required(),
    real_name: Joi.string().max(50).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    avatar: Joi.string().uri().optional()
  }),
  
  update: Joi.object({
    email: Joi.string().email().optional(),
    real_name: Joi.string().max(50).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    avatar: Joi.string().uri().optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  })
};

// 角色相关验证规则
const roleSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    code: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(255).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(255).optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  }),
  
  assignPermissions: Joi.object({
    permission_ids: Joi.array().items(Joi.number().integer().min(1)).required()
  })
};

// 权限相关验证规则
const permissionSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    code: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('menu', 'button', 'api').required(),
    parent_id: Joi.number().integer().min(0).default(0),
    path: Joi.string().max(255).optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    icon: Joi.string().max(50).optional(),
    sort_order: Joi.number().integer().default(0)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    type: Joi.string().valid('menu', 'button', 'api').optional(),
    parent_id: Joi.number().integer().min(0).optional(),
    path: Joi.string().max(255).optional(),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').optional(),
    icon: Joi.string().max(50).optional(),
    sort_order: Joi.number().integer().optional(),
    status: Joi.number().integer().valid(0, 1).optional()
  })
};

module.exports = {
  validateSchema,
  commonSchemas,
  userSchemas,
  roleSchemas,
  permissionSchemas
};