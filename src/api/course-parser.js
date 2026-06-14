/**
 * 课程目录解析模块 - 三级课程目录
 *
 * 实现 学科 → 章节 → 知识点 三级树形结构，
 * 支持与诊断结果联动推荐课程，带 AsyncStorage 缓存（1小时有效期）。
 *
 * @module course-parser
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUARK_CONFIG, STORAGE_KEYS } from '../config';
import { getShareToken, getAllShareFiles } from './quark-api';
import { extractShareCode } from './share-link-parser';
import { getCookie } from './cookie-manager';

const TAG = '[CourseParser]';

// ========== 常量 ==========

/** 默认分享码 */
const SHARE_CODE = QUARK_CONFIG.shareLinks.shareCode || 'e622c8366282';

/** 三级树缓存有效期：1小时（毫秒） */
const TREE_CACHE_DURATION = 60 * 60 * 1000;

/** 树缓存键前缀 */
const TREE_CACHE_PREFIX = '@three_level_tree';

/** 视频文件扩展名 */
const VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv',
  '.m3u8', '.ts', '.rmvb', '.rm', '.3gp', '.webm',
];

/** 科目关键词映射 */
const SUBJECT_KEYWORDS = {
  chinese: ['语文', '中文', '古诗', '文言文', '作文', '阅读', '写作'],
  math: ['数学', '代数', '几何', '函数', '方程', '竞赛'],
  english: ['英语', '英文', 'English', '听力', '语法', '词汇', '单词', '口语', '写作'],
  physics: ['物理', '力学', '电学', '光学', '热学', '声学'],
  chemistry: ['化学', '元素', '方程', '有机', '无机'],
  politics: ['道法', '道德', '政治', '法治'],
  history: ['历史', '古代', '近代', '世界史'],
  biology: ['生物', '细胞', '遗传', '生态'],
  geography: ['地理', '地球', '气候', '地形'],
};

/** 科目ID到中文名映射 */
const SUBJECT_DISPLAY_NAMES = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  politics: '道德与法治',
  history: '历史',
  biology: '生物',
  geography: '地理',
  other: '其他',
};

/** 非课程关键词（用于过滤无关文件） */
const NON_COURSE_KEYWORDS = [
  '王者', '异环', 'KeySteam', 'OK影视',
  '.zip', '.apk', 'iOS', '白嫖', 'bug', '.exe', '.rar',
];

/** 章节识别正则 */
const CHAPTER_PATTERNS = [
  /第[一二三四五六七八九十百千\d]+[章课节讲]/,
  /第?\d+[\.、\s]*[章课节讲]/,
  /Unit\s*\d+/i,
  /Chapter\s*\d+/i,
  /专题[一二三四五六七八九十\d]+/,
  /0?\d+[-_\s]+/,
];

// ========== 辅助函数 ==========

/**
 * 判断文件是否为视频
 */
function isVideoFile(name) {
  return VIDEO_EXTENSIONS.some(ext => name?.toLowerCase()?.endsWith(ext));
}

/**
 * 判断文件名是否包含非课程关键词
 */
function isNonCourse(name) {
  return NON_COURSE_KEYWORDS.some(kw => name?.includes(kw));
}

/**
 * 检测文件所属学科
 * @param {string} name - 文件名或路径
 * @returns {string|null} 学科ID，未识别返回 null
 */
