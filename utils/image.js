const sharp = require('sharp');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * 图片处理工具类
 */
class ImageUtil {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'];
  }

  /**
   * 调整图片大小
   * @param {Buffer|String} input - 输入图片（缓冲区或文件路径）
   * @param {Object} options - 配置选项
   * @returns {Buffer} 处理后的图片缓冲区
   */
  async resize(input, options = {}) {
    try {
      const {
        width = null,
        height = null,
        fit = 'cover', // cover, contain, fill, inside, outside
        quality = 80,
        format = 'jpeg'
      } = options;

      let image = sharp(input);

      // 调整大小
      if (width || height) {
        image = image.resize(width, height, { fit });
      }

      // 设置输出格式和质量
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png({ quality });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        default:
          image = image.jpeg({ quality });
      }

      const buffer = await image.toBuffer();
      logger.info('图片大小调整成功');
      return buffer;
    } catch (error) {
      logger.error('图片大小调整失败:', error);
      throw new Error(`图片处理失败: ${error.message}`);
    }
  }

  /**
   * 生成缩略图
   * @param {Buffer|String} input - 输入图片
   * @param {Object} options - 配置选项
   * @returns {Buffer} 缩略图缓冲区
   */
  async generateThumbnail(input, options = {}) {
    const {
      width = 200,
      height = 200,
      quality = 70,
      format = 'jpeg'
    } = options;

    return await this.resize(input, {
      width,
      height,
      fit: 'cover',
      quality,
      format
    });
  }

  /**
   * 图片格式转换
   * @param {Buffer|String} input - 输入图片
   * @param {String} targetFormat - 目标格式
   * @param {Object} options - 配置选项
   * @returns {Buffer} 转换后的图片缓冲区
   */
  async convertFormat(input, targetFormat, options = {}) {
    try {
      const { quality = 80 } = options;

      let image = sharp(input);

      switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png();
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'gif':
          image = image.gif();
          break;
        default:
          throw new Error(`不支持的格式: ${targetFormat}`);
      }

      const buffer = await image.toBuffer();
      logger.info(`图片格式转换成功: ${targetFormat}`);
      return buffer;
    } catch (error) {
      logger.error('图片格式转换失败:', error);
      throw new Error(`格式转换失败: ${error.message}`);
    }
  }

  /**
   * 添加水印
   * @param {Buffer|String} input - 输入图片
   * @param {Buffer|String} watermark - 水印图片
   * @param {Object} options - 配置选项
   * @returns {Buffer} 添加水印后的图片缓冲区
   */
  async addWatermark(input, watermark, options = {}) {
    try {
      const {
        position = 'bottom-right', // top-left, top-right, bottom-left, bottom-right, center
        opacity = 0.5,
        margin = 20
      } = options;

      const image = sharp(input);
      const { width, height } = await image.metadata();

      // 处理水印
      const watermarkImage = await sharp(watermark)
        .resize(Math.floor(width * 0.2)) // 水印大小为原图的20%
        .png()
        .toBuffer();

      const watermarkMetadata = await sharp(watermarkImage).metadata();

      // 计算水印位置
      let left, top;
      switch (position) {
        case 'top-left':
          left = margin;
          top = margin;
          break;
        case 'top-right':
          left = width - watermarkMetadata.width - margin;
          top = margin;
          break;
        case 'bottom-left':
          left = margin;
          top = height - watermarkMetadata.height - margin;
          break;
        case 'bottom-right':
          left = width - watermarkMetadata.width - margin;
          top = height - watermarkMetadata.height - margin;
          break;
        case 'center':
          left = Math.floor((width - watermarkMetadata.width) / 2);
          top = Math.floor((height - watermarkMetadata.height) / 2);
          break;
        default:
          left = width - watermarkMetadata.width - margin;
          top = height - watermarkMetadata.height - margin;
      }

      const buffer = await image
        .composite([{
          input: watermarkImage,
          left,
          top,
          blend: 'over'
        }])
        .toBuffer();

      logger.info('水印添加成功');
      return buffer;
    } catch (error) {
      logger.error('水印添加失败:', error);
      throw new Error(`水印添加失败: ${error.message}`);
    }
  }

  /**
   * 生成二维码
   * @param {String} text - 二维码内容
   * @param {Object} options - 配置选项
   * @returns {Buffer} 二维码图片缓冲区
   */
  async generateQRCode(text, options = {}) {
    try {
      const {
        width = 200,
        margin = 4,
        color = {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel = 'M' // L, M, Q, H
      } = options;

      const qrOptions = {
        width,
        margin,
        color,
        errorCorrectionLevel,
        type: 'png'
      };

      const buffer = await QRCode.toBuffer(text, qrOptions);
      logger.info('二维码生成成功');
      return buffer;
    } catch (error) {
      logger.error('二维码生成失败:', error);
      throw new Error(`二维码生成失败: ${error.message}`);
    }
  }

  /**
   * 获取图片信息
   * @param {Buffer|String} input - 输入图片
   * @returns {Object} 图片信息
   */
  async getImageInfo(input) {
    try {
      const metadata = await sharp(input).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      logger.error('获取图片信息失败:', error);
      throw new Error(`获取图片信息失败: ${error.message}`);
    }
  }

  /**
   * 图片裁剪
   * @param {Buffer|String} input - 输入图片
   * @param {Object} options - 裁剪选项
   * @returns {Buffer} 裁剪后的图片缓冲区
   */
  async crop(input, options = {}) {
    try {
      const {
        left = 0,
        top = 0,
        width,
        height,
        quality = 80,
        format = 'jpeg'
      } = options;

      if (!width || !height) {
        throw new Error('裁剪宽度和高度不能为空');
      }

      let image = sharp(input).extract({ left, top, width, height });

      // 设置输出格式
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png();
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
      }

      const buffer = await image.toBuffer();
      logger.info('图片裁剪成功');
      return buffer;
    } catch (error) {
      logger.error('图片裁剪失败:', error);
      throw new Error(`图片裁剪失败: ${error.message}`);
    }
  }

  /**
   * 验证图片格式
   * @param {String} filename - 文件名
   * @returns {Boolean} 是否为支持的图片格式
   */
  isValidImageFormat(filename) {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return this.supportedFormats.includes(ext);
  }
}

// 导出实例
module.exports = new ImageUtil();