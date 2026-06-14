/**
 * 应用全局配置
 *
 * 这是应用的核心配置文件，包含所有可配置的参数
 */

// 应用信息
export const APP_INFO = {
  name: '私人导师',
  version: '1.0.0',
  description: '陕西省中考私人导师APP - 科学育娃，精准提分',
};

// 开发者配置
export const DEVELOPER_CONFIG = {
  // 开发者模式（调试用）
  isDeveloperMode: __DEV__,

  // 日志级别：'debug' | 'info' | 'warn' | 'error'
  logLevel: __DEV__ ? 'debug' : 'error',
};

// ========== 夸克网盘配置 ==========
export const QUARK_CONFIG = {
  // Cookie - 请在此处填入您的夸克网盘Cookie
  //
  // 【如何获取Cookie - 详细步骤】
  // 1. 在电脑上打开 Chrome/Edge 浏览器
  // 2. 访问 https://pan.quark.cn 并登录您的夸克网盘账号
  // 3. 按 F12 打开开发者工具（或右键 -> 检查）
  // 4. 切换到 Network（网络）标签
  // 5. 按 F5 刷新页面
  // 6. 在左侧请求列表中点击任意一个请求
  // 7. 在右侧 Headers（标头）中找到 Request Headers（请求标头）
  // 8. 复制 Cookie 字段的完整值
  // 9. 粘贴到下方的 cookie 字段中
  //
  // 【注意事项】
  // - Cookie 有效期约为 7 天，过期后需要重新获取
  // - 请勿分享您的 Cookie 给他人，以免账号被盗
  // - 如果应用提示"Cookie已过期"，请重复上述步骤获取新Cookie
  //
  // 以下是示例格式（请替换为您的真实Cookie）：
  // cookie: '__puus=xxxxxx; _qk_bx_ck_v1=xxxxxx; _UP_A4A_11_=xxxxxx; ...',
  cookie: '', // <-- 安装后在设置页填写夸克Cookie

  // API基础地址
  apiBaseUrl: 'https://drive-pc.quark.cn/1/clouddrive',
  userApiUrl: 'https://drive-pc.quark.cn/1/user',

  // Cookie有效期（天）
  cookieExpiryDays: 7,

  // 分享链接配置
  shareLinks: {
    // 您提供的分享链接
    main: 'https://pan.quark.cn/s/e622c8366282',
    // 分享码
    shareCode: 'e622c8366282',
  },
};

// ========== 学生信息配置 ==========
export const STUDENT_CONFIG = {
  // 基本信息
  name: '',  // <-- 【建议填写】学生姓名（用于个性化学习报告）
  grade: '八年级',
  school: '',  // <-- 【建议填写】学校名称
  city: '榆林市',
  province: '陕西省',

  // 当前年级
  currentGrade: '八年级下册',
  targetExam: '中考',
  targetDate: '2027-06-15',  // 中考目标日期（假设2027年6月）
};