function detectSubject(name) {
  const scores = {};
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    scores[subject] = 0;
    for (const kw of keywords) {
      if (name?.includes(kw)) scores[subject] += 1;
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}

/**
 * 检测章节信息
 * @param {string} name - 文件名
 * @returns {string|null} 匹配到的章节文本，未匹配返回 null
 */
function detectChapter(name) {
  for (const pattern of CHAPTER_PATTERNS) {
    const match = name?.match(pattern);
    if (match) return match[0];
  }
  return null;
}

/**
 * 从文件名中提取知识点
 *
 * 逻辑：移除扩展名和已识别的章节部分后，剩余文本作为知识点。
 * 若无有效剩余文本，回退为 "基础内容" 或 "综合"。
 *
 * @param {string} name - 原始文件名
 * @param {string|null} chapter - 已识别的章节文本
 * @returns {string} 知识点名称
 */
function extractKnowledgePoint(name, chapter) {
  if (!name) return '综合';

  let cleaned = name;

  // 去除扩展名
  const dotIdx = cleaned.lastIndexOf('.');
  if (dotIdx > 0) {
    cleaned = cleaned.substring(0, dotIdx);
  }

  // 去除章节部分
  if (chapter) {
    // 先尝试精确去除
    cleaned = cleaned.replace(chapter, '');
  }

  // 清理分隔符和多余空白
  cleaned = cleaned
    .replace(/^[-_\s.，,、：:]+/, '')
    .replace(/[-_\s.，,、：:]+$/, '')
    .trim();

  if (!cleaned || cleaned.length < 2) {
    return chapter || '综合';
  }

  // 如果清理后还是章节编号格式，回退
  if (/^\d+$/.test(cleaned)) {
    return chapter || '综合';
  }

  return cleaned;
}

/**
 * 获取学科的显示名称
 * @param {string} subjectId - 学科ID
 * @returns {string} 中文显示名
 */
function getSubjectDisplayName(subjectId) {
  return SUBJECT_DISPLAY_NAMES[subjectId] || subjectId || '其他';
}

/**
 * 通用缓存键生成
 */
const cacheKey = (prefix) => `${prefix}_${SHARE_CODE}`;

// ========== 三级树构建 ==========

/**
 * 将扁平文件列表构建为 学科 → 章节 → 知识点 三级树结构
 *
 * @param {Array} files - parseFullCourseDirectory 返回的 files 数组
 * @returns {Array<TreeNode>} 三级树数组
 *
 * @typedef {Object} TreeNode
 * @property {string}   subjectId   - 学科ID（如 'math'）
 * @property {string}   subjectName - 学科中文名
 * @property {number}   courseCount - 该学科下课程总数
 * @property {Array<ChapterNode>} chapters - 章节列表
 *
 * @typedef {Object} ChapterNode
 * @property {string}   chapterName    - 章节名称
 * @property {number}   courseCount    - 该章节下课程总数
 * @property {Array<KnowledgePointNode>} knowledgePoints - 知识点列表
 *
 * @typedef {Object} KnowledgePointNode
 * @property {string}   knowledgePointName - 知识点名称
 * @property {number}   courseCount        - 该知识点下课程数
 * @property {Array}    courses            - 课程文件列表
 */
export function parseToThreeLevelTree(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  // 第一遍：按 学科 → 章节 → 知识点 三级分组
  // 使用 Map 保证插入顺序，结构: subjectMap[subjectId][chapterName][kpName] = [files]
  const subjectMap = new Map();

  for (const file of files) {
    const subjectId = file.subject || 'other';
    const chapter = file.chapter || '';
    const kp = file.knowledgePoint || extractKnowledgePoint(file.file_name, chapter) || '综合';

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, new Map());
    }
    const chapterMap = subjectMap.get(subjectId);

    const chapterKey = chapter || '未分类';
    if (!chapterMap.has(chapterKey)) {
      chapterMap.set(chapterKey, new Map());
    }
    const kpMap = chapterMap.get(chapterKey);

    if (!kpMap.has(kp)) {
      kpMap.set(kp, []);
    }
    kpMap.get(kp).push(file);
  }

  // 第二遍：转为嵌套数组结构
  const tree = [];

  for (const [subjectId, chapterMap] of subjectMap) {
    let subjectCourseCount = 0;
    const chapters = [];

    for (const [chapterName, kpMap] of chapterMap) {
      let chapterCourseCount = 0;
      const knowledgePoints = [];

      for (const [kpName, courses] of kpMap) {
        chapterCourseCount += courses.length;
        knowledgePoints.push({
          knowledgePointName: kpName,
          courseCount: courses.length,
          courses,
        });
      }

      // 知识点按课程数量降序
      knowledgePoints.sort((a, b) => b.courseCount - a.courseCount);

      subjectCourseCount += chapterCourseCount;
      chapters.push({
        chapterName,
        courseCount: chapterCourseCount,
        knowledgePoints,
      });
    }

    // 章节按课程数量降序
    chapters.sort((a, b) => b.courseCount - a.courseCount);

    tree.push({
      subjectId,
      subjectName: getSubjectDisplayName(subjectId),
      courseCount: subjectCourseCount,
      chapters,
    });
  }

  // 学科按课程数量降序
  tree.sort((a, b) => b.courseCount - a.courseCount);

  return tree;
}

// ========== 树缓存 ==========

/**
 * 获取三级树的缓存键（与分享码绑定）
 */
function getTreeCacheKey() {
  return `${TREE_CACHE_PREFIX}_${SHARE_CODE}`;
}

