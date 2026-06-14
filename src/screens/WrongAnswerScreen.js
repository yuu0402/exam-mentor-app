import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import {
  getWrongQuestions,
  getWrongQuestionStats,
  getTodayReviewQueue,
  reviewWrongQuestion,
} from '../api/backend';

const SUBJECT_NAMES = { math:'数学', physics:'物理', english:'英语', chinese:'语文', chemistry:'化学' };
const SUBJECT_COLORS = { math:'#FF3B30', physics:'#007AFF', english:'#FF9500', chinese:'#34C759', chemistry:'#AF52DE' };

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
  const { wrongAnswers: contextWrongAnswers, todayReviewCount: ctxTodayCount, reviewStats: ctxStats, markWrongAnswerReviewed } = useApp();
  const [wrongAnswers, setWrongAnswers] = useState(contextWrongAnswers || []);
  const [reviewStats, setReviewStats] = useState(ctxStats || {});
  const [todayReviewCount, setTodayReviewCount] = useState(ctxTodayCount || 0);
  const [loading, setLoading] = useState(true);
  const today = formatDate(new Date());

  // 从后端拉取错题数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>错题本</Text>
          <Text style={styles.headerCount}>共 {wrongAnswers.length} 题</Text>
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

              return (
                <View key={w.id || i} style={[styles.card, due && styles.cardDue]}>
                  {/* Review status bar */}
                  <View style={styles.statusBar}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    {!w.reviewState?.completedAll && (
                      <View style={styles.progressRow}>
                        {Array.from({ length: maxIntervals }).map((_, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.progressDot,
                              { backgroundColor: idx < reviewProgress ? color : '#E5E5EA' },
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
                        onPress={async () => {
                          try {
                            await reviewWrongQuestion(w.id, { is_correct: true });
                            markWrongAnswerReviewed && markWrongAnswerReviewed(w.id, true);
                          } catch (e) {
                            console.warn('复习结果上报失败:', e.message);
                          }
                        }}
                      >
                        <Icon name="check" size={16} color="#34C759" />
                        <Text style={styles.rememberBtnText}>记住了</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.forgetBtn}
                        onPress={async () => {
                          try {
                            await reviewWrongQuestion(w.id, { is_correct: false });
                            markWrongAnswerReviewed && markWrongAnswerReviewed(w.id, false);
                          } catch (e) {
                            console.warn('复习结果上报失败:', e.message);
                          }
                        }}
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
                    onPress={() => navigation.navigate('CourseTab')}
                  >
                    <Icon name="menu-book" size={16} color="#007AFF" />
                    <Text style={styles.courseBtnText}>查看相关课程</Text>
                  </TouchableOpacity>
                </View>
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
  statLabel: { fontSize:10, color:'#8E8E93', marginTop:1 },
  forgetRateHint: { fontSize:11, color:'#8E8E93', marginTop:8, lineHeight:16 },

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
  answerLabel: { fontSize:11, color:'#8E8E93', marginBottom:2 },
  answerWrong: { fontSize:15, fontWeight:'700', color:'#FF3B30' },
  answerCorrect: { fontSize:15, fontWeight:'700', color:'#34C759' },
  explanation: { fontSize:13, color:'#666', lineHeight:20, backgroundColor:'#F2F2F7', borderRadius:8, padding:10, marginTop:8 },

  // Review actions
  reviewActions: { flexDirection:'row', gap:10, marginTop:12 },
  rememberBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#F0FFF4', borderRadius:10, paddingVertical:10, gap:4, borderWidth:1, borderColor:'#D1F0D9' },
  rememberBtnText: { fontSize:14, color:'#34C759', fontWeight:'600' },
  forgetBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#FFF8F0', borderRadius:10, paddingVertical:10, gap:4, borderWidth:1, borderColor:'#FFE0B2' },
  forgetBtnText: { fontSize:14, color:'#FF9500', fontWeight:'600' },

  doneBadge: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:12, paddingVertical:8, backgroundColor:'#F0FFF4', borderRadius:10, gap:4 },
  doneText: { fontSize:13, color:'#34C759', fontWeight:'600' },

  aiBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, paddingVertical:8, gap:4, borderRadius:10, backgroundColor:'#F5F0FF' },
  aiBtnText: { fontSize:13, color:'#AF52DE', fontWeight:'500' },
  courseBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, paddingVertical:8, gap:4, borderRadius:10, backgroundColor:'#EBF5FF' },
  courseBtnText: { fontSize:13, color:'#007AFF', fontWeight:'500' },
  noExplanationHint: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:10, gap:4 },
  noExplanationHintText: { fontSize:12, color:'#8E8E93' },
});
