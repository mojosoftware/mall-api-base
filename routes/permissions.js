const Router = require('@koa/router');
const permissionController = require('../controllers/PermissionController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { createUserRateLimiter, rateLimitConfigs } = require('../middleware/rateLimiter');
const {
  validateSchema,
  permissionSchemas,
  commonSchemas
} = require('../utils/validator');

const router = new Router({ prefix: '/api/permissions' });

// 需要鉴权登录接口
router.use(authenticate);

// 应用中等限流到所有权限接口
router.use(createUserRateLimiter(rateLimitConfigs.moderate));

// 获取权限列表
router.get(
  '/',
  requirePermission('permission:list'),
  permissionController.getPermissions
);

// 获取权限树形结构
router.get(
  '/tree',
  requirePermission('permission:list'),
  permissionController.getPermissionTree
);

// 根据ID获取权限详情
router.get(
  '/:id',
  requirePermission('permission:list'),
  validateSchema(commonSchemas.id, 'params'),
  permissionController.getPermissionById
);

// 创建权限
router.post(
  '/',
  requirePermission('permission:create'),
  validateSchema(permissionSchemas.create),
  permissionController.createPermission
);

// 更新权限信息
router.put(
  '/:id',
  requirePermission('permission:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(permissionSchemas.update),
  permissionController.updatePermission
);

// 删除权限
router.delete(
  '/:id',
  requirePermission('permission:delete'),
  validateSchema(commonSchemas.id, 'params'),
  permissionController.deletePermission
);

module.exports = router;