/**
 * 从 AsyncStorage 读取缓存的三级树
 * @returns {Promise<Array|null>} 缓存树或 null
 */
async function loadTreeFromCache() {
  try {
    const raw = await AsyncStorage.getItem(getTreeCacheKey());
    if (!raw) return null;

    const { tree, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < TREE_CACHE_DURATION) {
      return tree;
    }
    // 过期
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * 将三级树写入 AsyncStorage 缓存
 * @param {Array} tree - parseToThreeLevelTree 的返回值
 */
async function saveTreeToCache(tree) {
  try {
    await AsyncStorage.setItem(
      getTreeCacheKey(),
      JSON.stringify({ tree, timestamp: Date.now() }),
    );
  } catch (e) {
    // 缓存写入失败不阻塞主流程
  }
}

/**
 * 确保三级树可用：优先读缓存，否则从远程拉取并构建
 *
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<Array>} 三级树数组
 */
async function ensureThreeLevelTree(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await loadTreeFromCache();
    if (cached) return cached;
  }

  // 拉取最新文件列表
  const result = await parseFullCourseDirectory(forceRefresh);
  const files = result.files || [];

  const tree = parseToThreeLevelTree(files);

  // 异步写缓存（不 await，避免阻塞）
  saveTreeToCache(tree);

  return tree;
}

// ========== 精确定位 ==========

/**
 * 根据学科和知识点精确定位课程
 *
 * 在三级树中查找指定学科下匹配知识点的所有课程。
 * 支持精确匹配和模糊匹配（包含关键词即命中）。
 *
 * @param {string} subject - 学科ID（如 'math'）
 * @param {string} knowledgePoint - 知识点名称（如 '二次函数'）
 * @param {Object} [options]
 * @param {boolean} [options.exact=false] - 是否精确匹配（默认模糊匹配）
 * @param {boolean} [options.forceRefresh=false] - 是否强制刷新数据
 * @returns {Promise<Object>} 查询结果
 * @returns {Array}  return.courses       - 匹配到的课程列表
 * @returns {Array}  return.knowledgePoints - 匹配到的知识点名称列表
 * @returns {number} return.total         - 匹配到的课程总数
 * @returns {string} return.subjectName   - 学科中文名
 */
export async function getCoursesForKnowledgePoint(
  subject,
  knowledgePoint,
  options = {},
) {
  const { exact = false, forceRefresh = false } = options;

  if (!subject || !knowledgePoint) {
    return { courses: [], knowledgePoints: [], total: 0, subjectName: '' };
  }

  const tree = await ensureThreeLevelTree(forceRefresh);

  // 定位学科
  const subjectNode = tree.find(
    s => s.subjectId === subject,
  );

  if (!subjectNode) {
    return {
      courses: [],
      knowledgePoints: [],
      total: 0,
      subjectName: getSubjectDisplayName(subject),
    };
  }

  const resultCourses = [];
  const matchedKps = [];

  // 遍历该学科的所有章节和知识点
  for (const chapter of subjectNode.chapters) {
    for (const kp of chapter.knowledgePoints) {
      const kpName = kp.knowledgePointName;
      let isMatch = false;

      if (exact) {
        isMatch = kpName === knowledgePoint;
      } else {
        isMatch = kpName.includes(knowledgePoint) || knowledgePoint.includes(kpName);
      }

      if (isMatch) {
        matchedKps.push(kpName);
        resultCourses.push(...kp.courses);
      }
    }
  }

  return {
    courses: resultCourses,
    knowledgePoints: matchedKps,
    total: resultCourses.length,
    subjectName: subjectNode.subjectName,
  };
}

// ========== 诊断联动 ==========

/**
 * 根据诊断弱项（薄弱知识点）推荐匹配课程
 *
 * 与诊断结果联动：接收一组薄弱知识点，在三级课程树中匹配
 * 相关课程，按匹配度排序返回。
 *
 * @param {Array<WeakPoint>} weakPoints - 薄弱知识点列表
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - 是否强制刷新
 * @param {number}  [options.maxPerPoint=5] - 每个弱项最多返回课程数
 * @returns {Promise<Object>} 推荐结果
 * @returns {Array<Recommendation>} return.recommendations - 推荐课程列表（扁平）
 * @returns {Array<GroupedRecommendation>} return.grouped - 按弱项分组的结果
 * @returns {number} return.totalCourses - 推荐课程总数
 *
 * @typedef {Object} WeakPoint
 * @property {string} subject        - 学科ID（如 'math'）
 * @property {string} knowledgePoint - 知识点名称（如 '二次函数'）
 * @property {number} [score]        - 得分率（0-1，越低越薄弱）
 * @property {string} [level]        - 薄弱等级（'severe'|'moderate'|'mild'）
 *
 * @typedef {Object} Recommendation
 * @property {Object}   file              - 课程文件对象
 * @property {string}   subjectId         - 学科ID
 * @property {string}   subjectName       - 学科中文名
 * @property {string}   knowledgePoint    - 匹配到的知识点名称
 * @property {string}   weakPointQuery    - 原始弱项查询关键词
 * @property {number}   weakScore         - 原始弱项得分率
 * @property {string}   matchType         - 匹配类型：'exact'|'fuzzy'|'subject_only'
 * @property {number}   relevance         - 相关度评分（越高越相关）
 *
 * @typedef {Object} GroupedRecommendation
 * @property {string}   query              - 弱项查询（学科:知识点）
 * @property {string}   subject            - 学科ID
 * @property {string}   knowledgePoint     - 原始知识点名称
 * @property {number}   weakScore          - 原始弱项得分率
 * @property {number}   matchedCount       - 匹配到的课程数
 * @property {Array}    courses            - 匹配到的课程列表（Recommendation[]）
 */
export async function getRecommendedCourses(weakPoints, options = {}) {
  const { forceRefresh = false, maxPerPoint = 5 } = options;

  if (!weakPoints || !Array.isArray(weakPoints) || weakPoints.length === 0) {
    return { recommendations: [], grouped: [], totalCourses: 0 };
  }

  const tree = await ensureThreeLevelTree(forceRefresh);

  const grouped = [];
  const recommendations = [];

  for (const wp of weakPoints) {
    const subject = wp.subject;
    const kpQuery = wp.knowledgePoint;
    const score = wp.score ?? 1;
    const level = wp.level || 'moderate';

    if (!subject || !kpQuery) continue;

    const queryKey = `${subject}:${kpQuery}`;
    const subjectNode = tree.find(s => s.subjectId === subject);

    const pointCourses = [];

    if (subjectNode) {
      // 遍历章节和知识点进行匹配
      for (const chapter of subjectNode.chapters) {
        for (const kp of chapter.knowledgePoints) {
          const kpName = kp.knowledgePointName;

          // 三级匹配：精确 > 包含 > 仅学科
          let matchType = null;
          if (kpName === kpQuery) {
            matchType = 'exact';
          } else if (kpName.includes(kpQuery) || kpQuery.includes(kpName)) {
            matchType = 'fuzzy';
          }

          if (matchType) {
            for (const course of kp.courses) {
              // 计算相关度评分
              // 精确匹配 + 得分率低（越薄弱）= 相关度越高
              const matchScore = matchType === 'exact' ? 100 : 60;
              const weaknessBonus = (1 - score) * 40; // score 越低 bonus 越高
              const relevance = Math.round(matchScore + weaknessBonus);

              pointCourses.push({
                file: course,
                subjectId: subject,
                subjectName: subjectNode.subjectName,
                knowledgePoint: kpName,
                weakPointQuery: kpQuery,
                weakScore: score,
                matchType,
                relevance,
              });
            }
          }
        }
      }
    }

    // 如果该学科下没有精确/模糊匹配，尝试仅学科级别的匹配
    if (pointCourses.length === 0 && subjectNode) {
      for (const chapter of subjectNode.chapters) {
        for (const kp of chapter.knowledgePoints) {
          for (const course of kp.courses) {
            pointCourses.push({
              file: course,
              subjectId: subject,
              subjectName: subjectNode.subjectName,
              knowledgePoint: kp.knowledgePointName,
              weakPointQuery: kpQuery,
              weakScore: score,
              matchType: 'subject_only',
              relevance: 20,
            });
          }
        }
      }
    }

    // 按相关度降序，截取 maxPerPoint
    pointCourses.sort((a, b) => b.relevance - a.relevance);
    const topCourses = pointCourses.slice(0, maxPerPoint);

    recommendations.push(...topCourses);

    grouped.push({
      query: queryKey,
      subject,
      knowledgePoint: kpQuery,
      weakScore: score,
      level,
      matchedCount: pointCourses.length,
      courses: topCourses,
    });
  }

  // 全局按相关度降序
  recommendations.sort((a, b) => b.relevance - a.relevance);

  return {
    recommendations,
    grouped,
    totalCourses: recommendations.length,
  };
}

// ========== 分享链接解析（保持兼容） ==========

/**
 * 解析完整的课程目录（从分享链接递归获取，带缓存）
 *
 * 此接口保持与旧版完全兼容。
 *
 * @param {boolean} forceRefresh - 是否强制刷新
 * @param {string} [shareCode]   - 指定分享码，不传则用默认分享
 * @returns {Promise<Object>} { files, fromCache?, shareTitle?, author?, totalCount?, videoCount?, shareCode?, error? }
 */
export async function parseFullCourseDirectory(forceRefresh = false, shareCode) {
  const cookie = await getCookie();
  if (!cookie) return { files: [], error: '未配置夸克Cookie' };

  const code = shareCode || SHARE_CODE;
  const cacheId = cacheKey(`quark_v3_${code}`);

  // 检查缓存（30分钟旧版缓存仍保留，供 parseFullCourseDirectory 自身使用）
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(cacheId);
      if (cached) {
        const { files, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          return { files, fromCache: true, shareCode: code };
        }
      }
    } catch (e) { /* 缓存损坏，忽略 */ }
  }

  try {
    const shareCodeClean = extractShareCode(code);
    const { stoken, title, author } = await getShareToken(shareCodeClean);
    const allFiles = await getAllShareFiles(shareCodeClean, stoken, '0', '');

    const files = allFiles
      .filter(f => isVideoFile(f.file_name) && !isNonCourse(f.file_name) && !isNonCourse(f.path))
      .map(f => ({
        fid: f.fid,
        file_name: f.file_name,
        path: f.path,
        size: f.size,
        subject: detectSubject(f.file_name) || detectSubject(f.path) || 'other',
        chapter: detectChapter(f.file_name) || detectChapter(f.path) || '',
        knowledgePoint: extractKnowledgePoint(
          f.file_name,
          detectChapter(f.file_name) || detectChapter(f.path) || '',
        ),
        isVideo: true,
      }));

    await AsyncStorage.setItem(cacheId, JSON.stringify({
      files,
      timestamp: Date.now(),
      shareTitle: title,
      shareCode: code,
    }));

    return {
      files,
      shareTitle: title,
      author: author?.nick_name,
      totalCount: allFiles.length,
      videoCount: files.length,
      shareCode: code,
    };
  } catch (error) {
    return { files: [], error: error.message, shareCode: code };
  }
}

