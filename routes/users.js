const Router = require('koa-router');
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validateSchema, userSchemas, commonSchemas } = require('../utils/validator');

const router = new Router({ prefix: '/api/users' });
const userController = new UserController();

// 获取用户列表
router.get('/', 
  authenticate, 
  requirePermission('user:list'),
  validateSchema(commonSchemas.pagination, 'query'),
  async (ctx) => {
    await userController.getUsers(ctx);
  }
);

// 根据ID获取用户详情
router.get('/:id', 
  authenticate, 
  requirePermission('user:list'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await userController.getUserById(ctx);
  }
);

// 创建用户
router.post('/', 
  authenticate, 
  requirePermission('user:create'),
  validateSchema(userSchemas.create),
  async (ctx) => {
    await userController.createUser(ctx);
  }
);

// 更新用户信息
router.put('/:id', 
  authenticate, 
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(userSchemas.update),
  async (ctx) => {
    await userController.updateUser(ctx);
  }
);

// 删除用户
router.delete('/:id', 
  authenticate, 
  requirePermission('user:delete'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await userController.deleteUser(ctx);
  }
);

// 为用户分配角色
router.post('/:id/roles', 
  authenticate, 
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await userController.assignRoles(ctx);
  }
);

// 重置用户密码
router.post('/:id/reset-password', 
  authenticate, 
  requirePermission('user:update'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await userController.resetPassword(ctx);
  }
);

module.exports = router;