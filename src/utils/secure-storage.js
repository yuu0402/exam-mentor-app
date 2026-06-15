/**
 * 安全存储工具层
 * Sensitive 数据（auth token、API Key、Cookie）使用 iOS Keychain / Android Keystore
 * 降级策略：SecureStore 不可用时回退 AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const KEYCHAIN_ACCESS = SecureStore.KEYCHAIN_ACCESSIBLE.WHEN_UNLOCKED;

async function setSecure(key, value) {
  try {
    await SecureStore.setItemAsync(key, value, { keychainAccessible: KEYCHAIN_ACCESS });
    return true;
  } catch (e) {
    await AsyncStorage.setItem(key, value);
    return false;
  }
}

async function getSecure(key) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return await AsyncStorage.getItem(key);
  }
}

async function removeSecure(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    await AsyncStorage.removeItem(key);
  }
}

// ===== 认证 Token =====
export const SECURE_TOKEN_KEY = '@auth_token';
export async function setAuthToken(token) { return setSecure(SECURE_TOKEN_KEY, token); }
export async function getAuthToken() { return getSecure(SECURE_TOKEN_KEY); }
export async function removeAuthToken() { return removeSecure(SECURE_TOKEN_KEY); }

// ===== 夸克 Cookie（敏感）=====
export const SECURE_QUARK_COOKIE = '@secure_quark_cookie';
export async function setQuarkCookie(cookieInfo) {
  return setSecure(SECURE_QUARK_COOKIE, JSON.stringify(cookieInfo));
}
export async function getQuarkCookie() {
  const val = await getSecure(SECURE_QUARK_COOKIE);
  return val ? JSON.parse(val) : null;
}
export async function removeQuarkCookie() { return removeSecure(SECURE_QUARK_COOKIE); }

// ===== AI API Key（敏感）=====
export const SECURE_AI_KEY = '@secure_ai_key';
export async function setAIKey(apiKey, model = 'gpt-4') {
  return setSecure(SECURE_AI_KEY, JSON.stringify({ apiKey, model }));
}
export async function getAIKey() {
  const val = await getSecure(SECURE_AI_KEY);
  return val ? JSON.parse(val) : null;
}
export async function removeAIKey() { return removeSecure(SECURE_AI_KEY); }