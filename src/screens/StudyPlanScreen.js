import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import {
  generateLearningPath,
  generateDailyPlan,
  generateWeeklyPlan,
  calculateEntertainmentTime,
  getDaysUntilExam,
} from '../utils/study-plan-generator';
import { EXAM_SUBJECTS, getSubjectDisplayName } from '../config';
import {
  generateDynamicPlan,
  getTodayDynamicPlan,
  getWeeklyStats,
} from '../api/backend';

export default function StudyPlanScreen({ navigation }) {
  const {
    student,
    diagnosisResult,
    studyPlan,
    saveStudyPlan,
    entertainment,
    startTimer,
    todayReviewCount,
    wrongAnswers,
  } = useApp();

  const [activeTab, setActiveTab] = useState('daily'); // daily | weekly | phase
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Loading lock & task manipulation state
  const generatingRef = useRef(false);
  const [skippedTaskIds, setSkippedTaskIds] = useState([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ subject: '', title: '', duration: 25 });

  // Generate plans on mount or when diagnosis changes
  useEffect(() => {
    generatePlans();
  }, [diagnosisResult]);

  const generatePlans = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);
    setSkippedTaskIds([]);
    try {
      // 调用后端 API 生成动态学习计划
      await generateDynamicPlan({});
      // 获取今日任务
      const todayRes = await getTodayDynamicPlan();
      const tasks = todayRes.tasks || [];
      // 映射后端格式 → 前端期望格式
      const mappedDaily = {
        date: todayRes.date || new Date().toISOString().split('T')[0],
        tasks: tasks.map(t => ({
          id: t.id,
          subject: t.subject || '数学',
          title: t.title || t.knowledge_point || '学习任务',
          task: t.title || t.knowledge_point || '学习任务',
          knowledgePoint: t.knowledge_point_id || '',
          duration: t.duration_minutes || 25,
          plannedDuration: t.duration_minutes || 25,
          difficulty: t.difficulty || 3,
          status: t.status || 'pending',
          resourceUrl: t.resource_url || null,
        })),
      };
      // 获取本周统计，构建"本周任务汇总"
      let weeklySummary = null;
      try {
        const weeklyStats = await getWeeklyStats();
        // 基于今日计划 + 本周统计生成周汇总
        const weekTasks = (weeklyStats.tasks || weeklyStats.weekly_tasks || []).length > 0
          ? weeklyStats.tasks || weeklyStats.weekly_tasks
          : tasks; // fallback: 使用今日任务作为周汇总基础
        weeklySummary = {
          date: new Date().toISOString().split('T')[0],
          tasks: weekTasks.map((t, idx) => ({
            id: t.id || `weekly-${idx}`,
            subject: t.subject || t.title || '数学',
            title: t.title || t.knowledge_point || t.task || '本周任务',
            task: t.title || t.knowledge_point || t.task || '本周任务',
            duration: t.duration_minutes || t.duration || 25,
            plannedDuration: t.duration_minutes || t.duration || 25,
            difficulty: t.difficulty || 'medium',
            status: t.status || 'pending',
            // 附加本周统计信息
            completedCount: weeklyStats.completed_count || 0,
            totalCount: weeklyStats.total_count || weeklyStats.weekly_completed || 0,
            streakDays: weeklyStats.streak_days || 0,
          })),
          totalStudyMinutes: weeklyStats.total_minutes || (tasks.reduce((sum, t) => sum + (t.duration_minutes || 25), 0) * 7),
          knowledgeItems: [],
          // 本周汇总摘要
          summary: {
            completedCount: weeklyStats.completed_count || 0,
            totalCount: weeklyStats.total_count || tasks.length * 7,
            streakDays: weeklyStats.streak_days || 0,
            weeklyCompleted: weeklyStats.weekly_completed || 0,
          },
        };
      } catch (weeklyErr) {
        console.warn('获取本周统计失败，使用本地周计划:', weeklyErr.message);
        // 本地生成周计划
        try {
          const path = learningPath || generateLearningPath(diagnosisResult);
          const today = new Date();
          const localWeekly = generateWeeklyPlan(path, today);
          weeklySummary = localWeekly;
        } catch (localWeeklyErr) {
          console.warn('本地周计划生成也失败:', localWeeklyErr.message);
        }
      }
      // 生成学习路径（本地辅助生成，用于显示阶段信息）
      const path = generateLearningPath(diagnosisResult);
      setLearningPath(path);
      setDailyPlan(mappedDaily);
      setWeeklyPlan(weeklySummary);
      await saveStudyPlan({ learningPath: path, daily: mappedDaily, weekly: weeklySummary, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('生成学习计划失败:', error);
      setFetchError('网络异常，请检查连接后重试');
      // 降级：尝试只用本地生成
      try {
        const path = generateLearningPath(diagnosisResult);
        const today = new Date();
        const daily = generateDailyPlan(path, { date: today });
        const weekly = generateWeeklyPlan(path, today);
        setLearningPath(path);
        setDailyPlan(daily);
        setWeeklyPlan(weekly);
        await saveStudyPlan({ learningPath: path, daily, weekly, generatedAt: new Date().toISOString() });
      } catch (e2) {
        console.error('本地降级也失败:', e2);
      }
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSkippedTaskIds([]);
    await generatePlans();
    setRefreshing(false);
  }, []);

  // ===== 任务操作函数 =====

  // 推迟任务：将任务移到列表末尾（今天稍后再做）
  const postponeTask = (taskId) => {
    const updatePlan = (plan) => {
      if (!plan?.tasks) return plan;
      const idx = plan.tasks.findIndex(t => (t.id || t.title) === taskId);
      if (idx === -1) return plan;
      const tasks = [...plan.tasks];
      const [moved] = tasks.splice(idx, 1);
      tasks.push(moved);
      return { ...plan, tasks };
    };
    if (activeTab === 'daily') setDailyPlan(prev => updatePlan(prev));
    else setWeeklyPlan(prev => updatePlan(prev));
  };

  // 跳过任务：从当前视图隐藏
  const skipTask = (taskId) => {
    setSkippedTaskIds(prev => [...prev, taskId]);
  };

  // 调整任务时长
  const adjustDuration = (taskId, delta) => {
    const updatePlan = (plan) => {
      if (!plan?.tasks) return plan;
      const tasks = plan.tasks.map(t => {
        if ((t.id || t.title) !== taskId) return t;
        const cur = t.duration || t.plannedDuration || 25;
        const next = Math.max(5, Math.min(120, cur + delta));
        return { ...t, duration: next, plannedDuration: next };
      });
      return { ...plan, tasks };
    };
    if (activeTab === 'daily') setDailyPlan(prev => updatePlan(prev));
    else setWeeklyPlan(prev => updatePlan(prev));
  };

  // 上移/下移任务（替代拖拽排序）
  const moveTask = (taskId, direction) => {
    const updatePlan = (plan) => {
      if (!plan?.tasks) return plan;
      const idx = plan.tasks.findIndex(t => (t.id || t.title) === taskId);
      if (idx === -1) return plan;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= plan.tasks.length) return plan;
      const tasks = [...plan.tasks];
      [tasks[idx], tasks[newIdx]] = [tasks[newIdx], tasks[idx]];
      return { ...plan, tasks };
    };
    if (activeTab === 'daily') setDailyPlan(prev => updatePlan(prev));
    else setWeeklyPlan(prev => updatePlan(prev));
  };

  // 添加自定义任务
  const addCustomTask = () => {
    if (!newTaskForm.title.trim()) return;
    const newTask = {
      id: 'custom-' + Date.now(),
      title: newTaskForm.title.trim(),
      subject: newTaskForm.subject || '学习',
      duration: newTaskForm.duration,
      plannedDuration: newTaskForm.duration,
      time: '自定义',
      difficulty: 'medium',
      isCustom: true,
    };
    const updatePlan = (plan) => {
      if (!plan) return { tasks: [newTask], knowledgeItems: [] };
      return { ...plan, tasks: [...(plan.tasks || []), newTask] };
    };
    if (activeTab === 'daily') setDailyPlan(prev => updatePlan(prev));
    else setWeeklyPlan(prev => updatePlan(prev));
    setNewTaskForm({ subject: '', title: '', duration: 25 });
    setShowAddTaskForm(false);
  };

  // No diagnosis result — prompt user
  if (!diagnosisResult) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>学习计划</Text>
          <Text style={styles.headerSubtitle}>科学规划，高效学习</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.promptCard}>
            <Icon name="assessment" size={60} color="#FF9800" />
            <Text style={styles.promptTitle}>建议先完成诊断测试</Text>
            <Text style={styles.promptText}>
              完成诊断测试后，系统将根据你的实际水平生成个性化的学习计划。
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => navigation.navigate('Diagnosis')}
            >
              <Icon name="play-arrow" size={20} color="#fff" />
              <Text style={styles.promptButtonText}>开始诊断测试</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>正在生成学习计划...</Text>
      </View>
    );
  }

  const currentPlan = activeTab === 'daily' ? dailyPlan : weeklyPlan;
  const entertainmentTime = calculateEntertainmentTime({}, 'weekday').total;

  const subjectColorMap = {};
  EXAM_SUBJECTS.subjects.forEach(s => {
    subjectColorMap[s.id] = s.color;
    subjectColorMap[s.name] = s.color;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>学习计划</Text>
        <Text style={styles.headerSubtitle}>
          {diagnosisResult
            ? `基于诊断结果 · 薄弱科目：${
                diagnosisResult.weakPoints?.slice(0, 2).map(w => getSubjectDisplayName(w.subject)).join('、') || '暂无'
              }`
            : '科学规划，高效学习'}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'daily', label: '今日计划' },
          { key: 'weekly', label: '本周计划' },
          { key: 'phase', label: '学习路径' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        {/* ===== PHASE TAB: 学习路径总览 ===== */}
        {activeTab === 'phase' ? (
          <>
            {learningPath ? (
              <>
                {/* 当前阶段卡片 */}
                <View style={styles.phaseHeroCard}>
                  <Icon name="timeline" size={36} color="#fff" />
                  <Text style={styles.phaseHeroTitle}>
                    {dailyPlan?.phaseName || learningPath.phases[0]?.name || '学习路径'}
                  </Text>
                  <Text style={styles.phaseHeroSub}>
                    {dailyPlan?.phaseFocus || learningPath.phases[0]?.focus || ''}
                  </Text>
                  {/* 进度条 */}
                  <View style={styles.phaseProgressBar}>
                    <View style={[styles.phaseProgressFill, {
                      width: `${learningPath.summary?.totalDays > 0
                        ? Math.min(100, ((dailyPlan?.dayInPhase || 1) / (learningPath.phases[0]?.totalDays || 1)) * 100)
                        : 0}%`,
                    }]} />
                  </View>
                  <View style={styles.phaseStatsRow}>
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatVal}>{dailyPlan?.dayInPhase || 1}/{learningPath.phases[0]?.totalDays || '—'}</Text>
                      <Text style={styles.phaseStatLabel}>当前阶段进度(天)</Text>
                    </View>
                    <View style={styles.phaseStatDivider} />
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatVal}>{Math.round(
                        learningPath.summary?.totalDays > 0
                          ? ((dailyPlan?.dayInPhase || 1) / learningPath.summary.totalDays) * 100
                          : 0
                      )}%</Text>
                      <Text style={styles.phaseStatLabel}>总进度</Text>
                    </View>
                    <View style={styles.phaseStatDivider} />
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatVal}>
                        {(() => {
                          const d = getDaysUntilExam();
                          const completion = new Date();
                          completion.setDate(completion.getDate() + d);
                          return `${completion.getMonth() + 1}/${completion.getDate()}`;
                        })()}
                      </Text>
                      <Text style={styles.phaseStatLabel}>预计完成</Text>
                    </View>
                  </View>
                </View>

                {/* 阶段列表 */}
                <Text style={styles.sectionTitle}>全部阶段</Text>
                {learningPath.phases.map((phase, idx) => {
                  const isCurrent = dailyPlan?.phaseId === phase.id || idx === 0;
                  return (
                    <View key={phase.id} style={[styles.phaseCard, isCurrent && styles.phaseCardActive]}>
                      <View style={styles.phaseCardHeader}>
                        <View style={[styles.phaseDot, isCurrent && styles.phaseDotActive]} />
                        <Text style={[styles.phaseCardTitle, isCurrent && styles.phaseCardTitleActive]}>
                          {phase.name}
                        </Text>
                        {isCurrent && (
                          <View style={styles.phaseCurrentBadge}>
                            <Text style={styles.phaseCurrentBadgeText}>当前</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.phaseCardDesc}>{phase.description}</Text>
                      <View style={styles.phaseCardMeta}>
                        <Text style={styles.phaseMetaItem}>
                          <Icon name="event" size={14} color="#888" /> {phase.totalDays}天
                        </Text>
                        <Text style={styles.phaseMetaItem}>
                          <Icon name="videocam" size={14} color="#888" /> {phase.totalVideos || 0}节课
                        </Text>
                        <Text style={styles.phaseMetaItem}>
                          <Icon name="edit" size={14} color="#888" /> {phase.totalExercises || 0}道题
                        </Text>
                      </View>
                      {phase.milestones && phase.milestones.length > 0 && (
                        <View style={styles.milestoneList}>
                          {phase.milestones.map((m, mi) => (
                            <View key={mi} style={styles.milestoneItem}>
                              <Icon name="flag" size={12} color="#FF9800" />
                              <Text style={styles.milestoneText}>第{m.day}天: {m.check}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* 科目分布 */}
                {learningPath.summary?.subjectDistribution?.length > 0 && (
                  <View style={styles.subjectDistCard}>
                    <Text style={styles.sectionTitle}>科目分布</Text>
                    {learningPath.summary.subjectDistribution.map(sd => (
                      <View key={sd.subject} style={styles.subjectDistRow}>
                        <Text style={styles.subjectDistName}>{sd.subjectName}</Text>
                        <View style={styles.subjectDistBarBg}>
                          <View style={[styles.subjectDistBarFill, {
                            width: `${Math.min(100, (sd.exercises / (learningPath.summary.totalExercises || 1)) * 100)}%`,
                            backgroundColor: subjectColorMap[sd.subject] || '#4CAF50',
                          }]} />
                        </View>
                        <Text style={styles.subjectDistCount}>{sd.exercises}题</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="timeline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>暂未生成学习路径</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* ===== DAILY / WEEKLY TAB ===== */}
            {/* Summary card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Icon name="timer" size={22} color="#4CAF50" />
                  <Text style={styles.summaryValue}>
                    {currentPlan?.totalStudyMinutes
                      ? Math.round(currentPlan.totalStudyMinutes / 60 * 10) / 10
                      : '—'}
                  </Text>
                  <Text style={styles.summaryLabel}>学习时长(小时)</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Icon name="school" size={22} color="#2196F3" />
                  <Text style={styles.summaryValue}>
                    {currentPlan?.knowledgeItems?.length || currentPlan?.tasks?.length || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>知识点数</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Icon name="assignment" size={22} color="#FF9800" />
                  <Text style={styles.summaryValue}>
                    {currentPlan?.totalPomodoros || currentPlan?.tasks?.length || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>番茄钟数</Text>
                </View>
              </View>
            </View>

            {/* Ebbinghaus review reminder */}
            {todayReviewCount > 0 && (
              <TouchableOpacity
                style={styles.reviewReminder}
                onPress={() => navigation.navigate('WrongAnswers')}
              >
                <View style={styles.reviewReminderLeft}>
                  <Icon name="notifications-active" size={20} color="#FF5722" />
                  <Text style={styles.reviewReminderText}>
                    今天有 <Text style={styles.reviewReminderBold}>{todayReviewCount}</Text> 道错题需要复习
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#FF5722" />
              </TouchableOpacity>
            )}

            {/* Task list */}
            <View style={styles.taskSection}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'daily' ? '今日任务' : '本周任务概览'}
                {skippedTaskIds.length > 0 && (
                  <Text style={styles.skippedHint}>（已跳过 {skippedTaskIds.length} 项）</Text>
                )}
              </Text>

              {currentPlan?.tasks?.filter(t => !skippedTaskIds.includes(t.id || t.title)).length > 0 ? (
                currentPlan.tasks
                  .filter(t => !skippedTaskIds.includes(t.id || t.title))
                  .map((task, index, filteredTasks) => {
                  // 匹配对应的 knowledgeItem
                  const taskId = task.id || task.title;
                  const ki = currentPlan.knowledgeItems
                    ? currentPlan.knowledgeItems.find(k =>
                        k.subject === task.subject && k.knowledgePoint === task.title)
                    : null;
                  const recommendedVideo = ki?.recommendedVideos?.[0] || null;
                  const exercises = ki?.exercises || task.exercises || 0;

                  return (
                    <View key={taskId} style={styles.taskCard}>
                      {/* 时间块 */}
                      <View style={styles.taskTimeBlock}>
                        <Text style={styles.taskTime}>
                          {task.timeSlot
                            ? task.timeSlot.split(' - ')[0]
                            : task.time || task.startTime || ''}
                        </Text>
                        <Text style={styles.taskDuration}>{task.duration || task.plannedDuration || 0}分钟</Text>
                      </View>
                      <View style={styles.taskDivider} />
                      {/* 任务信息 */}
                      <View style={styles.taskInfo}>
                        <View style={styles.taskHeader}>
                          <View
                            style={[
                              styles.subjectBadge,
                              {
                                backgroundColor:
                                  (subjectColorMap[task.subject] || '#4CAF50') + '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.subjectBadgeText,
                                { color: subjectColorMap[task.subject] || '#4CAF50' },
                              ]}
                            >
                              {task.subject ? getSubjectDisplayName(task.subject) : '学习'}
                            </Text>
                          </View>
                          {task.difficulty && (
                            <Text style={styles.difficultyText}>
                              {task.difficulty === 'easy'
                                ? '⭐'
                                : task.difficulty === 'medium'
                                ? '⭐⭐'
                                : '⭐⭐⭐'}
                            </Text>
                          )}
                          {task.isCustom && (
                            <View style={styles.customBadge}>
                              <Text style={styles.customBadgeText}>自定义</Text>
                            </View>
                          )}
                        </View>
                        {/* 知识点名称 */}
                        <Text style={styles.taskName}>
                          {ki?.knowledgePoint || task.title || task.task || task.name}
                        </Text>
                        {/* 推荐课程 */}
                        {recommendedVideo && (
                          <View style={styles.videoRecommend}>
                            <Icon name="play-circle-filled" size={14} color="#4CAF50" />
                            <Text style={styles.videoRecommendText} numberOfLines={1}>
                              {recommendedVideo.title}
                            </Text>
                          </View>
                        )}
                        {/* 预计习题量 + 时间块 */}
                        <View style={styles.taskMetaRow}>
                          {exercises > 0 && (
                            <Text style={styles.taskMeta}>
                              <Icon name="edit" size={12} color="#888" /> 约{exercises}道题
                            </Text>
                          )}
                          {task.timeSlot && (
                            <Text style={styles.taskMeta}>
                              <Icon name="schedule" size={12} color="#888" /> {task.timeSlot}
                            </Text>
                          )}
                        </View>
                        {/* ===== 任务操作按钮行 ===== */}
                        <View style={styles.taskActionsRow}>
                          {/* 推迟 */}
                          <TouchableOpacity
                            style={styles.taskActionBtn}
                            onPress={() => postponeTask(taskId)}
                          >
                            <Icon name="skip-next" size={14} color="#FF9800" />
                            <Text style={styles.taskActionLabel}>推迟</Text>
                          </TouchableOpacity>
                          {/* 跳过 */}
                          <TouchableOpacity
                            style={styles.taskActionBtn}
                            onPress={() => skipTask(taskId)}
                          >
                            <Icon name="cancel" size={14} color="#F44336" />
                            <Text style={styles.taskActionLabel}>跳过</Text>
                          </TouchableOpacity>
                          {/* 减时长 */}
                          <TouchableOpacity
                            style={styles.taskActionBtnSmall}
                            onPress={() => adjustDuration(taskId, -5)}
                          >
                            <Icon name="remove" size={14} color="#888" />
                          </TouchableOpacity>
                          {/* 时长显示 */}
                          <Text style={styles.taskActionDuration}>
                            {(task.duration || task.plannedDuration || 25)}分钟
                          </Text>
                          {/* 加时长 */}
                          <TouchableOpacity
                            style={styles.taskActionBtnSmall}
                            onPress={() => adjustDuration(taskId, 5)}
                          >
                            <Icon name="add" size={14} color="#888" />
                          </TouchableOpacity>
                          {/* 上移 */}
                          <TouchableOpacity
                            style={[styles.taskActionBtnSmall, index === 0 && styles.taskActionDisabled]}
                            onPress={() => index > 0 && moveTask(taskId, -1)}
                            disabled={index === 0}
                          >
                            <Icon name="keyboard-arrow-up" size={16} color={index === 0 ? '#ccc' : '#666'} />
                          </TouchableOpacity>
                          {/* 下移 */}
                          <TouchableOpacity
                            style={[styles.taskActionBtnSmall, index === filteredTasks.length - 1 && styles.taskActionDisabled]}
                            onPress={() => index < filteredTasks.length - 1 && moveTask(taskId, 1)}
                            disabled={index === filteredTasks.length - 1}
                          >
                            <Icon name="keyboard-arrow-down" size={16} color={index === filteredTasks.length - 1 ? '#ccc' : '#666'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {/* 开始学习按钮 */}
                      <TouchableOpacity
                        style={styles.startTaskBtn}
                        onPress={() => {
                          const subj = task.subject || '学习';
                          startTimer(getSubjectDisplayName(subj), task.id);
                        }}
                      >
                        <Icon name="play-arrow" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="event-busy" size={50} color="#ccc" />
                  <Text style={styles.emptyText}>暂无计划数据</Text>
                </View>
              )}
            </View>

            {/* ===== 添加自定义任务入口 ===== */}
            <View style={styles.addTaskSection}>
              {!showAddTaskForm ? (
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => setShowAddTaskForm(true)}
                >
                  <Icon name="add-circle-outline" size={22} color="#4CAF50" />
                  <Text style={styles.addTaskButtonText}>添加自定义任务</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.addTaskForm}>
                  <Text style={styles.addTaskFormTitle}>新建任务</Text>
                  {/* 科目选择 */}
                  <View style={styles.addTaskFormRow}>
                    <Text style={styles.addTaskLabel}>科目</Text>
                    <View style={styles.subjectPicker}>
                      {EXAM_SUBJECTS.subjects.slice(0, 8).map(s => (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.subjectChip,
                            newTaskForm.subject === s.id && styles.subjectChipActive,
                          ]}
                          onPress={() => setNewTaskForm(f => ({ ...f, subject: s.id }))}
                        >
                          <Text style={[
                            styles.subjectChipText,
                            newTaskForm.subject === s.id && styles.subjectChipTextActive,
                          ]}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {/* 任务名称 */}
                  <View style={styles.addTaskFormRow}>
                    <Text style={styles.addTaskLabel}>内容</Text>
                    <View style={styles.addTaskInputWrap}>
                      <Icon name="edit" size={14} color="#999" style={{ marginRight: 6 }} />
                      <Text style={styles.addTaskInput} numberOfLines={1}>
                        {newTaskForm.title || '输入任务名称...'}
                      </Text>
                      {/* 用 TextInput 需要额外 import，这里用简化方案：预设选项 */}
                    </View>
                  </View>
                  {/* 快捷填写任务名称 */}
                  <View style={styles.quickTitleRow}>
                    {['背单词', '做真题', '整理错题', '复习笔记', '预习新课'].map(qt => (
                      <TouchableOpacity
                        key={qt}
                        style={[styles.quickTitleChip, newTaskForm.title === qt && styles.quickTitleChipActive]}
                        onPress={() => setNewTaskForm(f => ({ ...f, title: qt }))}
                      >
                        <Text style={[styles.quickTitleChipText, newTaskForm.title === qt && styles.quickTitleChipTextActive]}>
                          {qt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* 时长选择 */}
                  <View style={styles.addTaskFormRow}>
                    <Text style={styles.addTaskLabel}>时长</Text>
                    <View style={styles.durationPicker}>
                      {[15, 25, 30, 45, 60].map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.durationChip, newTaskForm.duration === d && styles.durationChipActive]}
                          onPress={() => setNewTaskForm(f => ({ ...f, duration: d }))}
                        >
                          <Text style={[styles.durationChipText, newTaskForm.duration === d && styles.durationChipTextActive]}>
                            {d}分钟
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {/* 按钮行 */}
                  <View style={styles.addTaskFormActions}>
                    <TouchableOpacity
                      style={styles.addTaskCancelBtn}
                      onPress={() => {
                        setShowAddTaskForm(false);
                        setNewTaskForm({ subject: '', title: '', duration: 25 });
                      }}
                    >
                      <Text style={styles.addTaskCancelText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addTaskConfirmBtn, !newTaskForm.title.trim() && styles.addTaskConfirmDisabled]}
                      onPress={addCustomTask}
                      disabled={!newTaskForm.title.trim()}
                    >
                      <Icon name="check" size={16} color="#fff" />
                      <Text style={styles.addTaskConfirmText}>添加</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {/* Refresh button */}
        <TouchableOpacity style={styles.refreshButton} onPress={async () => {
          setRefreshing(true);
          setSkippedTaskIds([]);
          await generatePlans();
          setRefreshing(false);
        }}>
          <Icon name="refresh" size={20} color="#4CAF50" />
          <Text style={styles.refreshButtonText}>重新生成计划</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  promptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
  },
  taskSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  taskTimeBlock: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  taskDuration: {
    fontSize: 11,
    color: '#999',
  },
  taskDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyText: {
    fontSize: 12,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  taskDesc: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 10,
  },
  refreshButtonText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 30,
  },

  // ===== Phase tab styles =====
  phaseHeroCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  phaseHeroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 4,
  },
  phaseHeroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  phaseProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  phaseProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  phaseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  phaseStat: {
    alignItems: 'center',
    flex: 1,
  },
  phaseStatVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  phaseStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  phaseStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
  },

  phaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#E0E0E0',
  },
  phaseCardActive: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  phaseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  phaseDotActive: {
    backgroundColor: '#4CAF50',
  },
  phaseCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  phaseCardTitleActive: {
    color: '#2E7D32',
  },
  phaseCurrentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  phaseCurrentBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  phaseCardDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: 8,
    marginLeft: 20,
  },
  phaseCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 20,
    marginBottom: 4,
  },
  phaseMetaItem: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  milestoneList: {
    marginLeft: 20,
    marginTop: 6,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 6,
  },

  subjectDistCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  subjectDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectDistName: {
    width: 50,
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  subjectDistBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  subjectDistBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectDistCount: {
    width: 40,
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },

  // ===== Review reminder =====
  reviewReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  reviewReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewReminderText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
  },
  reviewReminderBold: {
    fontWeight: 'bold',
    color: '#FF5722',
  },

  // ===== Enhanced task card =====
  videoRecommend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  videoRecommendText: {
    fontSize: 11,
    color: '#2E7D32',
    marginLeft: 4,
    maxWidth: 160,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskMeta: {
    fontSize: 11,
    color: '#888',
    marginRight: 12,
  },

  // ===== Start task button =====
  startTaskBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: 6,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // ===== Task action buttons =====
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexWrap: 'wrap',
    gap: 4,
  },
  taskActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    marginRight: 4,
  },
  taskActionBtnSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  taskActionLabel: {
    fontSize: 10,
    color: '#E65100',
    marginLeft: 3,
    fontWeight: '600',
  },
  taskActionDuration: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginHorizontal: 4,
    minWidth: 40,
    textAlign: 'center',
  },
  taskActionDisabled: {
    opacity: 0.4,
  },

  // ===== Add custom task =====
  addTaskSection: {
    marginBottom: 15,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addTaskButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  addTaskForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  addTaskFormTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  addTaskFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addTaskLabel: {
    width: 40,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  subjectPicker: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  subjectChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  subjectChipText: {
    fontSize: 12,
    color: '#666',
  },
  subjectChipTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  addTaskInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addTaskInput: {
    fontSize: 13,
    color: '#999',
    flex: 1,
  },
  quickTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    marginLeft: 40,
  },
  quickTitleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickTitleChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  quickTitleChipText: {
    fontSize: 11,
    color: '#888',
  },
  quickTitleChipTextActive: {
    color: '#E65100',
    fontWeight: '600',
  },
  durationPicker: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  durationChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  durationChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  durationChipText: {
    fontSize: 12,
    color: '#666',
  },
  durationChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  addTaskFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  addTaskCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  addTaskCancelText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  addTaskConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  addTaskConfirmDisabled: {
    backgroundColor: '#A5D6A7',
  },
  addTaskConfirmText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },

  // ===== Misc =====
  skippedHint: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: 'normal',
  },
  customBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },
});
