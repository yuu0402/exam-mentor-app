/**
 * 工具函数统一导出
 *
 * 使用 import * as 模式确保 default export 能正确访问所有函数
 */

import * as timeUtils from './time-utils';
import * as storageUtils from './storage-utils';
import * as studyPlan from './study-plan-generator';
import * as diagnosis from './diagnosis-system';
import * as dataExport from './data-export';

// ========== 时间工具 ==========
export const {
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
} = timeUtils;

// ========== 存储工具 ==========
export const {
  saveData,
  loadData,
  removeData,
  getAllKeys,
  clearAllData,
  saveMultipleData,
  loadMultipleData,
  saveStudyLog,
  getStudyLogs,
  saveEntertainmentLog,
  getEntertainmentLogs,
  saveSleepLog,
  getSleepLogs,
  saveTestScore,
  getTestScores,
  saveRewardPunishment,
  getRewardPunishments,
  saveDiagnosisResult,
  getDiagnosisResult,
} = storageUtils;

// ========== 学习计划生成器 ==========
export const {
  generateDailyPlan,
  generateWeeklyPlan,
  generatePhasePlan,
  adjustPlanBasedOnPerformance,
  calculateRewardPunishment,
  calculateSubjectWeights,
  adjustDifficulty,
  getScheduleTemplate,
  calculateEntertainmentTime,
  getCurrentPhaseInfo,
  generateTaskId,
  formatTime,
  scheduleReview,
  getTodayReviews,
  markReviewed,
  getReviewStats,
} = studyPlan;

// ========== 诊断系统 ==========
export const {
  getQuestionBank,
  getQuestionsBySubject,
  selectRandomQuestions,
  generateDiagnosisTest,
  calculateQuestionScore,
  calculateSubjectScore,
  calculateTotalScore,
  getMasteryLevel,
  identifyWeakPoints,
  generateRecommendations,
  generateDiagnosisReport,
} = diagnosis;

// ========== 数据导出 ==========
export const {
  exportStudyReport,
  exportToClipboard,
  generateShareCode,
  verifyShareCode,
  getCurrentShareCode,
  clearShareCode,
} = dataExport;

// ========== 默认导出（按模块分组） ==========
export default {
  time: timeUtils,
  storage: storageUtils,
  studyPlan,
  diagnosis,
  dataExport,
};
