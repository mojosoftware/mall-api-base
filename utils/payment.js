const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('./logger');
const cache = require('./cache');

/**
 * 支付工具类
 * 支持多种支付方式
 */
class PaymentUtil {
  constructor() {
    this.providers = {
      stripe: this.processStripePayment.bind(this),
      alipay: this.processAlipayPayment.bind(this),
      wechat: this.processWechatPayment.bind(this),
      mock: this.processMockPayment.bind(this)
    };
  }

  /**
   * 创建支付订单
   * @param {Object} orderData - 订单数据
   * @param {String} provider - 支付提供商
   * @returns {Object} 支付结果
   */
  async createPayment(orderData, provider = 'stripe') {
    try {
      const {
        amount,
        currency = 'usd',
        description,
        orderId,
        customerInfo = {},
        metadata = {}
      } = orderData;

      // 验证订单数据
      this.validateOrderData(orderData);

      // 选择支付提供商
      const paymentProvider = this.providers[provider];
      if (!paymentProvider) {
        throw new Error(`不支持的支付提供商: ${provider}`);
      }

      // 创建支付
      const result = await paymentProvider({
        amount,
        currency,
        description,
        orderId,
        customerInfo,
        metadata: {
          ...metadata,
          provider,
          createdAt: new Date().toISOString()
        }
      });

      // 缓存支付信息
      await this.cachePaymentInfo(result.paymentId, {
        ...orderData,
        provider,
        status: 'pending'
      });

      logger.info(`支付订单创建成功 - 订单ID: ${orderId}, 支付ID: ${result.paymentId}`);
      return result;
    } catch (error) {
      logger.error('创建支付订单失败:', error);
      throw error;
    }
  }

