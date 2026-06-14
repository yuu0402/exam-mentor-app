/**
 * 存储工具函数
 *
 * 提供AsyncStorage的封装和常用操作
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';

/**
 * 保存数据
 * @param {string} key - 存储键
 * @param {*} value - 要保存的值
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveData(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

/**
 * 读取数据
 * @param {string} key - 存储键
 * @returns {Promise<*>} 保存的值
 */
export async function loadData(key) {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('读取数据失败:', error);
    return null;
  }
}

/**
 * 删除数据
 * @param {string} key - 存储键
 * @returns {Promise<boolean>} 是否成功
 */
export async function removeData(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
}

/**
 * 获取所有键
 * @returns {Promise<Array>} 键列表
 */
export async function getAllKeys() {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('获取键列表失败:', error);
    return [];
  }
}

/**
 * 清除所有数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function clearAllData() {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('清除数据失败:', error);
    return false;
  }
}

/**
 * 批量保存数据
 * @param {Array} keyValuePairs - 键值对数组 [[key, value], ...]
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveMultipleData(keyValuePairs) {
  try {
    const pairs = keyValuePairs.map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(pairs);
    return true;
  } catch (error) {
    console.error('批量保存数据失败:', error);
    return false;
  }
}

/**
 * 批量读取数据
 * @param {Array} keys - 键列表
 * @returns {Promise<Object>} 键值对对象
 */
export async function loadMultipleData(keys) {
  try {
    const keyValuePairs = await AsyncStorage.multiGet(keys);
    const result = {};

    keyValuePairs.forEach(([key, value]) => {
      result[key] = value != null ? JSON.parse(value) : null;
    });

    return result;
  } catch (error) {
    console.error('批量读取数据失败:', error);
    return {};
  }
}

/**
 * 保存学习日志
 * @param {Object} log - 日志数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveStudyLog(log) {
  try {
    const existingLogs = await loadData(STORAGE_KEYS.STUDY_LOGS) || [];
    const updatedLogs = [...existingLogs, { ...log, timestamp: new Date().toISOString() }];
    return await saveData(STORAGE_KEYS.STUDY_LOGS, updatedLogs);
  } catch (error) {
    console.error('保存学习日志失败:', error);
    return false;
  }
}

/**
 * 获取学习日志
 * @param {string} date - 日期（可选）
 * @returns {Promise<Array>} 日志列表
 */
export async function getStudyLogs(date = null) {
  try {
    const logs = await loadData(STORAGE_KEYS.STUDY_LOGS) || [];

    if (date) {
      return logs.filter(log => log.date === date);
    }

    return logs;
  } catch (error) {
    console.error('获取学习日志失败:', error);
    return [];
  }
}

/**
 * 保存娱乐日志
 * @param {Object} log - 日志数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveEntertainmentLog(log) {
  try {
    const existingLogs = await loadData(STORAGE_KEYS.ENTERTAINMENT_LOGS) || [];
    const updatedLogs = [...existingLogs, { ...log, timestamp: new Date().toISOString() }];
    return await saveData(STORAGE_KEYS.ENTERTAINMENT_LOGS, updatedLogs);
  } catch (error) {
    console.error('保存娱乐日志失败:', error);
    return false;
  }
}

/**
 * 获取娱乐日志
 * @param {string} date - 日期（可选）
 * @returns {Promise<Array>} 日志列表
 */
export async function getEntertainmentLogs(date = null) {
  try {
    const logs = await loadData(STORAGE_KEYS.ENTERTAINMENT_LOGS) || [];

    if (date) {
      return logs.filter(log => log.date === date);
    }

    return logs;
  } catch (error) {
    console.error('获取娱乐日志失败:', error);
    return [];
  }
}

