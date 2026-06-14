/**
 * AI 答疑服务（OpenAI 兼容 API）
 * 为学生提供智能辅导：答疑、错题讲解、知识点解析、作文批改、学习建议
 * @module ai-service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_BASE = 'https://cpa.xmsl.eu.cc/v1';
const AI_SETTINGS_KEY = '@ai_settings';
const AI_MODEL = 'gpt-4o';

// ======================== AI 配置状态检测 ========================

/**
 * AI 配置状态枚举
 * - UNCONFIGURED：Key 为占位符或明显无效，AI 完全不可用
 * - CONFIGURED：Key 已设置，可以进行 API 调用
 */
export const AI_STATUS = {
  UNCONFIGURED: 'unconfigured',
  CONFIGURED: 'configured',
};

/** 模块级 AI Key 缓存（同步读取） */
let cachedKey = null;

/**
 * 加载 AI 配置（异步，从 AsyncStorage 读取）
 * 每次 chat() 调用前自动刷新缓存
 */
export async function loadAIKey() {
  try {
    const raw = await AsyncStorage.getItem(AI_SETTINGS_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      cachedKey = cfg.apiKey || null;
    } else {
      cachedKey = null;
    }
  } catch {
    cachedKey = null;
  }
  return cachedKey;
}

/**
 * 检测 AI Key 是否已配置（同步，读取缓存）
 * @returns {string} AI_STATUS.UNCONFIGURED | AI_STATUS.CONFIGURED
 */
export function getAIStatus() {
  const key = cachedKey;
  if (!key) return AI_STATUS.UNCONFIGURED;
  const trimmed = String(key).trim();
  if (
    trimmed === '__AI_KEY_PLACEHOLDER__' ||
    /^__[A-Z_]+__$/.test(trimmed) ||
    trimmed.length < 10 ||
    trimmed.startsWith('your-') ||
    trimmed.startsWith('sk-placeholder')
  ) {
    return AI_STATUS.UNCONFIGURED;
  }
  return AI_STATUS.CONFIGURED;
}

/**
 * AI 未配置时显示的友好引导文本，面向非技术用户（学生）
 * 引导家长进行配置，而非要求学生自己输入 Key
 */
export const AI_UNCONFIGURED_MESSAGE =
  'AI 学习助手尚未配置，需要家长在设置中完成配置后使用。\n\n' +
  '配置步骤（由家长操作）：\n' +
  '1. 打开「我的」→「设置」→「AI 配置」\n' +
  '2. 输入 AI 服务密钥（API Key）\n' +
  '3. 保存后即可使用所有 AI 功能';

// ======================== 常量 / 配置 ========================

const SYSTEM_PROMPT = `你是一位耐心、幽默的中学辅导老师，正在辅导一名陕西榆林八年级学生备战中考。
教学风格：
- 用简单易懂的语言，像朋友聊天一样
- 多举生活中的例子帮助理解
- 鼓励为主，培养自信
- 回答控制在200字以内，除非学生要求详细讲解
- 如果学生问的是具体题目，先引导思考再给答案
- 适当使用表情符号增加亲和力`;

/** 请求超时（毫秒） */
const REQUEST_TIMEOUT = 15000;

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 重试基础延迟（毫秒），实际延迟 = base * 2^(attempt-1) */
const RETRY_BASE_DELAY = 800;

/** 可重试的 HTTP 状态码：429 限流 + 5xx 服务端错误 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/** 写死的错误类型中文标签，用于本地降级 */
const ERROR_TYPE_LABELS = {
  calculation:  '计算错误',
  concept:      '概念不清',
  reading:      '审题失误',
  knowledge:    '知识盲区',
};

// ======================== 本地缓存 ========================

/**
 * 内存缓存
 * - key: 规范化的缓存键（fnName + 排序参数摘要）
 * - value: { response, timestamp }
 * - maxSize: 最多缓存条数
 * - ttl: 单条缓存存活时间（毫秒），默认 30 分钟
 */