// ========== 中考科目配置 ==========
export const EXAM_SUBJECTS = {
  // 2026年陕西中考计分科目（参考西安方案）
  // 注意：榆林市可能有不同，请确认当地政策
  subjects: [
    {
      id: 'chinese',
      name: '语文',
      fullName: '语文',
      score: 120,
      examDuration: 150,  // 分钟
      examType: 'closed',  // 闭卷
      icon: 'menu-book',
      color: '#FF6B6B',
    },
    {
      id: 'math',
      name: '数学',
      fullName: '数学',
      score: 120,
      examDuration: 120,
      examType: 'closed',
      icon: 'functions',
      color: '#4ECDC4',
    },
    {
      id: 'english',
      name: '英语',
      fullName: '英语',
      score: 120,
      examDuration: 120,
      examType: 'closed',
      icon: 'language',
      color: '#45B7D1',
      notes: '含听力30分',
    },
    {
      id: 'physics',
      name: '物理',
      fullName: '物理',
      score: 80,
      examDuration: 80,
      examType: 'closed',
      icon: 'science',
      color: '#96CEB4',
    },
    {
      id: 'politics',
      name: '道法',
      fullName: '道德与法治',
      score: 80,
      examDuration: 80,
      examType: 'open',  // 开卷
      icon: 'gavel',
      color: '#FFEAA7',
    },
    {
      id: 'history',
      name: '历史',
      fullName: '历史',
      score: 60,
      examDuration: 60,
      examType: 'closed',
      icon: 'history-edu',
      color: '#DDA0DD',
    },
    {
      id: 'pe',
      name: '体育',
      fullName: '体育与健康',
      score: 60,
      examDuration: 0,  // 实践考试
      examType: 'practice',
      icon: 'fitness-center',
      color: '#FF9800',
    },
  ],

  // 不计入录取但需要考试的科目（八年级考）
  additionalSubjects: [
    {
      id: 'biology',
      name: '生物',
      fullName: '生物学',
      score: 60,
      grade: '八年级',
    },
    {
      id: 'geography',
      name: '地理',
      fullName: '地理',
      score: 60,
      grade: '八年级',
    },
  ],

  // 提前预习的科目（九年级内容）
  previewSubjects: [
    {
      id: 'chemistry',
      name: '化学',
      fullName: '化学',
      score: 60,
      grade: '九年级',
      status: 'preview',  // 预习状态
    },
  ],
};

// ========== 全局科目名称映射（统一所有科目 ID → 中文名） ==========
export const SUBJECT_NAME_MAP = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  politics: '道法',
  history: '历史',
  biology: '生物',
  geography: '地理',
  pe: '体育',
};

/**
 * 根据科目 ID 获取中文显示名称
 * @param {string} subjectId - 科目 ID（如 'math'、'physics'）
 * @returns {string} 中文名，未映射时返回「未知科目」而非英文 ID
 */
export function getSubjectDisplayName(subjectId) {
  if (!subjectId) return '未知科目';
  return SUBJECT_NAME_MAP[subjectId] || '未知科目';
}

// ========== 学习时间配置 ==========
export const STUDY_TIME_CONFIG = {
  // 每日学习时间分配（分钟）
  dailySchedule: {
    // 上学期间（周一至周五）
    weekday: {
      morning: {
        start: '06:00',
        end: '07:00',
        activities: ['起床', '洗漱', '早餐', '晨读'],
        studyTime: 20,  // 晨读20分钟
      },
      school: {
        start: '07:30',
        end: '17:30',
        note: '学校时间',
      },
      evening: {
        start: '19:00',
        end: '21:45',
        activities: [
          { name: '学习时段1', duration: 90, subject: '数学/物理' },
          { name: '休息', duration: 15 },
          { name: '学习时段2', duration: 60, subject: '英语/语文' },
        ],
        totalStudy: 150,  // 2.5小时
      },
      entertainment: {
        start: '21:45',
        end: '22:30',
        duration: 45,  // 45分钟
      },
      sleep: {
        bedtime: '23:00',
        wakeUp: '06:00',
        duration: 7,  // 7小时
      },
    },

    // 周末/假期
    weekend: {
      morning: {
        start: '07:00',
        end: '08:00',
        activities: ['起床', '洗漱', '早餐', '晨读'],
        studyTime: 20,
      },
      studyBlocks: [
        { start: '08:00', end: '10:00', duration: 120, subject: '数学' },
        { start: '10:20', end: '12:00', duration: 100, subject: '物理' },
        { start: '14:00', end: '15:30', duration: 90, subject: '英语' },
        { start: '15:45', end: '17:00', duration: 75, subject: '语文' },
        { start: '19:00', end: '20:30', duration: 90, subject: '化学（预习）' },
      ],
      totalStudy: 475,  // 约8小时
      entertainment: {
        start: '20:30',
        end: '22:00',
        duration: 90,  // 90分钟
      },
      sleep: {
        bedtime: '23:00',
        wakeUp: '07:00',
        duration: 8,  // 8小时
      },
    },
  },

  // 学习时长限制
  limits: {
    maxContinuousStudy: 120,  // 最长连续学习时间（分钟）
    breakDuration: 15,  // 每次休息时长（分钟）
    breakInterval: 50,  // 每学习多久休息一次（分钟）
  },
};

