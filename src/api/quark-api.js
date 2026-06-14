/**
 * 夸克网盘API封装（基于TVBox开源方案，已验证通过）
 * 提供分享链接解析、文件浏览、视频播放地址获取等功能
 * @module quark-api
 */

import { QUARK_CONFIG } from '../config';
import { getCookie, isCookieValid, clearCookie, saveCookie } from './cookie-manager';

// ========== 常量 ==========
const SHARE_API_BASE = 'https://pan.quark.cn';
const DRIVE_API_BASE = 'https://drive-pc.quark.cn';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch';
const REQUEST_TIMEOUT = 30000;
const MAX_RETRY = 3;
const RETRY_BASE_DELAY = 1500;

const TAG = '[QuarkAPI]';
const log = (level, msg, ...args) => {
  if (__DEV__ || level === 'error') {
    (console[level] || console.log)(`${TAG} ${msg}`, ...args);
  }
};

// ========== Cookie 管理 ==========
function updatePuusFromHeaders(headers) {
  try {
    const setCookie = headers?.get?.('set-cookie') || headers?.['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie].filter(Boolean);
    const puusCookie = cookies.find(c => c && c.startsWith('__puus'));
    if (puusCookie) {
      const puusVal = puusCookie.split(';')[0];
      const current = getCookie() || '';
      const parts = current.split(';').map(s => s.trim());
      const idx = parts.findIndex(c => c.startsWith('__puus='));
      if (idx >= 0) parts[idx] = puusVal;
      else parts.push(puusVal);
      saveCookie(parts.join('; '));
    }
  } catch(e) {}
}

// ========== 请求封装 ==========
async function request(url, { method = 'GET', body, host } = {}) {
  const cookie = await getCookie();
  if (!cookie) throw new Error('未配置Cookie');

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const fetchOptions = {
        method,
        headers: {
          'Cookie': cookie,
          'User-Agent': UA,
          'Referer': 'https://pan.quark.cn/',
          'Origin': 'https://pan.quark.cn',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': method !== 'GET' ? 'application/json;charset=UTF-8' : undefined,
        },
        signal: controller.signal,
      };
      if (body && method !== 'GET') fetchOptions.body = JSON.stringify(body);

      const finalUrl = url.startsWith('http') ? url : (host || SHARE_API_BASE) + url;
      const response = await fetch(finalUrl, fetchOptions);
      clearTimeout(timeoutId);
      updatePuusFromHeaders(response.headers);

      if (response.status === 401 || response.status === 403) {
        await clearCookie();
        throw new Error('Cookie已失效，请重新设置');
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      // 夸克API用 code=0 表示成功
      if (data.code !== undefined && data.code !== 0 && data.code !== 200) {
        if (data.code === 41001 || data.code === 40001 || data.code === 10000) {
          await clearCookie();
          throw new Error(`Cookie已失效 (${data.code})`);
        }
        throw new Error(`业务错误: ${data.message} (code=${data.code})`);
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (error.message.includes('Cookie已失效')) throw error;
      if (attempt < MAX_RETRY) {
        await new Promise(r => setTimeout(r, RETRY_BASE_DELAY * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError || new Error('请求失败，已重试最大次数');
}

// ========== 分享链接解析 ==========

/**
 * 获取分享Token（访问分享内容的前提）
 */
export async function getShareToken(pwdId, passcode = '') {
  const res = await request(
    `${SHARE_API_BASE}/1/clouddrive/share/sharepage/token?pr=ucpro&fr=pc&__dt=${Date.now()}`,
    { method: 'POST', body: { pwd_id: pwdId, passcode } }
  );
  if (res.code !== 0) throw new Error(`获取分享Token失败: ${res.message} (${res.code})`);
  return { stoken: res.data.stoken, title: res.data.title, author: res.data.author };
}

/**
 * 获取分享文件列表（递归获取所有文件）
 */
export async function getShareFileList(pwdId, stoken, pdirFid = '0', page = 1, size = 200) {
  const res = await request(
    `${SHARE_API_BASE}/1/clouddrive/share/sharepage/detail?pr=ucpro&fr=pc&pwd_id=${pwdId}&stoken=${encodeURIComponent(stoken)}&pdir_fid=${pdirFid}&_page=${page}&_size=${size}&_sort=file_type:asc,updated_at:desc&__dt=${Date.now()}`
  );
  return {
    list: res.data?.list || [],
    total: res.metadata?._total || 0,
    count: res.metadata?._count || 0,
  };
}

/**
 * 递归获取分享的所有文件（含子目录）
 */
export async function getAllShareFiles(pwdId, stoken, pdirFid = '0', parentPath = '') {
  let allFiles = [];
  let page = 1;
  // 先获取当前目录
  while (true) {
    const result = await getShareFileList(pwdId, stoken, pdirFid, page, 200);
    for (const item of result.list) {
      const currentPath = parentPath ? `${parentPath}/${item.file_name}` : item.file_name;
      if (item.dir) {
        const subFiles = await getAllShareFiles(pwdId, stoken, item.fid, currentPath);
        allFiles = allFiles.concat(subFiles);
      } else {
        allFiles.push({ ...item, path: parentPath });
      }
    }
    if (result.count < 200) break;
    page++;
  }
  return allFiles;
}

// ========== 视频播放 ==========

/**
 * 获取分享文件的视频播放地址
 */
export async function getVideoPlayUrl(fileId) {
  const res = await request(
    `${DRIVE_API_BASE}/1/clouddrive/file/download?pr=ucpro&fr=pc`,
    { method: 'POST', body: { fids: [fileId] } }
  );
  if (res.code !== 0) throw new Error(`获取播放地址失败: ${res.message}`);
  const download_url = res.data?.[0]?.download_url || null;
  return download_url;
}

// ========== 兼容旧接口（供 course-parser 等调用） ==========

/**
 * 获取文件信息
 */
export async function getFileInfo(fileId) {
  const res = await request(
    `${DRIVE_API_BASE}/1/clouddrive/file?pr=ucpro&fr=pc&fid=${fileId}&__dt=${Date.now()}`
  );
  return res.data;
}

/**
 * 搜索网盘文件
 */
export async function searchFiles(keyword, page = 1, size = 50) {
  const res = await request(
    `${DRIVE_API_BASE}/1/clouddrive/file/search?pr=ucpro&fr=pc`,
    { method: 'POST', body: { keyword, _page: page, _size: size } }
  );
  return { data: { list: res.data?.list || [], total: res.data?.total || 0 } };
}

/**
 * 获取文件列表（个人网盘）
 */
export async function getFileList(parentId = '0', page = 1, size = 50) {
  const res = await request(
    `${DRIVE_API_BASE}/1/clouddrive/file/sort?pr=ucpro&fr=pc`,
    { method: 'POST', body: { pdir_fid: parentId, _page: page, _size: size, _sort: { field: 'file_type', order: 'asc' } } }
  );
  return { data: { list: res.data?.list || [], total: res.data?.total || 0 } };
}

/**
 * 获取用户信息和容量
 */
export async function getUserInfo() {
  const res = await request(
    `${DRIVE_API_BASE}/1/clouddrive/member?pr=ucpro&fr=pc&fetch_subscribe=true&fetch_identity=true`
  );
  return res;
}

/**
 * 检查连接状态（验证Cookie是否有效）
 */
export async function checkConnection() {
  try {
    await getUserInfo();
    return true;
  } catch {
    return false;
  }
}