const cacheStore = new Map();
const CACHE_MAX_SIZE = 80;
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

/**
 * 生成缓存键
 * 对 question / essay 等字符串做轻量清洗，防止空格差异导致 miss
 */
function buildCacheKey(prefix, ...parts) {
  const normalized = parts.map(p => {
    if (typeof p === 'string') {
      return p.replace(/\s+/g, ' ').trim().slice(0, 200);
    }
    if (typeof p === 'object' && p !== null) {
      return JSON.stringify(p, Object.keys(p).sort());
    }
    return String(p);
  });
  return `${prefix}::${normalized.join('||')}`;
}

function cacheGet(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cacheStore.delete(key);
    return null;
  }
  return entry.response;
}

function cacheSet(key, response) {
  // 超过容量时淘汰最旧的一半
  if (cacheStore.size >= CACHE_MAX_SIZE) {
    const entries = [...cacheStore.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const removeCount = Math.floor(CACHE_MAX_SIZE / 2);
    for (let i = 0; i < removeCount; i++) {
      cacheStore.delete(entries[i][0]);
    }
  }
  cacheStore.set(key, { response, timestamp: Date.now() });
}

/** 清空所有缓存（调试/设置变更时调用） */
export function clearCache() {
  cacheStore.clear();
}

/** 返回缓存统计 */
export function getCacheStats() {
  let valid = 0;
  const now = Date.now();
  for (const [, v] of cacheStore) {
    if (now - v.timestamp <= CACHE_TTL) valid++;
  }
  return { total: cacheStore.size, valid, maxSize: CACHE_MAX_SIZE, ttlMs: CACHE_TTL };
}

// ======================== 带重试+超时的 fetch 封装 ========================

/**
 * 判断错误是否可重试
 */
function isRetryableError(error) {
  // 网络错误（fetch 抛出的 TypeError）通常可重试
  if (error.name === 'TypeError' || error.message?.includes('Network')) return true;
  if (error.name === 'AbortError') return true;
  return false;
}

/**
 * 带超时、自动重试的 JSON POST 请求
 * @param {string} url
 * @param {object} body - 请求体（会被 JSON.stringify）
 * @param {object} opts
 * @param {number}  [opts.timeout=REQUEST_TIMEOUT]
 * @param {number}  [opts.maxRetries=MAX_RETRIES]
 * @param {number}  [opts.retryBaseDelay=RETRY_BASE_DELAY]
 * @param {object}  [opts.headers] - 额外 headers
 * @param {boolean} [opts.skipRetry=false] - 强制不重试（如非幂等操作）
 * @returns {Promise<any>} 解析后的 JSON
 */
async function fetchWithRetry(url, body, apiKey, opts = {}) {
  const {
    timeout = REQUEST_TIMEOUT,
    maxRetries = MAX_RETRIES,
    retryBaseDelay = RETRY_BASE_DELAY,
    headers: extraHeaders = {},
    skipRetry = false,
  } = opts;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        const errorText = await res.text().catch(() => '');
        const err = new Error(`AI请求失败: HTTP ${status}${errorText ? ' - ' + errorText.slice(0, 200) : ''}`);
        err.httpStatus = status;

        // 可重试的服务端/限流错误，且还有重试次数时重试
        if (!skipRetry && RETRYABLE_STATUSES.has(status) && attempt <= maxRetries) {
          lastError = err;
          const delay = retryBaseDelay * Math.pow(2, attempt - 1);
          console.warn(`[ai-service] HTTP ${status}，${delay}ms 后第 ${attempt} 次重试...`);
          await sleep(delay);
          continue;
        }
        throw err;
      }

      return await res.json();
    } catch (error) {
      lastError = error;

      // 超时或网络错误，且还有重试次数
      if (!skipRetry && isRetryableError(error) && attempt <= maxRetries) {
        const delay = retryBaseDelay * Math.pow(2, attempt - 1);
        console.warn(`[ai-service] ${error.name || 'NetworkError'}，${delay}ms 后第 ${attempt} 次重试...`);
        await sleep(delay);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('AI请求失败：已达最大重试次数');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ======================== 核心：通用 AI 调用 ========================

/**
 * 向AI发送消息（底层方法，带缓存和重试）
 * @param {Array} messages - 对话历史 [{role, content}]
 * @param {object} [options]
 * @param {number}  [options.temperature=0.7]
 * @param {number}  [options.maxTokens=600]
 * @param {boolean} [options.jsonMode=false] - 是否要求 JSON 输出
 * @param {string}  [options.cacheKey] - 手动指定缓存键（不传则不缓存）
 * @returns {Promise<string>} AI回复文本
 */
export async function chat(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 600,
    jsonMode = false,
    cacheKey = null,
  } = options;

  // ====== 刷新 AI 配置缓存 ======
  await loadAIKey();

  // ====== 检测 AI 配置状态 ======
  if (getAIStatus() === AI_STATUS.UNCONFIGURED) {
    const err = new Error('AI 密钥未配置：占位符 Key 无法发起 API 请求');
    err.code = 'AI_UNCONFIGURED';
    err.userMessage = AI_UNCONFIGURED_MESSAGE;
    throw err;
  }

  // ====== 读缓存 ======
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached !== null) {
      console.log('[ai-service] 命中缓存:', cacheKey.slice(0, 80));
      return cached;
    }
  }

  const body = {
    model: AI_MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const data = await fetchWithRetry(`${AI_BASE}/chat/completions`, body, cachedKey);

  const content = data.choices?.[0]?.message?.content || '';
  const result = content || '（AI未返回内容，请稍后再试）';

  // ====== 写缓存 ======
  if (cacheKey && content) {
    cacheSet(cacheKey, result);
  }

  return result;
}

