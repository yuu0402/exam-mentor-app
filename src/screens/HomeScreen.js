import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { getCurrentPhaseInfo, getDaysUntilExam } from '../utils/study-plan-generator';
import {
  getTaskStats,
  getDiagnosisHistory,
  getLatestDiagnosis,
  getWrongQuestionStats,
  getGameState,
  getTodayTasks,
} from '../api/backend';

const { width } = Dimensions.get('window');

// 当前阶段判断
function getPhase(diagnosisResult, studyPlan, timer) {
  if (!diagnosisResult) return 'diagnosis';      // 未诊断
  if (timer?.active) return 'studying';            // 正在学习
  if (!studyPlan?.daily) return 'plan';            // 需要生成计划
  return 'ready';                                   // 可以开始学习
}

// 诊断说明折叠组件
function DiagnosisExplain() {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.explainContainer}>
      <TouchableOpacity
        style={styles.explainToggle}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Icon name="info-outline" size={16} color="#8E8E93" />
        <Text style={styles.explainToggleText}>诊断说明</Text>
        <Icon
          name={expanded ? 'expand-less' : 'expand-more'}
          size={20}
          color="#8E8E93"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.explainBody}>
          <Text style={styles.explainText}>
            诊断测试覆盖<Text style={styles.explainBold}>数学、物理、英语、语文、化学</Text>5科，共85道题，预计用时110分钟。
          </Text>
          <Text style={styles.explainText}>
            为什么要做这么多题？中考涉及的知识点广泛，只有全面诊断才能精准定位你的薄弱环节，避免"假性掌握"。
          </Text>
          <Text style={styles.explainText}>
            建议预留充足时间一次性完成，以获得最准确的诊断结果。也可分多次完成，题目量虽多但难度循序渐进，不必有压力。
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { student, today, timer, startTimer, stopTimer, pauseTimer, resumeTimer, checkInToast, dismissCheckInToast, studySummary, dismissStudySummary, checkIn, diagnosisResult, studyPlan, wrongAnswers, todayReviewCount, entertainment, remainingEntertainmentTime } = useApp();
  const [greeting, setGreeting] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6) setGreeting('夜深了');
    else if (h < 9) setGreeting('早上好');
    else if (h < 12) setGreeting('上午好');
    else if (h < 14) setGreeting('中午好');
    else if (h < 18) setGreeting('下午好');
    else if (h < 22) setGreeting('晚上好');
    else setGreeting('该休息了');
    checkIn();
  }, []);

  // 后端数据拉取
  const fetchBackendData = async () => {
    setFetchError(null);
    try {
      await Promise.allSettled([
        getTaskStats(),
        getDiagnosisHistory(),
        getLatestDiagnosis(),
        getWrongQuestionStats(),
        getGameState(),
        getTodayTasks(),
      ]);
    } catch (e) {
      setFetchError('网络异常，请检查连接后重试');
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBackendData();
    setRefreshing(false);
  }, []);

  // 显示名：有姓名则 "早上好，小明"，否则 "早上好，同学"；避免空问候+逗号残留
  const displayGreeting = student?.name
    ? `${greeting}，${student.name}`
    : greeting ? `${greeting}，同学` : '同学';

  // Timer tick
  useEffect(() => {
    if (!timer?.active) { setElapsed(0); return; }
    if (timer?.paused) {
      setElapsed(timer.accumulatedMinutes || 0);
      return;
    }
    const start = new Date(timer.startTime).getTime();
    setElapsed(Math.floor((Date.now() - start) / 60000));
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 60000)), 15000);
    return () => clearInterval(iv);
  }, [timer?.active, timer?.startTime, timer?.paused, timer?.accumulatedMinutes]);

  // Check-in toast auto-dismiss
  useEffect(() => {
    if (checkInToast) {
      const t = setTimeout(() => dismissCheckInToast(), 2500);
      return () => clearTimeout(t);
    }
  }, [checkInToast, dismissCheckInToast]);

  // Study summary toast auto-dismiss
  useEffect(() => {
    if (studySummary) {
      const t = setTimeout(() => dismissStudySummary(), 3000);
      return () => clearTimeout(t);
    }
  }, [studySummary, dismissStudySummary]);

  const phase = getPhase(diagnosisResult, studyPlan, timer);
  const studyTotal = today.studyTime + (timer?.active ? elapsed : 0);
  const streak = today.currentStreak || 0;
  const wrongCount = wrongAnswers?.length || 0;

  const todayPlan = studyPlan?.daily?.tasks || studyPlan?.tasks || [];
  const currentTask = todayPlan[0];
  const nextTasks = todayPlan.slice(1, 3);

  // 学习计划摘要（新引擎）
  const planSummary = useMemo(() => {
    const daily = studyPlan?.daily;
    if (!daily) return null;
    const knowledgeCount = daily.knowledgeItems?.length || 0;
    const estimatedHours = daily.totalStudyMinutes
      ? Math.round(daily.totalStudyMinutes / 60 * 10) / 10
      : 0;
    const phaseInfo = getCurrentPhaseInfo();
    const daysLeft = getDaysUntilExam();
    const totalDays = studyPlan?.learningPath?.summary?.totalDays || 90;
    const currentDay = daily.dayInPhase || 1;
    const progress = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0;
    return {
      knowledgeCount,
      estimatedHours,
      phaseName: daily.phaseName || phaseInfo?.name || '学习中',
      phaseFocus: daily.phaseFocus || '',
      progress,
      daysLeft,
      currentDay,
      totalDays,
    };
  }, [studyPlan]);

  const formatTime = (min) => {
    if (min < 60) return `${min}分钟`;
    return `${Math.floor(min/60)}小时${min%60}分钟`;
  };

  // ==================== PHASE: STUDYING ====================
  if (phase === 'studying') {
    const handleEndStudy = () => {
      const mins = timer?.paused ? (timer.accumulatedMinutes || elapsed) : elapsed;
      Alert.alert(
        '结束学习',
        `确定要结束吗？已学习 ${formatTime(mins)}`,
        [
          { text: '取消', style: 'cancel' },
          { text: '确定', style: 'destructive', onPress: () => stopTimer(mins, currentTask?.id) },
        ]
      );
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        {/* 打卡Toast */}
        {checkInToast && (
          <View style={styles.toastBanner}>
            <Icon name="check-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>今日已打卡 ✓</Text>
          </View>
        )}

        {/* 学习摘要Toast */}
        {studySummary && (
          <View style={styles.toastBannerSummary}>
            <Icon name="school" size={18} color="#fff" />
            <Text style={styles.toastText}>
              {studySummary.subject
                ? `本次学习了${studySummary.subject} ${studySummary.minutes}分钟`
                : `本次学习了 ${studySummary.minutes}分钟`}
            </Text>
          </View>
        )}

        <Text style={styles.phaseIcon}>{timer?.paused ? '⏸️' : '⏱️'}</Text>
        <Text style={styles.phaseTitle}>{timer?.paused ? '已暂停' : '正在学习'}</Text>
        {timer?.subject && <Text style={styles.phaseSub}>{timer.subject}</Text>}
        <Text style={styles.timerBig}>{formatTime(elapsed)}</Text>
        <Text style={styles.timerHint}>
          {timer?.paused ? '已暂停 · 点击继续' : '专注学习，完成后点击结束'}
        </Text>

        {/* 暂停/继续按钮 */}
        {timer?.paused ? (
          <TouchableOpacity style={styles.btnResume} onPress={resumeTimer}>
            <Icon name="play-arrow" size={22} color="#fff" />
            <Text style={styles.btnText}>继续学习</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnPause} onPress={pauseTimer}>
            <Icon name="pause" size={22} color="#fff" />
            <Text style={styles.btnText}>暂停</Text>
          </TouchableOpacity>
        )}

        <View style={{height: 14}} />

        <TouchableOpacity style={styles.btnDanger} onPress={handleEndStudy}>
          <Icon name="stop" size={22} color="#fff" />
          <Text style={styles.btnText}>结束学习</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==================== PHASE: DIAGNOSIS (no test) ====================
  if (phase === 'diagnosis') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        {/* 学习摘要Toast */}
        {studySummary && (
          <View style={styles.toastBannerSummary}>
            <Icon name="school" size={18} color="#fff" />
            <Text style={styles.toastText}>
              {studySummary.subject
                ? `本次学习了${studySummary.subject} ${studySummary.minutes}分钟`
                : `本次学习了 ${studySummary.minutes}分钟`}
            </Text>
          </View>
        )}

        <View style={styles.heroCard}>
          <Text style={styles.greeting}>{displayGreeting}</Text>
          <Text style={styles.heroTitle}>准备好了吗？</Text>
          <Text style={styles.heroDesc}>先做一个诊断测试，了解你的水平，然后我帮你制定专属学习计划。</Text>

          <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Diagnosis')}>
            <Icon name="assignment" size={24} color="#fff" />
            <Text style={styles.ctaText}>开始诊断测试</Text>
            <Text style={styles.ctaSub}>约110分钟 · 85道题 · 可中途保存进度</Text>
          </TouchableOpacity>

          {/* 诊断说明折叠区 */}
          <DiagnosisExplain />
        </View>

        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Icon name="local-fire-department" size={20} color="#FF9500" />
            <Text style={styles.streakText}>已连续打卡 {streak} 天 🔥</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ==================== PHASE: READY ====================
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
    }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{displayGreeting}</Text>
        <View style={styles.headerMeta}>
          {streak > 0 && <Text style={styles.streakSmall}>🔥 {streak}天</Text>}
          <Text style={styles.dateSmall}>{new Date().toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'short' })}</Text>
        </View>
      </View>

      {/* 学习摘要Toast */}
      {studySummary && (
        <View style={styles.toastBannerSummary}>
          <Icon name="school" size={18} color="#fff" />
          <Text style={styles.toastText}>
            {studySummary.subject
              ? `本次学习了${studySummary.subject} ${studySummary.minutes}分钟`
              : `本次学习了 ${studySummary.minutes}分钟`}
          </Text>
        </View>
      )}

      {/* 网络错误提示 */}
      {fetchError && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchBackendData}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.errorBannerText}>{fetchError}</Text>
          <Text style={styles.errorBannerRetry}>点击重试</Text>
        </TouchableOpacity>
      )}

      {/* Stats ring */}
      <View style={styles.ringRow}>
        <View style={styles.ring}>
          <Text style={styles.ringVal}>{studyTotal > 0 ? (studyTotal/60).toFixed(1) : '0'}</Text>
          <Text style={styles.ringLabel}>今日学习/时</Text>
        </View>
        <View style={styles.ringDivider} />
        <View style={styles.ring}>
          <Text style={[styles.ringVal, {color: remainingEntertainmentTime <= 0 ? '#FF3B30' : '#34C759'}]}>{remainingEntertainmentTime}</Text>
          <Text style={styles.ringLabel}>娱乐剩余/分</Text>
        </View>
        {todayReviewCount > 0 && (
          <>
            <View style={styles.ringDivider} />
            <View style={styles.ring}>
              <Text style={[styles.ringVal, {color: '#FF9500'}]}>{todayReviewCount}</Text>
              <Text style={styles.ringLabel}>今日待复习</Text>
            </View>
          </>
        )}
      </View>

      {/* 今日学习摘要 (新引擎) */}
      {planSummary && planSummary.knowledgeCount > 0 && (
        <View style={styles.planSummaryCard}>
          <View style={styles.planSummaryRow}>
            <Icon name="school" size={20} color="#4CAF50" />
            <Text style={styles.planSummaryText}>
              今天要学{' '}
              <Text style={styles.planSummaryBold}>{planSummary.knowledgeCount}</Text>
              {' '}个知识点，预计{' '}
              <Text style={styles.planSummaryBold}>{planSummary.estimatedHours}</Text>
              {' '}小时
            </Text>
          </View>
          {/* 学习阶段 + 进度 */}
          <View style={styles.phaseInfoRow}>
            <View style={styles.phaseInfoLeft}>
              <Icon name="timeline" size={14} color="#8E8E93" />
              <Text style={styles.phaseInfoText}>{planSummary.phaseName}</Text>
            </View>
            <View style={styles.phaseProgress}>
              <View style={styles.phaseProgressTrack}>
                <View style={[styles.phaseProgressFill, { width: `${Math.min(100, planSummary.progress)}%` }]} />
              </View>
              <Text style={styles.phaseProgressText}>{planSummary.progress}%</Text>
            </View>
          </View>
          <Text style={styles.phaseFocusText}>
            {planSummary.phaseFocus} · 距中考 {planSummary.daysLeft} 天
          </Text>
        </View>
      )}

      {/* 待复习错题提醒（带感叹号） */}
      {todayReviewCount > 0 && (
        <TouchableOpacity
          style={styles.wrongWarning}
          onPress={() => navigation.navigate('WrongAnswers')}
        >
          <View style={styles.wrongWarningIcon}>
            <Icon name="error-outline" size={22} color="#fff" />
          </View>
          <View style={styles.wrongWarningContent}>
            <Text style={styles.wrongWarningTitle}>错题复习提醒</Text>
            <Text style={styles.wrongWarningDesc}>
              今天有 <Text style={styles.wrongWarningCount}>{todayReviewCount}</Text> 道错题需要复习（艾宾浩斯记忆法）
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color="#FF9500" />
        </TouchableOpacity>
      )}

      {/* Main CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>
          {timer?.active ? '正在学习中...' : currentTask ? '准备好了吗？' : '今日目标'}
        </Text>
        <Text style={styles.ctaDesc}>
          {currentTask
            ? `${currentTask.subject || ''} · ${currentTask.task || currentTask.name || currentTask.title || '学习任务'}`
            : planSummary ? '查看下方计划，开始今日学习' : '先完成诊断测试，生成专属学习计划'}
        </Text>

        {!timer?.active && currentTask && (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => {
            startTimer(currentTask.subject, currentTask.id);
            navigation.navigate('LearningSession');
          }}>
            <Icon name="play-arrow" size={24} color="#fff" />
            <Text style={styles.btnText}>开始学习</Text>
          </TouchableOpacity>
        )}

        {!timer?.active && !currentTask && diagnosisResult && (
          <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('StudyPlan')}>
            <Icon name="refresh" size={20} color="#007AFF" />
            <Text style={styles.btnOutlineText}>生成学习计划</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upcoming tasks preview */}
      {nextTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>接下来的任务</Text>
          {nextTasks.map((t, i) => (
            <View key={i} style={styles.taskItem}>
              <View style={styles.taskDot} />
              <Text style={styles.taskSubject}>{t.subject || '学习'}</Text>
              <Text style={styles.taskName}>{t.task || t.title || t.name}</Text>
              <Text style={styles.taskDur}>{t.duration || t.plannedDuration || '?'}分钟</Text>
            </View>
          ))}
        </View>
      )}

      {/* Wrong answer reminder */}
      {todayReviewCount > 0 && (
        <TouchableOpacity style={styles.reminder} onPress={() => navigation.navigate('WrongAnswers')}>
          <Icon name="bookmark" size={18} color="#FF9500" />
          <Text style={styles.reminderText}>你有 {todayReviewCount} 道错题今日待复习</Text>
          <Icon name="chevron-right" size={18} color="#C7C7CC" />
        </TouchableOpacity>
      )}

      {/* Quick links at bottom */}
      <View style={styles.bottomLinks}>
        <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.navigate('StudyPlan')}>
          <Icon name="school" size={18} color="#007AFF" />
          <Text style={styles.bottomLinkText}>学习计划</Text>
        </TouchableOpacity>
        {diagnosisResult && (
          <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.navigate('Diagnosis')}>
            <Icon name="refresh" size={18} color="#34C759" />
            <Text style={styles.bottomLinkText}>重新诊断</Text>
          </TouchableOpacity>
        )}
        {todayReviewCount > 0 && (
          <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.navigate('WrongAnswers')}>
            <Icon name="bookmark" size={18} color="#FF9500" />
            <Text style={styles.bottomLinkText}>错题({todayReviewCount})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.bottomLink} onPress={() => navigation.navigate('Stats')}>
          <Icon name="bar-chart" size={18} color="#AF52DE" />
          <Text style={styles.bottomLinkText}>学习数据</Text>
        </TouchableOpacity>
      </View>

      <View style={{height:40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F2F2F7' },
  centerContent: { justifyContent:'center', alignItems:'center', padding:30, flexGrow:1, minHeight:500 },

  // Phase: Diagnosis
  heroCard: { backgroundColor:'#fff', borderRadius:20, padding:30, marginHorizontal:16, marginTop:60, alignItems:'center', width:width-32, shadowColor:'#000', shadowOffset:{w:0,h:4}, shadowOpacity:0.06, shadowRadius:12 },
  greeting: { fontSize:15, color:'#8E8E93' },
  heroTitle: { fontSize:28, fontWeight:'800', color:'#000', marginTop:8, marginBottom:12 },
  heroDesc: { fontSize:14, color:'#666', textAlign:'center', lineHeight:22, marginBottom:24 },
  ctaBtn: { backgroundColor:'#007AFF', borderRadius:18, paddingVertical:18, paddingHorizontal:32, alignItems:'center', width:'100%' },
  ctaText: { color:'#fff', fontSize:18, fontWeight:'700', marginTop:4 },
  ctaSub: { color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:4 },
  streakBadge: { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:20, gap:6 },

  // Phase: Studying
  phaseIcon: { fontSize:60, marginBottom:12 },
  phaseTitle: { fontSize:24, fontWeight:'800', color:'#000' },
  phaseSub: { fontSize:16, color:'#8E8E93', marginTop:4 },
  timerBig: { fontSize:56, fontWeight:'800', color:'#000', marginTop:20, fontVariant:['tabular-nums'] },
  timerHint: { fontSize:14, color:'#8E8E93', marginTop:8, marginBottom:30 },
  btnDanger: { flexDirection:'row', alignItems:'center', backgroundColor:'#FF3B30', borderRadius:18, paddingVertical:16, paddingHorizontal:40, gap:8 },
  btnPause: { flexDirection:'row', alignItems:'center', backgroundColor:'#FF9500', borderRadius:18, paddingVertical:16, paddingHorizontal:40, gap:8 },
  btnResume: { flexDirection:'row', alignItems:'center', backgroundColor:'#34C759', borderRadius:18, paddingVertical:16, paddingHorizontal:40, gap:8 },
  btnText: { color:'#fff', fontSize:17, fontWeight:'700' },
  toastBanner: { flexDirection:'row', alignItems:'center', backgroundColor:'#34C759', paddingVertical:12, paddingHorizontal:20, borderRadius:12, marginBottom:20, gap:8, shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.1, shadowRadius:6 },
  toastBannerSummary: { flexDirection:'row', alignItems:'center', backgroundColor:'#4A90D9', paddingVertical:12, paddingHorizontal:20, borderRadius:12, marginBottom:20, gap:8, shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.1, shadowRadius:6 },
  toastText: { color:'#fff', fontSize:15, fontWeight:'600' },

  // 网络错误提示
  errorBanner: { flexDirection:'row', alignItems:'center', backgroundColor:'#FF3B30', paddingVertical:10, paddingHorizontal:16, marginHorizontal:16, marginTop:12, borderRadius:10, gap:6 },
  errorBannerText: { color:'#fff', fontSize:13, fontWeight:'500', flex:1 },
  errorBannerRetry: { color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:'600' },

  // Phase: Ready
  header: { paddingHorizontal:20, paddingTop:50, paddingBottom:12 },
  headerMeta: { flexDirection:'row', alignItems:'center', gap:10, marginTop:4 },
  streakSmall: { fontSize:13, color:'#FF9500', fontWeight:'600' },
  dateSmall: { fontSize:13, color:'#8E8E93' },

  ringRow: { flexDirection:'row', justifyContent:'center', backgroundColor:'#fff', marginHorizontal:16, borderRadius:18, padding:20, marginBottom:16, shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.04, shadowRadius:8 },
  ring: { alignItems:'center', flex:1 },
  ringVal: { fontSize:30, fontWeight:'800', color:'#000' },
  ringLabel: { fontSize:11, color:'#8E8E93', marginTop:2 },
  ringDivider: { width:1, height:40, backgroundColor:'#F2F2F7', alignSelf:'center' },

  ctaCard: { backgroundColor:'#007AFF', marginHorizontal:16, borderRadius:20, padding:24, alignItems:'center', marginBottom:20, shadowColor:'#007AFF', shadowOffset:{w:0,h:6}, shadowOpacity:0.2, shadowRadius:12 },
  ctaTitle: { fontSize:20, fontWeight:'700', color:'#fff', marginBottom:4 },
  ctaDesc: { fontSize:14, color:'rgba(255,255,255,0.8)', marginBottom:16 },
  btnPrimary: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.2)', borderRadius:14, paddingVertical:14, paddingHorizontal:36, gap:6 },
  btnOutline: { flexDirection:'row', alignItems:'center', borderRadius:14, paddingVertical:14, paddingHorizontal:36, gap:6, borderWidth:1, borderColor:'rgba(255,255,255,0.4)', marginTop:8 },
  btnOutlineText: { color:'#fff', fontSize:15, fontWeight:'600' },

  section: { backgroundColor:'#fff', marginHorizontal:16, borderRadius:16, padding:18, marginBottom:12, shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.03, shadowRadius:6 },
  sectionTitle: { fontSize:14, fontWeight:'700', color:'#8E8E93', marginBottom:12, textTransform:'uppercase' },
  taskItem: { flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:0.5, borderBottomColor:'#F2F2F7', gap:10 },
  taskDot: { width:8, height:8, borderRadius:4, backgroundColor:'#007AFF' },
  taskSubject: { fontSize:13, fontWeight:'600', color:'#007AFF', width:50 },
  taskName: { fontSize:14, color:'#000', flex:1 },
  taskDur: { fontSize:12, color:'#8E8E93' },

  reminder: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', marginHorizontal:16, borderRadius:14, padding:14, marginBottom:12, gap:8, borderWidth:1, borderColor:'#FFE0B2' },
  reminderText: { flex:1, fontSize:14, color:'#FF9500', fontWeight:'500' },

  bottomLinks: { flexDirection:'row', justifyContent:'center', gap:20, paddingHorizontal:16, marginTop:8 },
  bottomLink: { flexDirection:'row', alignItems:'center', gap:4 },
  bottomLinkText: { fontSize:13, color:'#007AFF', fontWeight:'500' },

  streakText: { fontSize:14, color:'#FF9500', fontWeight:'500' },

  // ===== 今日学习摘要 (新引擎) =====
  planSummaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  planSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planSummaryText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  planSummaryBold: {
    fontWeight: '800',
    color: '#4CAF50',
    fontSize: 17,
  },
  phaseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phaseInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
    fontWeight: '600',
  },
  phaseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseProgressTrack: {
    width: 60,
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    marginRight: 6,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  phaseProgressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  phaseFocusText: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 18,
  },

  // ===== 错题复习提醒 (带感叹号) =====
  wrongWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  wrongWarningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  wrongWarningContent: {
    flex: 1,
  },
  wrongWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 2,
  },
  wrongWarningDesc: {
    fontSize: 12,
    color: '#BF360C',
  },
  wrongWarningCount: {
    fontWeight: '800',
    color: '#FF5722',
    fontSize: 14,
  },

  // ===== 诊断说明折叠区 =====
  explainContainer: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  explainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  explainToggleText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  explainBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  explainText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    marginTop: 6,
  },
  explainBold: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
});
