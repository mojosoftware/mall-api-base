const crypto = require('crypto');

/**
 * 加密工具类
 */
class EncryptionUtil {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }

  /**
   * 生成随机密钥
   * @param {Number} length - 密钥长度
   * @returns {String} 十六进制密钥
   */
  generateKey(length = this.keyLength) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成随机IV
   * @returns {Buffer} IV缓冲区
   */
  generateIV() {
    return crypto.randomBytes(this.ivLength);
  }

  /**
   * AES加密
   * @param {String} text - 明文
   * @param {String} key - 密钥(十六进制)
   * @returns {Object} 加密结果
   */
  encrypt(text, key) {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = this.generateIV();
      const cipher = crypto.createCipher(this.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      throw new Error(`加密失败: ${error.message}`);
    }
  }

  /**
   * AES解密
   * @param {String} encrypted - 密文
   * @param {String} key - 密钥(十六进制)
   * @param {String} iv - IV(十六进制)
   * @param {String} tag - 认证标签(十六进制)
   * @returns {String} 明文
   */
  decrypt(encrypted, key, iv, tag) {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer, ivBuffer);
      decipher.setAuthTag(tagBuffer);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`解密失败: ${error.message}`);
    }
  }

  /**
   * MD5哈希
   * @param {String} text - 文本
   * @returns {String} MD5哈希值
   */
  md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * SHA256哈希
   * @param {String} text - 文本
   * @returns {String} SHA256哈希值
   */
  sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * HMAC签名
   * @param {String} text - 文本
   * @param {String} secret - 密钥
   * @param {String} algorithm - 算法 (默认sha256)
   * @returns {String} HMAC签名
   */
  hmac(text, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(text).digest('hex');
  }

  /**
   * 生成RSA密钥对
   * @param {Number} keySize - 密钥大小(位)
   * @returns {Object} 公私钥对
   */
  generateRSAKeyPair(keySize = 2048) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * RSA加密
   * @param {String} text - 明文
   * @param {String} publicKey - 公钥
   * @returns {String} 密文(base64)
   */
  rsaEncrypt(text, publicKey) {
    try {
      const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(text));
      return encrypted.toString('base64');
    } catch (error) {
      throw new Error(`RSA加密失败: ${error.message}`);
    }
  }

  /**
   * RSA解密
   * @param {String} encrypted - 密文(base64)
   * @param {String} privateKey - 私钥
   * @returns {String} 明文
   */
  rsaDecrypt(encrypted, privateKey) {
    try {
      const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64'));
      return decrypted.toString();
    } catch (error) {
      throw new Error(`RSA解密失败: ${error.message}`);
    }
  }

  /**
   * 生成随机字符串
   * @param {Number} length - 长度
   * @param {String} charset - 字符集
   * @returns {String} 随机字符串
   */
  randomString(length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * 生成UUID
   * @returns {String} UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Base64编码
   * @param {String} text - 文本
   * @returns {String} Base64编码
   */
  base64Encode(text) {
    return Buffer.from(text).toString('base64');
  }

  /**
   * Base64解码
   * @param {String} encoded - Base64编码
   * @returns {String} 原文
   */
  base64Decode(encoded) {
    return Buffer.from(encoded, 'base64').toString();
  }
}

// 导出实例
module.exports = new EncryptionUtil();