// ======================== 原有快捷方法（升级为带缓存） ========================

/**
 * 快速提问（无上下文）
 */
export async function quickAsk(question) {
  const key = buildCacheKey('quickAsk', question);
  return chat([{ role: 'user', content: question }], { cacheKey: key });
}

/**
 * 错题讲解
 */
export async function explainMistake(question, userAnswer, correctAnswer, explanation) {
  const key = buildCacheKey('explainMistake', question, userAnswer, correctAnswer);
  return chat([{
    role: 'user',
    content: `我做了一道题："${question}"。我的答案是${userAnswer}，正确答案是${correctAnswer}。题目解析是：${explanation}。请用简单的语言重新帮我讲解一下这道题，让我真正理解为什么选${correctAnswer}。`
  }], { cacheKey: key });
}

/**
 * 知识点讲解
 */
export async function explainConcept(subject, concept) {
  const key = buildCacheKey('explainConcept', subject, concept);
  return chat([{
    role: 'user',
    content: `请用简单有趣的方式给我讲解${subject}中的"${concept}"这个知识点，最好能举一个生活中的例子。`
  }], { cacheKey: key });
}

// ======================== 新增功能 1：错题类型分析 ========================

/**
 * 分析错题的错误类型
 * 调用 AI 将错误归类为：计算错误 / 概念不清 / 审题失误 / 知识盲区
 *
 * @param {string} question      - 题目内容
 * @param {string} studentAnswer - 学生给出的答案
 * @param {string} correctAnswer - 正确答案
 * @returns {Promise<object>} JSON 格式分析结果
 * @returns {string}  result.type        - 错误类型英文 key: calculation|concept|reading|knowledge
 * @returns {string}  result.typeLabel   - 中文标签
 * @returns {number}  result.confidence  - 置信度 0-1
 * @returns {string}  result.reason      - 简短判断依据
 * @returns {string}  result.suggestion  - 针对性改进建议
 *
 * @example
 * const result = await analyzeMistakeType('2+3×4=?', '20', '14');
 * // { type: 'concept', typeLabel: '概念不清', confidence: 0.92, ... }
 */
