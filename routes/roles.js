const Router = require('@koa/router');
const roleController = require('../controllers/RoleController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { createUserRateLimiter, rateLimitConfigs } = require('../middleware/rateLimiter');
const {
  validateSchema,
  roleSchemas,
  commonSchemas
} = require('../utils/validator');

const router = new Router({ prefix: '/api/roles' });

// 需要鉴权登录接口
router.use(authenticate);

// 应用中等限流到所有角色接口
router.use(createUserRateLimiter(rateLimitConfigs.moderate));

// 获取角色列表
router.get('/', requirePermission('role:list'), roleController.getRoles);

// 根据ID获取角色详情
router.get(
  '/:id',
  requirePermission('role:list'),
  validateSchema(commonSchemas.id, 'params'),
  roleController.getRoleById
);

// 创建角色
router.post(
  '/',
  requirePermission('role:create'),
  validateSchema(roleSchemas.create),
  roleController.createRole
);

// 更新角色信息
router.put(
  '/:id',
  requirePermission('role:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(roleSchemas.update),
  roleController.updateRole
);

// 删除角色
router.delete(
  '/:id',
  requirePermission('role:delete'),
  validateSchema(commonSchemas.id, 'params'),
  roleController.deleteRole
);

// 为角色分配权限
router.post(
  '/:id/permissions',
  requirePermission('role:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(roleSchemas.assignPermissions),
  roleController.assignPermissions
);

module.exports = router;
