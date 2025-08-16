const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID'
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '用户角色关联表',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role_id']
    }
  ]
});

module.exports = UserRole;