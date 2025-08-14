const Router = require('koa-router');
const RoleController = require('../controllers/RoleController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validateSchema, roleSchemas, commonSchemas } = require('../utils/validator');

const router = new Router({ prefix: '/api/roles' });
const roleController = new RoleController();

// 获取角色列表
router.get('/', 
  authenticate, 
  requirePermission('role:list'),
  async (ctx) => {
    await roleController.getRoles(ctx);
  }
);

// 根据ID获取角色详情
router.get('/:id', 
  authenticate, 
  requirePermission('role:list'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await roleController.getRoleById(ctx);
  }
);

// 创建角色
router.post('/', 
  authenticate, 
  requirePermission('role:create'),
  validateSchema(roleSchemas.create),
  async (ctx) => {
    await roleController.createRole(ctx);
  }
);

// 更新角色信息
router.put('/:id', 
  authenticate, 
  requirePermission('role:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(roleSchemas.update),
  async (ctx) => {
    await roleController.updateRole(ctx);
  }
);

// 删除角色
router.delete('/:id', 
  authenticate, 
  requirePermission('role:delete'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await roleController.deleteRole(ctx);
  }
);

// 为角色分配权限
router.post('/:id/permissions', 
  authenticate, 
  requirePermission('role:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(roleSchemas.assignPermissions),
  async (ctx) => {
    await roleController.assignPermissions(ctx);
  }
);

module.exports = router;