/**
 * 中考智学后端 API 客户端
 * 对接 v2 FastAPI 后端（172个端点）
 *
 * @module backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ======================== 配置 ========================
const API_BASE = 'https://handles-scores-try-his.trycloudflare.com';
const TOKEN_KEY = '@backend_token';
const USER_KEY = '@backend_user';

// ======================== 工具函数 ========================
async function request(method, path, body = null, headers = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  };

  const config = { method, headers: defaultHeaders };
  if (body !== null) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.error || `请求失败: ${res.status}`);
  }
  return data;
}

// ======================== 认证模块 ========================

/**
 * 用户注册
 * @param {{ username: string, password: string, display_name?: string, role?: string }} userData
 * @returns {{ access_token: string, user: object }}
 */
export async function register(userData) {
  const result = await request('POST', '/api/auth/register', {
    username: userData.username,
    password: userData.password,
    display_name: userData.displayName || userData.username,
    role: userData.role || 'student',
    parent_id: userData.parentId || null,
  });
  await AsyncStorage.setItem(TOKEN_KEY, result.access_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

/**
 * 用户登录
 * @param {{ username: string, password: string }} credentials
 * @returns {{ access_token: string, user: object }}
 */
export async function login(credentials) {
  const result = await request('POST', '/api/auth/login', {
    username: credentials.username,
    password: credentials.password,
  });
  await AsyncStorage.setItem(TOKEN_KEY, result.access_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

/**
 * 获取当前用户信息
 * @returns {object} UserResp
 */
export async function getMe() {
  return request('GET', '/api/auth/me');
}

/**
 * 更新个人信息
 * @param {{ display_name?: string, parent_id?: number }} profileData
 * @returns {object} UserResp
 */
export async function updateProfile(profileData) {
  return request('PUT', '/api/auth/profile', {
    display_name: profileData.displayName,
    parent_id: profileData.parentId,
  });
}

/**
 * 登出
 */
export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export async function isLoggedIn() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return !!token;
}

/**
 * 获取缓存的用户信息
 * @returns {object|null}
 */
export async function getCachedUser() {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

// ======================== 诊断模块 ========================

/**
 * 开始诊断测试
 * @param {string} subject - 科目或"全科"
 * @returns {{ session_id: string, subject: string, total_questions: number }}
 */
export async function startDiagnosis(subject = '全科') {
  return request('POST', `/api/diagnostic/start?subject=${encodeURIComponent(subject)}`);
}

/**
 * 获取诊断题目
 * @param {string} sessionId
 * @returns {{ session_id: string, status: string, questions: array }}
 */
export async function getDiagnosisQuestions(sessionId) {
  return request('GET', `/api/diagnostic/questions/${sessionId}`);
}

/**
 * 提交诊断答案
 * @param {string} sessionId
 * @param {object} answers - {question_id: selected_answer, ...}
 * @returns {{ session_id, total_score, subject_scores, weakness_ranking, ... }}
 */
export async function submitDiagnosis(sessionId, answers) {
  return request('POST', `/api/diagnostic/submit/${sessionId}`, { answers });
}

/**
 * 获取诊断结果
 * @param {string} sessionId
 * @returns {object} 诊断结果详情
 */
export async function getDiagnosisResult(sessionId) {
  return request('GET', `/api/diagnostic/result/${sessionId}`);
}

/**
 * 获取最新诊断记录
 * @returns {object}
 */
export async function getLatestDiagnosis() {
  return request('GET', '/api/diagnostics/latest');
}

/**
 * 获取诊断历史
 * @returns {array}
 */
export async function getDiagnosisHistory() {
  return request('GET', '/api/diagnostics');
}

// ======================== V2 诊断模块（BKT自适应） ========================

/**
 * 开始 V2 诊断会话
 * @returns {{ session_id: string, first_question: object }}
 */
export async function startDiagnosisV2(subject = '全科') {
  return request('POST', '/api/v2/diagnostic/start', { subject });
}

/**
 * 提交 V2 诊断答案
 * @param {{ session_id: string, question_id: number, answer: string }} data
 * @returns {{ next_question: object|null, is_complete: boolean }}
 */
export async function submitDiagnosisV2Answer(data) {
  return request('POST', '/api/v2/diagnostic/answer', data);
}

/**
 * 获取 V2 掌握度报告
 * @param {number} userId
 * @returns {object}
 */
export async function getDiagnosisReportV2(userId) {
  return request('GET', `/api/v2/diagnostic/report/${userId}`);
}

// ======================== 每日任务模块 ========================

/**
 * 获取今日任务清单
 * @returns {{ date: string, tasks: array, total, completed, progress }}
 */
export async function getTodayTasks() {
  return request('GET', '/api/daily-task/today');
}

/**
 * 开始任务
 * @param {number} taskId
 * @returns {{ message: string, task_id: number, started_at: string }}
 */
export async function startTask(taskId) {
  return request('POST', `/api/daily-task/${taskId}/start`);
}

/**
 * 完成任务
 * @param {number} taskId
 * @returns {{ message: string, task_id: number, duration_minutes: number, xp_earned: number }}
 */
export async function completeTask(taskId) {
  return request('POST', `/api/daily-task/${taskId}/complete`);
}

/**
 * 获取任务完成统计
 * @returns {{ today_total, today_completed, today_pending, weekly_completed, streak_days }}
 */
export async function getTaskStats() {
  return request('GET', '/api/daily-task/stats');
}

// ======================== 动态计划模块 ========================

/**
 * 获取今日动态任务
 * @returns {object}
 */
export async function getTodayDynamicPlan() {
  return request('GET', '/api/v2/dynamic-plan/today');
}

/**
 * 生成动态学习计划
 * @param {{ weak_points?: array, target_minutes?: number }} options
 * @returns {object}
 */
export async function generateDynamicPlan(options = {}) {
  return request('POST', '/api/v2/dynamic-plan/generate', options);
}

/**
 * 开始番茄钟
 * @param {{ task_id?: number }} data
 * @returns {object}
 */
export async function startPomodoro(data = {}) {
  return request('POST', '/api/v2/dynamic-plan/pomodoro/start', data);
}

/**
 * 完成番茄钟
 * @param {{ task_id?: number, duration?: number }} data
 * @returns {object}
 */
export async function completePomodoro(data = {}) {
  return request('POST', '/api/v2/dynamic-plan/pomodoro/complete', data);
}

/**
 * 获取本周学习统计
 * @returns {object}
 */
export async function getWeeklyStats() {
  return request('GET', '/api/v2/dynamic-plan/weekly-stats');
}

/**
 * 获取中考倒计时
 * @returns {{ days_remaining: number, exam_date: string }}
 */
export async function getCountdown() {
  return request('GET', '/api/v2/dynamic-plan/countdown');
}

// ======================== 错题本模块 ========================

/**
 * 获取错题列表
 * @param {{ subject?: string, page?: number, page_size?: number }} filters
 * @returns {{ items: array, total: number }}
 */
export async function getWrongQuestions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.page) params.append('page', filters.page);
  if (filters.pageSize) params.append('page_size', filters.pageSize);
  const query = params.toString();
  return request('GET', `/api/wrong-questions${query ? `?${query}` : ''}`);
}

/**
 * 获取今日待复习错题
 * @returns {{ items: array, total: number }}
 */
export async function getTodayReviewQueue() {
  return request('GET', '/api/wrong-questions/due');
}

/**
 * 记录错题复习结果
 * @param {number} wqId - 错题ID
 * @param {{ is_correct: boolean, answer?: string }} result
 * @returns {object}
 */
export async function reviewWrongQuestion(wqId, result) {
  return request('POST', `/api/wrong-questions/${wqId}/review`, result);
}

/**
 * 获取错题统计
 * @returns {{ total: number, mastered: number, due_today: number }}
 */
export async function getWrongQuestionStats() {
  return request('GET', '/api/wrong-questions/stats');
}

/**
 * 智能重练队列
 * @returns {array}
 */
export async function getReviewQueue() {
  return request('GET', '/api/wrong-questions/review');
}

// ======================== 游戏化模块 ========================

/**
 * 每日签到
 * @returns {{ checkin_date: string, xp_earned: number, streak_days: number }}
 */
export async function checkIn() {
  return request('POST', '/api/game/checkin');
}

/**
 * 获取游戏状态
 * @returns {{ xp: number, level: number, streak_days: number }}
 */
export async function getGameState() {
  return request('GET', '/api/game/state');
}

/**
 * 获取签到记录
 * @param {number} days
 * @returns {array}
 */
export async function getCheckinRecords(days = 30) {
  return request('GET', `/api/game/checkin/records?days=${days}`);
}

/**
 * 获取签到统计
 * @returns {{ total_days: number, current_streak: number }}
 */
export async function getCheckinStats() {
  return request('GET', '/api/game/checkin/stats');
}

/**
 * 获取排行榜
 * @param {number} limit
 * @returns {array}
 */
export async function getLeaderboard(limit = 20) {
  return request('GET', `/api/game/leaderboard?limit=${limit}`);
}

// ======================== 学习日志模块 ========================

/**
 * 记录学习日志
 * @param {{ subject: string, duration_minutes: number, questions_done?: number, correct_count?: number }} logData
 * @returns {object}
 */
export async function recordLearningLog(logData) {
  return request('POST', '/api/logs', logData);
}

/**
 * 获取学习统计
 * @returns {{ today_minutes: number, week_minutes: number, total_questions: number }}
 */
export async function getLearningStats() {
  return request('GET', '/api/logs/stats');
}

/**
 * 获取学习周报
 * @param {string} startDate - YYYY-MM-DD
 * @returns {object}
 */
export async function getWeeklyReport(startDate) {
  return request('GET', `/api/logs/report/weekly?start_date=${startDate}`);
}

/**
 * 获取学习时长汇总
 * @param {{ start_date?: string, end_date?: string }} filters
 * @returns {array}
 */
export async function getLearningDuration(filters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  const query = params.toString();
  return request('GET', `/api/logs/duration${query ? `?${query}` : ''}`);
}

// ======================== 家长端模块 ========================

/**
 * 生成家长绑定码
 * @returns {{ binding_code: string, expires_at: string }}
 */
export async function generateBindingCode() {
  return request('POST', '/api/parents/binding-code');
}

/**
 * 学生绑定家长
 * @param {{ binding_code: string }} data
 * @returns {{ message: string }}
 */
export async function bindParent(data) {
  return request('POST', '/api/parents/bind', data);
}

/**
 * 获取孩子列表（家长端）
 * @returns {array}
 */
export async function getChildren() {
  return request('GET', '/api/parents/children');
}

/**
 * 获取孩子学习报告（家长端）
 * @param {number} childId
 * @returns {object}
 */
export async function getChildReport(childId) {
  return request('GET', `/api/parents/children/${childId}/report`);
}

// ======================== 健康检查 ========================

/**
 * 健康检查
 * @returns {{ status: string, version: string }}
 */
export async function healthCheck() {
  return request('GET', '/api/health');
}

// ======================== 默认导出 ========================
export default {
  // 认证
  register, login, logout, getMe, updateProfile, isLoggedIn, getCachedUser,
  // 诊断
  startDiagnosis, getDiagnosisQuestions, submitDiagnosis, getDiagnosisResult,
  getLatestDiagnosis, getDiagnosisHistory,
  startDiagnosisV2, submitDiagnosisV2Answer, getDiagnosisReportV2,
  // 每日任务
  getTodayTasks, startTask, completeTask, getTaskStats,
  // 动态计划
  getTodayDynamicPlan, generateDynamicPlan, startPomodoro, completePomodoro,
  getWeeklyStats, getCountdown,
  // 错题本
  getWrongQuestions, getTodayReviewQueue, reviewWrongQuestion,
  getWrongQuestionStats, getReviewQueue,
  // 游戏化
  checkIn, getGameState, getCheckinRecords, getCheckinStats, getLeaderboard,
  // 学习日志
  recordLearningLog, getLearningStats, getWeeklyReport, getLearningDuration,
  // 家长端
  generateBindingCode, bindParent, getChildren, getChildReport,
  // 系统
  healthCheck,
};