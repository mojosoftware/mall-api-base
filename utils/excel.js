const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

/**
 * Excel导入导出工具类
 */
class ExcelUtil {
  /**
   * 导出数据到Excel
   * @param {Array} data - 数据数组
   * @param {Object} options - 配置选项
   * @returns {Buffer} Excel文件缓冲区
   */
  async exportToExcel(data, options = {}) {
    try {
      const {
        sheetName = 'Sheet1',
        headers = null,
        filename = `export_${Date.now()}.xlsx`,
        autoWidth = true
      } = options;

      // 创建工作簿
      const workbook = XLSX.utils.book_new();

      // 处理数据
      let worksheetData = data;
      if (headers) {
        worksheetData = [headers, ...data];
      }

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // 自动调整列宽
      if (autoWidth) {
        const colWidths = this.calculateColumnWidths(worksheetData);
        worksheet['!cols'] = colWidths;
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 生成Excel文件缓冲区
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      logger.info(`Excel导出成功: ${filename}`);
      return buffer;
    } catch (error) {
      logger.error('Excel导出失败:', error);
      throw new Error(`Excel导出失败: ${error.message}`);
    }
  }

  /**
   * 从Excel文件导入数据
   * @param {Buffer|String} input - 文件缓冲区或文件路径
   * @param {Object} options - 配置选项
   * @returns {Array} 解析后的数据
   */
  async importFromExcel(input, options = {}) {
    try {
      const {
        sheetName = null,
        hasHeaders = true,
        range = null,
        skipEmptyRows = true
      } = options;

      // 读取工作簿
      let workbook;
      if (Buffer.isBuffer(input)) {
        workbook = XLSX.read(input, { type: 'buffer' });
      } else {
        workbook = XLSX.readFile(input);
      }

      // 获取工作表名称
      const targetSheet = sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];

      if (!worksheet) {
        throw new Error(`工作表 "${targetSheet}" 不存在`);
      }

      // 转换为JSON数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: hasHeaders ? 1 : 'A',
        range: range,
        blankrows: !skipEmptyRows
      });

      logger.info(`Excel导入成功: ${jsonData.length} 行数据`);
      return jsonData;
    } catch (error) {
      logger.error('Excel导入失败:', error);
      throw new Error(`Excel导入失败: ${error.message}`);
    }
  }

  /**
   * 导出对象数组到Excel
   * @param {Array} objects - 对象数组
   * @param {Object} options - 配置选项
   * @returns {Buffer} Excel文件缓冲区
   */
  async exportObjectsToExcel(objects, options = {}) {
    try {
      const {
        sheetName = 'Sheet1',
        columns = null,
        filename = `export_${Date.now()}.xlsx`
      } = options;

      if (!objects || objects.length === 0) {
        throw new Error('导出数据不能为空');
      }

      // 创建工作簿
      const workbook = XLSX.utils.book_new();

      // 处理列配置
      let worksheet;
      if (columns) {
        // 使用自定义列配置
        const headers = columns.map(col => col.header || col.key);
        const data = objects.map(obj => 
          columns.map(col => {
            const value = obj[col.key];
            return col.formatter ? col.formatter(value, obj) : value;
          })
        );
        worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      } else {
        // 直接转换对象
        worksheet = XLSX.utils.json_to_sheet(objects);
      }

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 生成Excel文件缓冲区
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      logger.info(`对象数组导出成功: ${filename}`);
      return buffer;
    } catch (error) {
      logger.error('对象数组导出失败:', error);
      throw new Error(`导出失败: ${error.message}`);
    }
  }

  /**
   * 计算列宽
   * @param {Array} data - 数据数组
   * @returns {Array} 列宽配置
   */
  calculateColumnWidths(data) {
    if (!data || data.length === 0) return [];

    const colCount = Math.max(...data.map(row => row.length));
    const colWidths = [];

    for (let col = 0; col < colCount; col++) {
      let maxWidth = 10; // 最小宽度
      
      for (let row = 0; row < data.length; row++) {
        if (data[row][col]) {
          const cellLength = String(data[row][col]).length;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      }
      
      colWidths.push({ width: Math.min(maxWidth + 2, 50) }); // 最大宽度50
    }

    return colWidths;
  }

  /**
   * 验证Excel文件格式
   * @param {String} filename - 文件名
   * @returns {Boolean} 是否为有效的Excel文件
   */
  isValidExcelFile(filename) {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(filename).toLowerCase();
    return validExtensions.includes(ext);
  }
}

// 导出实例
module.exports = new ExcelUtil();