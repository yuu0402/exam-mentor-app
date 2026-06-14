/**
 * 登录注册页面
 * 手机号 + 验证码登录，支持自动注册
 *
 * @module LoginScreen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { sendCode, login, register } from '../api/backend';

// 验证码倒计时秒数
const CODE_COOLDOWN = 60;
// 按钮防抖锁定时间（毫秒）
const BUTTON_LOCK_MS = 2000;

export default function LoginScreen() {
  const { login: contextLogin } = useApp();

  // 手机号
  const [phone, setPhone] = useState('');
  // 验证码
  const [code, setCode] = useState('');
  // 发送验证码按钮剩余秒数
  const [codeCooldown, setCodeCooldown] = useState(0);
  // 验证码定时器引用
  const cooldownTimerRef = useRef(null);
  // 按钮防抖引用
  const buttonLockRef = useRef(false);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 验证码输入框引用（用于聚焦）
  const codeInputRef = useRef(null);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  // 开始验证码倒计时
  const startCooldown = () => {
    setCodeCooldown(CODE_COOLDOWN);
    cooldownTimerRef.current = setInterval(() => {
      setCodeCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 验证手机号格式
  const validatePhone = (phoneNum) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNum);
  };

  // 验证验证码格式（6位数字）
  const validateCode = (codeStr) => {
    return /^\d{6}$/.test(codeStr);
  };

  // 发送验证码
  const handleSendCode = async () => {
    // 防抖检查
    if (buttonLockRef.current) return;
    if (codeCooldown > 0) return;

    // 验证手机号
    if (!validatePhone(phone)) {
      Alert.alert('请输入有效的手机号', '手机号必须是11位数字，以1开头');
      return;
    }

    buttonLockRef.current = true;
    setTimeout(() => { buttonLockRef.current = false; }, BUTTON_LOCK_MS);

    Keyboard.dismiss();
    setLoading(true);

    try {
      await sendCode(phone);
      startCooldown();
      Alert.alert('发送成功', '验证码已发送至您的手机，请查收');
      // 自动聚焦验证码输入框
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    } catch (error) {
      const message = error.message || '发送验证码失败';
      if (message.includes('过于频繁') || message.includes('rate limit')) {
        Alert.alert('发送过于频繁', '请稍后再试');
      } else {
        Alert.alert('发送失败', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 登录/注册
  const handleLogin = async () => {
    // 防抖检查
    if (buttonLockRef.current) return;

    // 验证手机号
    if (!validatePhone(phone)) {
      Alert.alert('请输入有效的手机号', '手机号必须是11位数字，以1开头');
      return;
    }

    // 验证验证码
    if (!validateCode(code)) {
      Alert.alert('请输入6位验证码', '验证码必须是6位数字');
      return;
    }

    buttonLockRef.current = true;
    setTimeout(() => { buttonLockRef.current = false; }, BUTTON_LOCK_MS);

    Keyboard.dismiss();
    setLoading(true);

    try {
      // 调用 contextLogin，它会处理注册或登录逻辑
      await contextLogin(phone, code);
      // 登录成功后，App.js 中的 navigation 会自动切换到主界面
    } catch (error) {
      const message = error.message || '登录失败';

      // 解析错误类型
      if (message.includes('验证码错误') || message.includes('invalid_code')) {
        Alert.alert('验证码错误', '请检查验证码是否输入正确');
      } else if (message.includes('验证码过期') || message.includes('expired')) {
        Alert.alert('验证码已过期', '请重新获取验证码');
      } else if (message.includes('验证码') || message.includes('code')) {
        Alert.alert('验证码错误', message);
      } else if (message.includes('网络') || message.includes('fetch') || message.includes('connect')) {
        Alert.alert('网络错误', '请检查网络连接后重试');
      } else {
        Alert.alert('登录失败', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 渲染手机号输入框
  const renderPhoneInput = () => (
    <View style={styles.inputContainer}>
      <Icon name="phone" size={20} color="#8E8E93" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder="请输入手机号"
        placeholderTextColor="#C7C7CC"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={11}
        autoComplete="tel"
        editable={!loading}
      />
    </View>
  );

  // 渲染验证码输入框
  const renderCodeInput = () => (
    <View style={styles.inputContainer}>
      <Icon name="lock" size={20} color="#8E8E93" style={styles.inputIcon} />
      <TextInput
        ref={codeInputRef}
        style={[styles.input, styles.codeInput]}
        placeholder="请输入6位验证码"
        placeholderTextColor="#C7C7CC"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry={false}
        editable={!loading}
      />
      <TouchableOpacity
        style={[
          styles.sendCodeButton,
          codeCooldown > 0 && styles.sendCodeButtonDisabled,
        ]}
        onPress={handleSendCode}
        disabled={loading || codeCooldown > 0}
      >
        {loading && codeCooldown === 0 ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={[
            styles.sendCodeText,
            codeCooldown > 0 && styles.sendCodeTextDisabled,
          ]}>
            {codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // 渲染登录按钮
  const renderLoginButton = () => (
    <TouchableOpacity
      style={[
        styles.loginButton,
        (!validatePhone(phone) || !validateCode(code) || loading) && styles.loginButtonDisabled,
      ]}
      onPress={handleLogin}
      disabled={!validatePhone(phone) || !validateCode(code) || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.loginButtonText}>登录 / 注册</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {/* 标题区域 */}
        <View style={styles.header}>
          <Text style={styles.title}>中考智学</Text>
          <Text style={styles.subtitle}>登录后开启智能学习之旅</Text>
        </View>

        {/* 输入区域 */}
        <View style={styles.form}>
          {renderPhoneInput()}
          {renderCodeInput()}
          {renderLoginButton()}
        </View>

        {/* 底部提示 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            登录即表示同意
            <Text style={styles.link}>《用户协议》</Text>
            和
            <Text style={styles.link}>《隐私政策》</Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    height: 52,
  },
  codeInput: {
    flex: 1,
    marginRight: 8,
  },
  sendCodeButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  sendCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sendCodeTextDisabled: {
    color: '#8E8E93',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0D4FF',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  link: {
    color: '#007AFF',
  },
});