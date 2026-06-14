/**
 * 学习计划生成器
 *
 * 根据学生诊断结果和学习习惯，生成个性化的学习计划
 * 支持每日计划、每周计划、阶段计划的生成与动态调整
 *
 * @module StudyPlanGenerator
 */

import {
  STUDY_TIME_CONFIG,
  ENTERTAINMENT_CONFIG,
  EXAM_SUBJECTS,
  DIAGNOSIS_CONFIG,
  SCHEDULE_CONFIG,
} from '../config/index.js';

// ========== 常量定义 ==========

/** 中考日期（假设为2027年6月15日） */
const EXAM_DATE = '2027-06-15';

/** 陕西中考大纲 — 各科满分 */
const SHAANXI_EXAM_SYLLABUS = {
  math:     { subject: 'math',     name: '数学',   fullScore: 120, isHighFocus: true  },
  physics:  { subject: 'physics',  name: '物理',   fullScore: 80,  isHighFocus: true  },
  english:  { subject: 'english',  name: '英语',   fullScore: 120, isHighFocus: false },
  chinese:  { subject: 'chinese',  name: '语文',   fullScore: 120, isHighFocus: false },
  politics: { subject: 'politics', name: '道法',   fullScore: 80,  isHighFocus: false },
  history:  { subject: 'history',  name: '历史',   fullScore: 60,  isHighFocus: false },
  pe:       { subject: 'pe',       name: '体育',   fullScore: 60,  isHighFocus: false },
};

/** 学习阶段定义 */
const PHASES = {
  EIGHT_GRADE_FINISH: {
    id: 'eight_grade_finish',
    name: '八年级收尾',
    start: '2026-06-12',
    end: '2026-06-30',
    focus: '夯实基础，查漏补缺',
  },
  SUMMER_INTENSIVE: {
    id: 'summer_intensive',
    name: '暑假强化',
    start: '2026-07-01',
    end: '2026-08-31',
    focus: '全面提升，强化训练',
  },
  NINTH_GRADE_UP: {
    id: 'ninth_grade_up',
    name: '九年级上学期',
    start: '2026-09-01',
    end: '2027-01-31',
    focus: '新课学习，巩固提高',
  },
  WINTER_SPRINT: {
    id: 'winter_sprint',
    name: '寒假冲刺',
    start: '2027-02-01',
    end: '2027-02-28',
    focus: '强化训练，查漏补缺',
  },
  FINAL_SPRINT: {
    id: 'final_sprint',
    name: '中考冲刺',
    start: '2027-03-01',
    end: '2027-06-14',
    focus: '模拟演练，调整状态',
  },
};

/** 任务类型定义 */
const TASK_TYPES = {
  VIDEO: 'video',
  PRACTICE: 'practice',
  REVIEW: 'review',
  PREVIEW: 'preview',
  ERROR: 'error',
  RECITE: 'recite',
};

/** 任务时长范围（分钟） */
const TASK_DURATIONS = {
  video: { min: 30, max: 45 },
  practice: { min: 20, max: 30 },
  review: { min: 15, max: 20 },
  preview: { min: 20, max: 30 },
  error: { min: 15, max: 20 },
  recite: { min: 10, max: 15 },
};

/** 难度等级 */
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

/** 默认科目权重 */
const DEFAULT_SUBJECT_WEIGHTS = {
  math: 0.35,
  physics: 0.25,
  english: 0.25,
  chinese: 0.10,
  chemistry: 0.05,
};

// ========== 模拟课程库（用于匹配推荐课程） ==========

/**
 * 模拟课程库 — 按科目和知识点索引
 * 实际项目中将从夸克网盘 COURSE_SOURCES 中动态匹配
 */
const COURSE_LIBRARY = {
  math: [
    { id: 'math_v01', title: '二次根式化简与运算', knowledgePoint: '根式化简', difficulty: 'easy', duration: 25, teacher: '乐乐课堂' },
    { id: 'math_v02', title: '勾股定理及其应用', knowledgePoint: '勾股定理应用', difficulty: 'easy', duration: 30, teacher: '洋葱学院' },
    { id: 'math_v03', title: '平行四边形性质与判定', knowledgePoint: '对边性质', difficulty: 'easy', duration: 28, teacher: '孙维刚' },
    { id: 'math_v04', title: '一次函数图像与性质', knowledgePoint: '函数定义', difficulty: 'medium', duration: 32, teacher: '洋葱学院' },
    { id: 'math_v05', title: '数据分析——平均数与方差', knowledgePoint: '平均数', difficulty: 'medium', duration: 26, teacher: '乐乐课堂' },
    { id: 'math_v06', title: '根式运算综合', knowledgePoint: '根式运算', difficulty: 'medium', duration: 30, teacher: '乐乐课堂' },
    { id: 'math_v07', title: '一次函数与方程综合应用', knowledgePoint: '一次函数应用', difficulty: 'hard', duration: 35, teacher: '孙维刚' },
    { id: 'math_v08', title: '矩形与菱形综合证明', knowledgePoint: '矩形性质', difficulty: 'hard', duration: 38, teacher: '洋葱学院' },
  ],
  physics: [
    { id: 'phy_v01', title: '力的三要素与受力分析', knowledgePoint: '力的三要素', difficulty: 'easy', duration: 24, teacher: '乐乐课堂' },
    { id: 'phy_v02', title: '速度公式与单位换算', knowledgePoint: '速度单位换算', difficulty: 'easy', duration: 22, teacher: '洋葱学院' },
    { id: 'phy_v03', title: '牛顿第一定律与惯性', knowledgePoint: '惯性', difficulty: 'medium', duration: 28, teacher: '乐乐课堂' },
    { id: 'phy_v04', title: '二力平衡条件及应用', knowledgePoint: '平衡条件', difficulty: 'medium', duration: 26, teacher: '洋葱学院' },
    { id: 'phy_v05', title: '滑动摩擦力综合', knowledgePoint: '滑动摩擦力', difficulty: 'hard', duration: 32, teacher: '乐乐课堂' },
    { id: 'phy_v06', title: '浮力与阿基米德原理', knowledgePoint: '浮力计算', difficulty: 'hard', duration: 35, teacher: '孙维刚' },
  ],
  english: [
    { id: 'eng_v01', title: '初中英语核心词汇速记', knowledgePoint: '词汇', difficulty: 'easy', duration: 20, teacher: '万唯中考' },
    { id: 'eng_v02', title: '英语语法——时态专题', knowledgePoint: '语法', difficulty: 'medium', duration: 30, teacher: '万唯中考' },
    { id: 'eng_v03', title: '阅读理解技巧精讲', knowledgePoint: '阅读', difficulty: 'medium', duration: 28, teacher: '万唯中考' },
    { id: 'eng_v04', title: '中考英语写作模板', knowledgePoint: '写作', difficulty: 'hard', duration: 32, teacher: '万唯中考' },
  ],
  chinese: [
    { id: 'chn_v01', title: '古诗文背诵与鉴赏', knowledgePoint: '古诗文', difficulty: 'easy', duration: 25, teacher: '乐乐课堂' },
    { id: 'chn_v02', title: '文言文阅读与翻译', knowledgePoint: '文言文', difficulty: 'medium', duration: 30, teacher: '乐乐课堂' },
    { id: 'chn_v03', title: '中考作文高分策略', knowledgePoint: '作文', difficulty: 'hard', duration: 35, teacher: '洋葱学院' },
  ],
  politics: [
    { id: 'pol_v01', title: '道德与法治基础知识梳理', knowledgePoint: '基础知识', difficulty: 'easy', duration: 25, teacher: '万唯中考' },
  ],
  history: [
    { id: 'his_v01', title: '中国近代史重大事件梳理', knowledgePoint: '近代史', difficulty: 'easy', duration: 28, teacher: '乐乐课堂' },
  ],
};

// ========== 工具函数 ==========

/**
 * 计算距离中考的天数
 */
export function getDaysUntilExam(examDate = EXAM_DATE) {
  try {
    const now = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('计算中考天数失败:', error);
    return 365;
  }
}

/**
 * 获取当前学习阶段
 */
export function getCurrentPhaseInfo() {
  try {
    const now = new Date();
    const phases = Object.values(PHASES);
    for (const phase of phases) {
      const start = new Date(phase.start);
      const end = new Date(phase.end);
      if (now >= start && now <= end) return phase;
    }
    return { id: 'default', name: '常规学习', start: null, end: null, focus: '平衡发展' };
  } catch (error) {
    return { id: 'default', name: '常规学习', start: null, end: null, focus: '平衡发展' };
  }
}

