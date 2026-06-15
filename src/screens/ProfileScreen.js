/**
 * 个人中心页面
 * 展示学生信息、打卡数据、学习时长，提供家长绑定和设置入口
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { getCheckinStats, getLearningStats, getGameState } from '../api/backend';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { student, today, checkIn } = useApp();
  const [checkinStats, setCheckinStats] = useState({ total_days: 0, current_streak: 0 });
  const [learningStats, setLearningStats] = useState({ today_minutes: 0, week_minutes: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // 加载后端数据
  const fetchData = useCallback(async () => {
    try {
      const [checkinResult, learningResult] = await Promise.allSettled([
        getCheckinStats(),
        getLearningStats(),
      ]);
      if (checkinResult.status === 'fulfilled') setCheckinStats(checkinResult.value);
      if (learningResult.status === 'fulfilled') {
        const data = learningResult.value;
        setLearningStats({ today_minutes: data.today_minutes || 0, week_minutes: data.week_minutes || 0 });
      }
    } catch (e) { console.warn('加载个人中心数据失败:', e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, [fetchData]);

  // 格式化学习时长
  const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  // 获取头像
  const getAvatar = () => {
    if (student?.avatar) {
      return { uri: student.avatar };
    }
    return require('../assets/default-avatar.png');
  };

  // 处理打卡（需 await 确认完成后再弹窗）
  const handleCheckIn = async () => {
    try {
      await checkIn();
      Alert.alert('打卡成功', '今日学习已打卡，继续加油！');
    } catch (e) {
      Alert.alert('打卡失败', '打卡失败，请重试');
    }
  };

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      {/* 头部信息卡片 */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Image
            source={getAvatar()}
            style={styles.avatar}
            defaultSource={require('../assets/default-avatar.png')}
          />
          {today?.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Icon name="local-fire-department" size={12} color="#fff" />
              <Text style={styles.streakText}>{today.currentStreak}</Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>
            {student?.name || student?.displayName || '同学'}
          </Text>
          <Text style={styles.phone}>
            {student?.phone || student?.username || '未绑定手机号'}
          </Text>
        </View>
      </View>

      {/* 打卡数据 */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>打卡记录</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkinStats.total_days || today?.totalCheckIns || 0}</Text>
            <Text style={styles.statLabel}>累计打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkinStats.current_streak || today?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatStudyTime(learningStats.today_minutes || today?.studyTime || 0)}</Text>
            <Text style={styles.statLabel}>今日学习</Text>
          </View>
        </View>
      </View>

      {/* 学习时长 */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>学习时长</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatStudyTime(learningStats.today_minutes || today?.studyTime || 0)}</Text>
            <Text style={styles.statLabel}>今日时长</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatStudyTime(learningStats.week_minutes || 0)}</Text>
            <Text style={styles.statLabel}>本周时长</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Stats')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Icon name="bar-chart" size={24} color="#007AFF" />
            <Text style={styles.menuItemText}>查看学习数据</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#C8C8CD" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ParentBinding')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Icon name="family-restroom" size={24} color="#34C759" />
            <Text style={styles.menuItemText}>家长绑定</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#C8C8CD" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <Icon name="settings" size={24} color="#636366" />
            <Text style={styles.menuItemText}>设置</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#C8C8CD" />
        </TouchableOpacity>
      </View>

      {/* 学习成就 */}
      <View style={styles.menuCard}>
        <Text style={styles.sectionTitle}>学习成就</Text>
        <View style={styles.achievementRow}>
          <View style={styles.achievementItem}>
            <Icon name="emoji-events" size={32} color="#FFD700" />
            <Text style={styles.achievementLabel}>初出茅庐</Text>
            <Text style={styles.achievementDesc}>完成首次诊断</Text>
          </View>
          <View style={styles.achievementItem}>
            <Icon name="workspace-premium" size={32} color="#C0C0C0" />
            <Text style={styles.achievementLabel}>学习新星</Text>
            <Text style={styles.achievementDesc}>累计学习10小时</Text>
          </View>
          <View style={styles.achievementItem}>
            <Icon name="military-tech" size={32} color="#CD7F32" />
            <Text style={styles.achievementLabel}>坚持不懈</Text>
            <Text style={styles.achievementDesc}>连续打卡7天</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E5EA',
  },
  streakBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: { color: '#fff', fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#636366',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#636366',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  menuCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  achievementItem: {
    alignItems: 'center',
    flex: 1,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  achievementDesc: { fontSize: 12,
    color: '#636366',
    marginTop: 2,
  },
  bottomPadding: {
    height: 30,
  },
});