export async function analyzeMistakeType(question, studentAnswer, correctAnswer) {
  const cacheKey = buildCacheKey('analyzeMistakeType', question, studentAnswer, correctAnswer);

  const prompt = `你是一位专业的中考错题分析老师。请分析下面这道错题的错误类型。

【题目】${question}
【学生答案】${studentAnswer}
【正确答案】${correctAnswer}

请判断学生的错误属于以下哪一类，并以 JSON 格式返回分析结果：
- calculation：计算错误（会做，但计算过程出错）
- concept：概念不清（对知识点理解不准确）
- reading：审题失误（看错/看漏题目条件）
- knowledge：知识盲区（完全不会，没见过这个知识点）

严格按以下 JSON 格式返回（不要包含其他文字）：
{
  "type": "calculation|concept|reading|knowledge",
  "typeLabel": "计算错误|概念不清|审题失误|知识盲区",
  "confidence": 0.0-1.0,
  "reason": "简短判断依据（30字以内）",
  "suggestion": "针对性改进建议（80字以内）"
}`;

  try {
    const jsonStr = await chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 300, jsonMode: true, cacheKey }
    );

    const parsed = JSON.parse(jsonStr);
    // 规范化 type 字段
    if (parsed.type && !['calculation', 'concept', 'reading', 'knowledge'].includes(parsed.type)) {
      // 尝试中文匹配
      const typeMap = {
        '计算错误': 'calculation', '概念不清': 'concept',
        '审题失误': 'reading', '知识盲区': 'knowledge',
      };
      parsed.type = typeMap[parsed.type] || 'concept';
    }
    parsed.typeLabel = parsed.typeLabel || ERROR_TYPE_LABELS[parsed.type] || '概念不清';
    parsed.confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.8;
    parsed.reason = parsed.reason || '';
    parsed.suggestion = parsed.suggestion || '';
    return parsed;
  } catch (e) {
    console.warn('[ai-service] analyzeMistakeType 失败，使用本地规则兜底:', e.message);
    return localFallbackMistakeType(question, studentAnswer, correctAnswer);
  }
}

/**
 * 本地兜底：基于简单规则推断错误类型
 */
function localFallbackMistakeType(question, studentAnswer, correctAnswer) {
  const sa = String(studentAnswer).trim();
  const ca = String(correctAnswer).trim();

  // 答案完全空白 → 知识盲区
  if (!sa) {
    return {
      type: 'knowledge', typeLabel: '知识盲区', confidence: 0.7,
      reason: '学生未作答，可能完全不会', suggestion: '从基础知识点开始复习，先理解概念再做题',
    };
  }

  // 纯数字题：学生答案与正确答案差一个简单倍数或常数 → 计算错误
  const saNum = parseFloat(sa);
  const caNum = parseFloat(ca);
  if (!isNaN(saNum) && !isNaN(caNum) && saNum !== caNum) {
    // 检查是否有明显计算型偏差
    const ratio = Math.max(saNum, caNum) / Math.min(saNum, caNum);
    if (ratio < 3 || Math.abs(saNum - caNum) < 5) {
      return {
        type: 'calculation', typeLabel: '计算错误', confidence: 0.65,
        reason: '数值答案接近但不对，疑似计算失误', suggestion: '加强计算练习，做完后验算一遍',
      };
    }
  }

  // 单选题：选项不同 → 概念不清 or 审题失误
  if (/^[A-D]$/i.test(sa) && /^[A-D]$/i.test(ca)) {
    return {
      type: 'concept', typeLabel: '概念不清', confidence: 0.6,
      reason: '选择题选错，可能概念混淆', suggestion: '回顾对应知识点的核心概念，做专项练习',
    };
  }

  // 默认
  return {
    type: 'concept', typeLabel: '概念不清', confidence: 0.5,
    reason: '答案与正确答案不符', suggestion: '回顾该题涉及的知识点，找类似题目巩固',
  };
}

