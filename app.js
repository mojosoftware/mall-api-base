const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const json = require('koa-json');
const logger = require('koa-logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = new Koa();

// 全局错误处理
app.use(errorHandler);

// 中间件
app.use(logger());
app.use(cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
app.use(json({ pretty: false, param: 'pretty' }));
app.use(bodyParser({
  enableTypes: ['json', 'form'],
  jsonLimit: '10mb',
  formLimit: '10mb',
  textLimit: '10mb'
}));

// 注册路由
app.use(routes.routes());
app.use(routes.allowedMethods());

// 404处理
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    code: -1,
    message: '接口不存在',
    data: null,
    timestamp: new Date().toISOString()
  };
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}/api/health`);
  console.log(`🔑 默认管理员账号: admin / password`);
});

module.exports = app;