// ========== 娱乐时间配置 ==========
export const ENTERTAINMENT_CONFIG = {
  // 基础娱乐时长（分钟）
  baseDuration: {
    weekday: 45,  // 上学日
    weekend: 90,  // 周末
    holiday: 90,  // 假期
    sprint: 30,   // 冲刺阶段
  },

  // 娱乐类型
  types: {
    green: {
      name: '绿色娱乐',
      description: '健康活动，不计入娱乐时长',
      items: [
        { id: 'sports', name: '体育运动', icon: 'fitness-center', maxDaily: 120 },
        { id: 'outdoor', name: '户外活动', icon: 'directions-walk', maxDaily: 120 },
        { id: 'reading', name: '课外阅读', icon: 'auto-stories', maxDaily: 60 },
        { id: 'family', name: '家庭活动', icon: 'family-restroom', maxDaily: 120 },
      ],
    },
    yellow: {
      name: '黄色娱乐',
      description: '允许，计入娱乐时长',
      items: [
        { id: 'movies', name: '电影/电视', icon: 'movie', maxDaily: 120 },
        { id: 'educational_games', name: '益智游戏', icon: 'extension', maxDaily: 30 },
        { id: 'chat', name: '社交聊天', icon: 'chat', maxDaily: 30 },
        { id: 'bilibili', name: 'B站知识区', icon: 'play-circle', maxDaily: 30 },
      ],
    },
    red: {
      name: '红色娱乐',
      description: '严格限制，计入娱乐时长',
      items: [
        { id: 'douyin', name: '抖音/快手', icon: 'music-video', maxDaily: 30, maxSession: 15 },
        { id: 'games', name: '游戏', icon: 'sports-esports', maxDaily: 45, maxSession: 30 },
        { id: 'short_video', name: '短视频', icon: 'video-library', maxDaily: 30, maxSession: 15 },
        { id: 'social_media', name: '社交媒体', icon: 'share', maxDaily: 30, maxSession: 15 },
      ],
    },
  },

  // 奖励规则
  rewards: {
    completeDailyTask: 30,  // 完成每日任务 +30分钟
    weeklyTestImproved: 60,  // 周测进步 +60分钟
    monthlyTestImproved: 120,  // 月考进步 +120分钟
    extraStudy: 15,  // 主动额外学习 +15分钟
    perfectAttendance: 30,  // 全勤 +30分钟
  },

  // 惩罚规则
  punishments: {
    incompleteTask: -30,  // 未完成任务 -30分钟
    phoneDuringStudy: -45,  // 学习玩手机 -45分钟
    overtime: -2,  // 超时倍数扣除
    lateNight: 'half',  // 熔次日娱乐减半
    copyHomework: 'clear',  // 抄袭作业清零
  },
};

// ========== 作息时间配置 ==========
export const SCHEDULE_CONFIG = {
  // 标准作息
  standard: {
    wakeUp: '06:00',
    bedtime: '23:00',
    sleepDuration: 7,  // 小时
  },

  // 周末作息
  weekend: {
    wakeUp: '07:00',
    bedtime: '23:00',
    sleepDuration: 8,
  },

  // 假期作息
  holiday: {
    wakeUp: '07:30',
    bedtime: '23:00',
    sleepDuration: 8.5,
  },

  // 提醒设置
  reminders: {
    bedtimeWarning: 30,  // 睡前30分钟提醒
    bedtimeAlert: 15,  // 睡前15分钟警告
    wakeUpAlarm: 0,  // 准时闹钟
    wakeUpLate: 30,  // 迟起提醒
  },
};

