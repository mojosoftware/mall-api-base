const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const json = require('koa-json');
const helmet = require('koa-helmet');
const logger = require('./utils/logger');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { createRateLimiter, rateLimitConfigs } = require('./middleware/rateLimiter');
const Response = require('./utils/response');

const app = new Koa();

// 全局错误处理
app.use(errorHandler);

// 安全中间件
app.use(helmet());

// CORS配置
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })
);

// 全局限流 - 宽松限流
app.use(createRateLimiter(rateLimitConfigs.loose));

app.use(json({ pretty: false, param: 'pretty' }));

// 请求体解析
app.use(
  bodyParser({
    jsonLimit: '10mb',
    formLimit: '10mb'
  })
);

// 请求日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// 注册路由
app.use(routes.routes());
app.use(routes.allowedMethods());

// API文档提示
app.use(async (ctx, next) => {
  if (ctx.path === '/') {
    ctx.body = {
      message: '商城管理系统 API',
      version: '1.0.0',
      docs: `${ctx.origin}/api-docs`,
      health: `${ctx.origin}/api/health`
    };
    return;
  }
  await next();
});

// 404处理
app.use(async (ctx) => {
  Response.error(ctx, '接口不存在', -1, 404);
});

const PORT = process.env.PORT || 3000;

// 启动前测试数据库连接和同步模型
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ 数据库连接成功');
    // 同步模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      return sequelize.sync({ alter: false });
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功！`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📖 API文档: http://localhost:${PORT}/api`);
      console.log(`🔑 默认管理员账号: admin / password`);
    });
  })
  .catch((err) => {
    logger.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });

module.exports = app;