export function generateTaskId() {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${random}`;
  } catch (error) {
    return `task_${Date.now()}`;
  }
}

export function formatTime(minutes) {
  try {
    if (typeof minutes !== 'number' || minutes < 0) return '0分钟';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}分钟`;
    if (mins === 0) return `${hours}小时`;
    return `${hours}小时${mins}分钟`;
  } catch (error) {
    return `${minutes}分钟`;
  }
}

function getDayType(date) {
  try {
    const d = new Date(date);
    const day = d.getDay();
    const month = d.getMonth();
    if (month >= 6 && month <= 7) return 'holiday';
    if (day === 0 || day === 6) return 'weekend';
    return 'weekday';
  } catch (error) {
    return 'weekday';
  }
}

function formatDate(date) {
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

function getSubjectName(subjectId) {
  const entry = SHAANXI_EXAM_SYLLABUS[subjectId];
  return entry ? entry.name : subjectId;
}

// ========== 课程匹配 ==========

/**
 * 根据知识点从课程库中匹配推荐视频
 */
function matchCourses(subject, knowledgePoint, difficulty, limit = 2) {
  try {
    const lib = COURSE_LIBRARY[subject];
    if (!lib || lib.length === 0) return [];

    const kpLower = (knowledgePoint || '').toLowerCase();
    const matches = lib.filter(course => {
      const titleLower = (course.title || '').toLowerCase();
      const kpCourseLower = (course.knowledgePoint || '').toLowerCase();
      return (
        titleLower.includes(kpLower) ||
        kpCourseLower.includes(kpLower) ||
        kpLower.includes(kpCourseLower)
      );
    });

    if (matches.length === 0) {
      return lib
        .filter(c => c.difficulty === difficulty || c.difficulty === 'easy')
        .slice(0, limit)
        .map(c => ({ ...c, matchType: 'subject_default' }));
    }

    const diffOrder = { easy: 1, medium: 2, hard: 3 };
    const targetDiff = diffOrder[difficulty] || 2;
    const sorted = matches.sort((a, b) =>
      Math.abs((diffOrder[a.difficulty] || 2) - targetDiff) -
      Math.abs((diffOrder[b.difficulty] || 2) - targetDiff)
    );

    return sorted.slice(0, limit).map(c => ({ ...c, matchType: 'knowledge_point' }));
  } catch (error) {
    console.error('课程匹配失败:', error);
    return [];
  }
}

// ========== 原有算法（保留） ==========

export function calculateSubjectWeights(diagnosisResult) {
  try {
    if (!diagnosisResult || !diagnosisResult.subjectScores) {
      return { ...DEFAULT_SUBJECT_WEIGHTS };
    }
    const { subjectScores } = diagnosisResult;
    const weights = {};
    let totalWeight = 0;
    Object.keys(DEFAULT_SUBJECT_WEIGHTS).forEach(subject => {
      const scoreData = subjectScores.find(s => s.subject === subject);
      const score = scoreData ? scoreData.percentage : 0;
      const ratio = score / 100;
      weights[subject] = DEFAULT_SUBJECT_WEIGHTS[subject] * (1.5 - ratio);
      totalWeight += weights[subject];
    });
    Object.keys(weights).forEach(subject => {
      weights[subject] = Math.round((weights[subject] / totalWeight) * 100) / 100;
    });
    return weights;
  } catch (error) {
    console.error('计算科目权重失败:', error);
    return { ...DEFAULT_SUBJECT_WEIGHTS };
  }
}

export function adjustDifficulty(currentPerformance, historicalData = []) {
  try {
    if (!currentPerformance) {
      return { difficulty: 'easy', skipBasic: false, forceBasic: true, reason: '无表现数据，从基础开始' };
    }
    const { correctStreak = 0, errorStreak = 0, accuracy = 50, currentDifficulty = 'easy' } = currentPerformance;
    let newDifficulty = currentDifficulty;
    let skipBasic = false;
    let forceBasic = false;
    let reason = '';

    if (correctStreak >= 5) {
      const idx = DIFFICULTY_LEVELS.indexOf(currentDifficulty);
      if (idx < DIFFICULTY_LEVELS.length - 1) {
        newDifficulty = DIFFICULTY_LEVELS[idx + 1];
        reason = '连续正确超过5题';
      }
    }
    if (errorStreak >= 3) {
      const idx = DIFFICULTY_LEVELS.indexOf(newDifficulty);
      if (idx > 0) {
        newDifficulty = DIFFICULTY_LEVELS[idx - 1];
        reason = '连续错误超过3题';
      }
    }
    if (accuracy > 90) { skipBasic = true; reason = '正确率超过90%'; }
    if (accuracy < 50) { forceBasic = true; reason = '正确率低于50%'; }

    return { difficulty: newDifficulty, skipBasic, forceBasic, reason };
  } catch (error) {
    return { difficulty: 'easy', skipBasic: false, forceBasic: true, reason: '错误回退到基础难度' };
  }
}

export function calculateRewardPunishment(dailyPerformance) {
  try {
    if (!dailyPerformance) {
      return { reward: 0, punishment: 0, total: 0, halfTomorrow: false, clearToday: false, details: [] };
    }
    let reward = 0;
    let punishment = 0;
    let halfTomorrow = false;
    let clearToday = false;
    const details = [];

    if (dailyPerformance.taskCompleted) {
      reward += ENTERTAINMENT_CONFIG.rewards.completeDailyTask;
      details.push({ type: 'reward', name: '完成每日任务', time: ENTERTAINMENT_CONFIG.rewards.completeDailyTask });
    }
    if (dailyPerformance.weeklyTestProgress >= 10) {
      reward += ENTERTAINMENT_CONFIG.rewards.weeklyTestImproved;
      details.push({ type: 'reward', name: '周测进步10%', time: ENTERTAINMENT_CONFIG.rewards.weeklyTestImproved });
    }
    if (dailyPerformance.monthlyTestProgress >= 5) {
      reward += ENTERTAINMENT_CONFIG.rewards.monthlyTestImproved;
      details.push({ type: 'reward', name: '月考进步5%', time: ENTERTAINMENT_CONFIG.rewards.monthlyTestImproved });
    }
    if (dailyPerformance.extraStudy) {
      reward += ENTERTAINMENT_CONFIG.rewards.extraStudy;
      details.push({ type: 'reward', name: '主动额外学习', time: ENTERTAINMENT_CONFIG.rewards.extraStudy });
    }
    if (dailyPerformance.perfectAttendance) {
      reward += ENTERTAINMENT_CONFIG.rewards.perfectAttendance;
      details.push({ type: 'reward', name: '全勤一周', time: ENTERTAINMENT_CONFIG.rewards.perfectAttendance });
    }

    if (dailyPerformance.taskIncomplete) {
      punishment += Math.abs(ENTERTAINMENT_CONFIG.punishments.incompleteTask);
      details.push({ type: 'punishment', name: '未完成任务', time: ENTERTAINMENT_CONFIG.punishments.incompleteTask });
    }
    if (dailyPerformance.phoneDuringStudy) {
      punishment += Math.abs(ENTERTAINMENT_CONFIG.punishments.phoneDuringStudy);
      details.push({ type: 'punishment', name: '学习玩手机', time: ENTERTAINMENT_CONFIG.punishments.phoneDuringStudy });
    }
    if (dailyPerformance.overtimeMinutes > 0) {
      punishment += dailyPerformance.overtimeMinutes * Math.abs(ENTERTAINMENT_CONFIG.punishments.overtime);
      details.push({ type: 'punishment', name: '超时使用', time: -(dailyPerformance.overtimeMinutes * Math.abs(ENTERTAINMENT_CONFIG.punishments.overtime)) });
    }
    if (dailyPerformance.lateNight) {
      halfTomorrow = true;
      details.push({ type: 'punishment', name: '熬夜', time: 0, effect: '次日娱乐减半' });
    }
    if (dailyPerformance.copyHomework) {
      clearToday = true;
      details.push({ type: 'punishment', name: '抄袭作业', time: 0, effect: '当日娱乐清零' });
    }

    return { reward, punishment, total: reward - punishment, halfTomorrow, clearToday, details };
  } catch (error) {
    return { reward: 0, punishment: 0, total: 0, halfTomorrow: false, clearToday: false, details: [] };
  }
}

export function calculateEntertainmentTime(dailyPerformance, dayType = 'weekday') {
  try {
    const base = ENTERTAINMENT_CONFIG.baseDuration[dayType] || ENTERTAINMENT_CONFIG.baseDuration.weekday;
    const rp = calculateRewardPunishment(dailyPerformance);
    if (rp.clearToday) {
      return { base, bonus: 0, penalty: base, total: 0, remaining: 0, halfTomorrow: false, details: rp.details };
    }
    const total = Math.max(0, base + rp.reward - rp.punishment);
    return { base, bonus: rp.reward, penalty: rp.punishment, total, remaining: total, halfTomorrow: rp.halfTomorrow, details: rp.details };
  } catch (error) {
    return { base: 45, bonus: 0, penalty: 0, total: 45, remaining: 45, halfTomorrow: false, details: [] };
  }
}

export function getScheduleTemplate(type = 'weekday') {
  try {
    if (type === 'weekend') {
      return {
        wakeUp: SCHEDULE_CONFIG.weekend.wakeUp,
        bedtime: SCHEDULE_CONFIG.weekend.bedtime,
        sleepDuration: SCHEDULE_CONFIG.weekend.sleepDuration,
        studyTime: STUDY_TIME_CONFIG.dailySchedule.weekend.totalStudy,
        entertainmentTime: ENTERTAINMENT_CONFIG.baseDuration.weekend,
      };
    }
    if (type === 'holiday') {
      return {
        wakeUp: SCHEDULE_CONFIG.holiday.wakeUp,
        bedtime: SCHEDULE_CONFIG.holiday.bedtime,
        sleepDuration: SCHEDULE_CONFIG.holiday.sleepDuration,
        studyTime: STUDY_TIME_CONFIG.dailySchedule.weekend.totalStudy,
        entertainmentTime: ENTERTAINMENT_CONFIG.baseDuration.holiday,
      };
    }
    return {
      wakeUp: SCHEDULE_CONFIG.standard.wakeUp,
      bedtime: SCHEDULE_CONFIG.standard.bedtime,
      sleepDuration: SCHEDULE_CONFIG.standard.sleepDuration,
      studyTime: STUDY_TIME_CONFIG.dailySchedule.weekday.evening.totalStudy,
      entertainmentTime: ENTERTAINMENT_CONFIG.baseDuration.weekday,
    };
  } catch (error) {
    return { wakeUp: '06:00', bedtime: '23:00', sleepDuration: 7, studyTime: 150, entertainmentTime: 45 };
  }
}

// ========== 任务创建 ==========

function createTask(subject, type, title, description, difficulty = 'easy', duration = null) {
  try {
    const range = TASK_DURATIONS[type] || TASK_DURATIONS.practice;
    const taskDuration = duration || Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    return {
      id: generateTaskId(),
      subject,
      type,
      title,
      description,
      duration: taskDuration,
      difficulty,
      status: 'pending',
      startTime: null,
      endTime: null,
      videoId: null,
      completedAt: null,
      score: null,
    };
  } catch (error) {
    return {
      id: generateTaskId(),
      subject,
      type: 'practice',
      title: title || '学习任务',
      description: description || '',
      duration: 30,
      difficulty: 'easy',
      status: 'pending',
      startTime: null,
      endTime: null,
      videoId: null,
      completedAt: null,
      score: null,
    };
  }
}

// ===================================================================
//  核心函数 1： generateLearningPath(diagnosisResult, examDate)
// ===================================================================

/**
 * 根据诊断报告生成分阶段学习路径
 *
 * 流程：
 * 1. 从诊断报告中提取薄弱知识点，按 priority 排序 (high > medium > low)
 * 2. 对照陕西中考大纲（数学120/物理80/英语120/语文120/道法80/历史60/体育60）
 * 3. 生成三阶段路径
 *
 * @param {Object} diagnosisResult - 诊断报告（来自 diagnose-system.generateDiagnosisReport）
 * @param {string} examDate - 中考日期 YYYY-MM-DD，默认 '2027-06-15'
 * @returns {Object} 学习路径对象，包含 meta、phases、summary
 */
export function generateLearningPath(diagnosisResult, examDate = EXAM_DATE) {
  try {
    const allWeakPoints = extractAndSortWeakPoints(diagnosisResult);

    const easyPoints = allWeakPoints.filter(wp => wp.difficulty === 'easy' || wp.priority === 'high');
    const mediumPoints = allWeakPoints.filter(wp => wp.difficulty === 'medium' || wp.priority === 'medium');
    const hardPoints = allWeakPoints.filter(wp => wp.difficulty === 'hard');

    const sortedByEase = [
      ...easyPoints.filter(wp => wp.priority === 'high'),
      ...easyPoints.filter(wp => wp.priority !== 'high'),
    ];
    const sortedMedium = [
      ...mediumPoints.filter(wp => wp.priority === 'high'),
      ...mediumPoints.filter(wp => wp.priority !== 'high'),
    ];
    const sortedHard = [
      ...hardPoints.filter(wp => wp.priority === 'high'),
      ...hardPoints.filter(wp => wp.priority !== 'high'),
    ];

    const examSubjects = buildExamSubjectMap(diagnosisResult);
    const daysUntilExam = getDaysUntilExam(examDate);

    const phase1 = buildPhase1(sortedByEase, easyPoints, examSubjects, daysUntilExam);
    const phase2 = buildPhase2(sortedMedium, mediumPoints, examSubjects, daysUntilExam, phase1.totalDays);
    const phase3 = buildPhase3(sortedHard, hardPoints, allWeakPoints, examSubjects, daysUntilExam, phase1.totalDays + phase2.totalDays);

    return {
      meta: {
        generatedAt: new Date().toISOString(),
        examDate,
        daysUntilExam,
        examSyllabus: SHAANXI_EXAM_SYLLABUS,
        totalWeakPoints: allWeakPoints.length,
      },
      phases: [phase1, phase2, phase3],
      summary: {
        totalDays: phase1.totalDays + phase2.totalDays + phase3.totalDays,
        totalExercises: phase1.totalExercises + phase2.totalExercises + phase3.totalExercises,
        totalVideos: phase1.totalVideos + phase2.totalVideos + phase3.totalVideos,
        subjectDistribution: buildSubjectDistribution([phase1, phase2, phase3]),
      },
    };
  } catch (error) {
    console.error('生成学习路径失败:', error);
    return generateFallbackLearningPath(examDate);
  }
}

/**
 * 提取并排序薄弱知识点
 */
function extractAndSortWeakPoints(diagnosisResult) {
  if (!diagnosisResult || !diagnosisResult.weakPoints || diagnosisResult.weakPoints.length === 0) {
    return generateDefaultWeakPoints();
  }
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...diagnosisResult.weakPoints]
    .sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2))
    .map(wp => ({
      ...wp,
      subjectName: getSubjectName(wp.subject),
      difficulty: wp.difficulty || (wp.priority === 'high' ? 'easy' : 'medium'),
    }));
}

