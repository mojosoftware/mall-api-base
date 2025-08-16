const Bull = require('bull');
const redis = require('../config/redis');
const logger = require('./logger');

/**
 * 消息队列工具类
 * 基于Bull和Redis实现
 */
class QueueUtil {
  constructor() {
    this.queues = new Map();
    this.defaultOptions = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0
      },
      defaultJobOptions: {
        removeOnComplete: 10, // 保留最近10个完成的任务
        removeOnFail: 50,     // 保留最近50个失败的任务
        attempts: 3,          // 重试次数
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    };
  }

  /**
   * 创建队列
   * @param {String} name - 队列名称
   * @param {Object} options - 队列配置
   * @returns {Bull.Queue} 队列实例
   */
  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queueOptions = {
      ...this.defaultOptions,
      ...options
    };

    const queue = new Bull(name, queueOptions);

    // 设置队列事件监听
    this.setupQueueEvents(queue, name);

    this.queues.set(name, queue);
    logger.info(`队列创建成功: ${name}`);

    return queue;
  }

  /**
   * 添加任务到队列
   * @param {String} queueName - 队列名称
   * @param {String} jobType - 任务类型
   * @param {Object} data - 任务数据
   * @param {Object} options - 任务选项
   * @returns {Bull.Job} 任务实例
   */
  async addJob(queueName, jobType, data, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      
      const jobOptions = {
        ...this.defaultOptions.defaultJobOptions,
        ...options
      };

      const job = await queue.add(jobType, data, jobOptions);
      
      logger.info(`任务添加成功 - 队列: ${queueName}, 类型: ${jobType}, ID: ${job.id}`);
      return job;
    } catch (error) {
      logger.error('添加任务失败:', error);
      throw error;
    }
  }

  /**
   * 添加延迟任务
   * @param {String} queueName - 队列名称
   * @param {String} jobType - 任务类型
   * @param {Object} data - 任务数据
   * @param {Number} delay - 延迟时间(毫秒)
   * @param {Object} options - 任务选项
   * @returns {Bull.Job} 任务实例
   */
  async addDelayedJob(queueName, jobType, data, delay, options = {}) {
    return await this.addJob(queueName, jobType, data, {
      ...options,
      delay
    });
  }

  /**
   * 添加定时任务
   * @param {String} queueName - 队列名称
   * @param {String} jobType - 任务类型
   * @param {Object} data - 任务数据
   * @param {String} cron - Cron表达式
   * @param {Object} options - 任务选项
   * @returns {Bull.Job} 任务实例
   */
  async addCronJob(queueName, jobType, data, cron, options = {}) {
    return await this.addJob(queueName, jobType, data, {
      ...options,
      repeat: { cron }
    });
  }

  /**
   * 处理队列任务
   * @param {String} queueName - 队列名称
   * @param {String} jobType - 任务类型
   * @param {Function} processor - 处理函数
   * @param {Object} options - 处理选项
   */
  process(queueName, jobType, processor, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      const { concurrency = 1 } = options;

      queue.process(jobType, concurrency, async (job) => {
        logger.info(`开始处理任务 - 队列: ${queueName}, 类型: ${jobType}, ID: ${job.id}`);
        
        try {
          const result = await processor(job);
          logger.info(`任务处理成功 - 队列: ${queueName}, 类型: ${jobType}, ID: ${job.id}`);
          return result;
        } catch (error) {
          logger.error(`任务处理失败 - 队列: ${queueName}, 类型: ${jobType}, ID: ${job.id}:`, error);
          throw error;
        }
      });

      logger.info(`队列处理器注册成功 - 队列: ${queueName}, 类型: ${jobType}`);
    } catch (error) {
      logger.error('注册队列处理器失败:', error);
      throw error;
    }
  }

  /**
   * 获取队列实例
   * @param {String} name - 队列名称
   * @returns {Bull.Queue} 队列实例
   */
  getQueue(name) {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`队列不存在: ${name}`);
    }
    return queue;
  }

  /**
   * 获取队列状态
   * @param {String} queueName - 队列名称
   * @returns {Object} 队列状态
   */
  async getQueueStatus(queueName) {
    try {
      const queue = this.getQueue(queueName);
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed()
      ]);

      return {
        name: queueName,
        counts: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length
        },
        jobs: {
          waiting: waiting.slice(0, 10), // 只返回前10个
          active: active.slice(0, 10),
          failed: failed.slice(0, 10)
        }
      };
    } catch (error) {
      logger.error('获取队列状态失败:', error);
      throw error;
    }
  }

  /**
   * 清空队列
   * @param {String} queueName - 队列名称
   * @param {String} status - 要清空的任务状态 (waiting, active, completed, failed, delayed)
   */
  async cleanQueue(queueName, status = 'completed') {
    try {
      const queue = this.getQueue(queueName);
      
      switch (status) {
        case 'waiting':
          await queue.clean(0, 'waiting');
          break;
        case 'active':
          await queue.clean(0, 'active');
          break;
        case 'completed':
          await queue.clean(0, 'completed');
          break;
        case 'failed':
          await queue.clean(0, 'failed');
          break;
        case 'delayed':
          await queue.clean(0, 'delayed');
          break;
        case 'all':
          await Promise.all([
            queue.clean(0, 'waiting'),
            queue.clean(0, 'active'),
            queue.clean(0, 'completed'),
            queue.clean(0, 'failed'),
            queue.clean(0, 'delayed')
          ]);
          break;
        default:
          throw new Error(`不支持的状态: ${status}`);
      }

      logger.info(`队列清理成功 - 队列: ${queueName}, 状态: ${status}`);
    } catch (error) {
      logger.error('清理队列失败:', error);
      throw error;
    }
  }

  /**
   * 暂停队列
   * @param {String} queueName - 队列名称
   */
  async pauseQueue(queueName) {
    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      logger.info(`队列暂停成功: ${queueName}`);
    } catch (error) {
      logger.error('暂停队列失败:', error);
      throw error;
    }
  }

  /**
   * 恢复队列
   * @param {String} queueName - 队列名称
   */
  async resumeQueue(queueName) {
    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      logger.info(`队列恢复成功: ${queueName}`);
    } catch (error) {
      logger.error('恢复队列失败:', error);
      throw error;
    }
  }

  /**
   * 设置队列事件监听
   * @param {Bull.Queue} queue - 队列实例
   * @param {String} name - 队列名称
   */
  setupQueueEvents(queue, name) {
    queue.on('completed', (job, result) => {
      logger.debug(`任务完成 - 队列: ${name}, ID: ${job.id}`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`任务失败 - 队列: ${name}, ID: ${job.id}:`, err);
    });

    queue.on('stalled', (job) => {
      logger.warn(`任务停滞 - 队列: ${name}, ID: ${job.id}`);
    });

    queue.on('progress', (job, progress) => {
      logger.debug(`任务进度 - 队列: ${name}, ID: ${job.id}, 进度: ${progress}%`);
    });
  }

  /**
   * 关闭所有队列
   */
  async closeAll() {
    try {
      const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
      await Promise.all(closePromises);
      this.queues.clear();
      logger.info('所有队列已关闭');
    } catch (error) {
      logger.error('关闭队列失败:', error);
      throw error;
    }
  }

  /**
   * 创建常用队列
   */
  setupCommonQueues() {
    // 邮件队列
    const emailQueue = this.createQueue('email', {
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000
        }
      }
    });

    // 短信队列
    const smsQueue = this.createQueue('sms', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000
        }
      }
    });

    // 文件处理队列
    const fileQueue = this.createQueue('file-processing', {
      defaultJobOptions: {
        attempts: 2,
        timeout: 30000 // 30秒超时
      }
    });

    // 数据同步队列
    const syncQueue = this.createQueue('data-sync', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000
        }
      }
    });

    return {
      emailQueue,
      smsQueue,
      fileQueue,
      syncQueue
    };
  }
}

// 导出实例
module.exports = new QueueUtil();