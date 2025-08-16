const Router = require('@koa/router');
const userController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const {
  validateSchema,
  userSchemas,
  commonSchemas
} = require('../utils/validator');

const router = new Router({ prefix: '/api/users' });

// 需要鉴权登录接口
router.use(authenticate);

// 获取用户列表
router.get(
  '/',
  requirePermission('user:list'),
  validateSchema(commonSchemas.pagination, 'query'),
  userController.getUsers
);

// 根据ID获取用户详情
router.get(
  '/:id',
  requirePermission('user:list'),
  validateSchema(commonSchemas.id, 'params'),
  userController.getUserById
);

// 创建用户
router.post(
  '/',
  requirePermission('user:create'),
  validateSchema(userSchemas.create),
  userController.createUser
);

// 更新用户信息
router.put(
  '/:id',
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(userSchemas.update),
  userController.updateUser
);

// 删除用户
router.delete(
  '/:id',
  requirePermission('user:delete'),
  validateSchema(commonSchemas.id, 'params'),
  userController.deleteUser
);

// 为用户分配角色
router.post(
  '/:id/roles',
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  userController.assignRoles
);

// 重置用户密码
router.post(
  '/:id/reset-password',
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  userController.resetPassword
);

module.exports = router;