/**
 * 保存睡眠日志
 * @param {Object} log - 日志数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveSleepLog(log) {
  try {
    const existingLogs = await loadData(STORAGE_KEYS.SLEEP_LOGS) || [];
    const updatedLogs = [...existingLogs, { ...log, timestamp: new Date().toISOString() }];
    return await saveData(STORAGE_KEYS.SLEEP_LOGS, updatedLogs);
  } catch (error) {
    console.error('保存睡眠日志失败:', error);
    return false;
  }
}

/**
 * 获取睡眠日志
 * @param {string} date - 日期（可选）
 * @returns {Promise<Array>} 日志列表
 */
export async function getSleepLogs(date = null) {
  try {
    const logs = await loadData(STORAGE_KEYS.SLEEP_LOGS) || [];

    if (date) {
      return logs.filter(log => log.date === date);
    }

    return logs;
  } catch (error) {
    console.error('获取睡眠日志失败:', error);
    return [];
  }
}

/**
 * 保存测试成绩
 * @param {Object} score - 成绩数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveTestScore(score) {
  try {
    const existingScores = await loadData(STORAGE_KEYS.TEST_SCORES) || [];
    const updatedScores = [...existingScores, { ...score, timestamp: new Date().toISOString() }];
    return await saveData(STORAGE_KEYS.TEST_SCORES, updatedScores);
  } catch (error) {
    console.error('保存测试成绩失败:', error);
    return false;
  }
}

/**
 * 获取测试成绩
 * @param {string} subject - 科目（可选）
 * @returns {Promise<Array>} 成绩列表
 */
export async function getTestScores(subject = null) {
  try {
    const scores = await loadData(STORAGE_KEYS.TEST_SCORES) || [];

    if (subject) {
      return scores.filter(score => score.subject === subject);
    }

    return scores;
  } catch (error) {
    console.error('获取测试成绩失败:', error);
    return [];
  }
}

/**
 * 保存奖惩记录
 * @param {Object} record - 记录数据
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveRewardPunishment(record) {
  try {
    const existingRecords = await loadData(STORAGE_KEYS.REWARD_PUNISHMENT) || [];
    const updatedRecords = [...existingRecords, { ...record, timestamp: new Date().toISOString() }];
    return await saveData(STORAGE_KEYS.REWARD_PUNISHMENT, updatedRecords);
  } catch (error) {
    console.error('保存奖惩记录失败:', error);
    return false;
  }
}

/**
 * 获取奖惩记录
 * @param {string} date - 日期（可选）
 * @returns {Promise<Array>} 记录列表
 */
export async function getRewardPunishments(date = null) {
  try {
    const records = await loadData(STORAGE_KEYS.REWARD_PUNISHMENT) || [];

    if (date) {
      return records.filter(record => record.date === date);
    }

    return records;
  } catch (error) {
    console.error('获取奖惩记录失败:', error);
    return [];
  }
}

/**
 * 保存诊断结果
 * @param {Object} result - 诊断结果
 * @returns {Promise<boolean>} 是否成功
 */
export async function saveDiagnosisResult(result) {
  try {
    return await saveData(STORAGE_KEYS.DIAGNOSIS_RESULT, result);
  } catch (error) {
    console.error('保存诊断结果失败:', error);
    return false;
  }
}

/**
 * 获取诊断结果
 * @returns {Promise<Object>} 诊断结果
 */
export async function getDiagnosisResult() {
  try {
    return await loadData(STORAGE_KEYS.DIAGNOSIS_RESULT);
  } catch (error) {
    console.error('获取诊断结果失败:', error);
    return null;
  }
}

export default {
  saveData,
  loadData,
  removeData,
  getAllKeys,
  clearAllData,
  saveMultipleData,
  loadMultipleData,
  saveStudyLog,
  getStudyLogs,
  saveEntertainmentLog,
  getEntertainmentLogs,
  saveSleepLog,
  getSleepLogs,
  saveTestScore,
  getTestScores,
  saveRewardPunishment,
  getRewardPunishments,
  saveDiagnosisResult,
  getDiagnosisResult,
};
