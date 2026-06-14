/**
 * Cookie管理模块
 *
 * 负责夸克网盘Cookie的存储、读取、验证和生命周期管理。
 * 使用React Native的AsyncStorage进行持久化存储。
 *
 * @module cookie-manager
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUARK_CONFIG, STORAGE_KEYS } from '../config';

/** 默认日志标签 */
const TAG = '[CookieManager]';

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
 * 保存Cookie到AsyncStorage
 *
 * 同时保存Cookie内容和当前时间戳，用于后续有效期计算。
 *
 * @param {string} cookie - 完整的Cookie字符串
 * @returns {Promise<boolean>} 保存是否成功
 * @throws {Error} 当cookie为空时抛出错误
 *
 * @example
 * await saveCookie('eyJhbGciOi...your_cookie_here');
 */
export async function saveCookie(cookie) {
  if (!cookie || typeof cookie !== 'string') {
    throw new Error('Cookie不能为空');
  }

  try {
    const trimmed = cookie.trim();
    const now = Date.now();
    const expiry = new Date(now + QUARK_CONFIG.cookieExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    // 统一存储格式：JSON { cookie, expiry, savedAt }（与 AppContext 保持一致）
    const cookieInfo = JSON.stringify({
      cookie: trimmed,
      expiry,
      savedAt: now,
    });

    await AsyncStorage.setItem(STORAGE_KEYS.QUARK_COOKIE, cookieInfo);

    log('info', 'Cookie保存成功');
    return true;
  } catch (error) {
    log('error', 'Cookie保存失败:', error);
    throw new Error(`Cookie保存失败: ${error.message}`);
  }
}

/**
 * 从AsyncStorage获取已保存的Cookie
 *
 * 优先读取AsyncStorage中保存的Cookie，如果不存在则回退到配置文件中的Cookie。
 *
 * @returns {Promise<string|null>} Cookie字符串，不存在时返回null
 *
 * @example
 * const cookie = await getCookie();
 * if (cookie) { // 使用cookie }
 */
export async function getCookie() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUARK_COOKIE);

    if (stored && stored.trim()) {
      log('debug', '从AsyncStorage获取Cookie');
      const trimmed = stored.trim();
      // 尝试 JSON 解析（新格式: { cookie, expiry, savedAt }，与 AppContext 统一）
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed.cookie === 'string' && parsed.cookie.trim()) {
          log('debug', '使用统一JSON格式Cookie');
          return parsed.cookie.trim();
        }
        // JSON 解析成功但没有有效的 cookie 字段
        log('warn', 'Cookie JSON格式正确但缺少cookie字段');
      } catch (e) {
        // 不是 JSON，当作旧版纯字符串 Cookie（向后兼容）
        log('debug', '检测到旧版纯字符串Cookie，返回原始值');
        return trimmed;
      }
    }

    // 回退到配置文件中的Cookie
    if (QUARK_CONFIG.cookie && QUARK_CONFIG.cookie.trim()) {
      log('debug', '使用配置文件中的Cookie');
      return QUARK_CONFIG.cookie.trim();
    }

    log('warn', '未找到有效的Cookie');
    return null;
  } catch (error) {
    log('error', '获取Cookie失败:', error);
    return null;
  }
}

/**
 * 清除已保存的Cookie
 *
 * 同时清除Cookie内容和过期时间戳。
 *
 * @returns {Promise<boolean>} 清除是否成功
 *
 * @example
 * await clearCookie();
 */
export async function clearCookie() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.QUARK_COOKIE);

    log('info', 'Cookie已清除');
    return true;
  } catch (error) {
    log('error', 'Cookie清除失败:', error);
    return false;
  }
}

/**
 * 验证Cookie是否可能有效
 *
 * 通过以下方式验证：
 * 1. 检查Cookie是否存在
 * 2. 检查Cookie是否过期（根据配置的有效天数）
 * 3. 尝试调用用户信息接口验证（可选）
 *
 * @param {boolean} [checkOnline=false] - 是否在线验证（调用API）
 * @returns {Promise<boolean>} Cookie是否有效
 *
 * @example
 * const valid = await isCookieValid();
 * const validOnline = await isCookieValid(true);
 */
