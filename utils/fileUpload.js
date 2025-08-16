const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('./logger');

/**
 * 文件上传工具类
 */
class FileUploadUtil {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
      archive: ['zip', 'rar', '7z', 'tar', 'gz']
    };
    
    this.initUploadDir();
  }

  /**
   * 初始化上传目录
   */
  async initUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`创建上传目录: ${this.uploadDir}`);
    }
  }

  /**
   * 生成唯一文件名
   * @param {String} originalName - 原始文件名
   * @returns {String} 新文件名
   */
  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  /**
   * 获取文件扩展名
   * @param {String} filename - 文件名
   * @returns {String} 扩展名
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  /**
   * 检查文件类型
   * @param {String} filename - 文件名
   * @param {Array} allowedTypes - 允许的类型
   * @returns {Boolean}
   */
  isAllowedType(filename, allowedTypes) {
    const ext = this.getFileExtension(filename);
    return allowedTypes.includes(ext);
  }

  /**
   * 创建multer存储配置
   * @param {Object} options - 配置选项
   * @returns {Object} multer存储配置
   */
  createStorage(options = {}) {
    const {
      destination = this.uploadDir,
      fileTypes = 'image',
      maxSize = this.maxFileSize
    } = options;

    return multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          const uploadPath = path.join(destination, fileTypes);
          await fs.mkdir(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const newFileName = this.generateFileName(file.originalname);
        cb(null, newFileName);
      }
    });
  }

  /**
   * 创建文件过滤器
   * @param {Array} allowedTypes - 允许的文件类型
   * @returns {Function} 过滤器函数
   */
  createFileFilter(allowedTypes) {
    return (req, file, cb) => {
      if (this.isAllowedType(file.originalname, allowedTypes)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型，仅支持: ${allowedTypes.join(', ')}`), false);
      }
    };
  }

  /**
   * 创建图片上传中间件
   * @param {Object} options - 配置选项
   * @returns {Function} multer中间件
   */
  createImageUpload(options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = this.allowedTypes.image,
      fieldName = 'image'
    } = options;

    return multer({
      storage: this.createStorage({ fileTypes: 'images', maxSize }),
      fileFilter: this.createFileFilter(allowedTypes),
      limits: {
        fileSize: maxSize,
        files: 1
      }
    }).single(fieldName);
  }

  /**
   * 创建多文件上传中间件
   * @param {Object} options - 配置选项
   * @returns {Function} multer中间件
   */
  createMultipleUpload(options = {}) {
    const {
      maxSize = this.maxFileSize,
      allowedTypes = [...this.allowedTypes.image, ...this.allowedTypes.document],
      fieldName = 'files',
      maxCount = 5
    } = options;

    return multer({
      storage: this.createStorage({ fileTypes: 'files', maxSize }),
      fileFilter: this.createFileFilter(allowedTypes),
      limits: {
        fileSize: maxSize,
        files: maxCount
      }
    }).array(fieldName, maxCount);
  }

  /**
   * 删除文件
   * @param {String} filePath - 文件路径
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`文件删除成功: ${filePath}`);
    } catch (error) {
      logger.error(`文件删除失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 获取文件信息
   * @param {String} filePath - 文件路径
   * @returns {Object} 文件信息
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = this.getFileExtension(filePath);
      
      return {
        size: stats.size,
        extension: ext,
        mimeType: this.getMimeType(ext),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      logger.error(`获取文件信息失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 根据扩展名获取MIME类型
   * @param {String} ext - 文件扩展名
   * @returns {String} MIME类型
   */
  getMimeType(ext) {
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 格式化文件大小
   * @param {Number} bytes - 字节数
   * @returns {String} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 清理过期文件
   * @param {String} directory - 目录路径
   * @param {Number} maxAge - 最大年龄(毫秒)
   */
  async cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      logger.info(`清理过期文件完成，删除 ${deletedCount} 个文件`);
      return deletedCount;
    } catch (error) {
      logger.error('清理过期文件失败:', error);
      throw error;
    }
  }
}

// 导出实例
module.exports = new FileUploadUtil();