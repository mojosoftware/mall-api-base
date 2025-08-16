const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * PDF生成工具类
 */
class PDFUtil {
  constructor() {
    this.defaultOptions = {
      size: 'A4',
      margin: 50,
      font: 'Helvetica',
      fontSize: 12
    };
  }

  /**
   * 创建PDF文档
   * @param {Object} options - PDF配置选项
   * @returns {PDFDocument} PDF文档实例
   */
  createDocument(options = {}) {
    const config = { ...this.defaultOptions, ...options };
    return new PDFDocument(config);
  }

  /**
   * 生成简单文本PDF
   * @param {String} text - 文本内容
   * @param {Object} options - 配置选项
   * @returns {Buffer} PDF缓冲区
   */
  async generateTextPDF(text, options = {}) {
    try {
      const {
        title = '文档',
        fontSize = 12,
        font = 'Helvetica'
      } = options;

      const doc = this.createDocument(options);
      const buffers = [];

      // 收集PDF数据
      doc.on('data', buffers.push.bind(buffers));

      // 设置文档信息
      doc.info.Title = title;
      doc.info.Author = '系统生成';
      doc.info.CreationDate = new Date();

      // 添加标题
      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(2);

      // 添加内容
      doc.fontSize(fontSize).font(font).text(text, {
        align: 'left',
        lineGap: 5
      });

      // 结束文档
      doc.end();

      // 等待PDF生成完成
      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info('文本PDF生成成功');
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('文本PDF生成失败:', error);
      throw new Error(`PDF生成失败: ${error.message}`);
    }
  }

  /**
   * 生成表格PDF
   * @param {Array} data - 表格数据
   * @param {Object} options - 配置选项
   * @returns {Buffer} PDF缓冲区
   */
  async generateTablePDF(data, options = {}) {
    try {
      const {
        title = '数据表格',
        headers = null,
        columnWidths = null,
        fontSize = 10
      } = options;

      const doc = this.createDocument(options);
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));

      // 添加标题
      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(1);

      // 计算表格参数
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const tableData = headers ? [headers, ...data] : data;
      const colCount = tableData[0]?.length || 0;
      const colWidth = columnWidths || Array(colCount).fill(pageWidth / colCount);

      let currentY = doc.y;

      // 绘制表格
      for (let i = 0; i < tableData.length; i++) {
        const row = tableData[i];
        const isHeader = headers && i === 0;

        // 检查是否需要换页
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }

        let currentX = doc.page.margins.left;

        // 绘制行
        for (let j = 0; j < row.length; j++) {
          const cellText = String(row[j] || '');
          
          // 设置字体
          if (isHeader) {
            doc.fontSize(fontSize + 1).font('Helvetica-Bold');
          } else {
            doc.fontSize(fontSize).font('Helvetica');
          }

          // 绘制单元格边框
          doc.rect(currentX, currentY, colWidth[j], 20).stroke();

          // 绘制文本
          doc.text(cellText, currentX + 5, currentY + 5, {
            width: colWidth[j] - 10,
            height: 15,
            ellipsis: true
          });

          currentX += colWidth[j];
        }

        currentY += 20;
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info('表格PDF生成成功');
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('表格PDF生成失败:', error);
      throw new Error(`PDF生成失败: ${error.message}`);
    }
  }

  /**
   * 生成报告PDF
   * @param {Object} reportData - 报告数据
   * @param {Object} options - 配置选项
   * @returns {Buffer} PDF缓冲区
   */
  async generateReportPDF(reportData, options = {}) {
    try {
      const {
        title = '系统报告',
        subtitle = '',
        sections = []
      } = reportData;

      const doc = this.createDocument(options);
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));

      // 添加标题页
      doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
      
      if (subtitle) {
        doc.fontSize(16).font('Helvetica').text(subtitle, { align: 'center' });
      }

      doc.fontSize(12).text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, { align: 'center' });
      doc.addPage();

      // 添加各个章节
      for (const section of sections) {
        // 章节标题
        doc.fontSize(18).font('Helvetica-Bold').text(section.title);
        doc.moveDown(1);

        // 章节内容
        if (section.content) {
          doc.fontSize(12).font('Helvetica').text(section.content);
          doc.moveDown(1);
        }

        // 章节表格
        if (section.table) {
          const tableBuffer = await this.generateTablePDF(section.table.data, {
            headers: section.table.headers,
            title: '',
            fontSize: 10
          });
          // 这里简化处理，实际项目中可能需要更复杂的表格嵌入逻辑
        }

        doc.moveDown(2);
      }

      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info('报告PDF生成成功');
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      logger.error('报告PDF生成失败:', error);
      throw new Error(`PDF生成失败: ${error.message}`);
    }
  }

  /**
   * 保存PDF到文件
   * @param {Buffer} pdfBuffer - PDF缓冲区
   * @param {String} filepath - 文件路径
   */
  async savePDFToFile(pdfBuffer, filepath) {
    try {
      await fs.writeFile(filepath, pdfBuffer);
      logger.info(`PDF保存成功: ${filepath}`);
    } catch (error) {
      logger.error('PDF保存失败:', error);
      throw new Error(`PDF保存失败: ${error.message}`);
    }
  }
}

// 导出实例
module.exports = new PDFUtil();