/**
 * 默认薄弱知识点（诊断结果为空时的兜底）
 */
function generateDefaultWeakPoints() {
  return [
    { subject: 'math', knowledgePoint: '根式化简', chapter: '二次根式', priority: 'high', difficulty: 'easy', subjectName: '数学' },
    { subject: 'math', knowledgePoint: '勾股定理应用', chapter: '勾股定理', priority: 'high', difficulty: 'easy', subjectName: '数学' },
    { subject: 'physics', knowledgePoint: '力的三要素', chapter: '力', priority: 'high', difficulty: 'easy', subjectName: '物理' },
    { subject: 'english', knowledgePoint: '词汇', chapter: '词汇', priority: 'medium', difficulty: 'medium', subjectName: '英语' },
    { subject: 'physics', knowledgePoint: '平衡条件', chapter: '运动和力', priority: 'medium', difficulty: 'medium', subjectName: '物理' },
    { subject: 'math', knowledgePoint: '一次函数应用', chapter: '一次函数', priority: 'medium', difficulty: 'hard', subjectName: '数学' },
  ];
}

function buildExamSubjectMap(diagnosisResult) {
  const map = {};
  Object.entries(SHAANXI_EXAM_SYLLABUS).forEach(([id, info]) => {
    let percentage = 50;
    if (diagnosisResult && diagnosisResult.subjectScores) {
      const scoreData = diagnosisResult.subjectScores.find(s => s.subject === id);
      if (scoreData) percentage = scoreData.percentage;
    }
    map[id] = {
      ...info,
      currentPercentage: percentage,
      weight: percentage < 40 ? 'high' : percentage < 70 ? 'medium' : 'low',
    };
  });
  return map;
}

