const nodemailer = require('nodemailer');
require('dotenv').config();

// 邮件配置
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// 创建邮件传输器
const transporter = nodemailer.createTransporter(emailConfig);

// 验证邮件配置
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ 邮件配置验证失败:', error.message);
  } else {
    console.log('✅ 邮件服务配置成功');
  }
});

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @returns {Promise} 发送结果
 */
async function sendEmail(options) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || '商城管理系统'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  emailConfig,
  transporter,
  sendEmail
};