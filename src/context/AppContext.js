import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, QUARK_CONFIG } from '../config';
import { scheduleReview, getTodayReviews, markReviewed, getReviewStats } from '../utils/study-plan-generator';
import { checkIn as backendCheckIn, getTodayTasks, completeTask as backendCompleteTask, startTask as backendStartTask, submitDiagnosis as backendSubmitDiagnosis, getWrongQuestions as backendGetWrongQuestions, logout as backendLogout, login as backendLogin, register as backendRegister, getMe as backendGetMe, sendCode as backendSendCode, addAuthListener } from '../api/backend';
import { checkNetworkStatus } from '../utils/network';

// 初始状态
const initialState = {
  // 登录状态
  isLoggedIn: false,
  token: null,

  // 学生信息
  student: null,

  // 学习计划
  studyPlan: null,

  // 诊断结果
  diagnosisResult: null,

  // 夸克配置
  quarkCookie: null,
  quarkCookieExpiry: null,

  // 今日状态
  today: {
    date: new Date().toISOString().split('T')[0],
    studyTime: 0,  // 分钟
    entertainmentTime: 0,  // 分钟
    completedTasks: [],
    currentStreak: 0,
    checkInDate: null,  // 最近打卡日期
    totalCheckIns: 0,   // 累计打卡天数
  },

  // 学习计时器
  timer: {
    active: false,
    paused: false,
    pausedAt: null,
    startTime: null,
    subject: null,
    accumulatedMinutes: 0,  // 当前会话已计时（分钟）
  },

  // 娱乐时间
  entertainment: {
    totalAllowed: 45,  // 分钟
    used: 0,  // 分钟
    bonus: 0,  // 奖励时间
    penalty: 0,  // 惩罚时间
    logs: [],
  },

  // 作息时间
  schedule: {
    bedtime: '23:00',
    wakeUp: '06:00',
    lastSleepTime: null,
    lastWakeTime: null,
    sleepQuality: null,
  },

  // 成绩记录
  testScores: [],

  // 奖惩记录
  rewardPunishmentLogs: [],

  // 错题本
  wrongAnswers: [],

  // 加载状态
  isLoading: true,

  // 错误信息
  error: null,

  // 引导状态
  isOnboarded: false,

  // 打卡Toast
  checkInToast: false,
  studySummary: null,

  // 网络状态
  isOnline: true,
};