// ========== 诊断测试配置 ==========
export const DIAGNOSIS_CONFIG = {
  // 测试时长（分钟）
  totalDuration: 110,

  // 科目时长分配
  subjectDuration: {
    math: 30,
    physics: 20,
    english: 25,
    chinese: 20,
    chemistry: 15,
  },

  // 题目数量
  questionCount: {
    math: 25,
    physics: 15,
    english: 20,
    chinese: 15,
    chemistry: 10,
  },

  // 总分
  totalScore: 200,

  // 评分标准
  grading: {
    excellent: { min: 160, max: 200, percentage: [80, 100], label: '优秀' },
    good: { min: 120, max: 159, percentage: [60, 79], label: '良好' },
    average: { min: 80, max: 119, percentage: [40, 59], label: '中等' },
    poor: { min: 0, max: 79, percentage: [0, 39], label: '较差' },
  },

  // 科目权重
  weights: {
    math: 0.35,
    physics: 0.25,
    english: 0.25,
    chinese: 0.10,
    chemistry: 0.05,
  },
};

// ========== AI配置（可选） ==========
export const AI_CONFIG = {
  // 是否启用AI功能
  enabled: false,

  // AI服务提供商
  provider: 'openai',  // 'openai' | 'anthropic' | 'baidu' | 'alibaba'

  // API配置
  api: {
    openai: {
      apiKey: '',  // <-- 填入OpenAI API Key
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com/v1',
    },
    anthropic: {
      apiKey: '',  // <-- 填入Claude API Key
      model: 'claude-3-opus-20240229',
    },
    baidu: {
      apiKey: '',
      secretKey: '',
      model: 'ernie-4.0',
    },
    alibaba: {
      apiKey: '',
      model: 'qwen-max',
    },
  },

  // AI功能开关
  features: {
    smartQA: true,  // 智能答疑
    adaptiveDifficulty: true,  // 自适应难度
    mentalSupport: true,  // 心理辅导
    studyReport: true,  // 学习报告
  },
};

// ========== 存储配置 ==========
export const STORAGE_KEYS = {
  // 用户信息
  STUDENT_INFO: '@student_info',
  STUDY_PLAN: '@study_plan',
  DIAGNOSIS_RESULT: '@diagnosis_result',

  // 夸克配置
  QUARK_COOKIE: '@quark_cookie',
  /** @deprecated 已统一合并到 QUARK_COOKIE 的 JSON { cookie, expiry, savedAt } 格式中，保留定义仅用于旧数据回退读取 */
  QUARK_COOKIE_EXPIRY: '@quark_cookie_expiry',
  COURSE_CACHE: '@course_cache',

  // 学习记录
  STUDY_LOGS: '@study_logs',
  ENTERTAINMENT_LOGS: '@entertainment_logs',
  SLEEP_LOGS: '@sleep_logs',

  // 成绩记录
  TEST_SCORES: '@test_scores',
  REWARD_PUNISHMENT: '@reward_punishment',

  // 娱乐时间状态持久化
  ENTERTAINMENT_STATE: '@entertainment_state',

  // 计时器持久化
  TIMER_STATE: '@timer_state',

  // 设置
  APP_SETTINGS: '@app_settings',
  AI_SETTINGS: '@ai_settings',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  NAV_STATE: '@nav_state',

  // 认证
  AUTH_TOKEN: '@auth_token',
  AUTH_USER: '@auth_user',
};

// ========== 导出所有配置 ==========
export default {
  APP_INFO,
  DEVELOPER_CONFIG,
  QUARK_CONFIG,
  STUDENT_CONFIG,
  EXAM_SUBJECTS,
  STUDY_TIME_CONFIG,
  ENTERTAINMENT_CONFIG,
  SCHEDULE_CONFIG,
  DIAGNOSIS_CONFIG,
  AI_CONFIG,
  STORAGE_KEYS,
};
