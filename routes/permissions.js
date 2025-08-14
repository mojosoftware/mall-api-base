const Router = require('koa-router');
const PermissionController = require('../controllers/PermissionController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validateSchema, permissionSchemas, commonSchemas } = require('../utils/validator');

const router = new Router({ prefix: '/api/permissions' });
const permissionController = new PermissionController();

// 获取权限列表
router.get('/', 
  authenticate, 
  requirePermission('permission:list'),
  async (ctx) => {
    await permissionController.getPermissions(ctx);
  }
);

// 获取权限树形结构
router.get('/tree', 
  authenticate, 
  requirePermission('permission:list'),
  async (ctx) => {
    await permissionController.getPermissionTree(ctx);
  }
);

// 根据ID获取权限详情
router.get('/:id', 
  authenticate, 
  requirePermission('permission:list'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await permissionController.getPermissionById(ctx);
  }
);

// 创建权限
router.post('/', 
  authenticate, 
  requirePermission('permission:create'),
  validateSchema(permissionSchemas.create),
  async (ctx) => {
    await permissionController.createPermission(ctx);
  }
);

// 更新权限信息
router.put('/:id', 
  authenticate, 
  requirePermission('permission:update'),
  validateSchema(commonSchemas.id, 'params'),
  validateSchema(permissionSchemas.update),
  async (ctx) => {
    await permissionController.updatePermission(ctx);
  }
);

// 删除权限
router.delete('/:id', 
  authenticate, 
  requirePermission('permission:delete'),
  validateSchema(commonSchemas.id, 'params'),
  async (ctx) => {
    await permissionController.deletePermission(ctx);
  }
);

module.exports = router;