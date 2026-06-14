import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';
import { useApp } from '../context/AppContext';
import { getRecommendedCourses } from '../api/course-parser';
import { getQuestionsBySubject, selectRandomQuestions } from '../utils/diagnosis-system';
import {
  startPomodoro,
  completePomodoro,
} from '../api/backend';

// 配置通知响应处理器（必须在组件外设置）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 请求通知权限并设置 25 分钟番茄钟通知
async function schedulePomodoroNotification(taskName, durationMinutes = 25) {
  try {
    // 请求通知权限
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('通知权限未授权');
        return;
      }
    }

    // 取消之前可能存在的所有通知
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 计划指定时长后发送通知
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '番茄钟完成',
        body: taskName ? `「${taskName}」${durationMinutes}分钟学习结束，休息一下吧！` : `${durationMinutes}分钟学习结束，休息一下吧！`,
        sound: true,
        data: { type: 'pomodoro_complete' },
      },
      trigger: { seconds: durationMinutes * 60 },
    });
    console.log(`番茄钟通知已设置，${durationMinutes}分钟后提醒`);
  } catch (e) {
    console.warn('设置通知失败:', e.message);
  }
}

// 学习会话状态机
const STAGES = {
  LEARN: 'learn',       // 看视频学知识点
  PRACTICE: 'practice', // 做题巩固
  REVIEW: 'review',     // 检查错题
  COMPLETE: 'complete', // 完成
};

