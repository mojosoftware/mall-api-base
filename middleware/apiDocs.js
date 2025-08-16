const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

/**
 * 轻量级API文档生成中间件
 */
class ApiDocsMiddleware {
  constructor() {
    this.routes = new Map();
    this.config = {
      title: '商城管理系统 API 文档',
      version: '1.0.0',
      description: '基于Koa2的商城后台管理API系统',
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
      docsPath: '/api-docs',
      jsonPath: '/api-docs.json'
    };
  }

  /**
   * 注册路由信息
   * @param {String} method - HTTP方法
   * @param {String} path - 路由路径
   * @param {Object} options - 路由选项
   */
  registerRoute(method, path, options = {}) {
    const key = `${method.toUpperCase()} ${path}`;
    this.routes.set(key, {
      method: method.toUpperCase(),
      path,
      summary: options.summary || '',
      description: options.description || '',
      tags: options.tags || [],
      parameters: options.parameters || [],
      requestBody: options.requestBody || null,
      responses: options.responses || {
        200: { description: '成功', example: { code: 0, message: '操作成功', data: null } }
      },
      security: options.security || false
    });
  }

  /**
   * 生成OpenAPI规范的JSON文档
   */
  generateOpenApiSpec() {
    const paths = {};
    const tags = new Set();

    // 转换路由信息为OpenAPI格式
    for (const [key, route] of this.routes) {
      const { method, path: routePath, ...routeInfo } = route;
      
      // 收集标签
      routeInfo.tags.forEach(tag => tags.add(tag));

      // 转换路径参数格式 (:id -> {id})
      const openApiPath = routePath.replace(/:(\w+)/g, '{$1}');
      
      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }

      // 构建参数信息
      const parameters = [...routeInfo.parameters];
      
      // 自动提取路径参数
      const pathParams = routePath.match(/:(\w+)/g);
      if (pathParams) {
        pathParams.forEach(param => {
          const paramName = param.slice(1);
          if (!parameters.find(p => p.name === paramName)) {
            parameters.push({
              name: paramName,
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: `${paramName} 参数`
            });
          }
        });
      }

      // 构建响应信息
      const responses = {};
      Object.entries(routeInfo.responses).forEach(([code, response]) => {
        responses[code] = {
          description: response.description,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', example: 0 },
                  message: { type: 'string', example: response.description },
                  data: { type: 'object' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              },
              example: response.example
            }
          }
        };
      });

      paths[openApiPath][method.toLowerCase()] = {
        summary: routeInfo.summary,
        description: routeInfo.description,
        tags: routeInfo.tags,
        parameters: parameters.length > 0 ? parameters : undefined,
        requestBody: routeInfo.requestBody,
        responses,
        security: routeInfo.security ? [{ bearerAuth: [] }] : undefined
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description
      },
      servers: [
        {
          url: this.config.baseUrl,
          description: '开发服务器'
        }
      ],
      tags: Array.from(tags).map(tag => ({ name: tag, description: `${tag}相关接口` })),
      paths,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              code: { type: 'integer', example: -1 },
              message: { type: 'string', example: '错误信息' },
              data: { type: 'object', nullable: true },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },
          Success: {
            type: 'object',
            properties: {
              code: { type: 'integer', example: 0 },
              message: { type: 'string', example: '操作成功' },
              data: { type: 'object' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    };
  }

  /**
   * 生成HTML文档页面
   */
  generateHtmlDocs() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #3b4151; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '${this.config.jsonPath}',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: "list",
                filter: true,
                showRequestHeaders: true,
                showCommonExtensions: true,
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>`;
  }

  /**
   * 创建文档中间件
   */
  middleware() {
    return async (ctx, next) => {
      // 提供JSON格式的API文档
      if (ctx.path === this.config.jsonPath) {
        ctx.type = 'application/json';
        ctx.body = this.generateOpenApiSpec();
        return;
      }

      // 提供HTML格式的API文档
      if (ctx.path === this.config.docsPath) {
        ctx.type = 'text/html';
        ctx.body = this.generateHtmlDocs();
        return;
      }

      await next();
    };
  }

  /**
   * 自动扫描路由并生成文档
   */
  autoScanRoutes() {
    // 预定义的路由文档
    const routeDocs = {
      // 认证相关
      'POST /api/auth/register': {
        summary: '用户注册',
        description: '用户注册接口，需要邮箱验证',
        tags: ['认证'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'newuser', description: '用户名' },
                  email: { type: 'string', format: 'email', example: 'user@example.com', description: '邮箱' },
                  password: { type: 'string', minLength: 6, example: 'password123', description: '密码' },
                  real_name: { type: 'string', example: '张三', description: '真实姓名' },
                  phone: { type: 'string', example: '13800138000', description: '手机号' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '注册成功',
            example: { code: 0, message: '注册信息已提交，请查收验证邮件', data: { email: 'user@example.com' } }
          }
        }
      },
      'POST /api/auth/verify-email': {
        summary: '验证邮箱',
        description: '验证邮箱地址',
        tags: ['认证'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  code: { type: 'string', example: '123456', description: '6位验证码' }
                }
              }
            }
          }
        }
      },
      'POST /api/auth/login': {
        summary: '用户登录',
        description: '用户登录接口',
        tags: ['认证'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@example.com' },
                  password: { type: 'string', example: 'password' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '登录成功',
            example: {
              code: 0,
              message: '登录成功',
              data: {
                user: { id: 1, username: 'admin', email: 'admin@example.com' },
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                roles: [],
                permissions: []
              }
            }
          }
        }
      },
      'GET /api/auth/me': {
        summary: '获取当前用户信息',
        description: '获取当前登录用户的详细信息',
        tags: ['认证'],
        security: true
      },
      'POST /api/auth/logout': {
        summary: '退出登录',
        description: '用户退出登录',
        tags: ['认证'],
        security: true
      },

      // 用户管理
      'GET /api/users': {
        summary: '获取用户列表',
        description: '分页获取用户列表',
        tags: ['用户管理'],
        security: true,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: '页码' },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 }, description: '每页数量' },
          { name: 'username', in: 'query', schema: { type: 'string' }, description: '用户名筛选' },
          { name: 'status', in: 'query', schema: { type: 'integer', enum: [0, 1] }, description: '状态筛选' }
        ]
      },
      'GET /api/users/:id': {
        summary: '获取用户详情',
        description: '根据ID获取用户详细信息',
        tags: ['用户管理'],
        security: true
      },
      'POST /api/users': {
        summary: '创建用户',
        description: '创建新用户',
        tags: ['用户管理'],
        security: true,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', example: 'newuser' },
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  real_name: { type: 'string', example: '张三' },
                  phone: { type: 'string', example: '13800138000' }
                }
              }
            }
          }
        }
      },
      'PUT /api/users/:id': {
        summary: '更新用户信息',
        description: '更新指定用户的信息',
        tags: ['用户管理'],
        security: true
      },
      'DELETE /api/users/:id': {
        summary: '删除用户',
        description: '删除指定用户',
        tags: ['用户管理'],
        security: true
      },

      // 角色管理
      'GET /api/roles': {
        summary: '获取角色列表',
        description: '获取系统角色列表',
        tags: ['角色管理'],
        security: true
      },
      'POST /api/roles': {
        summary: '创建角色',
        description: '创建新角色',
        tags: ['角色管理'],
        security: true,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string', example: '管理员' },
                  code: { type: 'string', example: 'admin' },
                  description: { type: 'string', example: '系统管理员角色' }
                }
              }
            }
          }
        }
      },

      // 权限管理
      'GET /api/permissions': {
        summary: '获取权限列表',
        description: '获取系统权限列表',
        tags: ['权限管理'],
        security: true
      },
      'GET /api/permissions/tree': {
        summary: '获取权限树',
        description: '获取树形结构的权限列表',
        tags: ['权限管理'],
        security: true
      },

      // 系统接口
      'GET /api/health': {
        summary: '健康检查',
        description: '检查系统运行状态',
        tags: ['系统'],
        responses: {
          200: {
            description: '系统正常',
            example: { code: 0, message: '服务正常', data: {} }
          }
        }
      }
    };

    // 注册所有预定义的路由文档
    Object.entries(routeDocs).forEach(([key, doc]) => {
      const [method, path] = key.split(' ');
      this.registerRoute(method, path, doc);
    });

    logger.info(`API文档已生成，包含 ${this.routes.size} 个接口`);
  }
}

// 创建全局实例
const apiDocs = new ApiDocsMiddleware();

// 自动扫描并注册路由
apiDocs.autoScanRoutes();

module.exports = apiDocs;