# 商城后台管理 API - RBAC 权限管理系统

基于 Koa2 + MySQL 的商城后台管理 API 系统，实现完整的 RBAC（基于角色的访问控制）权限管理功能。

## 📋 功能特性

- **完整的 RBAC 权限管理** - 用户、角色、权限三层管理体系
- **JWT 身份认证** - 安全的用户认证和授权机制
- **RESTful API 设计** - 标准的 REST API 接口规范
- **参数验证** - 使用 Joi 进行严格的参数校验
- **统一响应格式** - 标准化的 API 响应结构
- **数据库连接池** - MySQL 连接池优化性能
- **中间件架构** - 灵活的认证和权限验证中间件
- **错误处理** - 完善的全局错误处理机制

## 🏗️ 系统架构

```
app.js                    # 应用入口文件
├── config/               # 配置文件
│   ├── database.js       # 数据库配置
│   └── jwt.js           # JWT配置
├── services/             # 业务逻辑层
│   ├── AuthService.js    # 认证业务逻辑
│   ├── UserService.js    # 用户业务逻辑
│   ├── RoleService.js    # 角色业务逻辑
│   └── PermissionService.js # 权限业务逻辑
├── controllers/          # 控制器层
│   ├── AuthController.js # 认证控制器
│   ├── UserController.js # 用户控制器
│   ├── RoleController.js # 角色控制器
│   └── PermissionController.js # 权限控制器
├── middleware/           # 中间件
│   ├── auth.js          # 认证中间件
│   ├── permission.js    # 权限验证中间件
│   └── errorHandler.js  # 错误处理中间件
├── repositories/         # 数据访问层
│   ├── UserRepository.js # 用户数据访问
│   ├── RoleRepository.js # 角色数据访问
│   └── PermissionRepository.js # 权限数据访问
├── routes/              # 路由层
│   ├── index.js         # 路由汇总
│   ├── auth.js          # 认证路由
│   ├── users.js         # 用户路由
│   ├── roles.js         # 角色路由
│   └── permissions.js   # 权限路由
├── utils/               # 工具类
│   ├── response.js      # 响应工具
│   └── validator.js     # 验证工具
└── database/            # 数据库脚本
    └── schema.sql       # 数据库表结构
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env` 并配置相应参数：

```bash
cp .env.example .env
```

### 3. 创建数据库

创建数据库并执行 `database/schema.sql` 中的 SQL 语句：

```sql
CREATE DATABASE mall_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mall_admin;
-- 执行 schema.sql 中的建表语句
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务启动后访问：http://localhost:3000

## 🔐 权限管理

### RBAC 模型说明

系统采用标准的 RBAC（Role-Based Access Control）模型：

- **用户（User）** - 系统的使用者
- **角色（Role）** - 权限的集合，可分配给用户
- **权限（Permission）** - 对系统资源的操作权限

### 权限类型

- **menu** - 菜单权限（页面访问权限）
- **button** - 按钮权限（页面内操作权限）
- **api** - 接口权限（API 调用权限）

### 默认账号

- 用户名：`admin`
- 密码：`password`（实际为哈希值）

## 📝 API 接口

### 认证相关

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码
- `POST /api/auth/logout` - 退出登录

### 用户管理

- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `POST /api/users/:id/roles` - 分配角色
- `POST /api/users/:id/reset-password` - 重置密码

### 角色管理

- `GET /api/roles` - 获取角色列表
- `GET /api/roles/:id` - 获取角色详情
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色
- `POST /api/roles/:id/permissions` - 分配权限

### 权限管理

- `GET /api/permissions` - 获取权限列表
- `GET /api/permissions/tree` - 获取权限树
- `GET /api/permissions/:id` - 获取权限详情
- `POST /api/permissions` - 创建权限
- `PUT /api/permissions/:id` - 更新权限
- `DELETE /api/permissions/:id` - 删除权限

## 🔧 使用示例

### 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

### 获取用户列表（需要认证）

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 创建新用户

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123",
    "real_name": "新用户"
  }'
```

## 🛠️ 技术栈

- **Node.js** - JavaScript 运行环境
- **Koa2** - Web 应用框架
- **MySQL** - 关系型数据库
- **mysql2** - MySQL 数据库驱动
- **jsonwebtoken** - JWT 令牌处理
- **bcryptjs** - 密码加密
- **joi** - 参数验证库
- **@koa/router** - 路由中间件
- **koa-bodyparser** - 请求体解析
- **koa-cors** - 跨域处理

## 📄 许可证

MIT License
