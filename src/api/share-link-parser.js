/**
 * 分享链接解析模块
 *
 * 负责解析夸克网盘分享链接，提取分享码，获取分享内容和
 * 分享视频的播放地址。
 *
 * @module share-link-parser
 */

import { getShareToken, getShareFileList, getVideoPlayUrl, getFileInfo } from './quark-api';

/** 日志标签 */
const TAG = '[ShareLinkParser]';

/**
 * 夸克网盘分享链接的正则匹配模式
 * @type {RegExp[]}
 */
const SHARE_URL_PATTERNS = [
  // 标准分享链接: https://pan.quark.cn/s/e622c8366282
  /pan\.quark\.cn\/s\/([a-zA-Z0-9]+)/,
  // 带参数的分享链接: https://pan.quark.cn/s/e622c8366282?pwd=xxx
  /pan\.quark\.cn\/s\/([a-zA-Z0-9]+)(?:\?.*)?$/,
  // 短链接模式
  /quark\.cn\/s\/([a-zA-Z0-9]+)/,
];

/**
 * 日志输出工具
 * @param {'debug'|'info'|'warn'|'error'} level - 日志级别
 * @param {...*} args - 日志参数
 */
const log = (level, ...args) => {
  if (__DEV__ || level === 'error') {
    const fn = console[level] || console.log;
    fn(TAG, ...args);
  }
};

/**
 * 从分享URL中提取分享码
 *
 * 支持多种夸克网盘分享链接格式：
 * - https://pan.quark.cn/s/e622c8366282
 * - https://pan.quark.cn/s/e622c8366282?pwd=xxx
 * - 纯分享码字符串（直接返回）
 *
 * @param {string} shareUrl - 分享链接URL或分享码
 * @returns {string|null} 分享码，提取失败返回null
 *
 * @example
 * extractShareCode('https://pan.quark.cn/s/e622c8366282');
 * // => 'e622c8366282'
 *
 * extractShareCode('e622c8366282');
 * // => 'e622c8366282'
 *
 * extractShareCode('https://example.com');
 * // => null
 */
export function extractShareCode(shareUrl) {
  if (!shareUrl || typeof shareUrl !== 'string') {
    log('warn', '分享链接为空或非字符串');
    return null;
  }

  const trimmed = shareUrl.trim();

  // 如果本身就是一个纯分享码（无URL格式）
  if (/^[a-zA-Z0-9]{6,32}$/.test(trimmed)) {
    log('debug', '输入为纯分享码');
    return trimmed;
  }

  // 尝试各正则模式匹配
  for (const pattern of SHARE_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      log('debug', `提取到分享码: ${match[1]}`);
      return match[1];
    }
  }

  // 尝试从URL参数中提取
  try {
    const url = new URL(trimmed);
    const pwdId = url.searchParams.get('pwd_id') || url.searchParams.get('code');
    if (pwdId) {
      log('debug', `从URL参数提取分享码: ${pwdId}`);
      return pwdId;
    }
  } catch (e) {
    // URL解析失败，继续
  }

  log('warn', '无法从URL中提取分享码:', trimmed);
  return null;
}

/**
 * 解析分享链接并获取文件列表
 *
 * 完整的分享链接解析流程：
 * 1. 提取分享码
 * 2. 获取分享Token
 * 3. 获取文件列表
 *
 * @param {string} shareUrl - 分享链接URL或分享码
 * @param {string} [parentFolderId='0'] - 子文件夹ID（可选，用于浏览子目录）
 * @param {number} [page=1] - 页码
 * @param {number} [size=50] - 每页大小
 * @returns {Promise<Object>} 解析结果
 * @returns {string} return.shareCode - 提取的分享码
 * @returns {Object} return.shareToken - 分享Token信息
 * @returns {Array} return.files - 文件列表
 * @returns {number} return.total - 文件总数
 * @returns {Object} return.shareInfo - 分享信息（标题、创建时间等）
 *
 * @example
 * const result = await parseShareLink('https://pan.quark.cn/s/e622c8366282');
 * console.log(result.files.length, result.shareInfo);
 */
