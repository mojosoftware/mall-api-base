const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '权限名称'
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '权限代码'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'menu',
    comment: '权限类型: menu-菜单, button-按钮, api-接口'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '父权限ID'
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '路由路径'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'HTTP方法'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '图标'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态: 1-启用, 0-禁用'
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '权限表'
});

module.exports = Permission;