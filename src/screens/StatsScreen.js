/**
 * 学习数据统计页面
 * 包含：周学习时长柱状图、科目时间分布饼图、打卡日历
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getWeeklyStats, getCheckinRecords, getCheckinStats } from '../api/backend';

const { width } = Dimensions.get('window');

// 科目颜色配置
const SUBJECT_COLORS = {
  '数学': '#FF3B30',
  '物理': '#007AFF',
  '英语': '#FF9500',
  '语文': '#34C759',
  '化学': '#AF52DE',
};

// 默认颜色列表
const COLOR_LIST = ['#FF3B30', '#007AFF', '#FF9500', '#34C759', '#AF52DE', '#5856D6', '#FF2D55'];

// Tab 配置
const TABS = ['今日', '本周', '本月'];

// 一周日期标签
const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

// 将角度转换为弧度
function toRadians(angle) {
  return (angle * Math.PI) / 180;
}

/**
 * 纯 View 实现的饼图
 * @param {Array} segments - 饼图分段 [{label, value, color}]
 * @param {number} size - 饼图尺寸
 */
function PieChartView({ segments, size = 160 }) {
  if (!segments || segments.length === 0) {
    return (
      <View style={[styles.pieContainer, { width: size, height: size }]}>
        <View style={[styles.pieCenter, { width: size * 0.5, height: size * 0.5 }]} />
      </View>
    );
  }

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  if (total === 0) {
    return (
      <View style={[styles.pieContainer, { width: size, height: size }]}>
        <View style={[styles.pieCenter, { width: size * 0.5, height: size * 0.5 }]} />
      </View>
    );
  }

  const radius = size / 2;
  const centerRadius = radius * 0.5;
  const gaps = 2; // 扇形之间的间隙角度
  let currentAngle = -90; // 从顶部开始

  // 生成扇形块
  const wedges = segments.map((segment, idx) => {
    const angle = ((segment.value || 0) / total) * 360;
    const gapAngle = gaps;
    const actualAngle = Math.max(0, angle - gapAngle);

    if (actualAngle <= 0) return null;

    const halfAngle = currentAngle + actualAngle / 2;
    const radians = toRadians(halfAngle);

    // 计算扇形的关键点（相对于中心）
    const x1 = radius * Math.cos(toRadians(currentAngle));
    const y1 = radius * Math.sin(toRadians(currentAngle));
    const x2 = radius * Math.cos(toRadians(currentAngle + actualAngle));
    const y2 = radius * Math.sin(toRadians(currentAngle + actualAngle));

    const wedge = {
      color: segment.color || COLOR_LIST[idx % COLOR_LIST.length],
      startAngle: currentAngle,
      angle: actualAngle,
      halfAngle,
      x1, y1, x2, y2,
      label: segment.label,
      value: segment.value,
      percent: Math.round((segment.value / total) * 100),
    };

    currentAngle += actualAngle + gapAngle;
    return wedge;
  }).filter(Boolean);

  return (
    <View style={[styles.pieContainer, { width: size, height: size }]}>
      {/* 饼图外圈，用多个不同角度/颜色的矩形旋转堆叠实现 */}
      {wedges.map((wedge, idx) => {
        // 用多个小矩形模拟扇形块
        return (
          <View
            key={idx}
            style={[
              styles.pieWedge,
              {
                backgroundColor: wedge.color,
                transform: [
                  { translateX: size / 2 - 1 },
                  { translateY: size / 2 - wedge.angle / 2 },
                  { rotate: `${wedge.startAngle}deg` },
                ],
                width: 2,
                height: radius,
              },
            ]}
          />
        );
      })}
      {/* 中心透明圆 */}
      <View
        style={[
          styles.pieCenter,
          {
            width: centerRadius * 2,
            height: centerRadius * 2,
            borderRadius: centerRadius,
            left: radius - centerRadius,
            top: radius - centerRadius,
          },
        ]}
      />
    </View>
  );
}

/**
 * 打卡日历（GitHub contributions 风格）
 * @param {Array} records - [{date: 'YYYY-MM-DD', checked_in: boolean}]
 */