// ========== 按科目组织（保持兼容） ==========

/**
 * 按科目组织课程（二级分组，保持兼容）
 */
export function organizeBySubject(files) {
  const organized = {};
  for (const file of files) {
    const subject = file.subject || 'other';
    if (!organized[subject]) organized[subject] = [];
    organized[subject].push(file);
  }
  // 按视频数量降序
  const sorted = {};
  Object.entries(organized)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([k, v]) => { sorted[k] = v; });
  return sorted;
}

/**
 * 搜索课程（按关键词模糊搜索）
 */
export function searchCourse(keyword) {
  return parseFullCourseDirectory().then(result => {
    if (!result.files || !keyword) return result.files;
    const kw = keyword.toLowerCase();
    return result.files.filter(f =>
      f.file_name?.toLowerCase().includes(kw) ||
      f.path?.toLowerCase().includes(kw) ||
      f.subject?.toLowerCase().includes(kw),
    );
  });
}

/**
 * 获取课程统计
 */
export async function getStatistics() {
  const result = await parseFullCourseDirectory();
  const files = result.files || [];
  const bySubject = organizeBySubject(files);
  const stats = {
    totalVideos: files.length,
    bySubject: {},
    shareTitle: result.shareTitle,
  };
  for (const [subject, items] of Object.entries(bySubject)) {
    const totalSize = items.reduce((sum, f) => sum + (f.size || 0), 0);
    stats.bySubject[subject] = { count: items.length, totalSize };
  }
  return stats;
}

/**
 * 获取分享配置
 */
export function getShareConfig() {
  return { shareCode: SHARE_CODE, shareLink: QUARK_CONFIG.shareLinks?.main };
}

/**
 * 获取科目关键词映射（供调试或UI展示）
 */
export function getSubjectKeywords() {
  return SUBJECT_KEYWORDS;
}

// ========== 兼容旧接口的具名导出 ==========
export const detectSubjectFn = detectSubject;
export const detectChapterFn = detectChapter;
export const isVideoFileFn = isVideoFile;