/**
 * Phase 1: 夯实基础
 * - 薄弱知识点从易到难，每天2~3个
 * - 配合课程视频、基础练习
 */
function buildPhase1(sortedEasyPoints, allEasyPoints, examSubjects, daysUntilExam) {
  const pointsPerDayMin = 2;
  const pointsPerDayMax = 3;
  const totalDays = Math.max(14, Math.ceil(daysUntilExam * 0.30));
  const dailyPlan = [];
  let pointIdx = 0;
  const allPoints = sortedEasyPoints.length > 0 ? sortedEasyPoints : [];

  for (let day = 0; day < totalDays && pointIdx < allPoints.length; day++) {
    const count = Math.min(
      Math.floor(Math.random() * (pointsPerDayMax - pointsPerDayMin + 1)) + pointsPerDayMin,
      allPoints.length - pointIdx,
    );
    const dayPoints = allPoints.slice(pointIdx, pointIdx + count);
    pointIdx += count;
    if (dayPoints.length === 0) break;

    const dailyItems = dayPoints.map(wp => {
      const courses = matchCourses(wp.subject, wp.knowledgePoint, 'easy', 2);
      const exercisesPerPoint = wp.priority === 'high' ? 15 : 10;
      return {
        knowledgePoint: {
          subject: wp.subject,
          subjectName: wp.subjectName,
          name: wp.knowledgePoint,
          chapter: wp.chapter,
          difficulty: 'easy',
          priority: wp.priority,
        },
        recommendedVideos: courses,
        exercises: exercisesPerPoint,
        estimatedMinutes: courses.reduce((sum, c) => sum + c.duration, 0) + exercisesPerPoint * 2,
      };
    });

    dailyPlan.push({
      day: day + 1,
      focus: '基础概念 + 公式定理',
      items: dailyItems,
      totalExercises: dailyItems.reduce((sum, item) => sum + item.exercises, 0),
      totalMinutes: dailyItems.reduce((sum, item) => sum + item.estimatedMinutes, 0),
    });
  }

  const allVideos = dailyPlan.reduce((acc, d) => acc + d.items.reduce((s, i) => s + i.recommendedVideos.length, 0), 0);
  const allExercises = dailyPlan.reduce((acc, d) => acc + d.totalExercises, 0);

  return {
    id: 'phase_1_foundation',
    name: 'Phase 1: 夯实基础',
    description: '薄弱知识点从易到难逐个击破，每天掌握2-3个基础知识，配合课程视频和基础练习',
    focus: '打好地基',
    totalDays: dailyPlan.length,
    totalExercises: allExercises,
    totalVideos: allVideos,
    pointsPerDayRange: [pointsPerDayMin, pointsPerDayMax],
    strategy: 'easy_to_medium',
    dailyPlan,
    milestones: [
      { day: Math.ceil(dailyPlan.length * 0.33), check: '阶段检测1：已学知识点小测' },
      { day: Math.ceil(dailyPlan.length * 0.66), check: '阶段检测2：薄弱科目专项测验' },
      { day: dailyPlan.length, check: 'Phase 1 综合检测：夯实基础成果评估' },
    ],
  };
}

/**
 * Phase 2: 同步提高
 * - 中等难度知识点，配合变式题（一题多变）
 * - 每天2~3个知识点
 */
function buildPhase2(sortedMediumPoints, allMediumPoints, examSubjects, daysUntilExam, phase1Days) {
  const pointsPerDayMin = 2;
  const pointsPerDayMax = 3;
  const remainingDays = Math.max(0, daysUntilExam - phase1Days);
  const totalDays = Math.max(10, Math.ceil(remainingDays * 0.35));
  const dailyPlan = [];
  let pointIdx = 0;
  const allPoints = sortedMediumPoints.length > 0 ? sortedMediumPoints : [];

  for (let day = 0; day < totalDays && pointIdx < allPoints.length; day++) {
    const count = Math.min(
      Math.floor(Math.random() * (pointsPerDayMax - pointsPerDayMin + 1)) + pointsPerDayMin,
      allPoints.length - pointIdx,
    );
    const dayPoints = allPoints.slice(pointIdx, pointIdx + count);
    pointIdx += count;
    if (dayPoints.length === 0) break;

    const dailyItems = dayPoints.map(wp => {
      const courses = matchCourses(wp.subject, wp.knowledgePoint, 'medium', 2);
      const exercisesPerPoint = 20;
      return {
        knowledgePoint: {
          subject: wp.subject,
          subjectName: wp.subjectName,
          name: wp.knowledgePoint,
          chapter: wp.chapter,
          difficulty: 'medium',
          priority: wp.priority,
        },
        recommendedVideos: courses,
        exercises: exercisesPerPoint,
        variantExercises: Math.floor(exercisesPerPoint * 0.6),
        estimatedMinutes: courses.reduce((sum, c) => sum + c.duration, 0) + (exercisesPerPoint + Math.floor(exercisesPerPoint * 0.6)) * 2,
      };
    });

    dailyPlan.push({
      day: day + 1,
      focus: '变式训练 + 解题技巧',
      items: dailyItems,
      totalExercises: dailyItems.reduce((sum, item) => sum + item.exercises, 0),
      totalVariantExercises: dailyItems.reduce((sum, item) => sum + item.variantExercises, 0),
      totalMinutes: dailyItems.reduce((sum, item) => sum + item.estimatedMinutes, 0),
    });
  }

  const allVideos = dailyPlan.reduce((acc, d) => acc + d.items.reduce((s, i) => s + i.recommendedVideos.length, 0), 0);
  const allExercises = dailyPlan.reduce((acc, d) => acc + d.totalExercises, 0);

  return {
    id: 'phase_2_improvement',
    name: 'Phase 2: 同步提高',
    description: '中等难度知识点逐一攻克，每道题配变式训练（一题多变），提升解题灵活度',
    focus: '举一反三',
    totalDays: dailyPlan.length,
    totalExercises: allExercises,
    totalVideos: allVideos,
    pointsPerDayRange: [pointsPerDayMin, pointsPerDayMax],
    strategy: 'variant_training',
    dailyPlan,
    milestones: [
      { day: Math.ceil(dailyPlan.length * 0.33), check: '阶段检测1：中等难度专题测试' },
      { day: Math.ceil(dailyPlan.length * 0.66), check: '阶段检测2：变式题综合测验' },
      { day: dailyPlan.length, check: 'Phase 2 综合检测：同步提高成果评估' },
    ],
  };
}

/**
 * Phase 3: 综合训练
 * - 跨知识点综合题
 * - 每3天一次真题模拟
 * - 错题回顾
 */