export async function isCookieValid(checkOnline = false) {
  try {
    const cookie = await getCookie();

    if (!cookie) {
      log('warn', 'Cookie不存在');
      return false;
    }

    // 检查本地过期时间
    const remaining = await getCookieRemainingDays();
    if (remaining !== null && remaining <= 0) {
      log('warn', 'Cookie已过期（本地时间检测）');
      return false;
    }

    // 在线验证：调用用户信息接口
    if (checkOnline) {
      try {
        const { getUserInfo } = require('./quark-api');
        const result = await getUserInfo();
        const isValid = !!(result && result.data && result.data.nickname);
        log(isValid ? 'info' : 'warn', '在线验证结果:', isValid ? '有效' : '无效');
        return isValid;
      } catch (apiError) {
        log('warn', '在线验证失败:', apiError.message);
        return false;
      }
    }

    return true;
  } catch (error) {
    log('error', 'Cookie验证失败:', error);
    return false;
  }
}

/**
 * 获取Cookie剩余有效天数
 *
 * 根据保存Cookie时的时间戳和配置的有效天数计算剩余天数。
 *
 * @returns {Promise<number|null>} 剩余天数，如果无法计算则返回null
 *
 * @example
 * const days = await getCookieRemainingDays();
 * if (days !== null && days < 2) { // 提醒更新Cookie }
 */
export async function getCookieRemainingDays() {
  try {
    // 优先从统一JSON格式中读取过期时间（ISO 字符串：{ cookie, expiry, savedAt }）
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUARK_COOKIE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.expiry) {
          const expiryDate = new Date(parsed.expiry);
          if (!isNaN(expiryDate.getTime())) {
            const now = new Date();
            const remainingMs = expiryDate.getTime() - now.getTime();
            const remainingDays = remainingMs / (1000 * 60 * 60 * 24);
            log('debug', `Cookie剩余天数(JSON): ${remainingDays.toFixed(1)}`);
            return Math.max(0, Math.floor(remainingDays));
          }
        }
      } catch (e) {
        // 不是 JSON，回退到旧版时间戳方式
      }
    }

    // 回退：从旧版 @quark_cookie_expiry 时间戳计算（仅用于旧数据迁移读取，已废弃）
    log('warn', '使用已废弃的 QUARK_COOKIE_EXPIRY key 回退读取，请更新 Cookie');
    const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.QUARK_COOKIE_EXPIRY);
    if (!expiryStr) {
      log('debug', '未找到Cookie过期时间戳');
      return null;
    }

    const savedTimestamp = parseInt(expiryStr, 10);
    if (isNaN(savedTimestamp)) {
      log('warn', 'Cookie过期时间戳格式无效');
      return null;
    }

    const now = Date.now();
    const elapsedMs = now - savedTimestamp;
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const remainingDays = QUARK_CONFIG.cookieExpiryDays - elapsedDays;

    log('debug', `Cookie剩余天数(legacy): ${remainingDays.toFixed(1)}`);
    return Math.max(0, Math.floor(remainingDays));
  } catch (error) {
    log('error', '计算Cookie剩余天数失败:', error);
    return null;
  }
}

/**
 * 获取Cookie状态摘要
 *
 * @returns {Promise<Object>} Cookie状态信息
 * @returns {boolean} return.hasCookie - 是否有Cookie
 * @returns {boolean} return.isValid - Cookie是否可能有效
 * @returns {number|null} return.remainingDays - 剩余有效天数
 * @returns {string} return.source - Cookie来源 ('async-storage' | 'config' | 'none')
 */
export async function getCookieStatus() {
  try {
    const cookie = await getCookie();
    const remaining = await getCookieRemainingDays();

    let source = 'none';
    if (cookie) {
      // 检查是否来自 AsyncStorage（而非仅 config 回退）
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUARK_COOKIE);
      if (stored && stored.trim()) {
        source = 'async-storage';
      } else {
        source = 'config';
      }
    }

    const hasCookie = !!cookie;
    const isValid = hasCookie && (remaining === null || remaining > 0);

    return {
      hasCookie,
      isValid,
      remainingDays: remaining,
      source,
    };
  } catch (error) {
    log('error', '获取Cookie状态失败:', error);
    return {
      hasCookie: false,
      isValid: false,
      remainingDays: null,
      source: 'none',
    };
  }
}

export default {
  saveCookie,
  getCookie,
  clearCookie,
  isCookieValid,
  getCookieRemainingDays,
  getCookieStatus,
};
