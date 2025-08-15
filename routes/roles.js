const Router = require("@koa/router");
const RoleController = require("../controllers/RoleController");
const { authenticate } = require("../middleware/auth");
const { requirePermission } = require("../middleware/permission");
const {
  validateSchema,
  roleSchemas,
  commonSchemas,
} = require("../utils/validator");

const router = new Router({ prefix: "/api/roles" });
const roleController = new RoleController();

// 获取角色列表
router.get(
  "/",
  authenticate,
  requirePermission("role:list"),
  roleController.getRoles
);

// 根据ID获取角色详情
router.get(
  "/:id",
  authenticate,
  requirePermission("role:list"),
  validateSchema(commonSchemas.id, "params"),
  roleController.getRoleById
);

// 创建角色
router.post(
  "/",
  authenticate,
  requirePermission("role:create"),
  validateSchema(roleSchemas.create),
  roleController.createRole
);

// 更新角色信息
router.put(
  "/:id",
  authenticate,
  requirePermission("role:update"),
  validateSchema(commonSchemas.id, "params"),
  validateSchema(roleSchemas.update),
  roleController.updateRole
);

// 删除角色
router.delete(
  "/:id",
  authenticate,
  requirePermission("role:delete"),
  validateSchema(commonSchemas.id, "params"),
  roleController.deleteRole
);

// 为角色分配权限
router.post(
  "/:id/permissions",
  authenticate,
  requirePermission("role:update"),
  validateSchema(commonSchemas.id, "params"),
  validateSchema(roleSchemas.assignPermissions),
  roleController.assignPermissions
);

module.exports = router;
