const { sendEmail } = require('../config/email');
const ejs = require('ejs');
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  /**
   * 渲染邮件模板
   * @param {String} templateName - 模板名称
   * @param {Object} data - 模板数据
   * @returns {String} 渲染后的HTML
   */
  async renderTemplate(templateName, data) {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.ejs`);
    return await ejs.renderFile(templatePath, data);
  }

  /**
   * 发送验证邮件
   * @param {String} email - 收件人邮箱
   * @param {String} username - 用户名
   * @param {String} verificationCode - 验证码
   * @param {String} verificationUrl - 验证链接（可选）
   */
  async sendVerificationEmail(email, username, verificationCode, verificationUrl = null) {
    try {
      const html = await this.renderTemplate('verification', {
        username,
        verificationCode,
        verificationUrl
      });

      await sendEmail({
        to: email,
        subject: '邮箱验证 - 商城管理系统',
        html,
        text: `您好 ${username}，您的验证码是：${verificationCode}，有效期10分钟。`
      });

      logger.info(`验证邮件发送成功 - 收件人: ${email}`);
    } catch (error) {
      logger.error('发送验证邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }

  /**
   * 发送欢迎邮件
   * @param {String} email - 收件人邮箱
   * @param {String} username - 用户名
   * @param {String} loginUrl - 登录链接（可选）
   */
  async sendWelcomeEmail(email, username, loginUrl = null) {
    try {
      const html = await this.renderTemplate('welcome', {
        username,
        email,
        loginUrl
      });

      await sendEmail({
        to: email,
        subject: '欢迎加入 - 商城管理系统',
        html,
        text: `欢迎您，${username}！您的账户已成功创建。`
      });

      logger.info(`欢迎邮件发送成功 - 收件人: ${email}`);
    } catch (error) {
      logger.error('发送欢迎邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }

  /**
   * 发送密码重置邮件
   * @param {String} email - 收件人邮箱
   * @param {String} username - 用户名
   * @param {String} resetCode - 重置码
   * @param {String} resetUrl - 重置链接（可选）
   */
  async sendPasswordResetEmail(email, username, resetCode, resetUrl = null) {
    try {
      // 可以创建一个密码重置模板，这里先使用验证模板
      const html = await this.renderTemplate('verification', {
        username,
        verificationCode: resetCode,
        verificationUrl: resetUrl
      });

      await sendEmail({
        to: email,
        subject: '密码重置 - 商城管理系统',
        html: html.replace('邮箱验证', '密码重置').replace('验证您的邮箱地址', '重置您的密码'),
        text: `您好 ${username}，您的密码重置验证码是：${resetCode}，有效期10分钟。`
      });

      logger.info(`密码重置邮件发送成功 - 收件人: ${email}`);
    } catch (error) {
      logger.error('发送密码重置邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }
}

// 导出实例
module.exports = new EmailService();