function buildPhase3(sortedHardPoints, hardPoints, allWeakPoints, examSubjects, daysUntilExam, previousDays) {
  const remainingDays = Math.max(0, daysUntilExam - previousDays);
  const totalDays = Math.max(7, remainingDays);

  const examSimulationDays = [];
  for (let d = 1; d <= totalDays; d++) {
    if (d % 3 === 0 || d === totalDays) examSimulationDays.push(d);
  }

  const crossSubjectGroups = buildCrossSubjectGroups(allWeakPoints);
  const dailyPlan = [];

  for (let day = 0; day < totalDays; day++) {
    const dayNumber = day + 1;
    const isSimulationDay = examSimulationDays.includes(dayNumber);

    if (isSimulationDay) {
      const simulationSubjects = ['math', 'physics', 'english', 'chinese'];
      const simItems = simulationSubjects.map(subj => {
        const info = examSubjects[subj] || SHAANXI_EXAM_SYLLABUS[subj];
        return {
          knowledgePoint: {
            subject: subj,
            subjectName: getSubjectName(subj),
            name: `中考真题模拟——${getSubjectName(subj)}`,
            chapter: '综合',
            difficulty: 'hard',
            priority: 'high',
          },
          recommendedVideos: [],
          exercises: info ? Math.round(info.fullScore / 2) : 30,
          variantExercises: 0,
          estimatedMinutes: subj === 'math' || subj === 'chinese' ? 120 : 80,
          isSimulation: true,
        };
      });

      dailyPlan.push({
        day: dayNumber,
        focus: '真题模拟 — 严格按照中考时间作答',
        items: simItems,
        totalExercises: simItems.reduce((sum, item) => sum + item.exercises, 0),
        totalMinutes: simItems.reduce((sum, item) => sum + item.estimatedMinutes, 0),
        isSimulationDay: true,
      });
    } else {
      const group = crossSubjectGroups[day % crossSubjectGroups.length];
      if (!group) continue;

      const dailyItems = group.points.map(wp => {
        const courses = matchCourses(wp.subject, wp.knowledgePoint, 'hard', 1);
        const exercisesPerPoint = 25;
        return {
          knowledgePoint: {
            subject: wp.subject,
            subjectName: wp.subjectName,
            name: wp.knowledgePoint,
            chapter: wp.chapter,
            difficulty: 'hard',
            priority: wp.priority,
          },
          recommendedVideos: courses,
          exercises: exercisesPerPoint,
          errorReview: Math.floor(exercisesPerPoint * 0.4),
          estimatedMinutes: courses.reduce((sum, c) => sum + c.duration, 0) + exercisesPerPoint * 2.5,
        };
      });

      dailyPlan.push({
        day: dayNumber,
        focus: '跨知识点综合 + 错题回顾',
        items: dailyItems,
        totalExercises: dailyItems.reduce((sum, item) => sum + item.exercises, 0),
        totalMinutes: dailyItems.reduce((sum, item) => sum + item.estimatedMinutes, 0),
        isSimulationDay: false,
      });
    }
  }

  const allVideos = dailyPlan.reduce((acc, d) => acc + d.items.reduce((s, i) => s + i.recommendedVideos.length, 0), 0);
  const allExercises = dailyPlan.reduce((acc, d) => acc + d.totalExercises, 0);

  return {
    id: 'phase_3_comprehensive',
    name: 'Phase 3: 综合训练',
    description: '跨知识点综合题型训练，每3天一次真题模拟，配合错题回顾，全面备战中考',
    focus: '融会贯通',
    totalDays: dailyPlan.length,
    totalExercises: allExercises,
    totalVideos: allVideos,
    examSimulationDays,
    strategy: 'cross_knowledge_integration',
    dailyPlan,
    milestones: [
      { day: Math.ceil(totalDays * 0.5), check: '中期模拟：全科综合测验' },
      { day: totalDays, check: '考前终极模拟：全真中考环境演练' },
    ],
  };
}

/**
 * 构建跨知识点综合题组
 * 将不同科目的薄弱点组合成交叉训练单元
 */
function buildCrossSubjectGroups(allWeakPoints) {
  const groups = [];
  const stemPoints = allWeakPoints.filter(wp => wp.subject === 'math' || wp.subject === 'physics');
  const langPoints = allWeakPoints.filter(wp => wp.subject === 'english' || wp.subject === 'chinese');
  const socialPoints = allWeakPoints.filter(wp => wp.subject === 'politics' || wp.subject === 'history');

  if (stemPoints.length >= 2) {
    for (let i = 0; i < stemPoints.length - 1; i += 2) {
      groups.push({ type: 'stem_cross', label: '理科综合专题', points: [stemPoints[i], stemPoints[i + 1]] });
    }
  }
  if (langPoints.length >= 2) {
    for (let i = 0; i < langPoints.length - 1; i += 2) {
      groups.push({ type: 'lang_cross', label: '语言综合专题', points: [langPoints[i], langPoints[i + 1]] });
    }
  }
  if (socialPoints.length >= 2) {
    for (let i = 0; i < socialPoints.length - 1; i += 2) {
      groups.push({ type: 'social_cross', label: '文综专题', points: [socialPoints[i], socialPoints[i + 1]] });
    }
  }
  if (groups.length === 0 && allWeakPoints.length > 0) {
    groups.push({
      type: 'mixed',
      label: '综合复习',
      points: allWeakPoints.slice(0, Math.min(3, allWeakPoints.length)),
    });
  }
  return groups;
}

function buildSubjectDistribution(phases) {
  const dist = {};
  phases.forEach(phase => {
    phase.dailyPlan.forEach(day => {
      day.items.forEach(item => {
        const subject = item.knowledgePoint.subject;
        if (!dist[subject]) {
          dist[subject] = { subject, subjectName: item.knowledgePoint.subjectName, days: 0, exercises: 0, videos: 0 };
        }
        dist[subject].days += 1;
        dist[subject].exercises += item.exercises;
        dist[subject].videos += item.recommendedVideos.length;
      });
    });
  });
  return Object.values(dist);
}

function generateFallbackLearningPath(examDate) {
  const daysUntilExam = getDaysUntilExam(examDate);
  const defaultPoints = generateDefaultWeakPoints();
  const examSubjects = buildExamSubjectMap(null);
  const sortedEasy = defaultPoints.filter(wp => wp.priority === 'high');
  const sortedMedium = defaultPoints.filter(wp => wp.priority === 'medium');

  const phase1 = buildPhase1(sortedEasy, sortedEasy, examSubjects, daysUntilExam);
  const phase2 = buildPhase2(sortedMedium, sortedMedium, examSubjects, daysUntilExam, 14);
  const phase3 = buildPhase3([], [], defaultPoints, examSubjects, daysUntilExam, 24);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      examDate,
      daysUntilExam,
      examSyllabus: SHAANXI_EXAM_SYLLABUS,
      totalWeakPoints: 0,
      isFallback: true,
    },
    phases: [phase1, phase2, phase3],
    summary: {
      totalDays: phase1.totalDays + phase2.totalDays + phase3.totalDays,
      totalExercises: phase1.totalExercises + phase2.totalExercises + phase3.totalExercises,
      totalVideos: phase1.totalVideos + phase2.totalVideos + phase3.totalVideos,
      subjectDistribution: buildSubjectDistribution([phase1, phase2, phase3]),
    },
  };
}

// ===================================================================
//  核心函数 2： generateDailyPlan()
// ===================================================================

/**
 * 生成每日学习计划
 *
 * 按番茄钟（30分钟/节）排时间块：
 * - 上午：需要高度专注的科目（数学/物理）
 * - 下午：语言类（英语/语文）
 * - 晚上：复习和错题整理
 * - 每天预留娱乐时间（按阶段动态调整）
 *
 * @param {Object} learningPath - 由 generateLearningPath() 生成的学习路径
 * @param {Object} options - 可选配置
 * @param {Date|string} options.date - 目标日期，默认今天
 * @param {number} options.dayIndex - 当前在学习路径中的第几天（0开始），默认自动计算
 * @param {string} options.phaseId - 指定阶段ID，默认按dayIndex推算
 * @param {Object} options.customSchedule - 自定义作息（覆盖默认）
 * @returns {Object} 每日学习计划
 */
