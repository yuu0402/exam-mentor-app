/**
 * 数据导出模块
 *
 * 功能：
 * - 从 AsyncStorage 读取所有学习数据，生成结构化JSON报告
 * - 支持复制到剪贴板（学生App端发送给家长）
 * - 生成6位分享码，家长在Web看板输入后查看实时数据
 * - 数据格式与 web/index.html（家长看板）读取格式一致
 *
 * @module DataExport
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clipboard } from 'react-native';
import { STORAGE_KEYS, getSubjectDisplayName } from '../config';

// ========== 分享码存储键 ==========
const SHARE_CODE_KEY = '@share_code';
const SHARE_DATA_KEY = '@share_data';

// ========== 常量 ==========

/** 分享码有效期（毫秒）- 默认24小时 */
const SHARE_CODE_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** 家长看板数据格式版本号 */
const DATA_FORMAT_VERSION = '1.0.0';

// ========== 内部辅助函数 ==========

/**
 * 安全读取 AsyncStorage 数据
 * @param {string} key
 * @returns {Promise<*>} 解析后的数据，失败返回 null
 */
async function safeRead(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`[data-export] 读取 ${key} 失败:`, error);
    return null;
  }
}

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

/**
 * 聚合每日学习时长（从 STUDY_LOGS）
 */
function aggregateStudyTime(logs) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { totalMinutes: 0, dailyBreakdown: {}, bySubject: {}, recentAvg: 0 };
  }

  const daily = {};
  const bySubject = {};
  let totalMinutes = 0;

  logs.forEach((log) => {
    const date = (log.date || log.timestamp || '').split('T')[0];
    const minutes = typeof log.minutes === 'number' ? log.minutes : 0;
    const subject = log.subject || 'unknown';

    if (!date) return;

    daily[date] = (daily[date] || 0) + minutes;
    bySubject[subject] = (bySubject[subject] || 0) + minutes;
    totalMinutes += minutes;
  });

  // 近7天日均
  const sortedDates = Object.keys(daily).sort();
  const recentDates = sortedDates.slice(-7);
  const recentTotal = recentDates.reduce((sum, d) => sum + daily[d], 0);
  const recentAvg = recentDates.length > 0
    ? Math.round(recentTotal / recentDates.length)
    : 0;

  return { totalMinutes, dailyBreakdown: daily, bySubject, recentAvg };
}

/**
 * 计算正确率（从 TEST_SCORES 或诊断结果）
 */
function computeAccuracy(testScores, diagnosisResult) {
  const result = { overall: 0, bySubject: {}, trends: [], recentAvg: 0 };

  // 从测试成绩计算各科正确率
  if (Array.isArray(testScores) && testScores.length > 0) {
    const subjectScores = {};

    testScores.forEach((score) => {
      const subject = score.subject || 'unknown';
      const percentage = typeof score.percentage === 'number'
        ? score.percentage
        : (score.score && score.total ? Math.round((score.score / score.total) * 100) : 0);

      if (!subjectScores[subject]) {
        subjectScores[subject] = { scores: [], total: 0, count: 0 };
      }
      subjectScores[subject].scores.push(percentage);
      subjectScores[subject].total += percentage;
      subjectScores[subject].count += 1;
    });

    Object.keys(subjectScores).forEach((subj) => {
      const data = subjectScores[subj];
      result.bySubject[subj] = Math.round(data.total / data.count);
    });

    // 整体正确率
    const allPercentages = testScores.map((s) => {
      if (typeof s.percentage === 'number') return s.percentage;
      return s.score && s.total ? Math.round((s.score / s.total) * 100) : 0;
    });
    result.overall = Math.round(
      allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length
    );

    // 近7次成绩趋势
    const sorted = [...testScores]
      .sort((a, b) => new Date(a.timestamp || a.date || 0) - new Date(b.timestamp || b.date || 0));
    const recent = sorted.slice(-7);
    result.trends = recent.map((s) => ({
      date: (s.timestamp || s.date || '').split('T')[0],
      subject: s.subject,
      name: s.name || '',
      percentage: typeof s.percentage === 'number'
        ? s.percentage
        : (s.score && s.total ? Math.round((s.score / s.total) * 100) : 0),
    }));
    result.recentAvg = recent.length > 0
      ? Math.round(recent.reduce((sum, s) => sum + (result.trends.find(t => t.date === (s.timestamp || s.date || '').split('T')[0])?.percentage || 0), 0) / recent.length)
      : 0;
  }

  // 补充诊断结果中的数据
  if (diagnosisResult && diagnosisResult.subjectScores) {
    diagnosisResult.subjectScores.forEach((ss) => {
      if (!result.bySubject[ss.subject]) {
        result.bySubject[ss.subject] = ss.percentage || 0;
      }
      // 如果诊断数据的百分比比测试成绩更新，以诊断为准
      if (diagnosisResult.date && (!result.trends.length ||
          new Date(diagnosisResult.date) > new Date(result.trends[result.trends.length - 1]?.date || 0))) {
        // 诊断是最新数据，更新对应科目
        result.bySubject[ss.subject] = ss.percentage || result.bySubject[ss.subject];
      }
    });
  }

  return result;
}

