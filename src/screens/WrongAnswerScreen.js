import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import {
  getWrongQuestions,
  getWrongQuestionStats,
  getTodayReviewQueue,
  reviewWrongQuestion,
} from '../api/backend';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#007AFF', '#FF9500', '#34C759', '#FF3B30'];

const SUBJECT_NAMES = { math:'数学', physics:'物理', english:'英语', chinese:'语文', chemistry:'化学' };
const SUBJECT_COLORS = { math:'#FF3B30', physics:'#007AFF', english:'#FF9500', chinese:'#34C759', chemistry:'#AF52DE' };

// P1-6: 错题卡片组件用 React.memo 避免每次 refresh 重建
const WrongAnswerCard = memo(function WrongAnswerCard({ w, idx, due, statusText, statusColor, reviewProgress, maxIntervals, onRemember, onForget, onViewCourse }) {
  return (
    <View key={w.id || idx} style={[styles.card, due && styles.cardDue]}>
      {/* Review status bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        {!w.reviewState?.completedAll && (
          <View style={styles.progressRow}>
            {Array.from({ length: maxIntervals }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i < reviewProgress ? SUBJECT_COLORS[w.subject] || '#007AFF' : '#E5E5EA' },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <Text style={styles.question} numberOfLines={2}>{w.question || '未知题目'}</Text>
      <View style={styles.answerRow}>
        <View style={styles.answerBadge}>
          <Text style={styles.answerLabel}>你的答案</Text>
          <Text style={styles.answerWrong}>{w.userAnswer || '未作答'}</Text>
        </View>
        <Icon name="arrow-forward" size={16} color="#8E8E93" />
        <View style={styles.answerBadge}>
          <Text style={styles.answerLabel}>正确答案</Text>
          <Text style={styles.answerCorrect}>{w.correctAnswer || '?'}</Text>
        </View>
      </View>
      {w.explanation && <Text style={styles.explanation}>{w.explanation}</Text>}

      {/* Review action buttons */}
      {!w.reviewState?.completedAll && (
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.rememberBtn}
            onPress={onRemember}
          >
            <Icon name="check" size={16} color="#34C759" />
            <Text style={styles.rememberBtnText}>记住了</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.forgetBtn}
            onPress={onForget}
          >
            <Icon name="refresh" size={16} color="#FF9500" />
            <Text style={styles.forgetBtnText}>还没记住</Text>
          </TouchableOpacity>
        </View>
      )}

      {w.reviewState?.completedAll && (
        <View style={styles.doneBadge}>
          <Icon name="verified" size={16} color="#34C759" />
          <Text style={styles.doneText}>已完全掌握</Text>
        </View>
      )}

      {w.explanation ? null : (
        <View style={styles.noExplanationHint}>
          <Icon name="info-outline" size={14} color="#8E8E93" />
          <Text style={styles.noExplanationHintText}>暂无本地解析，可查看相关课程学习</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.courseBtn}
        onPress={onViewCourse}
      >
        <Icon name="menu-book" size={16} color="#007AFF" />
        <Text style={styles.courseBtnText}>查看相关课程</Text>
      </TouchableOpacity>
    </View>
  );
});

/** 安全解析日期字符串为本地日期对象，避免 new Date('YYYY-MM-DD') 解析为 UTC 零点的时区歧义 */
function parseDateSafe(dateStr) {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]) || 1;
  return new Date(y, m, d);
}

