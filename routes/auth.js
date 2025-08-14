const Router = require('koa-router');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { validateSchema, userSchemas } = require('../utils/validator');

const router = new Router({ prefix: '/api/auth' });
const authController = new AuthController();

// 用户登录
router.post('/login', validateSchema(userSchemas.login), async (ctx) => {
  await authController.login(ctx);
});

// 获取当前用户信息
router.get('/me', authenticate, async (ctx) => {
  await authController.getCurrentUser(ctx);
});

// 修改密码
router.post('/change-password', authenticate, async (ctx) => {
  await authController.changePassword(ctx);
});

// 退出登录
router.post('/logout', authenticate, async (ctx) => {
  await authController.logout(ctx);
});

module.exports = router;