function CheckinCalendar({ records }) {
  // 生成过去30天的日期
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const record = records.find(r => r.date === dateStr);
    days.push({
      date: dateStr,
      checked: record?.checked_in || false,
      day: d.getDate(),
    });
  }

  // 按周分组
  const weeks = [];
  let currentWeek = [];
  days.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || idx === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <View style={styles.calendarContainer}>
      {/* 星期标签 */}
      <View style={styles.calendarWeekdayRow}>
        {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
          <Text key={i} style={styles.calendarWeekday}>{d}</Text>
        ))}
      </View>
      {/* 日历格子 */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.calendarWeekRow}>
          {week.map((day, di) => (
            <View
              key={di}
              style={[
                styles.calendarDay,
                day.checked ? styles.calendarDayChecked : styles.calendarDayUnchecked,
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  day.checked ? styles.calendarDayTextChecked : styles.calendarDayTextUnchecked,
                ]}
              >
                {day.day}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * 周学习时长柱状图
 * @param {Array} data - [{day: '周一', minutes: number}]
 */
function WeeklyBarChart({ data }) {
  // 计算最高值作为 100% 基准
  const maxMinutes = Math.max(...(Array.isArray(data) ? data.map(d => d.minutes) : []), 1);

  return (
    <View style={styles.barChartContainer}>
      <View style={styles.barChartBars}>
        {data.map((item, idx) => {
          const heightPercent = (item.minutes / maxMinutes) * 100;
          return (
            <View key={idx} style={styles.barColumn}>
              <Text style={styles.barValue}>{item.minutes}m</Text>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StatsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('本周');
  const [weeklyData, setWeeklyData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [checkinRecords, setCheckinRecords] = useState([]);
  const [checkinStats, setCheckinStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [weeklyRes, recordsRes, statsRes] = await Promise.allSettled([
        getWeeklyStats(),
        getCheckinRecords(30),
        getCheckinStats(),
      ]);

      // 处理周数据
      if (weeklyRes.status === 'fulfilled') {
        const data = weeklyRes.value;
        // 后端返回格式：{daily: [{date, minutes, subjects: {math: 10, physics: 20}}]}
        const daily = data.daily || [];
        const weekData = WEEK_DAYS.map((day, idx) => {
          const dayData = daily[idx] || {};
          return {
            day,
            minutes: dayData.minutes || 0,
          };
        });
        setWeeklyData(weekData);

        // 聚合科目时间
        const subjectMap = {};
        daily.forEach(day => {
          const subjects = day.subjects || {};
          Object.entries(subjects).forEach(([subject, minutes]) => {
            subjectMap[subject] = (subjectMap[subject] || 0) + minutes;
          });
        });
        const subjData = Object.entries(subjectMap).map(([label, value], idx) => ({
          label,
          value,
          color: SUBJECT_COLORS[label] || COLOR_LIST[idx % COLOR_LIST.length],
        }));
        setSubjectData(subjData);
      }

      // 处理打卡记录
      if (recordsRes.status === 'fulfilled') {
        setCheckinRecords(recordsRes.value || []);
      }

      // 处理打卡统计
      if (statsRes.status === 'fulfilled') {
        setCheckinStats(statsRes.value || {});
      }
    } catch (e) {
      console.warn('加载统计数据失败:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, [loadData]);

  // 格式化时间
  const formatTime = (min) => {
    if (!min) return '0分钟';
    if (min < 60) return `${min}分钟`;
    return `${Math.floor(min / 60)}小时${min % 60}分钟`;
  };

  // 总学习时长
  const totalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);

  // 加载中显示全屏 Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>学习数据</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>学习数据</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
        {/* Tab 切换 */}
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 今日数据卡片 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatTime(totalMinutes)}</Text>
            <Text style={styles.statLabel}>本周学习</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{checkinStats.current_streak || 0}</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{checkinStats.total_days || 0}</Text>
            <Text style={styles.statLabel}>累计打卡</Text>
          </View>
        </View>

        {/* 周学习时长柱状图 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>本周学习时长</Text>
          <WeeklyBarChart data={weeklyData} />
        </View>

        {/* 科目时间分布 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>科目时间分布</Text>
          <View style={styles.pieSection}>
            {subjectData.length > 0 ? (
              <>
                <PieChartView segments={subjectData} size={140} />
                <View style={styles.legendContainer}>
                  {subjectData.map((item, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendValue}>{item.value}m</Text>
                      <Text style={styles.legendPercent}>{Math.round((item.value / (totalMinutes || 1)) * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="pie-chart" size={48} color="#E5E5EA" />
                <Text style={styles.emptyText}>暂无学习数据</Text>
              </View>
            )}
          </View>
        </View>

        {/* 打卡日历 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>打卡记录（近30天）</Text>
          <View style={styles.calendarLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendLabel}>已打卡</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#E5E5EA' }]} />
              <Text style={styles.legendLabel}>未打卡</Text>
            </View>
          </View>
          <CheckinCalendar records={checkinRecords} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },

  content: { flex: 1, padding: 16 },

  // Tab
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#636366' },
  tabTextActive: { color: '#fff' },

  // Stats Row
  statsRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#007AFF' },
  statLabel: { fontSize: 11, color: '#636366', marginTop: 4 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 16 },

  // Bar Chart
  barChartContainer: { paddingTop: 8 },
  barChartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, justifyContent: 'space-around' },
  barColumn: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barWrapper: { width: 24, height: 100, backgroundColor: '#F2F2F7', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { backgroundColor: '#007AFF', borderRadius: 6, width: '100%' },
  barValue: { fontSize: 10, color: '#636366', marginTop: 4 },
  barLabel: { fontSize: 11, color: '#636366', marginTop: 2 },

  // Pie Chart
  pieSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  pieContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieWedge: {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'center center',
  },
  pieCenter: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  legendContainer: { flex: 1, marginLeft: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { fontSize: 13, color: '#000', flex: 1 },
  legendValue: { fontSize: 12, color: '#636366', marginRight: 6 },
  legendPercent: { fontSize: 12, fontWeight: '700', color: '#007AFF', width: 36, textAlign: 'right' },

  // Calendar
  calendarLegend: { flexDirection: 'row', marginBottom: 12, gap: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  calendarContainer: { alignItems: 'center' },
  calendarWeekdayRow: { flexDirection: 'row', marginBottom: 6 },
  calendarWeekday: { width: 36, textAlign: 'center', fontSize: 11, color: '#636366' },
  calendarWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calendarDay: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2 },
  calendarDayChecked: { backgroundColor: '#34C759' },
  calendarDayUnchecked: { backgroundColor: '#E5E5EA' },
  calendarDayText: { fontSize: 12, fontWeight: '600' },
  calendarDayTextChecked: { color: '#fff' },
  calendarDayTextUnchecked: { color: '#636366' },

  // Empty State
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: '#636366', marginTop: 12 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#636366' },
});