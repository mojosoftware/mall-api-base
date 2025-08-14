const Router = require('koa-router');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const roleRoutes = require('./roles');
const permissionRoutes = require('./permissions');

const router = new Router();

// 注册路由
router.use(authRoutes.routes(), authRoutes.allowedMethods());
router.use(userRoutes.routes(), userRoutes.allowedMethods());
router.use(roleRoutes.routes(), roleRoutes.allowedMethods());
router.use(permissionRoutes.routes(), permissionRoutes.allowedMethods());

// 健康检查接口
router.get('/api/health', async (ctx) => {
  ctx.body = {
    code: 0,
    message: '服务正常',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  };
});

module.exports = router;