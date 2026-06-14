/**
 * 网络状态提示条组件
 * 网络断开时在屏幕顶部显示红色提示，网络恢复时自动消失
 *
 * @module NetworkStatusBar
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { checkNetworkStatus, subscribeNetworkChange } from '../utils/network';

export default function NetworkStatusBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 初始化检测网络状态
    const initNetworkStatus = async () => {
      const { isConnected } = await checkNetworkStatus();
      if (!isConnected) {
        showBar();
      }
    };
    initNetworkStatus();

    // 订阅网络状态变化
    const unsubscribe = subscribeNetworkChange((isConnected) => {
      if (isConnected) {
        hideBar();
      } else {
        showBar();
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const showBar = () => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideBar = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Icon name="wifi-off" size={16} color="#fff" />
        <Text style={styles.text}>网络连接已断开，请检查网络</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#FF3B30',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});