/**
 * 提取薄弱点（从诊断结果 + 错题本）
 */
function extractWeakPoints(diagnosisResult, wrongAnswers) {
  const weakPoints = [];

  // 从诊断结果提取
  if (diagnosisResult && Array.isArray(diagnosisResult.weakPoints)) {
    diagnosisResult.weakPoints.forEach((wp) => {
      weakPoints.push({
        subject: wp.subject || '',
        subjectName: wp.subjectName || wp.name || wp.subject || '',
        knowledgePoint: wp.knowledgePoint || wp.name || '',
        chapter: wp.chapter || '',
        priority: wp.priority || 'medium',
        difficulty: wp.difficulty || 'medium',
        source: 'diagnosis',
      });
    });
  }

  // 从错题本补充（按知识点聚合高频错题）
  if (Array.isArray(wrongAnswers) && wrongAnswers.length > 0) {
    const kpMap = {};
    wrongAnswers.forEach((wa) => {
      const kp = wa.knowledgePoint || wa.topic || wa.name || '';
      const subject = wa.subject || '';
      if (!kp) return;
      const key = `${subject}::${kp}`;
      if (!kpMap[key]) {
        kpMap[key] = { subject, knowledgePoint: kp, count: 0, wrongCount: 0 };
      }
      kpMap[key].count += 1;
      if (wa.isCorrect === false || wa.remembered === false || (wa.reviewState && wa.reviewState.consecutiveRemembered < 3)) {
        kpMap[key].wrongCount += 1;
      }
    });

    Object.values(kpMap)
      .filter((v) => v.wrongCount >= 2) // 错2次以上才算薄弱点
      .forEach((v) => {
        // 避免与诊断结果重复
        const exists = weakPoints.find((wp) =>
          wp.subject === v.subject && wp.knowledgePoint === v.knowledgePoint
        );
        if (!exists) {
          weakPoints.push({
            subject: v.subject,
            subjectName: v.subject,
            knowledgePoint: v.knowledgePoint,
            chapter: '',
            priority: v.wrongCount >= 4 ? 'high' : v.wrongCount >= 2 ? 'medium' : 'low',
            difficulty: 'medium',
            errorCount: v.wrongCount,
            source: 'wrong_questions',
          });
        }
      });
  }

  return weakPoints;
}

/**
 * 处理近期成绩（最近10条测试记录）
 */
function recentScores(testScores) {
  if (!Array.isArray(testScores) || testScores.length === 0) return [];

  return [...testScores]
    .sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0))
    .slice(0, 10)
    .map((s) => ({
      date: (s.timestamp || s.date || '').split('T')[0],
      subject: s.subject || '',
      name: s.name || s.title || '',
      score: s.score ?? null,
      total: s.total ?? null,
      percentage: typeof s.percentage === 'number'
        ? s.percentage
        : (s.score && s.total ? Math.round((s.score / s.total) * 100) : null),
      level: s.level || s.grade || '',
    }));
}

