-- 商城后台管理系统 - RBAC权限管理数据库表结构

-- 用户表
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_username` (`username`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 角色表
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色代码',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL COMMENT '权限代码',
  `type` varchar(20) NOT NULL DEFAULT 'menu' COMMENT '权限类型: menu-菜单, button-按钮, api-接口',
  `parent_id` int(11) DEFAULT 0 COMMENT '父权限ID',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `method` varchar(10) DEFAULT NULL COMMENT 'HTTP方法',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 用户角色关联表
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 角色权限关联表
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `permission_id` int(11) NOT NULL COMMENT '权限ID',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 插入初始数据
INSERT INTO `permissions` (`name`, `code`, `type`, `parent_id`, `path`, `method`) VALUES
('用户管理', 'user:manage', 'menu', 0, '/user', NULL),
('用户列表', 'user:list', 'api', 1, '/api/users', 'GET'),
('创建用户', 'user:create', 'api', 1, '/api/users', 'POST'),
('更新用户', 'user:update', 'api', 1, '/api/users/:id', 'PUT'),
('删除用户', 'user:delete', 'api', 1, '/api/users/:id', 'DELETE'),
('角色管理', 'role:manage', 'menu', 0, '/role', NULL),
('角色列表', 'role:list', 'api', 6, '/api/roles', 'GET'),
('创建角色', 'role:create', 'api', 6, '/api/roles', 'POST'),
('更新角色', 'role:update', 'api', 6, '/api/roles/:id', 'PUT'),
('删除角色', 'role:delete', 'api', 6, '/api/roles/:id', 'DELETE'),
('权限管理', 'permission:manage', 'menu', 0, '/permission', NULL),
('权限列表', 'permission:list', 'api', 11, '/api/permissions', 'GET'),
('创建权限', 'permission:create', 'api', 11, '/api/permissions', 'POST'),
('更新权限', 'permission:update', 'api', 11, '/api/permissions/:id', 'PUT'),
('删除权限', 'permission:delete', 'api', 11, '/api/permissions/:id', 'DELETE');

INSERT INTO `roles` (`name`, `code`, `description`) VALUES
('超级管理员', 'super_admin', '拥有系统所有权限'),
('管理员', 'admin', '拥有大部分管理权限'),
('操作员', 'operator', '拥有基本操作权限');

-- 为超级管理员角色分配所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions` WHERE `status` = 1;

INSERT INTO `users` (`username`, `email`, `password`, `real_name`) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '超级管理员');

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);