  /**
   * Stripe支付处理
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 支付结果
   */
  async processStripePayment(paymentData) {
    try {
      const {
        amount,
        currency,
        description,
        orderId,
        customerInfo,
        metadata
      } = paymentData;

      // 创建Stripe支付意图
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe使用分为单位
        currency: currency.toLowerCase(),
        description,
        metadata: {
          orderId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        provider: 'stripe',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Stripe支付处理失败:', error);
      throw new Error(`Stripe支付失败: ${error.message}`);
    }
  }

  /**
   * 支付宝支付处理
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 支付结果
   */
  async processAlipayPayment(paymentData) {
    // 这里需要集成支付宝SDK
    // const AlipaySdk = require('alipay-sdk').default;
    
    const {
      amount,
      currency,
      description,
      orderId,
      customerInfo,
      metadata
    } = paymentData;

    // 模拟支付宝支付
    logger.info(`[支付宝支付] 订单ID: ${orderId}, 金额: ${amount} ${currency}`);
    
    const paymentId = `alipay_${Date.now()}_${orderId}`;
    
    return {
      success: true,
      paymentId,
      paymentUrl: `https://openapi.alipay.com/gateway.do?payment_id=${paymentId}`,
      status: 'pending',
      provider: 'alipay',
      amount,
      currency
    };
  }

  /**
   * 微信支付处理
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 支付结果
   */
  async processWechatPayment(paymentData) {
    // 这里需要集成微信支付SDK
    // const WechatPay = require('wechatpay-node-v3');
    
    const {
      amount,
      currency,
      description,
      orderId,
      customerInfo,
      metadata
    } = paymentData;

    // 模拟微信支付
    logger.info(`[微信支付] 订单ID: ${orderId}, 金额: ${amount} ${currency}`);
    
    const paymentId = `wechat_${Date.now()}_${orderId}`;
    
    return {
      success: true,
      paymentId,
      qrCode: `weixin://wxpay/bizpayurl?pr=${paymentId}`,
      status: 'pending',
      provider: 'wechat',
      amount,
      currency
    };
  }

  /**
   * 模拟支付处理（用于开发测试）
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 支付结果
   */
  async processMockPayment(paymentData) {
    const {
      amount,
      currency,
      description,
      orderId,
      customerInfo,
      metadata
    } = paymentData;

    // 模拟支付处理
    logger.info(`[模拟支付] 订单ID: ${orderId}, 金额: ${amount} ${currency}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const paymentId = `mock_${Date.now()}_${orderId}`;
    
    return {
      success: true,
      paymentId,
      status: 'succeeded',
      provider: 'mock',
      amount,
      currency
    };
  }

  /**
   * 查询支付状态
   * @param {String} paymentId - 支付ID
   * @param {String} provider - 支付提供商
   * @returns {Object} 支付状态
   */
  async getPaymentStatus(paymentId, provider = 'stripe') {
    try {
      let status;
      
      switch (provider) {
        case 'stripe':
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
          status = {
            paymentId,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            provider: 'stripe'
          };
          break;
          
        case 'alipay':
        case 'wechat':
        case 'mock':
          // 从缓存中获取支付信息
          const cachedInfo = await this.getCachedPaymentInfo(paymentId);
          status = {
            paymentId,
            status: cachedInfo?.status || 'unknown',
            amount: cachedInfo?.amount,
            currency: cachedInfo?.currency,
            provider
          };
          break;
          
        default:
          throw new Error(`不支持的支付提供商: ${provider}`);
      }

      return status;
    } catch (error) {
      logger.error('查询支付状态失败:', error);
      throw error;
    }
  }

  /**
   * 处理支付回调
   * @param {Object} callbackData - 回调数据
   * @param {String} provider - 支付提供商
   * @returns {Object} 处理结果
   */
  async handlePaymentCallback(callbackData, provider) {
    try {
      let result;
      
      switch (provider) {
        case 'stripe':
          result = await this.handleStripeCallback(callbackData);
          break;
        case 'alipay':
          result = await this.handleAlipayCallback(callbackData);
          break;
        case 'wechat':
          result = await this.handleWechatCallback(callbackData);
          break;
        default:
          throw new Error(`不支持的支付提供商: ${provider}`);
      }

      // 更新支付状态缓存
      await this.updatePaymentStatus(result.paymentId, result.status);

      logger.info(`支付回调处理成功 - 支付ID: ${result.paymentId}, 状态: ${result.status}`);
      return result;
    } catch (error) {
      logger.error('处理支付回调失败:', error);
      throw error;
    }
  }

  /**
   * 处理Stripe回调
   * @param {Object} callbackData - Stripe回调数据
   * @returns {Object} 处理结果
   */
  async handleStripeCallback(callbackData) {
    const { type, data } = callbackData;
    
    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object;
      return {
        paymentId: paymentIntent.id,
        status: 'succeeded',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    }
    
    return { status: 'unknown' };
  }

  /**
   * 处理支付宝回调
   * @param {Object} callbackData - 支付宝回调数据
   * @returns {Object} 处理结果
   */
  async handleAlipayCallback(callbackData) {
    // 处理支付宝回调逻辑
    return {
      paymentId: callbackData.out_trade_no,
      status: callbackData.trade_status === 'TRADE_SUCCESS' ? 'succeeded' : 'failed'
    };
  }

  /**
   * 处理微信支付回调
   * @param {Object} callbackData - 微信支付回调数据
   * @returns {Object} 处理结果
   */
  async handleWechatCallback(callbackData) {
    // 处理微信支付回调逻辑
    return {
      paymentId: callbackData.out_trade_no,
      status: callbackData.result_code === 'SUCCESS' ? 'succeeded' : 'failed'
    };
  }

  /**
   * 验证订单数据
   * @param {Object} orderData - 订单数据
   */
  validateOrderData(orderData) {
    const { amount, orderId } = orderData;
    
    if (!amount || amount <= 0) {
      throw new Error('支付金额必须大于0');
    }
    
    if (!orderId) {
      throw new Error('订单ID不能为空');
    }
  }

  /**
   * 缓存支付信息
   * @param {String} paymentId - 支付ID
   * @param {Object} paymentInfo - 支付信息
   */
  async cachePaymentInfo(paymentId, paymentInfo) {
    const key = `payment:${paymentId}`;
    await cache.set(key, paymentInfo, 24 * 60 * 60); // 缓存24小时
  }

  /**
   * 获取缓存的支付信息
   * @param {String} paymentId - 支付ID
   * @returns {Object} 支付信息
   */
  async getCachedPaymentInfo(paymentId) {
    const key = `payment:${paymentId}`;
    return await cache.get(key);
  }

  /**
   * 更新支付状态
   * @param {String} paymentId - 支付ID
   * @param {String} status - 支付状态
   */
  async updatePaymentStatus(paymentId, status) {
    const paymentInfo = await this.getCachedPaymentInfo(paymentId);
    if (paymentInfo) {
      paymentInfo.status = status;
      paymentInfo.updatedAt = new Date().toISOString();
      await this.cachePaymentInfo(paymentId, paymentInfo);
    }
  }
}

// 导出实例
module.exports = new PaymentUtil();