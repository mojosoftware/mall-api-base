const sequelize = require('../config/sequelize');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const UserRole = require('./UserRole');
const RolePermission = require('./RolePermission');

// 定义关联关系
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users'
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// 权限自关联（父子关系）
Permission.hasMany(Permission, {
  foreignKey: 'parent_id',
  as: 'children'
});

Permission.belongsTo(Permission, {
  foreignKey: 'parent_id',
  as: 'parent'
});

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission
};