/**
 * 计算艾宾浩斯复习进度（从错题本 reviewState）
 */
function ebbinghausProgress(wrongAnswers) {
  if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
    return {
      totalItems: 0,
      reviewedToday: 0,
      dueToday: 0,
      overdue: 0,
      completedAll: 0,
      averageInterval: 0,
      retentionRate: 0,
      stages: {
        stage1_day1: 0,    // 第1天复习
        stage2_day2: 0,    // 第2天
        stage3_day4: 0,    // 第4天
        stage4_day7: 0,    // 第7天
        stage5_day15: 0,   // 第15天
        stage6_day30: 0,   // 第30天
        completed: 0,       // 已完成全部复习
      },
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  let reviewedToday = 0;
  let dueToday = 0;
  let overdue = 0;
  let completedAll = 0;
  let totalRemembered = 0;
  let totalReviews = 0;
  let totalInterval = 0;
  let intervalCount = 0;

  const stages = {
    stage1_day1: 0,
    stage2_day2: 0,
    stage3_day4: 0,
    stage4_day7: 0,
    stage5_day15: 0,
    stage6_day30: 0,
    completed: 0,
  };

  wrongAnswers.forEach((wa) => {
    const rs = wa.reviewState;
    if (!rs) return;

    totalReviews += 1;

    // 统计各阶段
    const interval = rs.currentInterval || 0;
    if (interval <= 1) stages.stage1_day1 += 1;
    else if (interval <= 2) stages.stage2_day2 += 1;
    else if (interval <= 4) stages.stage3_day4 += 1;
    else if (interval <= 7) stages.stage4_day7 += 1;
    else if (interval <= 15) stages.stage5_day15 += 1;
    else if (interval <= 30) stages.stage6_day30 += 1;

    if (rs.completedAll) {
      stages.completed += 1;
      completedAll += 1;
    }

    // 今日已复习
    if (rs.lastReviewed) {
      const reviewedDate = rs.lastReviewed.split('T')[0];
      if (reviewedDate === today) {
        reviewedToday += 1;
      }
    }

    // 今日待复习
    if (rs.nextReviewDate) {
      const nextDate = rs.nextReviewDate.split('T')[0];
      if (nextDate === today) {
        dueToday += 1;
      } else if (nextDate < today && !rs.completedAll) {
        overdue += 1;
      }
    }

    // 记忆保留率
    if (Array.isArray(rs.reviewHistory)) {
      rs.reviewHistory.forEach((h) => {
        if (h.remembered) totalRemembered += 1;
      });
    }

    if (rs.currentInterval > 0) {
      totalInterval += rs.currentInterval;
      intervalCount += 1;
    }
  });

  const totalHistory = wrongAnswers.reduce(
    (sum, wa) => sum + (wa.reviewState?.reviewHistory?.length || 0),
    0
  );
  const retentionRate = totalHistory > 0
    ? Math.round((totalRemembered / totalHistory) * 100)
    : 0;

  return {
    totalItems: wrongAnswers.length,
    reviewedToday,
    dueToday,
    overdue,
    completedAll,
    averageInterval: intervalCount > 0 ? Math.round(totalInterval / intervalCount) : 0,
    retentionRate,
    stages,
  };
}

// ========== 公开 API ==========

/**
 * 导出完整学习报告
 *
 * 从 AsyncStorage 读取所有学习数据，生成结构化 JSON 报告。
 * 报告包含：学习时长、正确率、薄弱点、近期成绩、艾宾浩斯复习进度。
 *
 * 数据格式与 web/index.html（家长看板）读取格式完全一致。
 *
 * @returns {Promise<Object>} 学习报告对象
 *
 * @example
 * const report = await exportStudyReport();
 * console.log(report.studyTime.totalMinutes); // 总学习时长（分钟）
 */
export async function exportStudyReport() {
  try {
    // 并行读取所有存储数据
    const [
      studentInfo,
      studyLogs,
      diagnosisResult,
      testScores,
      wrongAnswers,
      entertainmentLogs,
      sleepLogs,
      rewardPunishmentLogs,
      checkinData,
      studyPlan,
    ] = await Promise.all([
      safeRead(STORAGE_KEYS.STUDENT_INFO),
      safeRead(STORAGE_KEYS.STUDY_LOGS),
      safeRead(STORAGE_KEYS.DIAGNOSIS_RESULT),
      safeRead(STORAGE_KEYS.TEST_SCORES),
      safeRead('@wrong_answers'),
      safeRead(STORAGE_KEYS.ENTERTAINMENT_LOGS),
      safeRead(STORAGE_KEYS.SLEEP_LOGS),
      safeRead(STORAGE_KEYS.REWARD_PUNISHMENT),
      safeRead('@checkin'),
      safeRead(STORAGE_KEYS.STUDY_PLAN),
    ]);

    // ---- 1. 学习时长 ----
    const studyTime = aggregateStudyTime(studyLogs);

    // ---- 2. 正确率 ----
    const accuracy = computeAccuracy(testScores, diagnosisResult);

    // ---- 3. 薄弱点 ----
    const weakPoints = extractWeakPoints(diagnosisResult, wrongAnswers);

    // ---- 4. 近期成绩 ----
    const recentScoresList = recentScores(testScores);

    // ---- 5. 艾宾浩斯复习进度 ----
    const ebbinghaus = ebbinghausProgress(wrongAnswers);

    // ---- 6. 打卡统计 ----
    const checkin = checkinData || {};
    const checkinStats = {
      totalDays: checkin.total || checkin.totalCheckIns || 0,
      currentStreak: checkin.streak || 0,
      lastCheckInDate: checkin.date || null,
    };

    // ---- 7. 作息统计 ----
    const sleepStats = Array.isArray(sleepLogs) && sleepLogs.length > 0
      ? {
          totalLogs: sleepLogs.length,
          averageBedtime: computeAverageTime(sleepLogs, 'bedtime'),
          averageWakeUp: computeAverageTime(sleepLogs, 'wakeUp'),
          recentLogs: sleepLogs.slice(-7).map((l) => ({
            date: (l.date || l.timestamp || '').split('T')[0],
            bedtime: l.bedtime || '',
            wakeUp: l.wakeUp || '',
            quality: l.quality || l.sleepQuality || null,
          })),
        }
      : { totalLogs: 0, averageBedtime: null, averageWakeUp: null, recentLogs: [] };

    // ---- 8. 娱乐时间统计 ----
    const entertainmentStats = Array.isArray(entertainmentLogs) && entertainmentLogs.length > 0
      ? {
          totalLogs: entertainmentLogs.length,
          totalMinutes: entertainmentLogs.reduce((sum, l) => sum + (l.minutes || 0), 0),
          recentLogs: entertainmentLogs.slice(-7).map((l) => ({
            date: (l.date || l.timestamp || '').split('T')[0],
            minutes: l.minutes || 0,
            type: l.type || '',
          })),
        }
      : { totalLogs: 0, totalMinutes: 0, recentLogs: [] };

    // ---- 9. 学习阶段信息 ----
    const currentPhase = diagnosisResult
      ? {
          phaseId: diagnosisResult.phaseId || '',
          phaseName: diagnosisResult.phaseName || '',
          daysUntilExam: diagnosisResult.daysUntilExam || null,
        }
      : { phaseId: '', phaseName: '', daysUntilExam: null };

    // ---- 组装完整报告 ----
    const report = {
      // 元数据
      meta: {
        formatVersion: DATA_FORMAT_VERSION,
        generatedAt: new Date().toISOString(),
        studentName: studentInfo?.name || '',
        studentGrade: studentInfo?.grade || '',
        studentSchool: studentInfo?.school || '',
      },

      // 1. 学习时长
      studyTime: {
        totalMinutes: studyTime.totalMinutes,
        totalHours: +(studyTime.totalMinutes / 60).toFixed(1),
        dailyBreakdown: studyTime.dailyBreakdown,
        bySubject: studyTime.bySubject,
        recentAvgMinutes: studyTime.recentAvg,
      },

      // 2. 正确率
      accuracy: {
        overall: accuracy.overall,
        bySubject: accuracy.bySubject,
        recentAvg: accuracy.recentAvg,
        trends: accuracy.trends,
      },

      // 3. 薄弱点
      weakPoints,

      // 4. 近期成绩
      recentScores: recentScoresList,

      // 5. 艾宾浩斯复习进度
      ebbinghaus,

      // 6. 打卡统计
      checkin: checkinStats,

      // 7. 作息统计
      sleep: sleepStats,

      // 8. 娱乐时间
      entertainment: entertainmentStats,

      // 9. 学习阶段
      currentPhase,

      // 10. 奖惩记录摘要
      rewardPunishment: Array.isArray(rewardPunishmentLogs)
        ? {
            totalRecords: rewardPunishmentLogs.length,
            recentRecords: rewardPunishmentLogs.slice(-10).map((r) => ({
              date: (r.date || r.timestamp || '').split('T')[0],
              type: r.type || '',
              name: r.name || r.description || '',
              time: r.time ?? r.amount ?? 0,
              effect: r.effect || '',
            })),
          }
        : { totalRecords: 0, recentRecords: [] },
    };

    return report;
  } catch (error) {
    console.error('[data-export] 生成学习报告失败:', error);
    return {
      meta: {
        formatVersion: DATA_FORMAT_VERSION,
        generatedAt: new Date().toISOString(),
        studentName: '',
        studentGrade: '',
        studentSchool: '',
      },
      error: error.message || '生成报告失败',
    };
  }
}

/**
 * 将学习报告复制到剪贴板
 *
 * 学生可以在App内一键复制报告，然后通过微信/QQ发送给家长。
 * 报告以格式化的文本形式呈现，方便家长直接阅读。
 *
 * @param {Object} [report] - 可选，传入已有的报告对象；不传则自动生成
 * @returns {Promise<{success: boolean, text: string, error?: string}>}
 *
 * @example
 * const result = await exportToClipboard();
 * if (result.success) {
 *   Alert.alert('成功', '学习报告已复制到剪贴板，可以发送给家长了！');
 * }
 */
export async function exportToClipboard(report = null) {
  try {
    const data = report || (await exportStudyReport());

    if (data.error) {
      return { success: false, text: '', error: data.error };
    }

    const text = formatReportAsText(data);
    await Clipboard.setString(text);

    return { success: true, text };
  } catch (error) {
    console.error('[data-export] 复制到剪贴板失败:', error);
    return { success: false, text: '', error: error.message || '复制失败' };
  }
}

/**
 * 生成6位分享码
 *
 * 将当前学习报告保存到本地（@share_data），生成6位数字分享码。
 * 家长在 Web 看板（web/index.html）输入分享码后，可以通过
 * 该模块导出的数据查看学生实时学习情况。
 *
 * 分享码有效期为24小时，过期后需要重新生成。
 *
 * @returns {Promise<{success: boolean, shareCode: string, expiresAt: string, error?: string}>}
 *
 * @example
 * const result = await generateShareCode();
 * if (result.success) {
 *   Alert.alert('分享码', `您的分享码是：${result.shareCode}\n有效期至：${result.expiresAt}`);
 * }
 */
export async function generateShareCode() {
  try {
    // 生成报告
    const report = await exportStudyReport();
    if (report.error) {
      return { success: false, shareCode: '', expiresAt: '', error: report.error };
    }

    // 生成6位数字分享码
    const code = generateRandomCode(6);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SHARE_CODE_EXPIRY_MS);

    // 保存分享数据（报告 + 分享码 + 过期时间）
    const shareData = {
      shareCode: code,
      report,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await AsyncStorage.setItem(SHARE_DATA_KEY, JSON.stringify(shareData));

    // 保存分享码（用于快速查找）
    const codeInfo = {
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await AsyncStorage.setItem(SHARE_CODE_KEY, JSON.stringify(codeInfo));

    return {
      success: true,
      shareCode: code,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('[data-export] 生成分享码失败:', error);
    return { success: false, shareCode: '', expiresAt: '', error: error.message || '生成分享码失败' };
  }
}

/**
 * 验证分享码是否有效
 *
 * 检查本地存储的分享码是否匹配且未过期。
 * 此函数供 web/index.html（家长看板）调用时使用，
 * 在实际部署中应通过后端API验证（此实现为本地演示版本）。
 *
 * @param {string} code - 家长输入的6位分享码
 * @returns {Promise<{valid: boolean, report?: Object, error?: string}>}
 */
export async function verifyShareCode(code) {
  try {
    const raw = await AsyncStorage.getItem(SHARE_DATA_KEY);
    if (!raw) {
      return { valid: false, error: '未找到分享数据，请先生成分享码' };
    }

    const shareData = JSON.parse(raw);

    // 检查分享码是否匹配
    if (shareData.shareCode !== code) {
      return { valid: false, error: '分享码不正确' };
    }

    // 检查是否过期
    const now = new Date();
    const expiresAt = new Date(shareData.expiresAt);
    if (now > expiresAt) {
      return { valid: false, error: '分享码已过期，请重新生成' };
    }

    return { valid: true, report: shareData.report };
  } catch (error) {
    console.error('[data-export] 验证分享码失败:', error);
    return { valid: false, error: error.message || '验证失败' };
  }
}

/**
 * 获取当前有效的分享码信息
 *
 * @returns {Promise<{shareCode: string|null, expiresAt: string|null, isValid: boolean}>}
 */
export async function getCurrentShareCode() {
  try {
    const raw = await AsyncStorage.getItem(SHARE_CODE_KEY);
    if (!raw) {
      return { shareCode: null, expiresAt: null, isValid: false };
    }

    const info = JSON.parse(raw);
    const now = new Date();
    const expiresAt = new Date(info.expiresAt);
    const isValid = now <= expiresAt;

    return {
      shareCode: info.code,
      expiresAt: info.expiresAt,
      isValid,
    };
  } catch (error) {
    console.error('[data-export] 获取分享码失败:', error);
    return { shareCode: null, expiresAt: null, isValid: false };
  }
}

/**
 * 清除分享码和分享数据
 *
 * @returns {Promise<boolean>}
 */
export async function clearShareCode() {
  try {
    await AsyncStorage.removeItem(SHARE_CODE_KEY);
    await AsyncStorage.removeItem(SHARE_DATA_KEY);
    return true;
  } catch (error) {
    console.error('[data-export] 清除分享码失败:', error);
    return false;
  }
}

// ========== 报告格式化（纯文本） ==========

/**
 * 将报告格式化为易读的纯文本
 * 用于复制到剪贴板后发送给家长
 */
function formatReportAsText(report) {
  const m = report.meta || {};
  const st = report.studyTime || {};
  const ac = report.accuracy || {};
  const wp = report.weakPoints || [];
  const eb = report.ebbinghaus || {};
  const ci = report.checkin || {};
  const rs = report.recentScores || [];

  const lines = [];

  lines.push('═══════════════════════════════');
  lines.push('       📚 私人导师 · 学习报告');
  lines.push('═══════════════════════════════');
  lines.push('');
  lines.push(`学生：${m.studentName || '未设置'}`);
  lines.push(`年级：${m.studentGrade || '未设置'}`);
  lines.push(`生成时间：${(m.generatedAt || '').replace('T', ' ').substring(0, 19)}`);
  lines.push('');

  // 打卡
  lines.push('── 打卡统计 ──');
  lines.push(`累计打卡：${ci.totalDays || 0} 天`);
  lines.push(`连续打卡：${ci.currentStreak || 0} 天`);
  lines.push('');

  // 学习时长
  lines.push('── 学习时长 ──');
  lines.push(`总学习时长：${st.totalHours || 0} 小时（${st.totalMinutes || 0} 分钟）`);
  lines.push(`近7天日均：${st.recentAvgMinutes || 0} 分钟`);
  if (st.bySubject) {
    const topSubjects = Object.entries(st.bySubject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    lines.push('各科时长：');
    topSubjects.forEach(([subj, mins]) => {
      lines.push(`  ${subj}: ${Math.round(mins / 60 * 10) / 10} 小时`);
    });
  }
  lines.push('');

  // 正确率
  lines.push('── 正确率 ──');
  lines.push(`综合正确率：${ac.overall || 0}%`);
  if (ac.bySubject) {
    Object.entries(ac.bySubject).forEach(([subj, pct]) => {
      const emoji = pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';
      lines.push(`  ${emoji} ${subj}: ${pct}%`);
    });
  }
  lines.push('');

  // 近期成绩
  if (rs.length > 0) {
    lines.push('── 近期成绩 ──');
    rs.slice(0, 5).forEach((s) => {
      const pctStr = s.percentage != null ? `${s.percentage}%` : (s.score != null ? `${s.score}/${s.total}` : '--');
      lines.push(`  ${s.date} | ${s.subject} | ${s.name || '-'} | ${pctStr}`);
    });
    lines.push('');
  }

  // 薄弱点
  if (wp.length > 0) {
    lines.push('── 薄弱知识点 ──');
    wp.slice(0, 10).forEach((w) => {
      const flag = w.priority === 'high' ? '🔴' : w.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${flag} [${w.subjectName || getSubjectDisplayName(w.subject)}] ${w.knowledgePoint}${w.chapter ? `（${w.chapter}）` : ''}`);
    });
    lines.push('');
  }

  // 艾宾浩斯复习
  lines.push('── 艾宾浩斯复习进度 ──');
  lines.push(`错题总数：${eb.totalItems || 0}`);
  lines.push(`今日待复习：${eb.dueToday || 0}`);
  lines.push(`今日已复习：${eb.reviewedToday || 0}`);
  lines.push(`已逾期：${eb.overdue || 0}`);
  lines.push(`记忆保留率：${eb.retentionRate || 0}%`);
  lines.push(`已完成全部复习：${eb.completedAll || 0}`);
  if (eb.stages) {
    lines.push('各阶段分布：');
    lines.push(`  第1天: ${eb.stages.stage1_day1 || 0}  | 第2天: ${eb.stages.stage2_day2 || 0}`);
    lines.push(`  第4天: ${eb.stages.stage3_day4 || 0}  | 第7天: ${eb.stages.stage4_day7 || 0}`);
    lines.push(`  第15天: ${eb.stages.stage5_day15 || 0} | 第30天: ${eb.stages.stage6_day30 || 0}`);
    lines.push(`  已完成: ${eb.stages.completed || 0}`);
  }
  lines.push('');

  lines.push('═══════════════════════════════');
  lines.push('  报告由「私人导师」App 自动生成');
  lines.push('═══════════════════════════════');

  return lines.join('\n');
}

// ========== 内部工具函数 ==========

/**
 * 生成随机数字码
 */
function generateRandomCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * 计算时间数组的平均时间（用于作息统计）
 */
function computeAverageTime(logs, field) {
  if (!Array.isArray(logs) || logs.length === 0) return null;

  let totalMinutes = 0;
  let count = 0;

  logs.forEach((log) => {
    const timeStr = log[field];
    if (!timeStr) return;

    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      totalMinutes += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      count += 1;
    }
  });

  if (count === 0) return null;

  const avgMinutes = Math.round(totalMinutes / count);
  const hours = Math.floor(avgMinutes / 60);
  const mins = avgMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// ========== 默认导出 ==========
export default {
  exportStudyReport,
  exportToClipboard,
  generateShareCode,
  verifyShareCode,
  getCurrentShareCode,
  clearShareCode,
};
