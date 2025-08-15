const Router = require("@koa/router");
const AuthController = require("../controllers/AuthController");
const { authenticate } = require("../middleware/auth");
const { validateSchema, userSchemas } = require("../utils/validator");

const router = new Router({ prefix: "/api/auth" });
const authController = new AuthController();

// 用户登录
router.post("/login", validateSchema(userSchemas.login), authController.login);

// 获取当前用户信息
router.get("/me", authenticate, authController.getCurrentUser);

// 修改密码
router.post("/change-password", authenticate, authController.changePassword);

// 退出登录
router.post("/logout", authenticate, authController.logout);

module.exports = router;