export default function LearningSessionScreen({ navigation }) {
  const { timer, diagnosisResult, studyPlan, stopTimer } = useApp();
  const [stage, setStage] = useState(STAGES.LEARN);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroSessionId, setPomodoroSessionId] = useState(null);

  // 计时器
  useEffect(() => {
    if (!timer?.active) { navigation.goBack(); return; }
    const start = new Date(timer.startTime).getTime();
    setElapsed(Math.floor((Date.now() - start) / 60000));
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 60000)), 15000);
    return () => clearInterval(iv);
  }, [timer?.active]);

  // 初始化学习内容
  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    setLoading(true);
    try {
      // 从学习计划取今日第一个任务
      const tasks = studyPlan?.daily?.tasks || studyPlan?.tasks || [];
      const task = tasks[0] || {
        subject: timer?.subject || 'math',
        task: '基础知识点学习',
        knowledgePoint: '',
      };
      setCurrentTask(task);

      // 从诊断弱点匹配推荐课程
      if (diagnosisResult?.weakPoints?.length > 0) {
        const recs = await getRecommendedCourses(diagnosisResult.weakPoints, { maxPerSubject: 1 });
        const match = recs?.recommendations?.find(r => r.subject === task.subject);
        if (match) setCurrentVideo(match);
      }

      // 加载对应科目的练习题
      const qs = getQuestionsBySubject(task.subject || 'math', task.knowledgePoint || '');
      const selected = selectRandomQuestions(qs, 3);
      setQuestions(selected);

      // 启动番茄钟
      if (task.id) {
        try {
          const pomodoroRes = await startPomodoro({ task_id: task.id });
          setPomodoroSessionId(pomodoroRes.session_id);
          // 启动番茄钟通知
          await schedulePomodoroNotification(task.task || task.name || task.subject);
        } catch (e) {
          console.warn('启动番茄钟失败:', e.message);
        }
      } else {
        // 无 task_id 时也设置通知（通用 25 分钟番茄钟）
        await schedulePomodoroNotification(task.task || task.name || task.subject);
      }
    } catch (e) {
      console.error('初始化学习失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (min) => {
    if (min < 60) return `${min}分钟`;
    return `${Math.floor(min/60)}时${min%60}分`;
  };

  const handleAnswer = (questionId, answerIdx) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIdx }));
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setShowResult(false);
    } else {
      setStage(STAGES.COMPLETE);
    }
  };

  const handleFinish = async () => {
    // 取消已计划的番茄钟通知
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.warn('取消通知失败:', e.message);
    }

    // 结束番茄钟（completePomodoro 只接受 task_id 和 duration，不接受 session_id）
    if (currentTask?.id) {
      try {
        await completePomodoro({ task_id: currentTask.id, duration: elapsed });
      } catch (e) {
        console.warn('结束番茄钟失败:', e.message);
      }
    }
    stopTimer(elapsed);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在准备学习内容...</Text>
      </View>
    );
  }

  // ========== LEARN 阶段 ==========
  if (stage === STAGES.LEARN) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.stageLabel}>📖 正在学习</Text>
            <Text style={styles.subjectName}>{currentTask?.subject || '数学'}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Icon name="timer" size={16} color="#007AFF" />
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 当前知识点 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>今日目标</Text>
            <Text style={styles.cardDesc}>{currentTask?.task || currentTask?.name || '掌握基础知识点'}</Text>
            {currentTask?.knowledgePoint && (
              <View style={styles.tagRow}>
                <Icon name="star" size={14} color="#FF9500" />
                <Text style={styles.tag}>{currentTask.knowledgePoint}</Text>
              </View>
            )}
          </View>

          {/* 推荐课程视频 */}
          {currentVideo ? (
            <TouchableOpacity
              style={styles.videoCard}
              onPress={() => navigation.navigate('CourseTab', {
                screen: 'VideoPlayer',
                params: { fileId: currentVideo.fid, title: currentVideo.file_name }
              })}
            >
              <View style={styles.videoThumb}>
                <Icon name="play-circle-filled" size={48} color="#007AFF" />
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoLabel}>推荐课程</Text>
                <Text style={styles.videoTitle} numberOfLines={2}>{currentVideo.file_name?.replace(/\.[^.]+$/, '')}</Text>
                <Text style={styles.videoHint}>先看视频理解概念</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>学习提示</Text>
              <Text style={styles.cardDesc}>先去课程中心找到{currentTask?.subject || '数学'}相关的视频，看完再回来做题</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('CourseTab', { screen: 'CourseList' })}
              >
                <Icon name="play-circle" size={18} color="#007AFF" />
                <Text style={styles.browseText}>浏览课程</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 看完视频后进入练习 */}
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStage(STAGES.PRACTICE)}>
            <Icon name="assignment" size={20} color="#fff" />
            <Text style={styles.nextBtnText}>看完了，开始做题</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.endBtn} onPress={handleFinish}>
          <Text style={styles.endBtnText}>提前结束</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ========== PRACTICE 阶段 ==========
  if (stage === STAGES.PRACTICE && questions.length > 0) {
    const q = questions[currentQIndex];
    const userAnswer = answers[q.id];
    const correct = showResult && userAnswer === q.answer;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.stageLabel}>✏️ 练习巩固</Text>
            <Text style={styles.subjectName}>第{currentQIndex + 1}/{questions.length}题</Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.qCard}>
            <View style={styles.qMeta}>
              <View style={styles.qBadge}><Text style={styles.qBadgeText}>{q.chapter}</Text></View>
              <Text style={styles.qDiff}>{q.difficulty === 'easy' ? '基础' : q.difficulty === 'medium' ? '中等' : '提高'}</Text>
            </View>
            <Text style={styles.qText}>{q.question}</Text>

            <View style={styles.optionsWrap}>
              {q.options?.map((opt, i) => {
                let optStyle = styles.optBtn;
                if (showResult) {
                  if (i === q.answer) optStyle = styles.optCorrect;
                  else if (i === userAnswer && userAnswer !== q.answer) optStyle = styles.optWrong;
                } else if (userAnswer === i) {
                  optStyle = styles.optSelected;
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optBtn, optStyle]}
                    onPress={() => !showResult && handleAnswer(q.id, i)}
                    disabled={showResult}
                  >
                    <Text style={styles.optLetter}>{String.fromCharCode(65 + i)}</Text>
                    <Text style={styles.optText}>{opt}</Text>
                    {showResult && i === q.answer && <Icon name="check-circle" size={18} color="#34C759" />}
                    {showResult && i === userAnswer && i !== q.answer && <Icon name="cancel" size={18} color="#FF3B30" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResult && (
              <View style={styles.explanation}>
                <Text style={styles.explanationTitle}>{correct ? '✅ 回答正确！' : '❌ 回答错误'}</Text>
                <Text style={styles.explanationText}>{q.explanation}</Text>
                <TouchableOpacity style={styles.nextQBtn} onPress={nextQuestion}>
                  <Text style={styles.nextQText}>
                    {currentQIndex < questions.length - 1 ? '下一题' : '完成练习'}
                  </Text>
                  <Icon name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ========== COMPLETE 阶段 ==========
  if (stage === STAGES.COMPLETE) {
    const correctCount = questions.filter(q => answers[q.id] === q.answer).length;
    return (
      <View style={styles.center}>
        <Text style={styles.doneIcon}>🎉</Text>
        <Text style={styles.doneTitle}>学习完成！</Text>
        <Text style={styles.doneSub}>学习了 {formatTime(elapsed)}，正确 {correctCount}/{questions.length} 题</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={handleFinish}>
          <Icon name="check" size={22} color="#fff" />
          <Text style={styles.doneBtnText}>结束本次学习</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 30 },
  loadingText: { fontSize: 15, color: '#8E8E93', marginTop: 12 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  stageLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 2 },
  subjectName: { fontSize: 22, fontWeight: '800', color: '#000' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 4 },
  timerText: { fontSize: 15, fontWeight: '700', color: '#007AFF' },

  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 22 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  tag: { fontSize: 12, color: '#FF9500', fontWeight: '600' },

  videoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, gap: 12, shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  videoThumb: { width: 72, height: 48, backgroundColor: '#E8F2FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  videoInfo: { flex: 1 },
  videoLabel: { fontSize: 11, color: '#007AFF', fontWeight: '600', marginBottom: 2 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: '#000', lineHeight: 20 },
  videoHint: { fontSize: 12, color: '#8E8E93', marginTop: 4 },

  browseBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  browseText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },

  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', borderRadius: 16, padding: 16, marginBottom: 12, gap: 8 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  endBtn: { alignItems: 'center', padding: 16 },
  endBtnText: { color: '#FF3B30', fontSize: 14 },

  // Practice
  qCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  qBadge: { backgroundColor: '#E8F2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  qBadgeText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  qDiff: { fontSize: 12, color: '#8E8E93' },
  qText: { fontSize: 16, fontWeight: '600', color: '#000', lineHeight: 26, marginBottom: 20 },
  optionsWrap: { gap: 10 },
  optBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5EA', gap: 10 },
  optSelected: { borderColor: '#007AFF', backgroundColor: '#E8F2FF' },
  optCorrect: { borderColor: '#34C759', backgroundColor: '#E8F8ED' },
  optWrong: { borderColor: '#FF3B30', backgroundColor: '#FFF0F0' },
  optLetter: { fontSize: 15, fontWeight: '700', color: '#8E8E93', width: 24, textAlign: 'center' },
  optText: { fontSize: 14, color: '#000', flex: 1 },
  explanation: { marginTop: 16, backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16 },
  explanationTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 8 },
  explanationText: { fontSize: 14, color: '#666', lineHeight: 22 },
  nextQBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', borderRadius: 12, padding: 14, marginTop: 16, gap: 6 },
  nextQText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Complete
  doneIcon: { fontSize: 60, marginBottom: 12 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#000' },
  doneSub: { fontSize: 15, color: '#666', marginTop: 6, marginBottom: 30 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 36, gap: 8 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