export async function parseShareLink(shareUrl, parentFolderId = '0', page = 1, size = 50) {
  // 提取分享码
  const shareCode = extractShareCode(shareUrl);
  if (!shareCode) {
    throw new Error('无法从输入中提取有效的分享码');
  }

  log('info', `解析分享链接: shareCode=${shareCode}`);

  try {
    // 先获取stoken，再获取分享文件列表
    const { stoken, title, author } = await getShareToken(shareCode);
    const result = await getShareFileList(shareCode, stoken, parentFolderId, page, size);

    if (!result) {
      throw new Error('获取分享文件列表失败，返回为空');
    }

    const files = result?.list || [];
    const total = result?.total || 0;

    log('info', `分享链接解析成功: ${files.length} 个文件`);

    return {
      shareCode,
      shareToken: stoken,
      files,
      total,
      shareInfo: {
        title: title || '未知分享',
        creator: author || '未知',
        createdAt: null,
        expiredAt: null,
        fileCount: total,
      },
    };
  } catch (error) {
    log('error', '分享链接解析失败:', error);
    throw new Error(`分享链接解析失败: ${error.message}`);
  }
}

/**
 * 获取分享视频的播放地址
 *
 * 从分享链接中获取指定视频文件的播放URL。
 * 需要先解析分享链接获取stoken，然后通过文件ID获取播放地址。
 *
 * @param {string} shareCode - 分享码或分享链接
 * @param {string} fileId - 视频文件ID
 * @returns {Promise<Object>} 视频播放信息
 * @returns {string} return.videoUrl - 视频播放URL
 * @returns {string} return.shareCode - 分享码
 * @returns {string} return.fileId - 文件ID
 * @returns {Object|null} return.fileInfo - 文件信息
 *
 * @example
 * const video = await getShareVideoUrl('e622c8366282', 'fileId123');
 * console.log(video.videoUrl);
 */
export async function getShareVideoUrl(shareCode, fileId) {
  if (!shareCode) {
    throw new Error('分享码不能为空');
  }
  if (!fileId) {
    throw new Error('文件ID不能为空');
  }

  // 如果传入的是完整URL，先提取分享码
  const code = extractShareCode(shareCode) || shareCode;

  log('info', `获取分享视频播放地址: shareCode=${code}, fileId=${fileId}`);

  try {
    // 获取文件信息以确认是视频文件
    const fileInfo = await getFileInfo(fileId);

    // 获取视频播放地址
    const playResult = await getVideoPlayUrl(fileId);

    if (!playResult) {
      throw new Error('获取视频播放地址失败');
    }

    log('info', '分享视频播放地址获取成功');

    return {
      videoUrl: playResult,
      shareCode: code,
      fileId,
      fileInfo: fileInfo?.[0] || null,
    };
  } catch (error) {
    log('error', '获取分享视频播放地址失败:', error);
    throw new Error(`获取视频播放地址失败: ${error.message}`);
  }
}

/**
 * 验证分享链接是否有效
 *
 * 尝试解析分享链接，根据是否能获取文件列表来判断链接有效性。
 *
 * @param {string} shareUrl - 分享链接或分享码
 * @returns {Promise<Object>} 验证结果
 * @returns {boolean} return.isValid - 是否有效
 * @returns {string|null} return.shareCode - 分享码
 * @returns {string|null} return.error - 错误信息（无效时）
 * @returns {Object|null} return.shareInfo - 分享信息（有效时）
 *
 * @example
 * const result = await validateShareLink('https://pan.quark.cn/s/e622c8366282');
 * if (result.isValid) { console.log('有效分享:', result.shareInfo.title); }
 */
export async function validateShareLink(shareUrl) {
  const shareCode = extractShareCode(shareUrl);

  if (!shareCode) {
    return {
      isValid: false,
      shareCode: null,
      error: '无法提取分享码',
      shareInfo: null,
    };
  }

  try {
    const result = await parseShareLink(shareCode, '0', 1, 1);

    return {
      isValid: result.files.length > 0 || result.total > 0,
      shareCode,
      error: null,
      shareInfo: result.shareInfo,
    };
  } catch (error) {
    return {
      isValid: false,
      shareCode,
      error: error.message,
      shareInfo: null,
    };
  }
}

export default {
  extractShareCode,
  parseShareLink,
  getShareVideoUrl,
  validateShareLink,
};
