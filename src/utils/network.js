/**
 * 网络状态检测工具
 * 提供网络连接状态检测功能
 *
 * @module network
 */

import NetInfo from '@react-native-community/netinfo';

// 缓存当前网络状态
let cachedIsConnected = true;

/**
 * 检测网络状态
 * @returns {Promise<{isConnected: boolean, isInternetReachable: boolean}>}
 */
export async function checkNetworkStatus() {
  try {
    const state = await NetInfo.fetch();
    cachedIsConnected = !!(state.isConnected && state.isInternetReachable !== 'none');
    return {
      isConnected: cachedIsConnected,
      isInternetReachable: state.isInternetReachable === 'none' ? false : !!state.isInternetReachable,
    };
  } catch (err) {
    console.warn('网络状态检测失败:', err.message);
    return {
      isConnected: cachedIsConnected,
      isInternetReachable: false,
    };
  }
}

/**
 * 是否在线（简单判断）
 * @returns {boolean}
 */
export function isOnline() {
  return cachedIsConnected;
}

/**
 * 订阅网络状态变化
 * @param {function} callback - 状态变化回调，参数为 isConnected: boolean
 * @returns {function} 取消订阅函数
 */
export function subscribeNetworkChange(callback) {
  const unsubscribe = NetInfo.addEventListener(state => {
    const isConnected = !!(state.isConnected && state.isInternetReachable !== 'none');
    cachedIsConnected = isConnected;
    callback(isConnected);
  });
  return unsubscribe;
}

export default {
  checkNetworkStatus,
  isOnline,
  subscribeNetworkChange,
};