export function generateDailyPlan(learningPath, options = {}) {
  try {
    const {
      date = new Date(),
      dayIndex = null,
      phaseId = null,
      customSchedule = null,
    } = options;

    const targetDate = formatDate(date);
    const dayType = getDayType(date);
    const schedule = customSchedule || getScheduleTemplate(dayType);

    // ---- 步骤 1: 确定今天处于哪个阶段、第几天 ----
    let todayPhase = null;
    let todayDayInPhase = null;

    if (learningPath && learningPath.phases && learningPath.phases.length > 0) {
      if (phaseId) {
        todayPhase = learningPath.phases.find(p => p.id === phaseId);
      }
      if (!todayPhase && dayIndex !== null) {
        let offset = 0;
        for (const phase of learningPath.phases) {
          if (dayIndex < offset + phase.totalDays) {
            todayPhase = phase;
            todayDayInPhase = dayIndex - offset;
            break;
          }
          offset += phase.totalDays;
        }
      }
      if (!todayPhase) {
        todayPhase = learningPath.phases[0];
        todayDayInPhase = 0;
      }
    }

    // ---- 步骤 2: 从阶段日计划中取当天知识点 ----
    let dailyKnowledgeItems = [];
    if (todayPhase && todayPhase.dailyPlan && todayDayInPhase !== null && todayDayInPhase !== undefined) {
      const dayPlan = todayPhase.dailyPlan[todayDayInPhase];
      if (dayPlan && dayPlan.items) {
        dailyKnowledgeItems = dayPlan.items;
      }
    }

    // ---- 步骤 3: 按番茄钟 (30min/节) 排时间块 ----
    const timeBlocks = buildPomodoroSchedule(dailyKnowledgeItems, todayPhase, dayType, schedule);

    // ---- 步骤 4: 计算娱乐时间 ----
    const entertainmentMinutes = calculatePhaseEntertainment(todayPhase, dayType);

    // ---- 步骤 5: 构建任务列表 ----
    const tasks = buildTasksFromTimeBlocks(timeBlocks);

    // ---- 步骤 6: 统计 ----
    const totalStudyMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);

    return {
      id: `plan_${targetDate}`,
      date: targetDate,
      type: dayType,
      phaseId: todayPhase ? todayPhase.id : 'unknown',
      phaseName: todayPhase ? todayPhase.name : '未知阶段',
      dayInPhase: todayDayInPhase !== null && todayDayInPhase !== undefined ? todayDayInPhase + 1 : null,
      phaseFocus: todayPhase ? todayPhase.focus : '',
      daysUntilExam: learningPath ? learningPath.meta.daysUntilExam : getDaysUntilExam(),
      schedule: timeBlocks,
      tasks,
      totalStudyMinutes,
      totalPomodoros: timeBlocks.filter(b => b.type === 'study').length,
      entertainmentMinutes,
      restBreakMinutes: timeBlocks.filter(b => b.type === 'break').reduce((sum, b) => sum + b.duration, 0),
      sleepTime: schedule.bedtime,
      wakeUpTime: schedule.wakeUp,
      entertainment: {
        base: ENTERTAINMENT_CONFIG.baseDuration[dayType] || 45,
        adjusted: entertainmentMinutes,
        remaining: entertainmentMinutes,
        details: [],
      },
      knowledgeItems: dailyKnowledgeItems.map(item => ({
        subject: item.knowledgePoint.subject,
        subjectName: item.knowledgePoint.subjectName,
        knowledgePoint: item.knowledgePoint.name,
        difficulty: item.knowledgePoint.difficulty,
        recommendedVideos: item.recommendedVideos || [],
        exercises: item.exercises || 0,
      })),
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('生成每日计划失败:', error);
    return generateFallbackDailyPlan(date);
  }
}

/**
 * 按番茄钟排时间块
 *
 * 上午 (08:00-12:00): 高度专注科目 — 数学、物理
 * 下午 (14:00-17:30): 语言类科目 — 英语、语文
 * 晚上 (19:00-21:30): 复习和错题整理
 */
function buildPomodoroSchedule(knowledgeItems, currentPhase, dayType, schedule) {
  const POMODORO = 30;
  const blocks = [];

  const highFocusItems = knowledgeItems.filter(
    item => item.knowledgePoint.subject === 'math' || item.knowledgePoint.subject === 'physics',
  );
  const langItems = knowledgeItems.filter(
    item => item.knowledgePoint.subject === 'english' || item.knowledgePoint.subject === 'chinese',
  );
  const otherItems = knowledgeItems.filter(
    item => !highFocusItems.includes(item) && !langItems.includes(item),
  );

  const isWeekend = dayType === 'weekend' || dayType === 'holiday';
  const P = POMODORO;

  // ==== 上午：高度专注科目 (仅周末/假期) ====
  if (isWeekend) {
    let cur = 8 * 60; // 08:00

    highFocusItems.forEach((item, idx) => {
      const pomos = Math.max(1, Math.ceil(item.estimatedMinutes / P));
      for (let i = 0; i < Math.min(pomos, 2); i++) {
        const start = cur; cur += P;
        blocks.push(makeStudyBlock(start, cur, P, '上午', item, i + 1, Math.min(pomos, 2)));
      }
    });

    cur += 15;
    blocks.push(makeBreakBlock(cur - 15, cur, 15, '上午', '休息/活动'));

    // 上午二段：剩余高专注
    highFocusItems.slice(2).forEach(item => {
      if (cur < 12 * 60) {
        const start = cur; cur += P;
        blocks.push(makeStudyBlock(start, cur, P, '上午', item, 1, 1));
      }
    });

    blocks.push(makeBreakBlock(12 * 60, 14 * 60, 120, '午休', '午餐/午休'));

    // ==== 下午：语言类 ====
    cur = 14 * 60;

    langItems.forEach((item, idx) => {
      const pomos = Math.max(1, Math.ceil(item.estimatedMinutes / P));
      for (let i = 0; i < Math.min(pomos, 2); i++) {
        if (cur < 17.5 * 60) {
          const start = cur; cur += P;
          blocks.push(makeStudyBlock(start, cur, P, '下午', item, i + 1, Math.min(pomos, 2)));
        }
      }
      if (idx < langItems.length - 1) {
        cur += 10;
        blocks.push(makeBreakBlock(cur - 10, cur, 10, '下午', '短暂休息'));
      }
    });

    otherItems.forEach(item => {
      if (cur < 17.5 * 60) {
        const start = cur; cur += P;
        blocks.push(makeStudyBlock(start, cur, P, '下午', item, 1, 1));
      }
    });
  }

  // ==== 晚上：复习和错题 (所有日类型) ====
  if (!isWeekend) {
    // 上学日晚上
    let cur = 19 * 60;

    // 晚上一块：数学/物理
    highFocusItems.slice(0, 1).forEach(item => {
      const start = cur; cur += P;
      blocks.push(makeStudyBlock(start, cur, P, '晚上', item, 1, 1));
    });

    cur += 10;
    // 晚上二块：语言类
    langItems.slice(0, 2).forEach(item => {
      if (cur < 21.5 * 60) {
        const start = cur; cur += P;
        blocks.push(makeStudyBlock(start, cur, P, '晚上', item, 1, 1));
      }
    });
  } else {
    // 周末晚上：当日回顾
    const eveStart = 19 * 60;
    blocks.push({
      type: 'study',
      time: `${formatTimeBlock(eveStart)} - ${formatTimeBlock(eveStart + P)}`,
      duration: P,
      period: '晚上',
      subject: 'mixed',
      subjectName: '综合',
      title: '当日回顾复习',
      description: '回顾当天所有学习内容，整理笔记',
      difficulty: 'medium',
      exercises: 5,
      pomodoroIndex: 1,
      pomodoroTotal: 2,
    });
  }

  // 错题整理
  const currentPhaseId = currentPhase ? currentPhase.id : '';
  const isSprint = currentPhaseId.includes('phase_3') || currentPhaseId.includes('sprint');
  const errorDuration = isSprint ? POMODORO : 20;

  let errorStart;
  if (!isWeekend) {
    errorStart = 19 * 60 + POMODORO + 10 + (langItems.length > 0 ? POMODORO : 0) + (langItems.length > 1 ? 5 : 0);
  } else {
    errorStart = 19 * 60 + POMODORO + 5;
  }

  blocks.push({
    type: 'study',
    time: `${formatTimeBlock(errorStart)} - ${formatTimeBlock(errorStart + errorDuration)}`,
    duration: errorDuration,
    period: '晚上',
    subject: 'all',
    subjectName: '综合',
    title: '错题整理',
    description: '整理当天错题，分析错误原因，录入错题本',
    difficulty: 'medium',
    exercises: 0,
    isErrorReview: true,
    pomodoroIndex: 1,
    pomodoroTotal: 1,
  });

  // ==== 娱乐时间 ====
  const entStart = errorStart + errorDuration + 5;
  const entDuration = calculatePhaseEntertainment(currentPhase, dayType);
  blocks.push({
    type: 'entertainment',
    time: `${formatTimeBlock(entStart)} - ${formatTimeBlock(entStart + entDuration)}`,
    duration: entDuration,
    period: '晚上',
    description: '自由娱乐时间',
    allowedTypes: ['green', 'yellow'],
    limitedTypes: ['red'],
  });

  // ==== 睡前准备 ====
  blocks.push({
    type: 'routine',
    time: `${formatTimeBlock(entStart + entDuration)} - ${schedule.bedtime}`,
    duration: 30,
    period: '晚上',
    description: '洗漱/睡前准备',
  });

  return blocks;
}

function makeStudyBlock(startMin, endMin, duration, period, item, pomoIdx, pomoTotal) {
  return {
    type: 'study',
    time: `${formatTimeBlock(startMin)} - ${formatTimeBlock(endMin)}`,
    duration,
    period,
    subject: item.knowledgePoint.subject,
    subjectName: item.knowledgePoint.subjectName,
    title: item.knowledgePoint.name,
    description: `学习${item.knowledgePoint.subjectName} - ${item.knowledgePoint.name}`,
    difficulty: item.knowledgePoint.difficulty,
    recommendedVideos: item.recommendedVideos || [],
    exercises: Math.floor((item.exercises || 0) / pomoTotal),
    pomodoroIndex: pomoIdx,
    pomodoroTotal: pomoTotal,
  };
}

