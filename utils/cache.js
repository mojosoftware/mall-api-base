const redis = require('../config/redis');
const logger = require('./logger');

/**
 * 缓存工具类
 */
class CacheUtil {
  /**
   * 设置缓存
   * @param {String} key - 缓存键
   * @param {*} value - 缓存值
   * @param {Number} ttl - 过期时间(秒)
   */
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl > 0) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      logger.debug(`缓存设置成功: ${key}`);
    } catch (error) {
      logger.error('缓存设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存
   * @param {String} key - 缓存键
   * @returns {*} 缓存值
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      logger.error('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {String|Array} keys - 缓存键
   */
  async del(keys) {
    try {
      const result = await redis.del(keys);
      logger.debug(`缓存删除成功: ${keys}, 删除数量: ${result}`);
      return result;
    } catch (error) {
      logger.error('缓存删除失败:', error);
      throw error;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {String} key - 缓存键
   * @returns {Boolean}
   */
  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('缓存检查失败:', error);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   * @param {String} key - 缓存键
   * @param {Number} ttl - 过期时间(秒)
   */
  async expire(key, ttl) {
    try {
      await redis.expire(key, ttl);
      logger.debug(`缓存过期时间设置成功: ${key}, TTL: ${ttl}`);
    } catch (error) {
      logger.error('缓存过期时间设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存剩余过期时间
   * @param {String} key - 缓存键
   * @returns {Number} 剩余时间(秒)
   */
  async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error('获取缓存TTL失败:', error);
      return -1;
    }
  }

  /**
   * 批量获取缓存
   * @param {Array} keys - 缓存键数组
   * @returns {Array} 缓存值数组
   */
  async mget(keys) {
    try {
      const values = await redis.mget(keys);
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      logger.error('批量获取缓存失败:', error);
      return new Array(keys.length).fill(null);
    }
  }

  /**
   * 批量设置缓存
   * @param {Object} keyValues - 键值对对象
   * @param {Number} ttl - 过期时间(秒)
   */
  async mset(keyValues, ttl = 3600) {
    try {
      const pipeline = redis.pipeline();
      
      Object.entries(keyValues).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttl > 0) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      
      await pipeline.exec();
      logger.debug(`批量缓存设置成功: ${Object.keys(keyValues).length} 个键`);
    } catch (error) {
      logger.error('批量设置缓存失败:', error);
      throw error;
    }
  }

  /**
   * 模糊匹配删除缓存
   * @param {String} pattern - 匹配模式
   */
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const result = await redis.del(keys);
        logger.debug(`模糊删除缓存成功: ${pattern}, 删除数量: ${result}`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error('模糊删除缓存失败:', error);
      throw error;
    }
  }

  /**
   * 缓存装饰器
   * @param {String} keyPrefix - 缓存键前缀
   * @param {Number} ttl - 过期时间(秒)
   * @param {Function} keyGenerator - 键生成函数
   */
  cached(keyPrefix, ttl = 3600, keyGenerator = null) {
    return (target, propertyName, descriptor) => {
      const method = descriptor.value;
      
      descriptor.value = async function(...args) {
        const cacheKey = keyGenerator 
          ? `${keyPrefix}:${keyGenerator(...args)}`
          : `${keyPrefix}:${JSON.stringify(args)}`;
        
        // 尝试从缓存获取
        const cached = await this.get(cacheKey);
        if (cached !== null) {
          logger.debug(`缓存命中: ${cacheKey}`);
          return cached;
        }
        
        // 执行原方法
        const result = await method.apply(this, args);
        
        // 设置缓存
        if (result !== null && result !== undefined) {
          await this.set(cacheKey, result, ttl);
        }
        
        return result;
      }.bind(this);
      
      return descriptor;
    };
  }
}

// 导出实例
module.exports = new CacheUtil();