/** 格式化日期为 YYYY-MM-DD 的辅助函数 */
function formatDate(date) {
  const d = date instanceof Date ? date : parseDateSafe(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function WrongAnswerScreen({ navigation }) {
  const { wrongAnswers: contextWrongAnswers, todayReviewCount: ctxTodayCount, reviewStats: ctxStats, markWrongAnswerReviewed, addWrongAnswer } = useApp();
  const [wrongAnswers, setWrongAnswers] = useState(contextWrongAnswers || []);
  const [reviewStats, setReviewStats] = useState(ctxStats || {});
  const [todayReviewCount, setTodayReviewCount] = useState(ctxTodayCount || 0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelected, setPracticeSelected] = useState(null);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const today = formatDate(new Date());

  // 从后端拉取错题数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [wqRes, statsRes, queueRes] = await Promise.allSettled([
        getWrongQuestions({ page: 1, page_size: 100 }),
        getWrongQuestionStats(),
        getTodayReviewQueue(),
      ]);
      if (wqRes.status === 'fulfilled' && wqRes.value?.items) {
        setWrongAnswers(wqRes.value.items);
      }
      if (statsRes.status === 'fulfilled') {
        setReviewStats({
          completedCount: statsRes.value?.mastered || 0,
          totalCount: statsRes.value?.total || 0,
          forgetRate: statsRes.value?.total > 0
            ? Math.round(((statsRes.value?.total - statsRes.value?.mastered) / statsRes.value?.total) * 100)
            : 0,
          consecutiveRemembered: 0,
        });
      }
      if (queueRes.status === 'fulfilled' && queueRes.value?.items) {
        setTodayReviewCount(queueRes.value.items.length);
      }
    } catch (e) {
      console.warn('拉取错题数据失败，使用本地缓存:', e.message);
      setFetchError('网络异常，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const grouped = useMemo(() => {
    const map = {};
    (wrongAnswers || []).forEach(w => {
      const subj = w.subject || 'other';
      if (!map[subj]) map[subj] = [];
      map[subj].push(w);
    });
    return Object.entries(map).sort((a,b) => b[1].length - a[1].length);
  }, [wrongAnswers]);

  /** 判断某道错题今天是否需要复习 */
  const isDueToday = (wa) => {
    if (!wa?.reviewState) return true; // 没有reviewState视为待复习
    if (wa.reviewState.completedAll) return false;
    if (!wa.reviewState.nextReviewDate) return false;
    return wa.reviewState.nextReviewDate <= today;
  };

  /** 获取复习状态文字 */
  const getReviewStatusText = (wa) => {
    if (!wa?.reviewState) return '待复习';
    if (wa.reviewState.completedAll) return '已全部完成';
    if (wa.reviewState.nextReviewDate && wa.reviewState.nextReviewDate > today) {
      return `下次复习: ${wa.reviewState.nextReviewDate}`;
    }
    if (wa.reviewState.nextReviewDate && wa.reviewState.nextReviewDate <= today) {
      const overdueDays = Math.max(0, Math.ceil(
        (parseDateSafe(today).getTime() - parseDateSafe(wa.reviewState.nextReviewDate).getTime()) / 86400000
      ));
      return overdueDays > 0 ? `该复习啦（上次复习${overdueDays}天前）` : '复习时间到！';
    }
    return `第${wa.reviewState.currentInterval || 1}次复习`;
  };

  /** 获取复习状态颜色 */
  const getReviewStatusColor = (wa) => {
    if (wa?.reviewState?.completedAll) return '#34C759';
    if (isDueToday(wa)) return '#FF9500';
    return '#8E8E93';
  };

  // 进入练习模式
  const enterPracticeMode = () => {
    const questions = (wrongAnswers || []).map(w => ({
      id: w.id,
      question: w.question || '练习题',
      options: w.options || ['A', 'B', 'C', 'D'],
      answer: w.correctAnswer || w.answer || 'A',
      explanation: w.explanation || '',
      difficulty: w.difficulty || 'medium',
      subject: w.subject || 'math',
    }));
    setPracticeQuestions(questions);
    setPracticeIndex(0);
    setPracticeSelected(null);
    setPracticeAnswers({});
    setPracticeFinished(false);
    setPracticeMode(true);
  };

  // 练习模式：处理选项选择
  const handlePracticeSelect = (optIdx) => {
    const q = practiceQuestions[practiceIndex];
    if (!q) return;
    const label = OPTION_LABELS[optIdx];
    const isCorrect = label === q.answer;
    setPracticeSelected(optIdx);
    setPracticeAnswers(prev => ({ ...prev, [practiceIndex]: label }));
    // 答错题时记录到错题本
    if (!isCorrect && addWrongAnswer) {
      addWrongAnswer(q);
    }
    setTimeout(() => {
      if (practiceIndex < practiceQuestions.length - 1) {
        setPracticeIndex(prev => prev + 1);
        setPracticeSelected(null);
      } else {
        setPracticeFinished(true);
      }
    }, 800);
  };

  // 练习模式：重新开始
  const restartPractice = () => {
    setPracticeIndex(0);
    setPracticeSelected(null);
    setPracticeAnswers({});
    setPracticeFinished(false);
  };

  // 练习模式：退出
  const exitPracticeMode = () => {
    setPracticeMode(false);
    setPracticeQuestions([]);
    setPracticeIndex(0);
    setPracticeSelected(null);
    setPracticeAnswers({});
    setPracticeFinished(false);
  };

  // 练习模式：用汇总数据统计正确率
  const practiceScore = useMemo(() => {
    if (!practiceFinished) return null;
    let correct = 0;
    practiceQuestions.forEach((q, idx) => {
      if (practiceAnswers[idx] === q.answer) correct++;
    });
    return {
      correct,
      total: practiceQuestions.length,
      pct: Math.round((correct / practiceQuestions.length) * 100),
    };
  }, [practiceFinished, practiceAnswers, practiceQuestions]);

  // 练习模式：未开始（选择了题目但还没开始）
  if (practiceMode && practiceQuestions.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="quiz" size={70} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>暂无错题可练习</Text>
        <TouchableOpacity style={styles.goBtn} onPress={exitPracticeMode}>
          <Text style={styles.goBtnText}>返回错题本</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 练习模式：结果页
  if (practiceMode && practiceFinished && practiceScore) {
    const isPerfect = practiceScore.correct === practiceScore.total;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.practiceResultContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        <View style={styles.practiceResultHeader}>
          <View style={[styles.practiceResultIconWrap, { backgroundColor: isPerfect ? '#34C759' + '1A' : '#FF9500' + '1A' }]}>
            <Icon name={isPerfect ? 'emoji-events' : 'school'} size={48} color={isPerfect ? '#34C759' : '#FF9500'} />
          </View>
          <Text style={styles.practiceResultTitle}>
            {isPerfect ? '全对！太厉害了！' : practiceScore.pct >= 60 ? '不错，继续加油！' : '还需多加练习'}
          </Text>
          <Text style={styles.practiceResultScore}>
            {practiceScore.correct}/{practiceScore.total} 正确 ({practiceScore.pct}%)
          </Text>
          <View style={styles.practiceResultBarTrack}>
            <View style={[styles.practiceResultBarFill, {
              width: `${practiceScore.pct}%`,
              backgroundColor: isPerfect ? '#34C759' : practiceScore.pct >= 60 ? '#FF9500' : '#FF3B30',
            }]} />
          </View>
        </View>
        {/* 逐题回顾 */}
        {practiceQuestions.map((q, idx) => {
          const userAns = practiceAnswers[idx];
          const isCorrect = userAns === q.answer;
          return (
            <View key={q.id || idx} style={styles.practiceReviewCard}>
              <View style={styles.practiceReviewQHead}>
                <View style={[styles.practiceReviewIdx, { backgroundColor: isCorrect ? '#34C759' : '#FF3B30' }]}>
                  <Text style={styles.practiceReviewIdxText}>{idx + 1}</Text>
                </View>
                <Text style={styles.practiceReviewQText}>{q.question}</Text>
              </View>
              <View style={styles.practiceReviewOptions}>
                {q.options.map((opt, oi) => {
                  const label = OPTION_LABELS[oi];
                  const isUserChoice = userAns === label;
                  const isRightAnswer = q.answer === label;
                  let bg = '#F2F2F7';
                  let borderColor = 'transparent';
                  if (isRightAnswer) { bg = '#E8F8EE'; borderColor = '#34C759'; }
                  if (isUserChoice && !isCorrect) { bg = '#FEE8E8'; borderColor = '#FF3B30'; }
                  return (
                    <View key={oi} style={[styles.practiceReviewOpt, { backgroundColor: bg, borderColor }]}>
                      <Text style={[styles.practiceReviewOptLabel, { color: OPTION_COLORS[oi] }]}>{label}</Text>
                      <Text style={styles.practiceReviewOptText}>{opt}</Text>
                      {isRightAnswer && <Icon name="check-circle" size={16} color="#34C759" />}
                      {isUserChoice && !isCorrect && <Icon name="cancel" size={16} color="#FF3B30" />}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.practiceExplanation}>{q.explanation}</Text>
            </View>
          );
        })}
        <View style={styles.practiceResultActions}>
          <TouchableOpacity style={styles.practiceResultBtnPrimary} onPress={restartPractice}>
            <Icon name="refresh" size={18} color="#fff" />
            <Text style={styles.practiceResultBtnPrimaryText}>再来一组</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.practiceResultBtnSecondary} onPress={exitPracticeMode}>
            <Text style={styles.practiceResultBtnSecondaryText}>返回错题本</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // 练习模式：答题页
  if (practiceMode && !practiceFinished) {
    const currentQ = practiceQuestions[practiceIndex];
    return (
      <View style={styles.container}>
        {/* 顶部进度 */}
        <View style={styles.practiceQuizHead}>
          <TouchableOpacity onPress={exitPracticeMode} style={styles.practiceQuizBackBtn}>
            <Icon name="close" size={22} color="#8E8E93" />
          </TouchableOpacity>
          <View style={styles.practiceQuizProgressBar}>
            <View style={[styles.practiceQuizProgressFill, {
              width: `${((practiceIndex + (practiceSelected !== null ? 1 : 0)) / practiceQuestions.length) * 100}%`,
            }]} />
          </View>
          <Text style={styles.practiceQuizCounter}>{practiceIndex + 1}/{practiceQuestions.length}</Text>
        </View>
        {/* 题目 */}
        <ScrollView style={styles.practiceQuizBody} contentContainerStyle={styles.practiceQuizBodyInner} refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }>
          <Text style={styles.practiceQText}>{currentQ?.question}</Text>
          <View style={styles.practiceOptionsList}>
            {currentQ?.options.map((opt, idx) => {
              const isSelected = practiceSelected === idx;
              const isCorrectAnswer = currentQ.answer === OPTION_LABELS[idx];
              let bg = '#F2F2F7';
              let borderColor = 'transparent';
              let textStyle = {};
              if (practiceSelected !== null) {
                if (isCorrectAnswer) { bg = '#E8F8EE'; borderColor = '#34C759'; textStyle = { color: '#34C759', fontWeight: '700' }; }
                else if (isSelected) { bg = '#FEE8E8'; borderColor = '#FF3B30'; textStyle = { color: '#FF3B30', fontWeight: '700' }; }
              }
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.practiceOptBtn, { backgroundColor: bg, borderColor }]}
                  onPress={() => handlePracticeSelect(idx)}
                  disabled={practiceSelected !== null}
                  activeOpacity={0.7}
                >
                  <View style={[styles.practiceOptLabel, { backgroundColor: OPTION_COLORS[idx] + '1A' }]}>
                    <Text style={[styles.practiceOptLabelText, { color: OPTION_COLORS[idx] }]}>{OPTION_LABELS[idx]}</Text>
                  </View>
                  <Text style={[styles.practiceOptText, textStyle]}>{opt}</Text>
                  {practiceSelected !== null && isCorrectAnswer && (
                    <Icon name="check-circle" size={20} color="#34C759" />
                  )}
                  {practiceSelected !== null && isSelected && !isCorrectAnswer && (
                    <Icon name="cancel" size={20} color="#FF3B30" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // P1-5: loading 状态应该在 fetch 期间渲染 ActivityIndicator，
  // 在结果返回后（finally）才设为 false，确保用户能看到加载指示器
  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.emptyTitle}>加载中...</Text>
      </View>
    );
  }

  if (!wrongAnswers?.length) {
    return (
      <View style={styles.empty}>
        <Icon name="check-circle" size={70} color="#34C759" />
        <Text style={styles.emptyTitle}>错题本空空如也</Text>
        <Text style={styles.emptyDesc}>完成诊断测试后，错题会自动收录</Text>
        <TouchableOpacity style={styles.goBtn} onPress={() => navigation.navigate('Diagnosis')}>
          <Text style={styles.goBtnText}>去做诊断测试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
    }>
      {/* Header with stats */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>错题本</Text>
            <Text style={styles.headerCount}>共 {wrongAnswers.length} 题</Text>
          </View>
          {/* 练习模式入口 */}
          {wrongAnswers.length > 0 && (
            <TouchableOpacity style={styles.practiceModeBtn} onPress={enterPracticeMode}>
              <Icon name="quiz" size={16} color="#fff" />
              <Text style={styles.practiceModeBtnText}>练习模式</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.statsRow}>
          {todayReviewCount > 0 && (
            <View style={styles.statBadge}>
              <Text style={styles.statNum}>{todayReviewCount}</Text>
              <Text style={styles.statLabel}>今日待复习</Text>
            </View>
          )}
          {reviewStats?.completedCount > 0 && (
            <View style={[styles.statBadge, styles.statBadgeGreen]}>
              <Text style={[styles.statNum, {color:'#34C759'}]}>{reviewStats.completedCount}</Text>
              <Text style={styles.statLabel}>已完成</Text>
            </View>
          )}
          <View style={styles.statBadge}>
            <Text style={styles.statNum}>{reviewStats?.consecutiveRemembered || 0}</Text>
            <Text style={styles.statLabel}>连续记住</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={[styles.statNum, {color: (reviewStats?.forgetRate || 0) > 50 ? '#FF3B30' : '#FF9500'}]}>{reviewStats?.forgetRate || 0}%</Text>
            <Text style={styles.statLabel}>遗忘率</Text>
          </View>
        </View>
        <Text style={styles.forgetRateHint}>记忆曲线正常范围：随着复习次数增加，遗忘率会逐渐下降</Text>
      </View>

      {/* 网络错误提示 */}
      {fetchError && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchData}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.errorBannerText}>{fetchError}</Text>
          <Text style={styles.errorBannerRetry}>点击重试</Text>
        </TouchableOpacity>
      )}

      {grouped.map(([subject, items]) => {
        const color = SUBJECT_COLORS[subject] || '#8E8E93';
        return (
          <View key={subject} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={[styles.groupDot, { backgroundColor: color }]} />
              <Text style={styles.groupTitle}>{SUBJECT_NAMES[subject] || subject}</Text>
              <Text style={styles.groupCount}>{items.length}题</Text>
            </View>
            {items.map((w, i) => {
              const due = isDueToday(w);
              const statusText = getReviewStatusText(w);
              const statusColor = getReviewStatusColor(w);
              const reviewProgress = w.reviewState?.currentInterval || 1;
              const maxIntervals = 6;

              // P1-6: 使用 React.memo 包裹的 WrongAnswerCard 组件，
              // 避免每次 refresh 时所有卡片都重建
              return (
                <WrongAnswerCard
                  key={w.id || i}
                  w={w}
                  idx={i}
                  due={due}
                  statusText={statusText}
                  statusColor={statusColor}
                  reviewProgress={reviewProgress}
                  maxIntervals={maxIntervals}
                  onRemember={async () => {
                    try {
                      await reviewWrongQuestion(w.id, { is_correct: true });
                      markWrongAnswerReviewed && markWrongAnswerReviewed(w.id, true);
                    } catch (e) {
                      console.warn('复习结果上报失败:', e.message);
                    }
                  }}
                  onForget={async () => {
                    try {
                      await reviewWrongQuestion(w.id, { is_correct: false });
                      markWrongAnswerReviewed && markWrongAnswerReviewed(w.id, false);
                    } catch (e) {
                      console.warn('复习结果上报失败:', e.message);
                    }
                  }}
                  onViewCourse={() => navigation.navigate('CourseTab')}
                />
              );
            })}
          </View>
        );
      })}
      <View style={{height:40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F2F2F7' },
  empty: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F2F2F7', padding:30 },
  emptyTitle: { fontSize:20, fontWeight:'700', color:'#000', marginTop:16 },
  emptyDesc: { fontSize:14, color:'#8E8E93', marginTop:8, marginBottom:24, textAlign:'center' },
  goBtn: { backgroundColor:'#007AFF', borderRadius:20, paddingHorizontal:28, paddingVertical:12 },
  goBtnText: { color:'#fff', fontSize:15, fontWeight:'600' },

  header: { paddingHorizontal:20, paddingTop:16, paddingBottom:4 },
  headerTitle: { fontSize:28, fontWeight:'800', color:'#000' },
  headerCount: { fontSize:14, color:'#8E8E93', marginTop:2 },
  statsRow: { flexDirection:'row', gap:12, marginTop:12, flexWrap:'wrap' },
  statBadge: { backgroundColor:'#fff', borderRadius:12, paddingHorizontal:12, paddingVertical:6, alignItems:'center', shadowColor:'#000', shadowOffset:{w:0,h:1}, shadowOpacity:0.03, shadowRadius:3 },
  statBadgeGreen: { backgroundColor:'#F0FFF4' },
  statNum: { fontSize:16, fontWeight:'800', color:'#000' },
  statLabel: { fontSize:12, color:'#8E8E93', marginTop:1 },

  // 网络错误提示
  errorBanner: { flexDirection:'row', alignItems:'center', backgroundColor:'#FF3B30', paddingVertical:10, paddingHorizontal:16, marginHorizontal:16, marginTop:12, borderRadius:10, gap:6 },
  errorBannerText: { color:'#fff', fontSize:13, fontWeight:'500', flex:1 },
  errorBannerRetry: { color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:'600' },
  forgetRateHint: { fontSize:12, color:'#8E8E93', marginTop:8, lineHeight:16 },

  group: { marginBottom:20, paddingHorizontal:16 },
  groupHead: { flexDirection:'row', alignItems:'center', marginBottom:10, gap:8 },
  groupDot: { width:10, height:10, borderRadius:5 },
  groupTitle: { fontSize:17, fontWeight:'700', color:'#000', flex:1 },
  groupCount: { fontSize:13, color:'#8E8E93' },

  card: { backgroundColor:'#fff', borderRadius:14, padding:16, marginBottom:8, shadowColor:'#000', shadowOffset:{w:0,h:1}, shadowOpacity:0.03, shadowRadius:4 },
  cardDue: { borderWidth:1, borderColor:'#FFE0B2' },

  // Review status
  statusBar: { flexDirection:'row', alignItems:'center', marginBottom:8, gap:8 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:12, fontWeight:'600', flex:1 },
  progressRow: { flexDirection:'row', gap:3, alignItems:'center' },
  progressDot: { width:6, height:6, borderRadius:3 },

  question: { fontSize:14, color:'#000', fontWeight:'500', lineHeight:20, marginBottom:10 },
  answerRow: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, marginBottom:8 },
  answerBadge: { alignItems:'center', flex:1 },
  answerLabel: { fontSize:12, color:'#8E8E93', marginBottom:2 },
  answerWrong: { fontSize:15, fontWeight:'700', color:'#FF3B30' },
  answerCorrect: { fontSize:15, fontWeight:'700', color:'#34C759' },
  explanation: { fontSize:13, color:'#666', lineHeight:20, backgroundColor:'#F2F2F7', borderRadius:8, padding:10, marginTop:8 },

  // Review actions
  reviewActions: { flexDirection:'row', gap:10, marginTop:12 },
  rememberBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#F0FFF4', borderRadius:10, paddingVertical:14, gap:4, borderWidth:1, borderColor:'#D1F0D9' },
  rememberBtnText: { fontSize:14, color:'#34C759', fontWeight:'600' },
  forgetBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#FFF8F0', borderRadius:10, paddingVertical:14, gap:4, borderWidth:1, borderColor:'#FFE0B2' },
  forgetBtnText: { fontSize:14, color:'#FF9500', fontWeight:'600' },

  doneBadge: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:12, paddingVertical:8, backgroundColor:'#F0FFF4', borderRadius:10, gap:4 },
  doneText: { fontSize:13, color:'#34C759', fontWeight:'600' },

  aiBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, paddingVertical:8, gap:4, borderRadius:10, backgroundColor:'#F5F0FF' },
  aiBtnText: { fontSize:13, color:'#AF52DE', fontWeight:'500' },
  courseBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, paddingVertical:12, gap:4, borderRadius:10, backgroundColor:'#EBF5FF' },
  courseBtnText: { fontSize:13, color:'#007AFF', fontWeight:'500' },
  noExplanationHint: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, gap:4 },
  noExplanationHintText: { fontSize:12, color:'#8E8E93' },

  // ===== 练习模式按钮 =====
  headerTopRow: { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 },
  practiceModeBtn: {
    flexDirection:'row', alignItems:'center', backgroundColor:'#4CAF50', borderRadius:20,
    paddingHorizontal:14, paddingVertical:8, gap:4,
  },
  practiceModeBtnText: { color:'#fff', fontSize:13, fontWeight:'700' },

  // ===== 练习模式答题页 =====
  practiceQuizHead: {
    flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingTop:48, paddingBottom:10,
    backgroundColor:'#fff', gap:10,
  },
  practiceQuizBackBtn: { padding:8 },
  practiceQuizProgressBar: { flex:1, height:4, backgroundColor:'#E5E5EA', borderRadius:2, overflow:'hidden' },
  practiceQuizProgressFill: { height:'100%', backgroundColor:'#4CAF50', borderRadius:2 },
  practiceQuizCounter: { fontSize:13, fontWeight:'600', color:'#8E8E93', minWidth:36, textAlign:'right' },
  practiceQuizBody: { flex:1 },
  practiceQuizBodyInner: { padding:20, paddingTop:16 },
  practiceQText: { fontSize:17, fontWeight:'600', color:'#000', lineHeight:26, marginBottom:24 },
  practiceOptionsList: { gap:10 },
  practiceOptBtn: {
    flexDirection:'row', alignItems:'center', padding:14, borderRadius:14,
    borderWidth:1.5, gap:10,
  },
  practiceOptLabel: {
    width:32, height:32, borderRadius:10, justifyContent:'center', alignItems:'center',
  },
  practiceOptLabelText: { fontSize:15, fontWeight:'700' },
  practiceOptText: { flex:1, fontSize:15, color:'#000', lineHeight:22 },

  // ===== 练习模式结果页 =====
  practiceResultContent: { padding:20, paddingBottom:40 },
  practiceResultHeader: { alignItems:'center', marginBottom:24, paddingTop:20 },
  practiceResultIconWrap: {
    width:80, height:80, borderRadius:40, justifyContent:'center', alignItems:'center', marginBottom:14,
  },
  practiceResultTitle: { fontSize:20, fontWeight:'700', color:'#000', marginBottom:6 },
  practiceResultScore: { fontSize:15, color:'#8E8E93', marginBottom:12 },
  practiceResultBarTrack: { width:'80%', height:8, backgroundColor:'#E5E5EA', borderRadius:4, overflow:'hidden' },
  practiceResultBarFill: { height:'100%', borderRadius:4 },
  practiceReviewCard: {
    backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12,
    shadowColor:'#000', shadowOffset:{w:0,h:1}, shadowOpacity:0.03, shadowRadius:4,
  },
  practiceReviewQHead: { flexDirection:'row', gap:10, marginBottom:10, alignItems:'flex-start' },
  practiceReviewIdx: { width:24, height:24, borderRadius:8, justifyContent:'center', alignItems:'center' },
  practiceReviewIdxText: { fontSize:12, fontWeight:'700', color:'#fff' },
  practiceReviewQText: { flex:1, fontSize:14, fontWeight:'500', color:'#000', lineHeight:20 },
  practiceReviewOptions: { marginBottom:8, gap:4 },
  practiceReviewOpt: {
    flexDirection:'row', alignItems:'center', padding:8, paddingHorizontal:10,
    borderRadius:8, gap:8, borderWidth:1,
  },
  practiceReviewOptLabel: { fontSize:13, fontWeight:'700', minWidth:20 },
  practiceReviewOptText: { flex:1, fontSize:13, color:'#000' },
  practiceExplanation: {
    fontSize:12, color:'#8E8E93', lineHeight:18, paddingTop:4,
    borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:'#E5E5EA', marginTop:4,
  },
  practiceResultActions: { flexDirection:'row', gap:12, marginTop:8 },
  practiceResultBtnPrimary: {
    flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center',
    backgroundColor:'#4CAF50', borderRadius:14, paddingVertical:14, gap:6,
  },
  practiceResultBtnPrimaryText: { color:'#fff', fontSize:15, fontWeight:'700' },
  practiceResultBtnSecondary: {
    flex:1, justifyContent:'center', alignItems:'center',
    backgroundColor:'#fff', borderRadius:14, paddingVertical:14,
    borderWidth:1, borderColor:'#E5E5EA',
  },
  practiceResultBtnSecondaryText: { color:'#8E8E93', fontSize:15, fontWeight:'600' },
});
