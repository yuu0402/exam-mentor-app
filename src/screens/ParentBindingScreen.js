/**
 * 家长绑定页面
 * Tab1: 生成绑定码并展示二维码
 * Tab2: 扫码绑定或手动输入绑定码
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { generateBindingCode, bindParent } from '../api/backend';

export default function ParentBindingScreen({ navigation }) {
  const { student } = useApp();

  // Tab状态
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'scan'

  // 生成绑定码状态
  const [bindingCode, setBindingCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // 扫码绑定状态
  const [manualCode, setManualCode] = useState('');
  const [loadingBind, setLoadingBind] = useState(false);

  // 二维码弹窗
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // 生成绑定码
  const handleGenerateCode = async () => {
    setLoadingGenerate(true);
    try {
      const result = await generateBindingCode();
      setBindingCode(result.binding_code);
      setExpiresAt(result.expires_at);
      setQrModalVisible(true);
    } catch (e) {
      Alert.alert('生成失败', '生成绑定码失败，请重试');
    } finally {
      setLoadingGenerate(false);
    }
  };

  // 刷新绑定码
  const handleRefreshCode = async () => {
    // 等生成完成后再关闭 modal，避免用户看到中间状态
    await handleGenerateCode();
    setQrModalVisible(false);
  };

  // 复制绑定码
  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(bindingCode);
      Alert.alert('已复制', '绑定码已复制到剪贴板');
    } catch (e) {
      console.warn('复制绑定码失败:', e?.message);
      Alert.alert('复制失败', '无法访问剪贴板，请手动复制');
    }
  };

  // 扫码（需要camera权限）
  
  // 绑定家长
  const handleBind = async () => {
    if (!manualCode.trim()) {
      Alert.alert('提示', '请输入绑定码');
      return;
    }

    setLoadingBind(true);
    try {
      await bindParent({ binding_code: manualCode.trim() });
      Alert.alert('绑定成功', '家长绑定成功！', [
        {
          text: '确定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e) {
      Alert.alert('绑定失败', e.message || '绑定失败，请检查绑定码是否正确');
    } finally {
      setLoadingBind(false);
    }
  };

  // 生成二维码URL
  const getQRCodeUrl = () => {
    if (!bindingCode) return '';
    return `zhongkao-mentor://bind?code=${bindingCode}`;
  };

  return (
    <View style={styles.container}>
      {/* Tab切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generate' && styles.tabActive]}
          onPress={() => setActiveTab('generate')}
          activeOpacity={0.7}
        >
          <Icon
            name="qr-code"
            size={20}
            color={activeTab === 'generate' ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'generate' && styles.tabTextActive,
            ]}
          >
            生成绑定码
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
          onPress={() => setActiveTab('scan')}
          activeOpacity={0.7}
        >
          <Icon
            name="qr-code-scanner"
            size={20}
            color={activeTab === 'scan' ? '#007AFF' : '#8E8E93'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'scan' && styles.tabTextActive,
            ]}
          >
            扫码绑定
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab内容 */}
      {activeTab === 'generate' ? (
        <View style={styles.tabContent}>
          <View style={styles.infoCard}>
            <Icon name="info-outline" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              生成绑定码后，请让家长使用"中考智学家长端"扫描二维码或输入绑定码完成绑定。
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, loadingGenerate && styles.buttonDisabled]}
            onPress={handleGenerateCode}
            disabled={loadingGenerate}
            activeOpacity={0.7}
          >
            <Icon name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.generateButtonText}>
              {loadingGenerate ? '生成中...' : '生成绑定码'}
            </Text>
          </TouchableOpacity>

          {bindingCode && (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>绑定码</Text>
              <Text style={styles.codeValue}>{bindingCode}</Text>
              <Text style={styles.codeHint}>
                有效期至：{expiresAt ? new Date(expiresAt).toLocaleString() : '未知'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.tabContent}>
          <View style={styles.infoCard}>
            <Icon name="info-outline" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              请让家长打开"中考智学家长端"，获取绑定码后在此输入完成绑定。
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>输入绑定码</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.codeInput}
            placeholder="请输入家长端的绑定码..."
            placeholderTextColor="#C7C7CC"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.bindButton, loadingBind && styles.buttonDisabled]}
            onPress={handleBind}
            disabled={loadingBind}
            activeOpacity={0.7}
          >
            <Text style={styles.bindButtonText}>
              {loadingBind ? '绑定中...' : '确认绑定'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 二维码弹窗 */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>家长端扫码绑定</Text>

            {/* 绑定链接展示区域 */}
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Icon name="link" size={48} color="#4CAF50" />
                <Text style={styles.bindUrlText}>
                  {getQRCodeUrl() || `绑定码: ${bindingCode}`}
                </Text>
                <Text style={styles.qrCodeText}>绑定码：{bindingCode}</Text>
              </View>
              <Text style={styles.qrHint}>
                请将上述绑定码或链接发送给家长，在家长端完成绑定
              </Text>
            </View>

            {/* 绑定码复制 */}
            <View style={styles.copySection}>
              <Text style={styles.copyLabel}>或复制绑定码：</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Icon name="content-copy" size={16} color="#007AFF" />
                <Text style={styles.copyButtonText}>复制</Text>
              </TouchableOpacity>
            </View>

            {/* 操作按钮 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshCode}
                activeOpacity={0.7}
              >
                <Icon name="refresh" size={20} color="#007AFF" />
                <Text style={styles.refreshButtonText}>刷新绑定码</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setQrModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#F2F2F7',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    marginLeft: 12,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  scanButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginHorizontal: 16,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  bindButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bindButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  codeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrCodeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  bindUrlText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  qrHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  copySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  copyLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginRight: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
