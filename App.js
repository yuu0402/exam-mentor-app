import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppProvider, useApp } from './src/context/AppContext';

import HomeScreen from './src/screens/HomeScreen';
import CourseListScreen from './src/screens/CourseListScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import DiagnosisScreen from './src/screens/DiagnosisScreen';
import StudyPlanScreen from './src/screens/StudyPlanScreen';
import WrongAnswerScreen from './src/screens/WrongAnswerScreen';
import QuickPracticeScreen from './src/screens/QuickPracticeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LearningSessionScreen from './src/screens/LearningSessionScreen';
import StatsScreen from './src/screens/StatsScreen';

// ── Deep Linking 配置 ──────────────────────────────────────────
const linking = {
  prefixes: ['zhongkao-mentor://', 'https://zhongkao.peer.today'],
  config: {
    screens: {
      TodayTab: {
        screens: {
          Today: '',
          Diagnosis: 'diagnosis',
          StudyPlan: 'study-plan',
          WrongAnswers: 'wrong-answers',
        },
      },
      CourseTab: {
        screens: {
          CourseList: 'courses',
          VideoPlayer: 'video/:fileId',
          QuickPractice: 'quick-practice',
        },
      },
      AITab: {
        screens: {
          AIChat: 'ai-chat',
        },
      },
    },
  },
};

// ── 导航状态持久化 Key ──────────────────────────────────────
const NAV_STATE_KEY = '@nav_state';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const headerStyle = { backgroundColor: '#FFFFFF' };
const headerTint = '#007AFF';
const headerConfig = {
  headerStyle, headerTintColor: headerTint,
  headerTitleStyle: { fontWeight: '700', color: '#000', fontSize: 17 },
  headerShadowVisible: false, headerBackTitle: '返回',
};

function CourseStack() {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen name="CourseList" component={CourseListScreen} options={{ title: '课程' }} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: '', headerShown: false }} />
      <Stack.Screen name="QuickPractice" component={QuickPracticeScreen} options={{ title: '课后练习', headerShown: false }} />
    </Stack.Navigator>
  );
}

function AIStack() {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI答疑' }} />
    </Stack.Navigator>
  );
}

// 主流程 stack（首页引导 → 诊断 → 学习计划 → 错题本）
function MainStack() {
  return (
    <Stack.Navigator screenOptions={headerConfig}>
      <Stack.Screen name="Today" component={HomeScreen} options={{ title: '私人导师', headerShown: false }} />
      <Stack.Screen name="LearningSession" component={LearningSessionScreen} options={{ title: '', headerShown: false }} />
      <Stack.Screen name="Diagnosis" component={DiagnosisScreen} options={{ title: '诊断测试' }} />
      <Stack.Screen name="StudyPlan" component={StudyPlanScreen} options={{ title: '学习计划' }} />
      <Stack.Screen name="WrongAnswers" component={WrongAnswerScreen} options={{ title: '错题本' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: '学习数据' }} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
      tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 8, height: 56, paddingBottom: 6, paddingTop: 4 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ color, size }) => {
        const icons = { TodayTab: 'today', CourseTab: 'play-circle', AITab: 'psychology' };
        return <Icon name={icons[route.name] || 'circle'} size={size} color={color} />;
      },
    })}>
      <Tab.Screen name="TodayTab" component={MainStack} options={{ title: '今日' }} />
      <Tab.Screen name="CourseTab" component={CourseStack} options={{ title: '课程' }} />
      <Tab.Screen name="AITab" component={AIStack} options={{ title: 'AI' }} />
    </Tab.Navigator>
  );
}

// 根组件：根据引导状态决定显示 Onboarding 还是主界面
function AppRoot() {
  const { isLoading, isOnboarded, student } = useApp();
  const [navState, setNavState] = useState(null);
  const [navReady, setNavReady] = useState(false);
  const navigationRef = useRef(null);

  // 恢复上次导航状态（记住 Tab）
  useEffect(() => {
    AsyncStorage.getItem(NAV_STATE_KEY).then(saved => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setNavState(parsed);
          }
        } catch (e) {
          // 无效状态，忽略
        }
      }
      setNavReady(true);
    }).catch(() => setNavReady(true));
  }, []);

  // 持久化导航状态变化
  const handleStateChange = (state) => {
    if (state) {
      AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
    }
  };

  // 加载中 - 显示启动画面
  if (isLoading) {
    return (
      <View style={splashStyles.container}>
        <StatusBar style="dark" />
        <Text style={splashStyles.title}>私人导师</Text>
        <Text style={splashStyles.subtitle}>你的专属中考备考助手</Text>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
      </View>
    );
  }

  // 未完成引导（无学生信息）- 显示引导流程
  if (!isOnboarded || !student) {
    return (
      <>
        <StatusBar style="dark" />
        <OnboardingScreen />
      </>
    );
  }

  // 已完成引导 - 显示主界面
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        initialState={navState}
        onStateChange={handleStateChange}
        onReady={() => setNavReady(true)}
      >
        <AppTabs />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