// ======================== 新增功能 2：学习建议生成 ========================

/**
 * 根据诊断结果和最近学习活动，由 AI 生成个性化学习调整建议
 *
 * @param {object} diagnosisResult - 诊断结果对象（参见 diagnosis-system.js 输出）
 * @param {object} [recentActivity] - 最近学习活动数据
 * @param {Array}  [recentActivity.wrongQuestions] - 最近错题列表
 * @param {Array}  [recentActivity.studyLogs]      - 学习时长日志
 * @param {Array}  [recentActivity.testScores]     - 近期测试成绩
 * @param {number} [recentActivity.daysUntilExam]  - 距离中考天数
 * @returns {Promise<object>} JSON 格式建议
 * @returns {string}  result.summary         - 总体评价（一句话）
 * @returns {Array}   result.priorities      - 优先攻克的知识点列表 [{name, urgency: 'high'|'medium'|'low'}]
 * @returns {Array}   result.dailyAdjustments - 每日学习调整建议 [{aspect, suggestion}]
 * @returns {string}  result.motivation      - 鼓励语
 */
export async function generateStudyAdvice(diagnosisResult, recentActivity = {}) {
  const cacheKey = buildCacheKey('generateStudyAdvice', diagnosisResult, recentActivity);

  // 提取诊断关键信息，精简传给 AI
  const summary = extractDiagnosisSummary(diagnosisResult);
  const activitySummary = extractActivitySummary(recentActivity);

  const prompt = `你是一位中考备考策略专家。根据以下学生数据，给出个性化的学习调整建议。

【诊断报告摘要】
${summary}

【最近学习活动】
${activitySummary}

请以 JSON 格式返回（不要包含其他文字）：
{
  "summary": "总体评价（一句话，40字以内）",
  "priorities": [
    { "name": "知识点名称", "urgency": "high|medium|low", "reason": "简短原因" }
  ],
  "dailyAdjustments": [
    { "aspect": "调整方面（如：数学时间分配、错题复习频率等）", "suggestion": "具体建议（60字以内）" }
  ],
  "motivation": "鼓励语（30字以内）"
}

要求：
- priorities 列出 3-5 个最需要攻克的知识点，按 urgent 程度排序
- dailyAdjustments 给出 3-4 条可执行的具体调整建议
- 语气积极正面，强调进步空间`;

  try {
    const jsonStr = await chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, maxTokens: 600, jsonMode: true, cacheKey }
    );
    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || '继续努力，你正在进步！',
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 5) : [],
      dailyAdjustments: Array.isArray(parsed.dailyAdjustments) ? parsed.dailyAdjustments.slice(0, 4) : [],
      motivation: parsed.motivation || '每一天的努力都是中考时的底气！',
    };
  } catch (e) {
    console.warn('[ai-service] generateStudyAdvice 失败，使用本地兜底:', e.message);
    return localFallbackStudyAdvice(diagnosisResult);
  }
}

/**
 * 从诊断结果中提取摘要文本
 */
function extractDiagnosisSummary(diagnosisResult) {
  if (!diagnosisResult) return '暂无诊断数据';

  const parts = [];
  if (diagnosisResult.totalScore != null) {
    parts.push(`总分：${diagnosisResult.totalScore}分`);
  }
  if (diagnosisResult.overallLevel) {
    parts.push(`等级：${diagnosisResult.overallLevel}`);
  }
  if (diagnosisResult.subjects) {
    const subjectDetails = Object.entries(diagnosisResult.subjects)
      .map(([name, s]) => `${name}(${s.score ?? '?'}分, ${s.level ?? '未知'})`)
      .join('、');
    parts.push(`各科：${subjectDetails}`);
  }
  if (diagnosisResult.weakPoints?.length) {
    parts.push(`薄弱点：${diagnosisResult.weakPoints.slice(0, 5).join('、')}`);
  }
  return parts.join('；') || '诊断数据不完整';
}

