const logger = require('./logger');
const cache = require('./cache');

/**
 * 短信发送工具类
 * 支持多个短信服务提供商
 */
class SMSUtil {
  constructor() {
    this.providers = {
      aliyun: this.sendAliyunSMS.bind(this),
      tencent: this.sendTencentSMS.bind(this),
      mock: this.sendMockSMS.bind(this) // 用于开发测试
    };
    
    this.currentProvider = process.env.SMS_PROVIDER || 'mock';
    this.rateLimitKey = 'sms_rate_limit';
  }

  /**
   * 发送短信
   * @param {String} phone - 手机号
   * @param {String} message - 短信内容
   * @param {Object} options - 配置选项
   * @returns {Object} 发送结果
   */
  async sendSMS(phone, message, options = {}) {
    try {
      // 验证手机号格式
      if (!this.isValidPhoneNumber(phone)) {
        throw new Error('手机号格式不正确');
      }

      // 检查发送频率限制
      await this.checkRateLimit(phone);

      // 选择发送提供商
      const provider = this.providers[this.currentProvider];
      if (!provider) {
        throw new Error(`不支持的短信提供商: ${this.currentProvider}`);
      }

      // 发送短信
      const result = await provider(phone, message, options);

      // 记录发送日志
      logger.info(`短信发送成功 - 手机号: ${phone}, 提供商: ${this.currentProvider}`);

      // 更新发送频率限制
      await this.updateRateLimit(phone);

      return result;
    } catch (error) {
      logger.error('短信发送失败:', error);
      throw error;
    }
  }

  /**
   * 发送验证码短信
   * @param {String} phone - 手机号
   * @param {String} code - 验证码
   * @param {Object} options - 配置选项
   * @returns {Object} 发送结果
   */
  async sendVerificationCode(phone, code, options = {}) {
    const {
      template = '您的验证码是：{code}，有效期5分钟，请勿泄露给他人。',
      expireMinutes = 5
    } = options;

    const message = template.replace('{code}', code);

    // 存储验证码到缓存
    const cacheKey = `sms_code:${phone}`;
    await cache.set(cacheKey, code, expireMinutes * 60);

    return await this.sendSMS(phone, message, options);
  }

  /**
   * 验证短信验证码
   * @param {String} phone - 手机号
   * @param {String} code - 用户输入的验证码
   * @returns {Boolean} 验证结果
   */
  async verifyCode(phone, code) {
    try {
      const cacheKey = `sms_code:${phone}`;
      const storedCode = await cache.get(cacheKey);

      if (!storedCode) {
        throw new Error('验证码已过期或不存在');
      }

      if (storedCode !== code) {
        throw new Error('验证码错误');
      }

      // 验证成功后删除验证码
      await cache.del(cacheKey);
      
      logger.info(`短信验证码验证成功 - 手机号: ${phone}`);
      return true;
    } catch (error) {
      logger.error('短信验证码验证失败:', error);
      throw error;
    }
  }

  /**
   * 阿里云短信发送
   * @param {String} phone - 手机号
   * @param {String} message - 短信内容
   * @param {Object} options - 配置选项
   * @returns {Object} 发送结果
   */
  async sendAliyunSMS(phone, message, options = {}) {
    // 这里需要集成阿里云SDK
    // const Core = require('@alicloud/pop-core');
    
    const {
      accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET,
      signName = process.env.ALIYUN_SMS_SIGN_NAME,
      templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
    } = options;

    // 模拟阿里云短信发送
    logger.info(`[阿里云短信] 发送到 ${phone}: ${message}`);
    
    return {
      success: true,
      messageId: `aliyun_${Date.now()}`,
      provider: 'aliyun'
    };
  }

  /**
   * 腾讯云短信发送
   * @param {String} phone - 手机号
   * @param {String} message - 短信内容
   * @param {Object} options - 配置选项
   * @returns {Object} 发送结果
   */
  async sendTencentSMS(phone, message, options = {}) {
    // 这里需要集成腾讯云SDK
    // const tencentcloud = require('tencentcloud-sdk-nodejs');
    
    const {
      secretId = process.env.TENCENT_SECRET_ID,
      secretKey = process.env.TENCENT_SECRET_KEY,
      sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID,
      signName = process.env.TENCENT_SMS_SIGN_NAME
    } = options;

    // 模拟腾讯云短信发送
    logger.info(`[腾讯云短信] 发送到 ${phone}: ${message}`);
    
    return {
      success: true,
      messageId: `tencent_${Date.now()}`,
      provider: 'tencent'
    };
  }

  /**
   * 模拟短信发送（用于开发测试）
   * @param {String} phone - 手机号
   * @param {String} message - 短信内容
   * @param {Object} options - 配置选项
   * @returns {Object} 发送结果
   */
  async sendMockSMS(phone, message, options = {}) {
    // 开发环境下模拟发送
    logger.info(`[模拟短信] 发送到 ${phone}: ${message}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    };
  }

  /**
   * 验证手机号格式
   * @param {String} phone - 手机号
   * @returns {Boolean} 是否有效
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 检查发送频率限制
   * @param {String} phone - 手机号
   */
  async checkRateLimit(phone) {
    const key = `${this.rateLimitKey}:${phone}`;
    const count = await cache.get(key) || 0;
    
    // 每小时最多发送5条短信
    if (count >= 5) {
      throw new Error('发送过于频繁，请稍后再试');
    }
  }

  /**
   * 更新发送频率限制
   * @param {String} phone - 手机号
   */
  async updateRateLimit(phone) {
    const key = `${this.rateLimitKey}:${phone}`;
    const count = await cache.get(key) || 0;
    await cache.set(key, count + 1, 3600); // 1小时过期
  }

  /**
   * 生成随机验证码
   * @param {Number} length - 验证码长度
   * @returns {String} 验证码
   */
  generateVerificationCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    
    return code;
  }
}

// 导出实例
module.exports = new SMSUtil();