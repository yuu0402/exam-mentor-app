/**
 * 设置页面
 * 包含夸克Cookie配置、AI API Key配置、消息通知、清除缓存、退出登录等功能
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  AsyncStorage,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { APP_INFO } from '../config';
import { logout as backendLogout } from '../api/backend';

export default function SettingsScreen({ navigation }) {
  const { saveQuarkCookie, quarkCookie, isCookieExpired, saveAIConfig } = useApp();

  // 夸克Cookie状态
  const [quarkCookieInput, setQuarkCookieInput] = useState('');
  const [quarkCookieStatus, setQuarkCookieStatus] = useState('');

  // AI API Key状态
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4');

  // 通知开关
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // 加载状态
  const [loadingQuark, setLoadingQuark] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // 初始化加载
  useEffect(() => {
    loadSettings();
  }, []);

  // 加载设置数据
  const loadSettings = async () => {
    try {
      // 加载夸克Cookie状态
      if (quarkCookie) {
        const status = isCookieExpired() ? '已过期' : '已配置';
        setQuarkCookieStatus(status);
      } else {
        setQuarkCookieStatus('未配置');
      }

      // 加载AI配置
      const aiSettings = await AsyncStorage.getItem('@ai_settings');
      if (aiSettings) {
        const parsed = JSON.parse(aiSettings);
        setAiApiKey(parsed.apiKey || '');
        setAiModel(parsed.model || 'gpt-4');
      }

      // 加载通知设置
      const notifSettings = await AsyncStorage.getItem('@notification_settings');
      if (notifSettings) {
        setNotificationsEnabled(JSON.parse(notifSettings).enabled);
      }
    } catch (e) {
      console.warn('加载设置失败:', e);
    }
  };

  // 保存夸克Cookie
  const handleSaveQuarkCookie = async () => {
    if (!quarkCookieInput.trim()) {
      Alert.alert('提示', '请输入夸克Cookie');
      return;
    }

    setLoadingQuark(true);
    try {
      const success = await saveQuarkCookie(quarkCookieInput.trim());
      if (success) {
        setQuarkCookieStatus('已配置');
        setQuarkCookieInput('');
        Alert.alert('保存成功', '夸克Cookie已保存');
      } else {
        Alert.alert('保存失败', '夸克Cookie保存失败，请重试');
      }
    } catch (e) {
      Alert.alert('错误', '保存夸克Cookie时发生错误');
    } finally {
      setLoadingQuark(false);
    }
  };

  // 保存AI配置
  const handleSaveAIConfig = async () => {
    if (!aiApiKey.trim()) {
      Alert.alert('提示', '请输入API Key');
      return;
    }

    setLoadingAI(true);
    try {
      const settings = {
        apiKey: aiApiKey.trim(),
        model: aiModel.trim() || 'gpt-4',
      };
      await AsyncStorage.setItem('@ai_settings', JSON.stringify(settings));
      await saveAIConfig(settings);
      Alert.alert('保存成功', 'AI配置已保存');
    } catch (e) {
      Alert.alert('错误', '保存AI配置时发生错误');
    } finally {
      setLoadingAI(false);
    }
  };

  // 切换通知开关
  const handleNotificationToggle = async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('@notification_settings', JSON.stringify({ enabled: value }));
    } catch (e) {
      console.warn('保存通知设置失败:', e);
    }
  };

  // 清除缓存
  const handleClearCache = () => {
    Alert.alert(
      '确认清除缓存',
      '清除缓存将删除本地学习数据，但不会影响您的账号信息。确定要清除吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              // 清除本地缓存
              await AsyncStorage.multiRemove([
                '@course_cache',
                '@study_logs',
                '@entertainment_logs',
              ]);
              Alert.alert('清除成功', '缓存已清除');
            } catch (e) {
              Alert.alert('错误', '清除缓存时发生错误');
            }
          },
        },
      ]
    );
  };

  // 退出登录
  const handleLogout = () => {
    Alert.alert(
      '确认退出登录',
      '退出登录后将清除本地登录状态，需要重新登录才能继续使用。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定退出',
          style: 'destructive',
          onPress: async () => {
            try {
              // 调用后端登出
              await backendLogout();
              // 清除本地存储
              await AsyncStorage.clear();
              // 跳转到登录页
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              console.warn('退出登录失败:', e);
              // 仍然尝试本地登出
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 夸克Cookie配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>夸克网盘配置</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Cookie状态：{quarkCookieStatus}</Text>
          <TextInput
            style={styles.multilineInput}
            placeholder="请粘贴夸克网盘Cookie..."
            placeholderTextColor="#C7C7CC"
            value={quarkCookieInput}
            onChangeText={setQuarkCookieInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.saveButton, loadingQuark && styles.saveButtonDisabled]}
            onPress={handleSaveQuarkCookie}
            disabled={loadingQuark}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>
              {loadingQuark ? '保存中...' : '保存Cookie'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            如何获取Cookie：打开pan.quark.cn，按F12打开开发者工具，在Network中查看请求的Cookie
          </Text>
        </View>
      </View>

      {/* AI API Key配置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI配置</Text>
        <View style={styles.card}>
          <Text style={styles.label}>API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入OpenAI API Key..."
            placeholderTextColor="#C7C7CC"
            value={aiApiKey}
            onChangeText={setAiApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>模型（可选）</Text>
          <TextInput
            style={styles.input}
            placeholder="gpt-4"
            placeholderTextColor="#C7C7CC"
            value={aiModel}
            onChangeText={setAiModel}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveButton, loadingAI && styles.saveButtonDisabled]}
            onPress={handleSaveAIConfig}
            disabled={loadingAI}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>
              {loadingAI ? '保存中...' : '保存AI配置'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 消息通知 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>消息通知</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Icon name="notifications" size={24} color="#007AFF" />
              <Text style={styles.switchLabelText}>启用消息通知</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* 清除缓存 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存储</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="delete-outline" size={24} color="#FF9500" />
              <Text style={styles.menuItemText}>清除缓存</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 退出登录 */}
      <View style={styles.section}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Icon name="logout" size={24} color="#FF3B30" />
              <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>退出登录</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 版本信息 */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>{APP_INFO.name} v{APP_INFO.version}</Text>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  multilineInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabelText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  versionInfo: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  bottomPadding: {
    height: 30,
  },
});