/**
 * 从最近活动提取摘要文本
 */
function extractActivitySummary(recentActivity = {}) {
  const parts = [];
  if (recentActivity.wrongQuestions?.length) {
    const subjects = [...new Set(recentActivity.wrongQuestions.map(q => q.subject).filter(Boolean))];
    parts.push(`近期错题${recentActivity.wrongQuestions.length}道，涉及科目：${subjects.join('、')}`);
  }
  if (recentActivity.testScores?.length) {
    const latest = recentActivity.testScores[recentActivity.testScores.length - 1];
    parts.push(`最近测试：${latest.subject ?? '未知'} ${latest.score ?? '?'}分`);
  }
  if (recentActivity.daysUntilExam != null) {
    parts.push(`距离中考还有${recentActivity.daysUntilExam}天`);
  }
  return parts.join('；') || '近期无学习活动记录';
}

/**
 * 本地兜底：根据诊断结果生成基础建议
 */
function localFallbackStudyAdvice(diagnosisResult) {
  const weakPoints = diagnosisResult?.weakPoints || [];
  const priorities = weakPoints.slice(0, 5).map((name, i) => ({
    name,
    urgency: i < 2 ? 'high' : 'medium',
    reason: '诊断测试中得分较低',
  }));

  return {
    summary: diagnosisResult?.overallLevel
      ? `当前水平${diagnosisResult.overallLevel}，继续系统复习可稳步提升`
      : '坚持每天学习，保持良好状态',
    priorities: priorities.length ? priorities : [
      { name: '数学基础运算', urgency: 'high', reason: '中考分值占比大' },
    ],
    dailyAdjustments: [
      { aspect: '错题复习', suggestion: '每天花15分钟回顾当天的错题，确保真正理解' },
      { aspect: '限时训练', suggestion: '每周做一次限时模拟，培养考试节奏感' },
      { aspect: '薄弱科目', suggestion: '每天给最弱的科目多分配20分钟专项练习' },
    ],
    motivation: '每一天的努力都是中考时的底气，加油！',
  };
}

// ======================== 新增功能 3：作文批改 ========================

/**
 * AI 批改作文：给出总分、分项评语和修改建议
 *
 * @param {string} essayText - 学生作文全文
 * @param {string} topic     - 作文题目/话题
 * @returns {Promise<object>} JSON 批改结果
 * @returns {number}  result.totalScore     - 总分（满分100）
 * @returns {object}  result.dimensions     - 分项评分
 * @returns {number}  result.dimensions.content    - 内容（满分40）
 * @returns {number}  result.dimensions.structure  - 结构（满分30）
 * @returns {number}  result.dimensions.language   - 语言表达（满分20）
 * @returns {number}  result.dimensions.handwriting - 卷面书写（满分10）
 * @returns {string}  result.overallComment - 总体评价
 * @returns {Array}   result.highlights     - 亮点 [{sentence, comment}]
 * @returns {Array}   result.issues         - 问题 [{sentence, issue, fix}]
 * @returns {string}  result.revisionAdvice - 修改建议
 *
 * @example
 * const result = await gradeEssay('春天来了...', '春天的故事');
 * console.log(result.totalScore); // 82
 */