function makeBreakBlock(startMin, endMin, duration, period, desc) {
  return {
    type: 'break',
    time: `${formatTimeBlock(startMin)} - ${formatTimeBlock(endMin)}`,
    duration,
    period,
    description: desc,
  };
}

function formatTimeBlock(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildTasksFromTimeBlocks(timeBlocks) {
  return timeBlocks
    .filter(b => b.type === 'study')
    .map(b => ({
      id: generateTaskId(),
      subject: b.subject,
      type: b.isErrorReview
        ? TASK_TYPES.ERROR
        : (b.recommendedVideos && b.recommendedVideos.length > 0 ? TASK_TYPES.VIDEO : TASK_TYPES.PRACTICE),
      title: b.title,
      description: b.description,
      duration: b.duration,
      difficulty: b.difficulty,
      timeSlot: b.time,
      period: b.period,
      status: 'pending',
      exercises: b.exercises || 0,
      videoId: b.recommendedVideos && b.recommendedVideos[0] ? b.recommendedVideos[0].id : null,
      pomodoroIndex: b.pomodoroIndex || 1,
      pomodoroTotal: b.pomodoroTotal || 1,
    }));
}

/**
 * 按阶段动态计算娱乐时间
 * Phase 3 / sprint 阶段压缩娱乐时间
 */
function calculatePhaseEntertainment(currentPhase, dayType) {
  const base = ENTERTAINMENT_CONFIG.baseDuration[dayType] || ENTERTAINMENT_CONFIG.baseDuration.weekday;
  if (!currentPhase) return base;

  const phaseId = currentPhase.id || '';
  if (phaseId.includes('phase_3') || phaseId.includes('sprint') || phaseId === 'final_sprint') {
    return Math.max(ENTERTAINMENT_CONFIG.baseDuration.sprint || 30, base - 15);
  }
  if (phaseId.includes('phase_2') || phaseId.includes('intensive')) {
    return Math.max(30, base - 5);
  }
  return base;
}

function generateFallbackDailyPlan(date) {
  const targetDate = formatDate(date);
  const dayType = getDayType(date);
  const blocks = [
    {
      type: 'study', time: '19:00 - 19:30', duration: 30, period: '晚上',
      subject: 'math', subjectName: '数学', title: '数学基础练习',
      description: '完成基础数学练习题', difficulty: 'easy', exercises: 10,
      pomodoroIndex: 1, pomodoroTotal: 1,
    },
    {
      type: 'study', time: '19:40 - 20:10', duration: 30, period: '晚上',
      subject: 'physics', subjectName: '物理', title: '物理基础练习',
      description: '完成基础物理练习题', difficulty: 'easy', exercises: 10,
      pomodoroIndex: 1, pomodoroTotal: 1,
    },
    {
      type: 'study', time: '20:20 - 20:50', duration: 30, period: '晚上',
      subject: 'english', subjectName: '英语', title: '英语基础练习',
      description: '完成基础英语练习题', difficulty: 'easy', exercises: 10,
      pomodoroIndex: 1, pomodoroTotal: 1,
    },
    {
      type: 'study', time: '21:00 - 21:20', duration: 20, period: '晚上',
      subject: 'all', subjectName: '综合', title: '错题整理',
      description: '整理今天的错题', difficulty: 'medium', exercises: 0,
      isErrorReview: true, pomodoroIndex: 1, pomodoroTotal: 1,
    },
    { type: 'entertainment', time: '21:30 - 22:15', duration: 45, period: '晚上', description: '自由娱乐时间' },
    { type: 'routine', time: '22:15 - 23:00', duration: 45, period: '晚上', description: '洗漱/睡前准备' },
  ];

  return {
    id: `plan_${targetDate}`, date: targetDate, type: dayType,
    phaseId: 'default', phaseName: '常规学习', dayInPhase: null, phaseFocus: '平衡发展',
    daysUntilExam: getDaysUntilExam(),
    schedule: blocks,
    tasks: buildTasksFromTimeBlocks(blocks),
    totalStudyMinutes: 110, totalPomodoros: 3,
    entertainmentMinutes: 45, restBreakMinutes: 0,
    sleepTime: '23:00', wakeUpTime: '06:00',
    entertainment: { base: 45, adjusted: 45, remaining: 45, details: [] },
    knowledgeItems: [],
    isFallback: true,
    createdAt: new Date().toISOString(),
  };
}

// ========== 每周 / 阶段计划 ==========

export function generateWeeklyPlan(learningPath, weekStart = new Date()) {
  try {
    const startDate = new Date(weekStart);
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dayPlan = generateDailyPlan(learningPath, { date: currentDate, dayIndex: i });
      days.push({ date: formatDate(currentDate), dayOfWeek: i + 1, isWeekend: i >= 5, plan: dayPlan });
    }

    const totalStudy = days.reduce((sum, d) => sum + d.plan.totalStudyMinutes, 0);
    const totalEnt = days.reduce((sum, d) => sum + d.plan.entertainmentMinutes, 0);

    return {
      id: `week_${formatDate(startDate)}`,
      startDate: formatDate(startDate),
      endDate: formatDate(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)),
      days,
      totalStudyTime: totalStudy,
      totalEntertainment: totalEnt,
      summary: {
        weekdayStudyTime: days.slice(0, 5).reduce((sum, d) => sum + d.plan.totalStudyMinutes, 0),
        weekendStudyTime: days.slice(5, 7).reduce((sum, d) => sum + d.plan.totalStudyMinutes, 0),
      },
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('生成每周计划失败:', error);
    return {
      id: `week_${formatDate(new Date())}`,
      startDate: formatDate(new Date()),
      endDate: formatDate(new Date()),
      days: [], totalStudyTime: 0, totalEntertainment: 0,
      summary: {}, createdAt: new Date().toISOString(),
    };
  }
}

