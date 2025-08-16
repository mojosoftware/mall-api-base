const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-here',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  issuer: process.env.JWT_ISSUER || 'mall-admin-api',
  algorithm: 'HS256'
};

/**
 * 生成JWT令牌
 * @param {Object} payload - 载荷数据
 * @param {String} expiresIn - 过期时间
 * @returns {String} token
 */
function generateToken(payload, expiresIn = jwtConfig.expiresIn) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn,
    issuer: jwtConfig.issuer,
    algorithm: jwtConfig.algorithm
  });
}

/**
 * 验证JWT令牌
 * @param {String} token - JWT令牌
 * @returns {Object} 解码后的载荷
 */
function verifyToken(token) {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    algorithms: [jwtConfig.algorithm]
  });
}

module.exports = {
  jwtConfig,
  generateToken,
  verifyToken
};
