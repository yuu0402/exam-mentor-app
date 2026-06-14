/**
 * 时间工具函数
 *
 * 提供时间相关的工具函数
 */

/**
 * 获取当前时间字符串
 * @returns {string} HH:mm格式的时间
 */
export function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * 获取当前日期字符串
 * @returns {string} YYYY-MM-DD格式的日期
 */
export function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * 获取今天的星期几
 * @returns {number} 0-6（0是周日）
 */
export function getDayOfWeek() {
  return new Date().getDay();
}

/**
 * 判断是否是周末
 * @returns {boolean}
 */
export function isWeekend() {
  const day = getDayOfWeek();
  return day === 0 || day === 6;
}

/**
 * 判断是否是上学日
 * @returns {boolean}
 */
export function isSchoolDay() {
  return !isWeekend();
}

/**
 * 计算两个时间之间的分钟差
 * @param {string} startTime - 开始时间（HH:mm）
 * @param {string} endTime - 结束时间（HH:mm）
 * @returns {number} 分钟数
 */
export function getTimeDifference(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;

  return endTotal - startTotal;
}

/**
 * 将分钟数转换为时间字符串
 * @param {number} minutes - 分钟数
 * @returns {string} HH:mm格式的时间
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 将时间字符串转换为分钟数
 * @param {string} time - HH:mm格式的时间
 * @returns {number} 从0点开始的分钟数
 */
export function timeToMinutes(time) {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

/**
 * 计算距离目标日期的天数
 * @param {string} targetDate - 目标日期（YYYY-MM-DD）
 * @returns {number} 天数（正数表示未来，负数表示过去）
 */
export function getDaysUntil(targetDate) {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// getDaysUntilExam 从 study-plan-generator 重新导出（该版本有 try-catch 错误处理，更健壮）
import { getDaysUntilExam } from './study-plan-generator';
export { getDaysUntilExam };

/**
 * 获取当前学习阶段ID
 * @returns {string} 阶段ID
 */
export function getCurrentPhaseId() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 6月12日-6月30日：八年级收尾
  if (month === 6 && day >= 12) {
    return 'eight_grade_finish';
  }

  // 7月-8月：暑假强化
  if (month === 7 || month === 8) {
    return 'summer_intensive';
  }

  // 9月-1月：九年级上学期
  if (month >= 9 || month <= 1) {
    return 'nine_grade_first';
  }

  // 1月-2月：寒假冲刺
  if (month === 1 || month === 2) {
    return 'winter_sprint';
  }

  // 2月-6月：中考冲刺
  return 'exam_sprint';
}

/**
 * 格式化时长
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化后的时长
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${mins}分钟`;
}

/**
 * 格式化日期
 * @param {string} date - 日期字符串
 * @param {string} format - 格式（'full' | 'short' | 'time'）
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'full') {
  const d = new Date(date);

  switch (format) {
    case 'full':
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

    case 'short':
      return d.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
      });

    case 'time':
      return d.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

    default:
      return d.toISOString();
  }
}

/**
 * 判断是否在指定时间范围内
 * @param {string} startTime - 开始时间（HH:mm）
 * @param {string} endTime - 结束时间（HH:mm）
 * @returns {boolean}
 */
export function isWithinTimeRange(startTime, endTime) {
  const now = getCurrentTime();
  return now >= startTime && now <= endTime;
}

/**
 * 获取下一个时间段
 * @param {Array} schedule - 时间表
 * @returns {Object|null} 下一个时间段
 */
export function getNextTimeSlot(schedule) {
  const now = getCurrentTime();

  for (const slot of schedule) {
    if (slot.startTime > now) {
      return slot;
    }
  }

  return null;
}

export default {
  getCurrentTime,
  getCurrentDate,
  getDayOfWeek,
  isWeekend,
  isSchoolDay,
  getTimeDifference,
  minutesToTime,
  timeToMinutes,
  getDaysUntil,
  getDaysUntilExam,
  getCurrentPhaseId,
  formatDuration,
  formatDate,
  isWithinTimeRange,
  getNextTimeSlot,
};
