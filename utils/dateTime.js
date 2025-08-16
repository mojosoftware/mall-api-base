const moment = require('moment');

/**
 * 日期时间工具类
 */
class DateTimeUtil {
  constructor() {
    // 设置默认语言为中文
    moment.locale('zh-cn');
  }

  /**
   * 获取当前时间戳
   * @returns {Number} 时间戳(毫秒)
   */
  now() {
    return Date.now();
  }

  /**
   * 获取当前时间戳(秒)
   * @returns {Number} 时间戳(秒)
   */
  nowSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 格式化日期
   * @param {Date|String|Number} date - 日期
   * @param {String} format - 格式 (默认: YYYY-MM-DD HH:mm:ss)
   * @returns {String} 格式化后的日期
   */
  format(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
  }

  /**
   * 解析日期字符串
   * @param {String} dateString - 日期字符串
   * @param {String} format - 格式
   * @returns {Date} 日期对象
   */
  parse(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(dateString, format).toDate();
  }

  /**
   * 添加时间
   * @param {Date|String|Number} date - 日期
   * @param {Number} amount - 数量
   * @param {String} unit - 单位 (years, months, days, hours, minutes, seconds)
   * @returns {Date} 新日期
   */
  add(date, amount, unit) {
    return moment(date).add(amount, unit).toDate();
  }

  /**
   * 减少时间
   * @param {Date|String|Number} date - 日期
   * @param {Number} amount - 数量
   * @param {String} unit - 单位
   * @returns {Date} 新日期
   */
  subtract(date, amount, unit) {
    return moment(date).subtract(amount, unit).toDate();
  }

  /**
   * 计算时间差
   * @param {Date|String|Number} date1 - 日期1
   * @param {Date|String|Number} date2 - 日期2
   * @param {String} unit - 单位 (默认: milliseconds)
   * @returns {Number} 时间差
   */
  diff(date1, date2, unit = 'milliseconds') {
    return moment(date1).diff(moment(date2), unit);
  }

  /**
   * 判断是否为同一天
   * @param {Date|String|Number} date1 - 日期1
   * @param {Date|String|Number} date2 - 日期2
   * @returns {Boolean}
   */
  isSameDay(date1, date2) {
    return moment(date1).isSame(moment(date2), 'day');
  }

  /**
   * 判断是否在指定日期之前
   * @param {Date|String|Number} date1 - 日期1
   * @param {Date|String|Number} date2 - 日期2
   * @returns {Boolean}
   */
  isBefore(date1, date2) {
    return moment(date1).isBefore(moment(date2));
  }

  /**
   * 判断是否在指定日期之后
   * @param {Date|String|Number} date1 - 日期1
   * @param {Date|String|Number} date2 - 日期2
   * @returns {Boolean}
   */
  isAfter(date1, date2) {
    return moment(date1).isAfter(moment(date2));
  }

  /**
   * 判断是否在指定时间范围内
   * @param {Date|String|Number} date - 日期
   * @param {Date|String|Number} start - 开始日期
   * @param {Date|String|Number} end - 结束日期
   * @returns {Boolean}
   */
  isBetween(date, start, end) {
    return moment(date).isBetween(moment(start), moment(end));
  }

  /**
   * 获取一天的开始时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  startOfDay(date = new Date()) {
    return moment(date).startOf('day').toDate();
  }

  /**
   * 获取一天的结束时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  endOfDay(date = new Date()) {
    return moment(date).endOf('day').toDate();
  }

  /**
   * 获取一周的开始时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  startOfWeek(date = new Date()) {
    return moment(date).startOf('week').toDate();
  }

  /**
   * 获取一周的结束时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  endOfWeek(date = new Date()) {
    return moment(date).endOf('week').toDate();
  }

  /**
   * 获取一个月的开始时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  startOfMonth(date = new Date()) {
    return moment(date).startOf('month').toDate();
  }

  /**
   * 获取一个月的结束时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  endOfMonth(date = new Date()) {
    return moment(date).endOf('month').toDate();
  }

  /**
   * 获取相对时间描述
   * @param {Date|String|Number} date - 日期
   * @returns {String} 相对时间 (如: 2小时前)
   */
  fromNow(date) {
    return moment(date).fromNow();
  }

  /**
   * 获取到指定时间的相对时间描述
   * @param {Date|String|Number} date - 日期
   * @returns {String} 相对时间 (如: 2小时后)
   */
  toNow(date) {
    return moment(date).toNow();
  }

  /**
   * 验证日期格式
   * @param {String} dateString - 日期字符串
   * @param {String} format - 格式
   * @returns {Boolean}
   */
  isValid(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(dateString, format, true).isValid();
  }

  /**
   * 获取时区偏移
   * @param {Date|String|Number} date - 日期
   * @returns {Number} 偏移分钟数
   */
  getTimezoneOffset(date = new Date()) {
    return moment(date).utcOffset();
  }

  /**
   * 转换为UTC时间
   * @param {Date|String|Number} date - 日期
   * @returns {Date}
   */
  toUTC(date) {
    return moment(date).utc().toDate();
  }

  /**
   * 从UTC时间转换为本地时间
   * @param {Date|String|Number} date - UTC日期
   * @returns {Date}
   */
  fromUTC(date) {
    return moment.utc(date).local().toDate();
  }

  /**
   * 获取年龄
   * @param {Date|String|Number} birthDate - 出生日期
   * @returns {Number} 年龄
   */
  getAge(birthDate) {
    return moment().diff(moment(birthDate), 'years');
  }

  /**
   * 获取工作日
   * @param {Date|String|Number} start - 开始日期
   * @param {Date|String|Number} end - 结束日期
   * @returns {Number} 工作日天数
   */
  getWorkdays(start, end) {
    const startMoment = moment(start);
    const endMoment = moment(end);
    let workdays = 0;
    
    while (startMoment.isSameOrBefore(endMoment)) {
      if (startMoment.day() !== 0 && startMoment.day() !== 6) {
        workdays++;
      }
      startMoment.add(1, 'day');
    }
    
    return workdays;
  }
}

// 导出实例
module.exports = new DateTimeUtil();