export function generatePhasePlan(learningPath, phaseId = null) {
  try {
    const phase = phaseId
      ? (learningPath && learningPath.phases ? learningPath.phases.find(p => p.id === phaseId) : null)
      : (learningPath && learningPath.phases ? learningPath.phases[0] : null);
    if (!phase) throw new Error('阶段未找到');

    return {
      phase: { id: phase.id, name: phase.name, focus: phase.focus, totalDays: phase.totalDays, description: phase.description },
      dailyPlan: phase.dailyPlan,
      milestones: phase.milestones,
      totalExercises: phase.totalExercises,
      totalVideos: phase.totalVideos,
      strategy: phase.strategy,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('生成阶段计划失败:', error);
    return {
      phase: { id: 'unknown', name: '未知', focus: '', totalDays: 0, description: '' },
      dailyPlan: [], milestones: [], totalExercises: 0, totalVideos: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

export function adjustPlanBasedOnPerformance(plan, performanceData) {
  try {
    if (!plan) throw new Error('计划不能为空');
    if (!performanceData) return plan;

    const { completionRate = 70, consecutiveGoodDays = 0, consecutiveBadDays = 0 } = performanceData;
    const adjustedPlan = { ...plan };
    const adjustments = [];

    if (completionRate > 90 && adjustedPlan.entertainment) {
      adjustedPlan.entertainment.adjusted = Math.min(adjustedPlan.entertainment.adjusted + 15, 120);
      adjustedPlan.entertainmentMinutes = adjustedPlan.entertainment.adjusted;
      adjustments.push({ type: 'reward', reason: '完成率超过90%', effect: '娱乐时间+15分钟' });
    }
    if (completionRate < 60 && adjustedPlan.entertainment) {
      adjustedPlan.entertainment.adjusted = Math.max(15, adjustedPlan.entertainment.adjusted - 15);
      adjustedPlan.entertainmentMinutes = adjustedPlan.entertainment.adjusted;
      adjustments.push({ type: 'adjust', reason: '完成率低于60%', effect: '娱乐时间-15分钟' });
    }
    if (consecutiveGoodDays >= 3) {
      adjustments.push({ type: 'unlock', reason: '连续3天表现优秀', effect: '可解锁新内容预习' });
    }
    if (consecutiveBadDays >= 3) {
      adjustments.push({ type: 'force_review', reason: '连续3天表现不佳', effect: '强制复习基础知识' });
    }

    adjustedPlan.adjustments = adjustments;
    adjustedPlan.adjustedAt = new Date().toISOString();
    return adjustedPlan;
  } catch (error) {
    console.error('调整计划失败:', error);
    return plan;
  }
}

// ===================================================================
//  艾宾浩斯遗忘曲线复习系统
// ===================================================================

/** 艾宾浩斯复习间隔（天）：第1天、2天、4天、7天、15天、30天 */
const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30];

/**
 * 获取本地日期字符串（YYYY-MM-DD）
 * 避免 toISOString() 返回 UTC 日期导致跨日边界差一天的问题
 * @param {Date} date - JavaScript Date 对象
 * @returns {string} 本地日期字符串
 */
function getLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 为错题生成艾宾浩斯复习调度计划
 *
 * 基于错题添加日期 (addedAt)，按标准间隔 [1, 2, 4, 7, 15, 30] 天
 * 计算出全部 6 个复习日期、当前间隔及下一次复习日期。
 * P2-006 修复：改用本地时间计算，避免 toISOString() UTC 日期导致跨日差一天。
 *
 * @param {{ addedAt?: string }} wrongAnswerItem - 错题对象，至少包含 addedAt (ISO 字符串)
 * @returns {{
 *   currentInterval: number,
 *   reviewDates: string[],
 *   nextReviewDate: string,
 *   stage: number,
 * }} 复习调度对象
 */
export function scheduleReview(wrongAnswerItem) {
  const addedAt = wrongAnswerItem?.addedAt || new Date().toISOString();
  const baseDate = new Date(addedAt);

  const reviewDates = EBBINGHAUS_INTERVALS.map(interval => {
    // P2-006 修复：使用本地时间计算日期，而非 UTC
    const d = new Date(baseDate);
    d.setDate(d.getDate() + interval);
    return getLocalDateString(d);
  });

  return {
    currentInterval: EBBINGHAUS_INTERVALS[0],
    reviewDates,
    nextReviewDate: reviewDates[0],
    stage: 0,
  };
}

/**
 * 过滤出今日待复习的错题
 *
 * 筛选 reviewState.nextReviewDate <= 今天 且尚未完成全部复习的错题。
 *
 * @param {Array<Object>} wrongAnswers - 错题数组
 * @returns {Array<Object>} 今日到期需要复习的错题列表
 */
export function getTodayReviews(wrongAnswers) {
  if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) return [];

  // [P2-006修复] 使用本地时间获取今天日期字符串，避免 UTC 凌晨差一天
  const today = getLocalDateString(new Date());

  return wrongAnswers.filter(wa => {
    if (!wa || !wa.reviewState) return false;
    const { nextReviewDate, completedAll } = wa.reviewState;
    if (completedAll) return false;
    if (!nextReviewDate) return false;
    return nextReviewDate <= today;
  });
}

/**
 * 标记错题复习结果，根据艾宾浩斯间隔计算下一次复习日期
 *
 * - 记住了 (remembered = true)：推进到下一间隔阶段 (stage+1)
 * - 没记住 (remembered = false)：回退到第一阶段重新开始 (stage=0)
 * - 全部 6 阶段完成后标记 completedAll = true
 *
 * @param {Object} wrongAnswer - 错题对象
 * @param {boolean} remembered - 本次复习是否记住了
 * @returns {Object} 更新后的错题对象（含新的 reviewState）
 */
export function markReviewed(wrongAnswer, remembered) {
  if (!wrongAnswer) return wrongAnswer;

  const reviewState = wrongAnswer.reviewState || {};
  const currentStage = reviewState.stage != null ? reviewState.stage : 0;
  // [P2-006修复] 使用本地时间获取今天日期，避免 UTC 凌晨差一天
  const now = new Date();
  const today = getLocalDateString(now);

  let newStage;
  let completedAll = false;

  if (remembered) {
    // 记住了 → 推进到下一间隔阶段
    newStage = currentStage + 1;
    if (newStage >= EBBINGHAUS_INTERVALS.length) {
      completedAll = true;
      newStage = EBBINGHAUS_INTERVALS.length - 1;
    }
  } else {
    // 没记住 → 从第 1 天间隔重新开始
    newStage = 0;
  }

  const baseDate = new Date(wrongAnswer.addedAt || now);

  // 基于 addedAt 重新计算全部 reviewDates（与 scheduleReview 一致）
  const reviewDates = EBBINGHAUS_INTERVALS.map(interval => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + interval);
    // [P2-006修复] 使用本地时间，避免 UTC 跨日差一天
    return getLocalDateString(d);
  });

  // 下一次复习日期 = 今天 + 当前新阶段的间隔
  const nextInterval = EBBINGHAUS_INTERVALS[newStage] || EBBINGHAUS_INTERVALS[0];
  const nextReviewDateObj = new Date();
  nextReviewDateObj.setDate(nextReviewDateObj.getDate() + nextInterval);
  // [P2-006修复] 使用本地时间
  const nextReviewDate = getLocalDateString(nextReviewDateObj);

  const reviewEntry = {
    date: today,
    stage: currentStage,
    interval: EBBINGHAUS_INTERVALS[currentStage] || 0,
    remembered,
  };

  const newReviewHistory = [...(reviewState.reviewHistory || []), reviewEntry];

  return {
    ...wrongAnswer,
    reviewState: {
      currentInterval: nextInterval,
      reviewDates,
      nextReviewDate,
      lastReviewed: today,
      reviewHistory: newReviewHistory,
      consecutiveRemembered: remembered ? (reviewState.consecutiveRemembered || 0) + 1 : 0,
      completedAll,
      stage: newStage,
    },
    reviewCount: (wrongAnswer.reviewCount || 0) + 1,
  };
}

/**
 * 获取错题本复习统计数据
 *
 * @param {Array<Object>} wrongAnswers - 错题数组
 * @returns {{
 *   total: number,
 *   reviewed: number,
 *   remembered: number,
 *   forgotten: number,
 *   overdue: number,
 * }} 复习统计
 */
export function getReviewStats(wrongAnswers) {
  if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
    return { total: 0, reviewed: 0, remembered: 0, forgotten: 0, overdue: 0 };
  }

  // [P2-006修复] 使用本地时间获取今天日期，避免 UTC 凌晨差一天
  const today = getLocalDateString(new Date());

  let reviewed = 0;
  let remembered = 0;
  let forgotten = 0;
  let overdue = 0;

  wrongAnswers.forEach(wa => {
    const rs = wa?.reviewState;
    if (!rs) return;

    // 是否至少复习过一次
    if (rs.lastReviewed || (rs.reviewHistory && rs.reviewHistory.length > 0)) {
      reviewed++;
    }

    // 最近一次复习结果
    if (rs.reviewHistory && rs.reviewHistory.length > 0) {
      const lastReview = rs.reviewHistory[rs.reviewHistory.length - 1];
      if (lastReview.remembered) {
        remembered++;
      } else {
        forgotten++;
      }
    }

    // 逾期未复习（nextReviewDate 已过且未完成全部阶段）
    if (!rs.completedAll && rs.nextReviewDate && rs.nextReviewDate < today) {
      overdue++;
    }
  });

  return {
    total: wrongAnswers.length,
    reviewed,
    remembered,
    forgotten,
    overdue,
  };
}

// ========== 导出 ==========

export { SHAANXI_EXAM_SYLLABUS, PHASES, TASK_TYPES, TASK_DURATIONS, DIFFICULTY_LEVELS, DEFAULT_SUBJECT_WEIGHTS, EBBINGHAUS_INTERVALS };

export default {
  getDaysUntilExam,
  getCurrentPhaseInfo,
  generateTaskId,
  formatTime,
  getScheduleTemplate,
  calculateEntertainmentTime,
  calculateSubjectWeights,
  adjustDifficulty,
  calculateRewardPunishment,
  generateLearningPath,
  generateDailyPlan,
  generateWeeklyPlan,
  generatePhasePlan,
  adjustPlanBasedOnPerformance,
  scheduleReview,
  getTodayReviews,
  markReviewed,
  getReviewStats,
  SHAANXI_EXAM_SYLLABUS,
  PHASES,
  TASK_TYPES,
  TASK_DURATIONS,
  DIFFICULTY_LEVELS,
  DEFAULT_SUBJECT_WEIGHTS,
  EBBINGHAUS_INTERVALS,
};
