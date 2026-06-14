/**
 * 夸克网盘课程资源来源配置
 *
 * 本文件列出所有已发现的夸克网盘教育分享链接。
 * 这些链接与现有分享 (e622c8366282) 互补，覆盖陕西中考备考所需的全部科目和资料类型。
 *
 * 现有分享 (e622c8366282) 已包含：
 *   - 乐乐课堂 (数学/物理/化学/英语)
 *   - 洋葱学院全套
 *   - 万唯中考词汇
 *   - 作业帮数学52招
 *   - 孙维刚初中数学
 *   - 英语课程多种
 *
 * 使用方式：每个来源包含 shareCode，可通过夸克网盘API获取文件列表并解析课程结构。
 */

export const COURSE_SOURCES = [
  // ==================== 陕西中考真题 / 模拟题 ====================
  {
    id: 'shaanxi-real-exams-2013-2025',
    shareCode: '171abfba6b19',
    title: '陕西省历年中考真题汇编 (2013-2025)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '九年级',
    type: 'exam_paper',
    description: '陕西省2013-2025年中考真题全科汇总，含答案和解析。中考备考最核心资源，了解陕西中考命题规律和难度。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'shaanxi-2025-exams-all',
    shareCode: '04c91a519ae8',
    title: '2025年陕西省中考真题答案 (全科汇总)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '九年级',
    type: 'exam_paper',
    description: '2025年最新陕西省中考真题全科汇总，含详细答案解析。最新年份真题，参考价值最高。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'shaanxi-2025-english',
    shareCode: '61a4798a2030',
    title: '2025年陕西中考英语真题',
    subjects: ['english'],
    grade: '九年级',
    type: 'exam_paper',
    description: '2025年陕西省中考英语真题，含听力原文和答案。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 万唯中考系列 (陕西专版) ====================
  {
    id: 'wanwei-shaanxi-math-research-2026',
    shareCode: 'bf4f3565b0ef',
    title: '2026陕西《万唯试题研究》数学',
    subjects: ['math'],
    grade: '九年级',
    type: 'workbook',
    description: '万唯中考·试题研究·数学 陕西专版。万唯是陕西中考最权威的备考教辅，试题研究系列系统梳理考点。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'wanwei-shaanxi-math-miankan-2026',
    shareCode: '42dbf3d15367',
    title: '2026陕西《万唯中考面对面》数学',
    subjects: ['math'],
    grade: '九年级',
    type: 'workbook',
    description: '万唯中考·面对面·数学 陕西专版。考点对接练习，夯实基础。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'wanwei-shaanxi-physics-research-2026',
    shareCode: 'fceff413aa21',
    title: '2026陕西《万唯试题研究》物理',
    subjects: ['physics'],
    grade: '九年级',
    type: 'workbook',
    description: '万唯中考·试题研究·物理 陕西专版。物理题型专项训练。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'wanwei-shaanxi-physics-miankan-2026',
    shareCode: '5dc6b985cd36',
    title: '2026陕西《万唯中考面对面》物理',
    subjects: ['physics'],
    grade: '九年级',
    type: 'workbook',
    description: '万唯中考·面对面·物理 陕西专版。物理基础巩固练习。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'wanwei-blackwhite-2025',
    shareCode: '988fcaeda466',
    title: '2025万唯中考·黑白卷 (陕西7科全套)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics'],
    grade: '九年级',
    type: 'exam_paper',
    description: '万唯中考黑白卷，考前模拟冲刺卷，黑卷+白卷各一套，含详细解析。中考前必刷。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 初中网课视频 ====================
  {
    id: 'junior-all-webcast-2026',
    shareCode: '12d3be0f3d5a',
    title: '2026版初中网课 7-9年级全套',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '七八九年级',
    type: 'video_course',
    description: '2026版初中全年级全科网课合集。包含名师讲解视频，系统学习各科知识点，适合预习+复习。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'junior-grade8-webcast-2026',
    shareCode: '30905f280a5b',
    title: '2026版初二(八年级)网课',
    subjects: ['chinese', 'math', 'english', 'physics', 'history', 'politics', 'biology', 'geography'],
    grade: '八年级',
    type: 'video_course',
    description: '2026版初二(八年级)网课合集，针对性最强，直接匹配当前学习进度。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'junior-grade9-webcast-2026',
    shareCode: '90fa9e00f712',
    title: '2026版初三(九年级)网课',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics'],
    grade: '九年级',
    type: 'video_course',
    description: '2026版初三(九年级)网课合集。含中考复习专题，适合提前接触初三内容和一轮复习。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 八年级下册专项 ====================
  {
    id: 'grade8b-main-subjects',
    shareCode: '9e66f8753aa7',
    title: '八年级下册语数英 (知识点+同步专项+期中+期末+月考) 多版本',
    subjects: ['chinese', 'math', 'english'],
    grade: '八年级下册',
    type: 'workbook',
    description: '八年级下册三门主科的同步学习资料包。包含知识点总结、同步练习、单元测试、期中/期末/月考试卷。多教材版本可选。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'grade8b-xiaosimen',
    shareCode: 'f7f599100c41',
    title: '八年级下册小四门 (单元测试+知识点总结+同步专项练习) 多版本',
    subjects: ['politics', 'history', 'biology', 'geography'],
    grade: '八年级下册',
    type: 'workbook',
    description: '八年级下册道法、历史、生物、地理四科的同步资料包。包含单元测试卷、知识点总结、同步专项练习。陕西中考虽然只考语数英物化+政史，但生物/地理在八年级有学业水平考试。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 53 系列 (5年中考3年模拟) ====================
  {
    id: '53-knowledge-list-chinese',
    shareCode: '8465202f6cb1',
    title: '2026版《53初中知识清单》语文',
    subjects: ['chinese'],
    grade: '七八九年级',
    type: 'reference',
    description: '5年中考3年模拟·初中知识清单·语文。系统梳理初中语文全部知识点。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: '53-knowledge-list-math',
    shareCode: '57bc6f6f13ec',
    title: '2026版《53初中知识清单》数学',
    subjects: ['math'],
    grade: '七八九年级',
    type: 'reference',
    description: '5年中考3年模拟·初中知识清单·数学。全国通用版，知识点+典型例题。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: '53-knowledge-list-politics',
    shareCode: '4afc4b131376',
    title: '2026版《53初中知识清单》道德与法治',
    subjects: ['politics'],
    grade: '七八九年级',
    type: 'reference',
    description: '5年中考3年模拟·初中知识清单·道德与法治。陕西道法为开卷考试，知识清单是开卷必备工具书。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: '53-knowledge-list-history',
    shareCode: 'ba0521446c4b',
    title: '2026版《53初中知识清单》历史',
    subjects: ['history'],
    grade: '七八九年级',
    type: 'reference',
    description: '5年中考3年模拟·初中知识清单·历史。系统梳理中外历史知识点。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 中考总复习 ====================
  {
    id: 'zhongkao-review-knowledge-points',
    shareCode: 'adcd7476d36b',
    title: '中考总复习专题知识要点',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '九年级',
    type: 'reference',
    description: '中考总复习专题知识要点汇总，九科全覆盖。适合系统复习和查漏补缺。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'zhongkao-review-pack',
    shareCode: 'fe592cd7eb49',
    title: '中考复习资料包 (全科)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics'],
    grade: '九年级',
    type: 'reference',
    description: '中考综合复习资料包，含各科复习要点、答题技巧、高频考点等。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'zhongkao-national-exams',
    shareCode: '6c631dec0322',
    title: '全国各地中考历年真题汇总',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics'],
    grade: '九年级',
    type: 'exam_paper',
    description: '全国各地中考历年真题汇编。用于拓展视野，了解不同省份的命题思路，但冲刺阶段应以陕西真题为主。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 初中全科综合资源 ====================
  {
    id: 'all-subjects-dark-memory',
    shareCode: '2b289bfe29bf',
    title: '初中全科考点暗记 睡前5分钟 (9科合集)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '七八九年级',
    type: 'reference',
    description: '初中全科考点快速记忆卡片/音频。设计用于睡前5分钟快速回顾，利用记忆曲线巩固考点。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'all-subjects-prep-review',
    shareCode: '34c1790107b4',
    title: '初中预习复习资料大礼包 (7-9年级全科)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '七八九年级',
    type: 'reference',
    description: '初中全年级全科预习+复习资料大合集。适合假期提前预习和考前集中复习。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'all-subjects-top-notes',
    shareCode: '96e6de19f910',
    title: '初中状元笔记 (全科)',
    subjects: ['chinese', 'math', 'english', 'physics', 'chemistry', 'history', 'politics', 'biology', 'geography'],
    grade: '七八九年级',
    type: 'reference',
    description: '初中各科学霸/状元笔记。手写笔记风格，包含知识框架、易错点、解题技巧等。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 趣味学习 / 辅助资源 ====================
  {
    id: 'funny-physics-144',
    shareCode: '4069e822c955',
    title: '初中爆笑物理全套144集',
    subjects: ['physics'],
    grade: '八年级',
    type: 'video_course',
    description: '爆笑物理动画课程144集，用幽默动画讲解物理知识。适合激发物理学习兴趣，补充枯燥学习之余的趣味输入。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'geometry-models-76',
    shareCode: '28bc7ea68f8c',
    title: '初中几何76类解题模型解析',
    subjects: ['math'],
    grade: '七八九年级',
    type: 'reference',
    description: '初中几何76类常见解题模型归纳。几何是陕西中考数学的重难点，模型化学习可快速提升解题能力。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'math-formula-advanced',
    shareCode: '3c0ed5764567',
    title: '初中数学公式大全+二级结论速查',
    subjects: ['math'],
    grade: '七八九年级',
    type: 'reference',
    description: '初中数学全部公式整理+实用二级结论。快速查阅工具，适合考前速览和做题时备查。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 化学预习 (九年级内容，八年级暑假必备) ====================
  {
    id: 'chemistry-summer-prep-9th',
    shareCode: '01e73a7f3d11',
    title: '九年级上册化学暑假预习早背晚默42天 (每日一练)',
    subjects: ['chemistry'],
    grade: '九年级上册',
    type: 'workbook',
    description: '九年级化学上册暑假预习计划，42天每日任务。包含早背(知识点记忆)和晚默(默写检测)。非常适合八年级升九年级的暑假使用，化学是新学科，提前预习可建立优势。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'chemistry-animation-course',
    shareCode: '54ee6e2a2e38',
    title: '看动画学初中化学 (全册)',
    subjects: ['chemistry'],
    grade: '九年级',
    type: 'video_course',
    description: '动画形式讲解初中化学全部知识点，生动有趣适合入门。零基础学生也能轻松理解。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 地理 / 生物 会考 ====================
  {
    id: 'wanwei-bio-geo-huikao',
    shareCode: '258559f170fc',
    title: '万唯初中生物地理会考高频考点真题分类',
    subjects: ['biology', 'geography'],
    grade: '八年级',
    type: 'workbook',
    description: '万唯品牌·生物/地理会考专项资料。包含高频考点梳理和真题分类训练。陕西八年级学生需要参加生物和地理学业水平考试。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 2026版示例卷 (官方命题方向) ====================
  {
    id: 'shaanxi-2026-sample-chinese',
    shareCode: 'f045ed3f965a',
    title: '2026陕西中考各科示例卷 - 语文',
    subjects: ['chinese'],
    grade: '九年级',
    type: 'exam_paper',
    description: '2026年陕西省中考语文示例卷。由陕西省教育考试院发布，展示最新命题方向和题型变化。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'shaanxi-2026-sample-math',
    shareCode: '8ffbcb37e12c',
    title: '2026陕西中考各科示例卷 - 数学',
    subjects: ['math'],
    grade: '九年级',
    type: 'exam_paper',
    description: '2026年陕西省中考数学示例卷。了解最新题型结构和难度分布。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'shaanxi-2026-sample-physics',
    shareCode: '9d1698d79610',
    title: '2026陕西中考各科示例卷 - 物理',
    subjects: ['physics'],
    grade: '九年级',
    type: 'exam_paper',
    description: '2026年陕西省中考物理示例卷。把握物理最新命题趋势。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },

  // ==================== 英语专项补充 ====================
  {
    id: 'english-grammar-systematic',
    shareCode: '2e23655ca93c',
    title: '英语语法系统精讲系列',
    subjects: ['english'],
    grade: '七八九年级',
    type: 'video_course',
    description: '英语语法系统讲解视频课程。完整覆盖初中英语全部语法点，适合系统梳理语法知识体系。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
  {
    id: 'english-vocab-audio',
    shareCode: 'aee2a72bc021',
    title: '英语词汇多维记忆音频课程',
    subjects: ['english'],
    grade: '七八九年级',
    type: 'audio',
    description: '英语词汇记忆音频课程，利用听力和联想记忆法辅助背单词。可搭配每日晨读使用。',
    source: '微信公众号合集',
    verifiedDate: '2026-06',
  },
];

// ==================== 辅助函数 ====================

/**
 * 按科目筛选课程来源
 * @param {string} subjectId - 科目ID (如 'math', 'english')
 * @returns {Array} 匹配的课程来源
 */
export function getSourcesBySubject(subjectId) {
  return COURSE_SOURCES.filter(s => s.subjects.includes(subjectId));
}

/**
 * 按年级筛选课程来源
 * @param {string} grade - 年级 (如 '八年级下册', '九年级')
 * @returns {Array} 匹配的课程来源
 */
export function getSourcesByGrade(grade) {
  return COURSE_SOURCES.filter(s => s.grade.includes(grade) || s.grade === '七八九年级');
}

/**
 * 按类型筛选课程来源
 * @param {string} type - 类型 (exam_paper | workbook | video_course | reference | audio)
 * @returns {Array} 匹配的课程来源
 */
export function getSourcesByType(type) {
  return COURSE_SOURCES.filter(s => s.type === type);
}

/**
 * 获取所有陕西中考真题来源
 * @returns {Array} 陕西中考真题相关的课程来源
 */
export function getShaanxiExamSources() {
  return COURSE_SOURCES.filter(s =>
    s.type === 'exam_paper' &&
    (s.title.includes('陕西') || s.title.includes('陕西省'))
  );
}

/**
 * 获取所有万唯系列来源
 * @returns {Array} 万唯品牌相关的课程来源
 */
export function getWanweiSources() {
  return COURSE_SOURCES.filter(s => s.title.includes('万唯'));
}

/**
 * 获取建议优先保存的来源 (TOP 10)
 * 按重要性排序：陕西真题 > 万唯教辅 > 八年级下册 > 网课 > 其他
 * @param {number} limit - 返回数量上限
 * @returns {Array} 优先课程来源
 */
export function getPrioritySources(limit = 10) {
  const priorityOrder = [
    'shaanxi-real-exams-2013-2025',
    'shaanxi-2025-exams-all',
    'wanwei-blackwhite-2025',
    'wanwei-shaanxi-math-research-2026',
    'wanwei-shaanxi-physics-research-2026',
    'shaanxi-2026-sample-math',
    'shaanxi-2026-sample-physics',
    'shaanxi-2026-sample-chinese',
    'grade8b-main-subjects',
    'grade8b-xiaosimen',
    'junior-grade8-webcast-2026',
    'chemistry-summer-prep-9th',
    'wanwei-bio-geo-huikao',
    'zhongkao-review-knowledge-points',
    'all-subjects-dark-memory',
    'geometry-models-76',
    'funny-physics-144',
  ];

  return priorityOrder
    .map(id => COURSE_SOURCES.find(s => s.id === id))
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * 获取所有课程来源的分类统计
 * @returns {Object} { byType, bySubject, byGrade }
 */
export function getSourceStats() {
  const stats = {
    byType: {},
    bySubject: {},
    byGrade: {},
    total: COURSE_SOURCES.length,
  };

  COURSE_SOURCES.forEach(source => {
    // 按类型统计
    stats.byType[source.type] = (stats.byType[source.type] || 0) + 1;

    // 按科目统计
    source.subjects.forEach(subj => {
      stats.bySubject[subj] = (stats.bySubject[subj] || 0) + 1;
    });

    // 按年级统计
    stats.byGrade[source.grade] = (stats.byGrade[source.grade] || 0) + 1;
  });

  return stats;
}

export default COURSE_SOURCES;