export async function gradeEssay(essayText, topic) {
  // 作文文本通常很长，缓存键只用前200字摘要
  const cacheKey = buildCacheKey('gradeEssay', topic, essayText);

  // 截断过长的作文传给 AI，避免 token 超限
  const truncated = essayText.length > 2000
    ? essayText.slice(0, 2000) + '\n……（原文过长，已截断）'
    : essayText;

  const prompt = `你是一位中考语文阅卷老师。请批改下面的作文。

【作文题目】${topic}
【学生作文】
${truncated}

请从内容、结构、语言表达、卷面书写四个维度评分，并以 JSON 格式返回（不要包含其他文字）：

{
  "totalScore": 0-100,
  "dimensions": {
    "content": 0-40,
    "structure": 0-30,
    "language": 0-20,
    "handwriting": 0-10
  },
  "overallComment": "总体评价（100字以内）",
  "highlights": [
    { "sentence": "原文中的亮点句子（可截取前15字）", "comment": "为什么好（20字以内）" }
  ],
  "issues": [
    { "sentence": "原文中有问题的句子（可截取前15字）", "issue": "什么问题", "fix": "修改建议" }
  ],
  "revisionAdvice": "整体修改建议（80字以内）"
}

评分参考陕西中考语文作文评分标准。highlights 给 2-3 条，issues 给 2-4 条。`;

  try {
    const jsonStr = await chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.4, maxTokens: 800, jsonMode: true, cacheKey }
    );
    const parsed = JSON.parse(jsonStr);

    // 规范化
    const dims = parsed.dimensions || {};
    const total = typeof parsed.totalScore === 'number'
      ? parsed.totalScore
      : (dims.content || 0) + (dims.structure || 0) + (dims.language || 0) + (dims.handwriting || 0);

    return {
      totalScore: clampScore(total, 0, 100),
      dimensions: {
        content: clampScore(dims.content, 0, 40),
        structure: clampScore(dims.structure, 0, 30),
        language: clampScore(dims.language, 0, 20),
        handwriting: clampScore(dims.handwriting, 0, 10),
      },
      overallComment: parsed.overallComment || '作文已批改完成。',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 4) : [],
      revisionAdvice: parsed.revisionAdvice || '继续多读多写，坚持练笔。',
    };
  } catch (e) {
    console.warn('[ai-service] gradeEssay 失败，使用本地兜底:', e.message);
    return localFallbackGradeEssay(essayText, topic);
  }
}

function clampScore(val, min, max) {
  const n = Number(val);
  if (isNaN(n)) return Math.round((min + max) / 2);
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * 本地兜底：基本作文评分
 */
function localFallbackGradeEssay(essayText, topic) {
  const len = (essayText || '').length;
  let contentScore, structureScore, languageScore, handwritingScore;

  if (len < 100) {
    contentScore = 10; structureScore = 8; languageScore = 5; handwritingScore = 3;
  } else if (len < 300) {
    contentScore = 20; structureScore = 15; languageScore = 10; handwritingScore = 5;
  } else if (len < 600) {
    contentScore = 28; structureScore = 20; languageScore = 14; handwritingScore = 7;
  } else {
    contentScore = 32; structureScore = 24; languageScore = 16; handwritingScore = 8;
  }

  return {
    totalScore: contentScore + structureScore + languageScore + handwritingScore,
    dimensions: {
      content: contentScore,
      structure: structureScore,
      language: languageScore,
      handwriting: handwritingScore,
    },
    overallComment: len < 200
      ? '作文篇幅偏短，建议充实内容，增加描写和具体事例。'
      : '作文结构完整，继续在语言表达和细节描写上多下功夫。',
    highlights: [],
    issues: len < 200
      ? [{ sentence: '（篇幅不足）', issue: '字数偏少', fix: '建议扩充到600字以上，增加具体描写' }]
      : [],
    revisionAdvice: '建议增加细节描写和修辞手法的运用，注意段落间的过渡衔接。',
  };
}

// ======================== 统一导出 ========================

export default {
  // 核心
  chat,
  quickAsk,
  explainMistake,
  explainConcept,

  // 新增
  analyzeMistakeType,
  generateStudyAdvice,
  gradeEssay,

  // 缓存管理
  clearCache,
  getCacheStats,

  // AI 配置状态
  AI_STATUS,
  getAIStatus,
  AI_UNCONFIGURED_MESSAGE,
};