// Action Types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LOGGED_IN: 'SET_LOGGED_IN',
  SET_TOKEN: 'SET_TOKEN',
  SET_STUDENT: 'SET_STUDENT',
  SET_STUDY_PLAN: 'SET_STUDY_PLAN',
  SET_DIAGNOSIS_RESULT: 'SET_DIAGNOSIS_RESULT',
  SET_QUARK_COOKIE: 'SET_QUARK_COOKIE',
  UPDATE_TODAY_STUDY: 'UPDATE_TODAY_STUDY',
  UPDATE_TODAY_ENTERTAINMENT: 'UPDATE_TODAY_ENTERTAINMENT',
  ADD_COMPLETED_TASK: 'ADD_COMPLETED_TASK',
  UPDATE_ENTERTAINMENT: 'UPDATE_ENTERTAINMENT',
  ADD_ENTERTAINMENT_LOG: 'ADD_ENTERTAINMENT_LOG',
  UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',
  ADD_TEST_SCORE: 'ADD_TEST_SCORE',
  ADD_REWARD_PUNISHMENT: 'ADD_REWARD_PUNISHMENT',
  RESET_TODAY: 'RESET_TODAY',
  START_TIMER: 'START_TIMER',
  STOP_TIMER: 'STOP_TIMER',
  PAUSE_TIMER: 'PAUSE_TIMER',
  RESUME_TIMER: 'RESUME_TIMER',
  CHECK_IN: 'CHECK_IN',
  SHOW_CHECK_IN_TOAST: 'SHOW_CHECK_IN_TOAST',
  HIDE_CHECK_IN_TOAST: 'HIDE_CHECK_IN_TOAST',
  SHOW_STUDY_SUMMARY: 'SHOW_STUDY_SUMMARY',
  HIDE_STUDY_SUMMARY: 'HIDE_STUDY_SUMMARY',
  ADD_WRONG_ANSWER: 'ADD_WRONG_ANSWER',
  UPDATE_WRONG_ANSWER: 'UPDATE_WRONG_ANSWER',
  MARK_REVIEWED: 'MARK_REVIEWED',
  SET_WRONG_ANSWERS: 'SET_WRONG_ANSWERS',
  SET_TODAY: 'SET_TODAY',
  RESTORE_TIMER: 'RESTORE_TIMER',
  SET_ONBOARDED: 'SET_ONBOARDED',
  SET_ONLINE: 'SET_ONLINE',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.SET_LOGGED_IN:
      return { ...state, isLoggedIn: action.payload };

    case ActionTypes.SET_TOKEN:
      return { ...state, token: action.payload };

    case ActionTypes.SET_STUDENT:
      return { ...state, student: action.payload };

    case ActionTypes.SET_STUDY_PLAN:
      return { ...state, studyPlan: action.payload };

    case ActionTypes.SET_DIAGNOSIS_RESULT:
      return { ...state, diagnosisResult: action.payload };

    case ActionTypes.SET_QUARK_COOKIE:
      return {
        ...state,
        quarkCookie: action.payload.cookie,
        quarkCookieExpiry: action.payload.expiry,
      };

    case ActionTypes.UPDATE_TODAY_STUDY:
      return {
        ...state,
        today: {
          ...state.today,
          studyTime: state.today.studyTime + action.payload,
        },
      };

    case ActionTypes.UPDATE_TODAY_ENTERTAINMENT:
      return {
        ...state,
        today: {
          ...state.today,
          entertainmentTime: state.today.entertainmentTime + action.payload,
        },
      };

    case ActionTypes.ADD_COMPLETED_TASK:
      return {
        ...state,
        today: {
          ...state.today,
          completedTasks: [...state.today.completedTasks, action.payload],
        },
      };

    case ActionTypes.UPDATE_ENTERTAINMENT:
      return {
        ...state,
        entertainment: {
          ...state.entertainment,
          // [P1-3修复] 支持函数式更新：action.payload 为函数时调用它获取最新值
          ...(typeof action.payload === 'function'
            ? action.payload(state.entertainment)
            : action.payload),
        },
      };

    case ActionTypes.ADD_ENTERTAINMENT_LOG:
      return {
        ...state,
        entertainment: {
          ...state.entertainment,
          logs: [...state.entertainment.logs, action.payload],
        },
      };

    case ActionTypes.UPDATE_SCHEDULE:
      return {
        ...state,
        schedule: {
          ...state.schedule,
          ...action.payload,
        },
      };

    case ActionTypes.ADD_TEST_SCORE:
      return {
        ...state,
        testScores: [...state.testScores, action.payload],
      };

    case ActionTypes.ADD_REWARD_PUNISHMENT:
      return {
        ...state,
        rewardPunishmentLogs: [...state.rewardPunishmentLogs, action.payload],
      };

    case ActionTypes.RESET_TODAY:
      return {
        ...state,
        today: {
          ...initialState.today,
          date: new Date().toISOString().split('T')[0],
        },
        entertainment: {
          ...state.entertainment,
          used: 0,
          logs: [],
        },
      };

    case ActionTypes.START_TIMER:
      return {
        ...state,
        timer: {
          active: true,
          startTime: action.payload.startTime || new Date().toISOString(),
          subject: action.payload.subject || null,
          accumulatedMinutes: 0,
        },
      };

    case ActionTypes.STOP_TIMER: {
      const elapsed = action.payload?.minutes || state.timer.accumulatedMinutes || 0;
      return {
        ...state,
        timer: { active: false, paused: false, pausedAt: null, startTime: null, subject: null, accumulatedMinutes: 0 },
        today: { ...state.today, studyTime: state.today.studyTime + elapsed },
      };
    }

    case ActionTypes.PAUSE_TIMER: {
      const now = new Date().getTime();
      const start = state.timer.startTime ? new Date(state.timer.startTime).getTime() : now;
      const acc = state.timer.accumulatedMinutes + Math.floor((now - start) / 60000);
      return {
        ...state,
        timer: {
          ...state.timer,
          active: true,
          paused: true,
          pausedAt: new Date().toISOString(),
          accumulatedMinutes: acc,
        },
      };
    }

    case ActionTypes.RESUME_TIMER: {
      const accMs = (state.timer.accumulatedMinutes || 0) * 60000;
      return {
        ...state,
        timer: {
          ...state.timer,
          active: true,
          paused: false,
          pausedAt: null,
          startTime: new Date(Date.now() - accMs).toISOString(),
        },
      };
    }

    case ActionTypes.CHECK_IN:
      return {
        ...state,
        today: {
          ...state.today,
          checkInDate: action.payload.date,
          currentStreak: action.payload.streak,
          totalCheckIns: (state.today.totalCheckIns || 0) + 1,
        },
      };

    case ActionTypes.ADD_WRONG_ANSWER: {
      const newItem = {
        ...action.payload,
        addedAt: new Date().toISOString(),
        reviewCount: 0,
      };
      // 自动计算艾宾浩斯复习计划
      const reviewSchedule = scheduleReview(newItem);
      newItem.reviewState = {
        currentInterval: reviewSchedule.currentInterval,
        reviewDates: reviewSchedule.reviewDates,
        nextReviewDate: reviewSchedule.nextReviewDate,
        stage: reviewSchedule.stage,
        lastReviewed: null,
        reviewHistory: [],
        consecutiveRemembered: 0,
        completedAll: false,
      };
      return {
        ...state,
        wrongAnswers: [...state.wrongAnswers, newItem],
      };
    }

    case ActionTypes.MARK_REVIEWED: {
      const { id, remembered } = action.payload;
      return {
        ...state,
        wrongAnswers: state.wrongAnswers.map((wa) => {
          if (wa.id !== id && wa.question !== id) return wa;
          return markReviewed(wa, remembered);
        }),
      };
    }

    case ActionTypes.UPDATE_WRONG_ANSWER:
      return {
        ...state,
        wrongAnswers: state.wrongAnswers.map((wa) => {
          if (wa.id === action.payload.id || wa.question === action.payload.id) {
            return { ...wa, ...action.payload };
          }
          return wa;
        }),
      };

    case ActionTypes.SET_WRONG_ANSWERS:
      return { ...state, wrongAnswers: action.payload || [] };

    case ActionTypes.SHOW_CHECK_IN_TOAST:
      return { ...state, checkInToast: true };

    case ActionTypes.HIDE_CHECK_IN_TOAST:
      return { ...state, checkInToast: false };

    case ActionTypes.SHOW_STUDY_SUMMARY:
      return { ...state, studySummary: action.payload };

    case ActionTypes.HIDE_STUDY_SUMMARY:
      return { ...state, studySummary: null };

    case ActionTypes.RESTORE_TIMER:
      return { ...state, timer: action.payload };

    case ActionTypes.SET_TODAY:
      return {
        ...state,
        today: {
          ...state.today,
          ...action.payload,
        },
      };

    case ActionTypes.SET_ONBOARDED:
      return { ...state, isOnboarded: action.payload };

    case ActionTypes.SET_ONLINE:
      return { ...state, isOnline: action.payload };

    default:
      return state;
  }
}

