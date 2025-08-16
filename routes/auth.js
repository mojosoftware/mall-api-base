const Router = require('@koa/router');
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { validateSchema, userSchemas } = require('../utils/validator');

const router = new Router({ prefix: '/api/auth' });

// 用户登录
router.post('/login', validateSchema(userSchemas.login), authController.login);

// 需要鉴权登录接口
router.use(authenticate);

// 获取当前用户信息
router.get('/me', authController.getCurrentUser);
// 修改密码
router.post('/change-password', authController.changePassword);
// 退出登录
router.post('/logout', authController.logout);

module.exports = router;
