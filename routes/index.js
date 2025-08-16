const Router = require('@koa/router');
const Response = require('../utils/response');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const roleRoutes = require('./roles');
const permissionRoutes = require('./permissions');
const apiDocs = require('../middleware/apiDocs');

const router = new Router();

// API文档中间件
router.use(apiDocs.middleware());

// 注册路由
router.use(authRoutes.routes(), authRoutes.allowedMethods());
router.use(userRoutes.routes(), userRoutes.allowedMethods());
router.use(roleRoutes.routes(), roleRoutes.allowedMethods());
router.use(permissionRoutes.routes(), permissionRoutes.allowedMethods());

// 健康检查接口
router.get('/api/health', async (ctx) => {
  Response.success(ctx, {}, '服务正常');
});

module.exports = router;