// 创建Context
const AppContext = createContext();

// Provider组件
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 用于透视最新 timer 状态的 ref（避免 interval 闭包过期）
  const timerRef = useRef(state.timer);
  timerRef.current = state.timer;

  // [P1-3修复] 用于透视最新 entertainment 状态的 ref（避免 logEntertainmentTime 闭包过期）
  const entertainmentRef = useRef(state.entertainment);
  entertainmentRef.current = state.entertainment;

  // 初始化加载数据
  useEffect(() => {
    loadInitialData();
  }, []);

  // 检查日期变化
  useEffect(() => {
    const checkDate = () => {
      const today = new Date().toISOString().split('T')[0];
      if (state.today.date !== today) {
        dispatch({ type: ActionTypes.RESET_TODAY });
      }
    };

    const interval = setInterval(checkDate, 60000);  // 每分钟检查
    return () => clearInterval(interval);
  }, [state.today.date]);

  // 网络状态监控
  useEffect(() => {
    let unsubscribe;

    const initNetworkMonitor = async () => {
      try {
        const { isConnected } = await checkNetworkStatus();
        dispatch({ type: ActionTypes.SET_ONLINE, payload: isConnected });

        // 订阅网络状态变化
        const NetInfo = require('@react-native-community/netinfo').default;
        unsubscribe = NetInfo.addEventListener(netState => {
          const online = !!(netState.isConnected && netState.isInternetReachable !== 'none');
          dispatch({ type: ActionTypes.SET_ONLINE, payload: online });
        });
      } catch (e) {
        console.warn('网络监控初始化失败:', e.message);
      }
    };

    initNetworkMonitor();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 后端 401 监听——token 过期时自动触发全局登出
  useEffect(() => {
    const handleAuthEvent = (type) => {
      if (type === 'backend:unauthorized') {
        dispatch({ type: ActionTypes.LOGOUT });
        // 清除所有本地用户数据（保留 AI 配置和通知设置由 SettingsScreen logout 处理）
        AsyncStorage.multiRemove([
          STORAGE_KEYS.STUDENT,
          STORAGE_KEYS.ONBOARDING,
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.NAV_STATE,
          STORAGE_KEYS.STUDY_PLAN,
          STORAGE_KEYS.DIAGNOSIS_RESULT,
          STORAGE_KEYS.TODAY_TASKS,
        ]).catch(() => {});
      }
    };
    addAuthListener(handleAuthEvent);
    return () => removeAuthListener(handleAuthEvent);
  }, []);

  // 计时器状态持久化——每秒/每 5 秒写入 AsyncStorage，保证杀 App 后可断点续学
  useEffect(() => {
    if (!state.timer.active) {
      // 计时器停止后清除持久化
      AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE).catch(() => {});
      return;
    }

    const persist = async () => {
      try {
        const t = timerRef.current;
        const now = Date.now();
        let acc = t.accumulatedMinutes || 0;
        if (!t.paused && t.startTime) {
          acc += Math.floor((now - new Date(t.startTime).getTime()) / 60000);
        }
        await AsyncStorage.setItem(
          STORAGE_KEYS.TIMER_STATE,
          JSON.stringify({
            active: t.active,
            paused: t.paused || false,
            pausedAt: t.pausedAt || null,
            startTime: t.startTime,
            subject: t.subject || null,
            accumulatedMinutes: acc,
            date: new Date().toISOString().split('T')[0],
          }),
        );
      } catch (e) {
        // 静默失败，不影响计时
      }
    };

    persist();
    const iv = setInterval(persist, 5000);
    return () => clearInterval(iv);
  }, [state.timer.active, state.timer.paused]);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // 先检查认证状态
      await checkAuth();

      // 并行加载所有数据
      const [
        studentData,
        studyPlanData,
        diagnosisData,
        quarkCookieData,
        todayData,
        entertainmentData,
        entertainmentStateData,
        scheduleData,
        testScoresData,
        logsData,
        wrongAnswersData,
        checkinData,
        timerStateData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STUDENT_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.STUDY_PLAN),
        AsyncStorage.getItem(STORAGE_KEYS.DIAGNOSIS_RESULT),
        AsyncStorage.getItem(STORAGE_KEYS.QUARK_COOKIE),
        AsyncStorage.getItem(STORAGE_KEYS.STUDY_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.ENTERTAINMENT_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.ENTERTAINMENT_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.SLEEP_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.TEST_SCORES),
        AsyncStorage.getItem(STORAGE_KEYS.REWARD_PUNISHMENT),
        AsyncStorage.getItem('@wrong_answers'),
        AsyncStorage.getItem('@checkin'),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE),
      ]);

      // 更新状态
      if (studentData) {
        dispatch({ type: ActionTypes.SET_STUDENT, payload: JSON.parse(studentData) });
      }
      if (studyPlanData) {
        dispatch({ type: ActionTypes.SET_STUDY_PLAN, payload: JSON.parse(studyPlanData) });
      }
      if (diagnosisData) {
        dispatch({ type: ActionTypes.SET_DIAGNOSIS_RESULT, payload: JSON.parse(diagnosisData) });
      }
      if (quarkCookieData) {
        try {
          const cookieInfo = JSON.parse(quarkCookieData);
          // 新统一格式: { cookie, expiry, savedAt }
          if (cookieInfo && typeof cookieInfo.cookie === 'string') {
            dispatch({
              type: ActionTypes.SET_QUARK_COOKIE,
              payload: {
                cookie: cookieInfo.cookie,
                expiry: cookieInfo.expiry || null,
              },
            });
          }
        } catch (e) {
          // 旧版纯字符串 Cookie（向后兼容）
          const trimmed = quarkCookieData.trim();
          if (trimmed && !trimmed.startsWith('{')) {
            dispatch({
              type: ActionTypes.SET_QUARK_COOKIE,
              payload: { cookie: trimmed, expiry: null },
            });
          }
        }
      }

      // 加载错题本
      if (wrongAnswersData) {
        dispatch({ type: ActionTypes.SET_WRONG_ANSWERS, payload: JSON.parse(wrongAnswersData) });
      }
      // 加载打卡数据
      if (checkinData) {
        const ci = JSON.parse(checkinData);
        dispatch({ type: ActionTypes.CHECK_IN, payload: { date: ci.date, streak: ci.streak || 1 } });
      }
      // 从 STUDY_LOGS 恢复 today.studyTime
      if (todayData) {
        try {
          const logs = JSON.parse(todayData);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayMinutes = logs
            .filter(log => log.date && log.date.startsWith(todayStr))
            .reduce((sum, log) => sum + (log.minutes || 0), 0);
          if (todayMinutes > 0) {
            dispatch({ type: ActionTypes.SET_TODAY, payload: { studyTime: todayMinutes } });
          }
        } catch (e) {}
      }


      // 恢复 entertainment 状态（used/bonus/penalty），仅同日数据有效
      if (entertainmentStateData) {
        try {
          const es = JSON.parse(entertainmentStateData);
          const todayStr = new Date().toISOString().split('T')[0];
          if (es.date === todayStr) {
            dispatch({
              type: ActionTypes.UPDATE_ENTERTAINMENT,
              payload: {
                used: es.used || 0,
                bonus: es.bonus || 0,
                penalty: es.penalty || 0,
              },
            });
          }
          // 跨天数据不恢复（RESET_TODAY 已将 used 归零）
        } catch (e) {}
      }
      // 恢复未完成的计时器会话
      if (timerStateData) {
        try {
          const savedTimer = JSON.parse(timerStateData);
          if (savedTimer.active) {
            const todayStr = new Date().toISOString().split('T')[0];
            if (savedTimer.date && savedTimer.date !== todayStr) {
              // 跨天旧会话，清除
              await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
            } else if (savedTimer.paused) {
              // 暂停状态，原样恢复
              dispatch({ type: ActionTypes.RESTORE_TIMER, payload: savedTimer });
            } else {
              // 非暂停（计时中），补算已流逝时间后恢复
              const now = Date.now();
              const savedStart = savedTimer.startTime ? new Date(savedTimer.startTime).getTime() : now;
              const additional = Math.floor((now - savedStart) / 60000);
              const totalAcc = (savedTimer.accumulatedMinutes || 0) + Math.max(0, additional);
              dispatch({
                type: ActionTypes.RESTORE_TIMER,
                payload: {
                  active: true,
                  paused: false,
                  pausedAt: null,
                  startTime: new Date(now - totalAcc * 60000).toISOString(),
                  subject: savedTimer.subject || null,
                  accumulatedMinutes: totalAcc,
                },
              });
            }
          }
        } catch (e) {
          await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE).catch(() => {});
        }
      }

      // 加载引导完成状态：有学生数据或标记即为已完成
      const onboarded = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      if (studentData || onboarded) {
        dispatch({ type: ActionTypes.SET_ONBOARDED, payload: true });
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    } catch (error) {
      console.error('加载数据失败:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: '加载数据失败' });
    }
  };

  // 保存学生信息
  const saveStudent = async (studentInfo) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STUDENT_INFO,
        JSON.stringify(studentInfo)
      );
      dispatch({ type: ActionTypes.SET_STUDENT, payload: studentInfo });
      return true;
    } catch (error) {
      console.error('保存学生信息失败:', error);
      return false;
    }
  };

  // 完成引导
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      dispatch({ type: ActionTypes.SET_ONBOARDED, payload: true });
      return true;
    } catch (error) {
      console.error('保存引导状态失败:', error);
      return false;
    }
  };

  // 保存学习计划
  // [P0] 替换为先调用 backend.getTodayTasks() 获取真实任务，再 dispatch
  const saveStudyPlan = async (plan) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.STUDY_PLAN,
        JSON.stringify(plan)
      );
      dispatch({ type: ActionTypes.SET_STUDY_PLAN, payload: plan });
      // 尝试从后端获取真实任务
      try {
        const tasksResult = await getTodayTasks();
        if (tasksResult && tasksResult.tasks) {
          dispatch({ type: ActionTypes.SET_STUDY_PLAN, payload: { ...plan, tasks: tasksResult.tasks } });
        }
      } catch(apiErr) {
        console.warn('获取后端任务列表失败，使用本地计划:', apiErr);
      }
      return true;
    } catch (error) {
      console.error('保存学习计划失败:', error);
      return false;
    }
  };

  // 保存诊断结果
  // [P0] 替换为调用 backend.submitDiagnosis()，用返回结果更新本地状态
  const saveDiagnosisResult = async (sessionId, answers) => {
    try {
      const result = await backendSubmitDiagnosis(sessionId, answers);
      await AsyncStorage.setItem(
        STORAGE_KEYS.DIAGNOSIS_RESULT,
        JSON.stringify(result)
      );
      dispatch({ type: ActionTypes.SET_DIAGNOSIS_RESULT, payload: result });
      return result;
    } catch (error) {
      console.error('提交诊断结果失败:', error);
      return null;
    }
  };

  // 保存夸克Cookie（格式与 cookie-manager 统一: { cookie, expiry, savedAt }）
  const saveQuarkCookie = async (cookie) => {
    try {
      const now = Date.now();
      const expiry = new Date(now + QUARK_CONFIG.cookieExpiryDays * 24 * 60 * 60 * 1000);

      const cookieInfo = {
        cookie,
        expiry: expiry.toISOString(),
        savedAt: now,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.QUARK_COOKIE, JSON.stringify(cookieInfo));

      dispatch({
        type: ActionTypes.SET_QUARK_COOKIE,
        payload: {
          cookie,
          expiry: expiry.toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error('保存夸克Cookie失败:', error);
      return false;
    }
  };

  // 清理过期日志（保留最近 90 天）
  const KEEP_LOG_DAYS = 90;
  const trimLogs = (logs) => {
    const cutoff = Date.now() - KEEP_LOG_DAYS * 24 * 60 * 60 * 1000;
    return logs.filter(log => {
      const logDate = log.date ? new Date(log.date).getTime() : 0;
      return logDate >= cutoff;
    });
  };

  // 记录学习时间
  const logStudyTime = async (minutes, subject) => {
    // 读取已有日志，清理过期记录后再追加
    const log = {
      date: new Date().toISOString(),
      minutes,
      subject,
    };

    try {
      const existingLogs = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_LOGS);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(log);
      const trimmedLogs = trimLogs(logs);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_LOGS, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('记录学习时间失败:', error);
    }
  };

  // 记录娱乐时间
  // [P1-3修复] 使用函数式更新避免 stale closure：entertainment.used 连续调用时可能不同步
  const logEntertainmentTime = async (minutes, type) => {
    dispatch({ type: ActionTypes.UPDATE_TODAY_ENTERTAINMENT, payload: minutes });
    // 递增 entertainment.used（累计已用娱乐时间），防止重启后归零被反复使用
    // 使用函数式更新确保基于最新状态计算
    dispatch({ type: ActionTypes.UPDATE_ENTERTAINMENT, payload: { used: prev => (prev || 0) + minutes } });

    const log = {
      date: new Date().toISOString(),
      minutes,
      type,
    };

    dispatch({ type: ActionTypes.ADD_ENTERTAINMENT_LOG, payload: log });

    // [P1-3修复] 计算本次更新后的 used 值（用于 storage 持久化）
    // 由于 dispatch 是异步的，这里用局部变量记录本次增量，storage 写入依赖此值而非 state
    const currentUsedDelta = minutes;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const existingLogs = await AsyncStorage.getItem(STORAGE_KEYS.ENTERTAINMENT_LOGS);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(log);
      const trimmedLogs = trimLogs(logs);
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENTERTAINMENT_LOGS,
        JSON.stringify(trimmedLogs)
      );

      // 持久化 entertainment 状态（used/bonus/penalty），保证重启后不丢失
      // [P1-3修复] 从 timerRef 读取最新的 entertainment 状态而非闭包中的 state
      const entRef = entertainmentRef.current;
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENTERTAINMENT_STATE,
        JSON.stringify({
          totalAllowed: entRef.totalAllowed,
          used: entRef.used + currentUsedDelta,
          bonus: entRef.bonus,
          penalty: entRef.penalty,
          date: todayStr,
        }),
      );
    } catch (error) {
      console.error('记录娱乐时间失败:', error);
    }
  };

  // 完成任务
  const completeTask = async (taskId) => {
    dispatch({ type: ActionTypes.ADD_COMPLETED_TASK, payload: taskId });
  };

  // 记录成绩
  const addTestScore = async (score) => {
    dispatch({ type: ActionTypes.ADD_TEST_SCORE, payload: score });

    try {
      const existingScores = await AsyncStorage.getItem(STORAGE_KEYS.TEST_SCORES);
      const scores = existingScores ? JSON.parse(existingScores) : [];
      scores.push(score);
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_SCORES, JSON.stringify(scores));
    } catch (error) {
      console.error('记录成绩失败:', error);
    }
  };

  // 更新作息时间
  const updateSchedule = async (scheduleData) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SLEEP_LOGS,
        JSON.stringify(scheduleData)
      );
      dispatch({ type: ActionTypes.UPDATE_SCHEDULE, payload: scheduleData });
    } catch (error) {
      console.error('更新作息失败:', error);
    }
  };

  // ===== 计时器 =====
  const timerLockRef = useRef(false);

  // [P0] 替换为 startTimer 时调用 backend.startTask(taskId)
  const startTimer = async (subject, taskId) => {
    if (timerLockRef.current || state.timer.active) return;
    timerLockRef.current = true;
    try {
      dispatch({ type: ActionTypes.START_TIMER, payload: { startTime: new Date().toISOString(), subject } });
      // 调用后端 API 开启任务
      if (taskId != null) {
        try {
          await backendStartTask(taskId);
        } catch(apiErr) {
          console.warn('backend.startTask 失败:', apiErr);
        }
      }
    } finally {
      timerLockRef.current = false;
    }
  };

  // [P0] 替换为 stopTimer 时调用 backend.completeTask(taskId)
  const stopTimer = async (minutes, taskId) => {
    if (timerLockRef.current || !state.timer.active) return;
    timerLockRef.current = true;
    try {
      const elapsed = minutes || state.timer.accumulatedMinutes || 0;
      dispatch({ type: ActionTypes.STOP_TIMER, payload: { minutes: elapsed } });
      logStudyTime(elapsed, state.timer.subject);
      // 尝试调用后端 API 完成任务
      if (taskId != null) {
        try {
          await backendCompleteTask(taskId);
        } catch(apiErr) {
          console.warn('backend.completeTask 失败:', apiErr);
        }
      }
      // 展示学习摘要
      if (elapsed > 0) {
        dispatch({
          type: ActionTypes.SHOW_STUDY_SUMMARY,
          payload: { subject: state.timer.subject, minutes: elapsed },
        });
      }
      // 清除持久化的计时器状态，避免下次启动误恢复已结束的会话
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
      } catch (e) {}
      // 自动打卡
      const today = new Date().toISOString().split('T')[0];
      if (state.today.checkInDate !== today) {
        checkIn();
        dispatch({ type: ActionTypes.SHOW_CHECK_IN_TOAST });
      }
    } finally {
      timerLockRef.current = false;
    }
  };

  const pauseTimer = () => {
    if (timerLockRef.current || !state.timer.active || state.timer.paused) return;
    timerLockRef.current = true;
    try {
      dispatch({ type: ActionTypes.PAUSE_TIMER });
    } finally {
      timerLockRef.current = false;
    }
  };

  const resumeTimer = () => {
    if (timerLockRef.current || !state.timer.paused) return;
    timerLockRef.current = true;
    try {
      dispatch({ type: ActionTypes.RESUME_TIMER });
    } finally {
      timerLockRef.current = false;
    }
  };

  const dismissCheckInToast = () => {
    dispatch({ type: ActionTypes.HIDE_CHECK_IN_TOAST });
  };

  const dismissStudySummary = () => {
    dispatch({ type: ActionTypes.HIDE_STUDY_SUMMARY });
  };

  // ===== 打卡 =====
  // [P0] 替换为 backend.checkIn() API
  const checkIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (state.today.checkInDate === today) return;
    try {
      const result = await backendCheckIn();
      dispatch({ type: ActionTypes.CHECK_IN, payload: { date: result.last_checkin || today, streak: result.streak || 1 } });
      await AsyncStorage.setItem('@checkin', JSON.stringify({ date: result.last_checkin || today, streak: result.streak || 1, total: (state.today.totalCheckIns || 0) + 1 }));
    } catch(e) {
      // Fallback to local state
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = state.today.checkInDate === yesterday ? state.today.currentStreak + 1 : 1;
      dispatch({ type: ActionTypes.CHECK_IN, payload: { date: today, streak: newStreak } });
      try {
        await AsyncStorage.setItem('@checkin', JSON.stringify({ date: today, streak: newStreak, total: (state.today.totalCheckIns || 0) + 1 }));
      } catch(e2) {}
    }
  };

  // ===== 错题本 =====
  // [P0] 优先使用 backend.getWrongQuestions() 拉取，后端自动处理错题记录（见 diagnostic_session.py），本地缓存保留
  const addWrongAnswer = async (item) => {
    dispatch({ type: ActionTypes.ADD_WRONG_ANSWER, payload: item });
    try {
      const existing = await AsyncStorage.getItem('@wrong_answers');
      const list = existing ? JSON.parse(existing) : [];
      // 计算艾宾浩斯复习计划
      const reviewSchedule = scheduleReview({ addedAt: new Date().toISOString() });
      const newItem = {
        ...item,
        addedAt: new Date().toISOString(),
        reviewCount: 0,
        reviewState: {
          currentInterval: reviewSchedule.currentInterval,
          reviewDates: reviewSchedule.reviewDates,
          nextReviewDate: reviewSchedule.nextReviewDate,
          stage: reviewSchedule.stage,
          lastReviewed: null,
          reviewHistory: [],
          consecutiveRemembered: 0,
          completedAll: false,
        },
      };
      list.push(newItem);
      await AsyncStorage.setItem('@wrong_answers', JSON.stringify(list));
      // 尝试从后端拉取最新错题（后端自动处理记录）
      try {
        const result = await backendGetWrongQuestions();
        if (result && result.items) {
          dispatch({ type: ActionTypes.SET_WRONG_ANSWERS, payload: result.items });
        }
      } catch(apiErr) {
        console.warn('backend.getWrongQuestions 失败，使用本地缓存:', apiErr);
      }
    } catch(e) {}
  };

  const markWrongAnswerReviewed = async (wrongAnswerId, remembered) => {
    dispatch({ type: ActionTypes.MARK_REVIEWED, payload: { id: wrongAnswerId, remembered } });
    try {
      const existing = await AsyncStorage.getItem('@wrong_answers');
      const list = existing ? JSON.parse(existing) : [];
      const updated = list.map((wa) => {
        if (wa.id === wrongAnswerId || wa.question === wrongAnswerId) {
          return markReviewed(wa, remembered);
        }
        return wa;
      });
      await AsyncStorage.setItem('@wrong_answers', JSON.stringify(updated));
    } catch(e) {}
  };

  const updateWrongAnswer = async (wrongAnswerId, updates) => {
    dispatch({ type: ActionTypes.UPDATE_WRONG_ANSWER, payload: { id: wrongAnswerId, ...updates } });
    try {
      const existing = await AsyncStorage.getItem('@wrong_answers');
      const list = existing ? JSON.parse(existing) : [];
      const updated = list.map((wa) => {
        if (wa.id === wrongAnswerId || wa.question === wrongAnswerId) {
          return { ...wa, ...updates };
        }
        return wa;
      });
      await AsyncStorage.setItem('@wrong_answers', JSON.stringify(updated));
    } catch(e) {}
  };

  const loadWrongAnswers = async () => {
    try {
      const data = await AsyncStorage.getItem('@wrong_answers');
      if (data) {
        dispatch({ type: ActionTypes.SET_WRONG_ANSWERS, payload: JSON.parse(data) });
      }
    } catch(e) {}
  };

  // 记录奖惩
  const addRewardPunishment = async (record) => {
    dispatch({ type: ActionTypes.ADD_REWARD_PUNISHMENT, payload: record });

    try {
      const existingLogs = await AsyncStorage.getItem(STORAGE_KEYS.REWARD_PUNISHMENT);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(record);
      await AsyncStorage.setItem(
        STORAGE_KEYS.REWARD_PUNISHMENT,
        JSON.stringify(logs)
      );
    } catch (error) {
      console.error('记录奖惩失败:', error);
    }
  };

  // 计算剩余娱乐时间（useMemo 避免每次 render 重复计算）
  const remainingEntertainmentTime = useMemo(() => {
    const { totalAllowed, used, bonus, penalty } = state.entertainment;
    return Math.max(0, totalAllowed + bonus - penalty - used);
  }, [state.entertainment.totalAllowed, state.entertainment.used, state.entertainment.bonus, state.entertainment.penalty]);

  // 检查Cookie是否过期（useMemo 缓存结果）
  const isCookieExpired = useMemo(() => {
    if (!state.quarkCookieExpiry) return true;
    return new Date() > new Date(state.quarkCookieExpiry);
  }, [state.quarkCookieExpiry]);

  // 今日待复习数量（艾宾浩斯复习系统）
  const todayReviewCount = useMemo(() => {
    const due = getTodayReviews(state.wrongAnswers);
    return due.length;
  }, [state.wrongAnswers]);

  // 复习统计数据
  const reviewStats = useMemo(() => {
    return getReviewStats(state.wrongAnswers);
  }, [state.wrongAnswers]);

  // 退出登录
  const logout = async () => {
    try {
      // 调用后端登出API
      await backendLogout();
    } catch (e) {
      console.warn('后端登出失败:', e);
    }
    // [P2-3修复] 清除所有本地存储的敏感数据：token、用户信息、夸克Cookie、AI设置
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.AUTH_USER,
        STORAGE_KEYS.QUARK_COOKIE,
        STORAGE_KEYS.AI_SETTINGS,
      ]);
    } catch (e) {
      console.warn('清除本地存储失败:', e);
    }
    // 重置登录状态和敏感状态
    dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: false });
    dispatch({ type: ActionTypes.SET_TOKEN, payload: null });
    dispatch({ type: ActionTypes.SET_STUDENT, payload: null });
    // [P2-3修复] 清除夸克Cookie状态（使用SET_QUARK_COOKIE将cookie和expiry设为null）
    dispatch({ type: ActionTypes.SET_QUARK_COOKIE, payload: { cookie: null, expiry: null } });
  };

  // 检查认证状态（启动时调用）
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: false });
        return false;
      }
      // 用 /api/auth/me 验证 token 有效性
      const user = await backendGetMe();
      dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: true });
      dispatch({ type: ActionTypes.SET_TOKEN, payload: token });
      dispatch({ type: ActionTypes.SET_STUDENT, payload: user });
      return true;
    } catch (e) {
      // token 无效或过期，清除
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER).catch(() => {});
      dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: false });
      dispatch({ type: ActionTypes.SET_TOKEN, payload: null });
      return false;
    }
  };

  // 登录（手机号 + 验证码）
  const login = async (phone, code) => {
    // 先尝试登录，失败则尝试注册
    try {
      const result = await backendLogin({ phone, code });
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(result.user));
      dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: true });
      dispatch({ type: ActionTypes.SET_TOKEN, payload: result.access_token });
      dispatch({ type: ActionTypes.SET_STUDENT, payload: result.user });
      return result;
    } catch (loginErr) {
      // 登录失败，尝试注册（未注册用户会走到这里）
      const regResult = await backendRegister({ phone, code });
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, regResult.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(regResult.user));
      dispatch({ type: ActionTypes.SET_LOGGED_IN, payload: true });
      dispatch({ type: ActionTypes.SET_TOKEN, payload: regResult.access_token });
      dispatch({ type: ActionTypes.SET_STUDENT, payload: regResult.user });
      return regResult;
    }
  };

  // [P1-1修复] 使用 useMemo 包裹整个 contextValue，避免每次 render 新建对象导致所有 consumer 重渲染
  // 依赖数组包含所有会影响 context value 的 state 和方法
  const contextValue = useMemo(() => ({
    // 状态（spread 会在 value 变化时触发 memo 重新计算）
    ...state,

    // 计算属性（已通过 useMemo 缓存）
    remainingEntertainmentTime,
    isCookieExpired,
    todayReviewCount,
    reviewStats,

    // 操作方法（这些函数定义在 useMemo 外，引用稳定，但每次 memo 重新计算时生成新引用）
    saveStudent,
    completeOnboarding,
    saveStudyPlan,
    saveDiagnosisResult,
    saveQuarkCookie,
    logStudyTime,
    logEntertainmentTime,
    completeTask,
    addTestScore,
    addRewardPunishment,
    updateSchedule,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    dismissCheckInToast,
    dismissStudySummary,
    checkIn,
    addWrongAnswer,
    markWrongAnswerReviewed,
    updateWrongAnswer,
    loadWrongAnswers,
    wrongAnswers: state.wrongAnswers,
    logout,
    login,
    checkAuth,

    // 刷新数据
    refreshData: loadInitialData,

    // 网络状态（已通过 state.isOnline 跟踪）
    isOnline: state.isOnline,
  }), [
    state,
    remainingEntertainmentTime,
    isCookieExpired,
    todayReviewCount,
    reviewStats,
    saveStudent,
    completeOnboarding,
    saveStudyPlan,
    saveDiagnosisResult,
    saveQuarkCookie,
    logStudyTime,
    logEntertainmentTime,
    completeTask,
    addTestScore,
    addRewardPunishment,
    updateSchedule,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    dismissCheckInToast,
    dismissStudySummary,
    checkIn,
    addWrongAnswer,
    markWrongAnswerReviewed,
    updateWrongAnswer,
    loadWrongAnswers,
    logout,
    login,
    checkAuth,
    loadInitialData,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// 自定义Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
