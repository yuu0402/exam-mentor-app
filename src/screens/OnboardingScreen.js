import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Animated, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { EXAM_SUBJECTS } from '../config';
import { login, register, updateProfile } from '../api/backend';

const { width } = Dimensions.get('window');

// ---- 年级选项 ----
const GRADES = [
  { id: 'grade8', label: '八年级', icon: 'looks-3', desc: '初二在读' },
  { id: 'grade9', label: '九年级', icon: 'looks-4', desc: '初三备考' },
];

// ---- 陕西城市 ----
const CITIES = [
  '榆林市', '西安市', '咸阳市', '宝鸡市', '渭南市',
  '延安市', '汉中市', '安康市', '商洛市', '铜川市',
];

// ---- 科目自评 ----
const SUBJECTS_FOR_SELF_EVAL = (EXAM_SUBJECTS?.subjects || [
  { id: 'chinese', name: '语文', score: 120 },
  { id: 'math', name: '数学', score: 120 },
  { id: 'english', name: '英语', score: 120 },
  { id: 'physics', name: '物理', score: 80 },
  { id: 'politics', name: '道法', score: 80 },
  { id: 'history', name: '历史', score: 60 },
  { id: 'pe', name: '体育', score: 60 },
]).filter(s => s.id !== 'pe'); // 体育不参与自评

// ---- 总分参考 ----
const TOTAL_EXAM_SCORE = (EXAM_SUBJECTS?.subjects || [])
  .reduce((sum, s) => sum + (s.score || 0), 0);

// 预设目标分数
const TARGET_PRESETS = [
  { pct: 0.92, label: '顶尖', desc: '冲刺重点高中' },
  { pct: 0.85, label: '优秀', desc: '稳上普高重点班' },
  { pct: 0.75, label: '良好', desc: '确保上普高' },
  { pct: 0.65, label: '达标', desc: '争取过线' },
];

// ---- 步骤定义 ----
const STEPS = [
  { key: 'name', title: '你的名字', subtitle: '让我知道怎么称呼你' },
  { key: 'grade', title: '所在年级', subtitle: '帮你匹配对应学段内容' },
  { key: 'city', title: '所在城市', subtitle: '不同地区教材版本不同' },
  { key: 'scores', title: '各科水平', subtitle: '大概自评一下（可跳过）' },
  { key: 'target', title: '你的目标', subtitle: '设定中考目标分数' },
];

export default function OnboardingScreen() {
  const { saveStudent, completeOnboarding } = useApp();

  // ---- 表单数据 ----
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [city, setCity] = useState('');
  const [currentScores, setCurrentScores] = useState({});
  const [targetScore, setTargetScore] = useState(null);

  // ---- 动画 ----
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: nextStep / (STEPS.length - 1),
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) animateStep(step + 1);
  };
  const prevStep = () => {
    if (step > 0) animateStep(step - 1);
  };

  const canNext = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return grade !== '';
      case 2: return city !== '';
      case 3: return true; // always skippable
      case 4: return targetScore !== null;
      default: return false;
    }
  };

  // ---- 完成引导 ----
  // [P0] 调用后端注册 API，fallback 本地保存
  const finish = async () => {
    const studentInfo = {
      name: name.trim(),
      grade: grade === 'grade8' ? '八年级' : '九年级',
      city,
      province: '陕西省',
      targetScore,
      currentScores,
      createdAt: new Date().toISOString(),
    };

    try {
      // 调用后端注册 API
      const usernameKey = name.trim().toLowerCase().replace(/\s+/g, '_');
      const result = await register({
        username: usernameKey,
        password: `onboard_${usernameKey}`,
        displayName: name.trim(),
        role: 'student',
      });
      // 保存后端返回的用户信息
      if (result && result.user) {
        await saveStudent({ ...studentInfo, ...result.user, backendUser: result.user });
      } else {
        await saveStudent(studentInfo);
      }
      // 同步用户画像到后端（年级/城市/目标分）
      try {
        await updateProfile({
          displayName: name.trim(),
          grade: grade === 'grade8' ? '八年级' : '九年级',
          city,
          targetScore,
        });
      } catch (profileErr) {
        console.warn('同步用户画像失败:', profileErr.message);
      }
    } catch (apiErr) {
      console.warn('后端注册 API 调用失败，fallback 本地保存:', apiErr.message);
      await saveStudent(studentInfo);
    }

    await completeOnboarding();
  };

  // ---- 分数自评 ----
  const setSubjectScore = (subjId, scoreStr) => {
    const num = parseInt(scoreStr, 10);
    setCurrentScores(prev => ({
      ...prev,
      [subjId]: isNaN(num) ? undefined : num,
    }));
  };

  // ---- 进度条 ----
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // ===================== RENDER STEPS =====================
  const renderStep = () => {
    switch (step) {
      // ---------- Step 0: Name ----------
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconBox}>
              <Icon name="person" size={36} color="#007AFF" />
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="输入你的昵称或名字"
              placeholderTextColor="#9E9E9E"
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => name.trim() && nextStep()}
            />
            <Text style={styles.hint}>你可以用真名、小名或者昵称</Text>
          </View>
        );

      // ---------- Step 1: Grade ----------
      case 1:
        return (
          <View style={styles.stepContent}>
            {GRADES.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionCard, grade === g.id && styles.optionCardActive]}
                onPress={() => { setGrade(g.id); setTimeout(nextStep, 300); }}
              >
                <Icon name={g.icon} size={32} color={grade === g.id ? '#fff' : '#007AFF'} />
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, grade === g.id && styles.optionLabelActive]}>
                    {g.label}
                  </Text>
                  <Text style={[styles.optionDesc, grade === g.id && styles.optionDescActive]}>
                    {g.desc}
                  </Text>
                </View>
                {grade === g.id && <Icon name="check-circle" size={24} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        );

      // ---------- Step 2: City ----------
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.cityGrid}>
              {CITIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, city === c && styles.cityChipActive]}
                  onPress={() => { setCity(c); setTimeout(nextStep, 300); }}
                >
                  <Icon
                    name={city === c ? 'location-on' : 'location-city'}
                    size={18}
                    color={city === c ? '#fff' : '#007AFF'}
                  />
                  <Text style={[styles.cityLabel, city === c && styles.cityLabelActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // ---------- Step 3: Self-evaluation ----------
      case 3: {
        const subjects = SUBJECTS_FOR_SELF_EVAL;
        return (
          <ScrollView style={styles.scoreScroll} showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scoreScrollInner}>
            <Text style={styles.scoreIntro}>
              请根据最近考试成绩，大致估算每科得分（满分见括号）。{' '}
              {'\n'}不确定可以不填，后续可以修改。
            </Text>
            {subjects.map(s => (
              <View key={s.id} style={styles.scoreRow}>
                <Icon name={s.icon || 'school'} size={20} color={s.color || '#007AFF'} />
                <Text style={styles.scoreSubject}>{s.name}</Text>
                <TextInput
                  style={styles.scoreInput}
                  placeholder={`0-${s.score}`}
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  maxLength={3}
                  value={currentScores[s.id]?.toString() || ''}
                  onChangeText={v => setSubjectScore(s.id, v)}
                />
                <Text style={styles.scoreMax}>/ {s.score}</Text>
              </View>
            ))}
          </ScrollView>
        );
      }

      // ---------- Step 4: Target ----------
      case 4: {
        const highScore = Math.round(TOTAL_EXAM_SCORE * 0.92);
        const midHigh = Math.round(TOTAL_EXAM_SCORE * 0.85);
        const mid = Math.round(TOTAL_EXAM_SCORE * 0.75);
        const low = Math.round(TOTAL_EXAM_SCORE * 0.65);
        const presets = [
          { score: highScore, pct: '92%', label: '顶尖', desc: TARGET_PRESETS[0].desc, color: '#FF3B30' },
          { score: midHigh, pct: '85%', label: '优秀', desc: TARGET_PRESETS[1].desc, color: '#FF9500' },
          { score: mid, pct: '75%', label: '良好', desc: TARGET_PRESETS[2].desc, color: '#34C759' },
          { score: low, pct: '65%', label: '达标', desc: TARGET_PRESETS[3].desc, color: '#007AFF' },
        ];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.totalScoreHint}>
              中考总分约 {TOTAL_EXAM_SCORE} 分（含体育）
            </Text>
            <View style={styles.targetGrid}>
              {presets.map(p => (
                <TouchableOpacity
                  key={p.score}
                  style={[styles.targetCard, targetScore === p.score && { borderColor: p.color, backgroundColor: p.color + '15' }]}
                  onPress={() => setTargetScore(p.score)}
                >
                  <Text style={[styles.targetScore, { color: p.color }]}>{p.score}</Text>
                  <Text style={styles.targetPct}>{p.pct}</Text>
                  <Text style={styles.targetLabel}>{p.label}</Text>
                  <Text style={styles.targetDesc}>{p.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.customTarget}
              placeholder="或手动输入目标分数..."
              placeholderTextColor="#9E9E9E"
              keyboardType="numeric"
              maxLength={4}
              value={targetScore ? targetScore.toString() : ''}
              onChangeText={v => {
                const n = parseInt(v, 10);
                setTargetScore(isNaN(n) ? null : n);
              }}
            />
          </View>
        );
      }

      default:
        return null;
    }
  };

  const stepData = STEPS[step];

  // ===================== MAIN RENDER =====================
  return (
    <KeyboardAvoidingView style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 顶部跳过按钮（非最后一步） */}
      {step < STEPS.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>跳过全部</Text>
        </TouchableOpacity>
      )}

      {/* 进度条 */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>{step + 1} / {STEPS.length}</Text>
      </View>

      {/* 步骤内容 */}
      <View style={styles.body}>
        <Animated.View style={[styles.bodyInner, { opacity: fadeAnim }]}>
          <Text style={styles.stepTitle}>{stepData.title}</Text>
          <Text style={styles.stepSubtitle}>{stepData.subtitle}</Text>
          {renderStep()}
        </Animated.View>
      </View>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.btnSecondary} onPress={prevStep}>
            <Icon name="arrow-back" size={20} color="#007AFF" />
            <Text style={styles.btnSecondaryText}>上一步</Text>
          </TouchableOpacity>
        ) : <View style={styles.btnPlaceholder} />}

        {step < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.btnPrimary, !canNext() && styles.btnDisabled]}
            onPress={nextStep}
            disabled={!canNext()}
          >
            <Text style={styles.btnPrimaryText}>下一步</Text>
            <Icon name="arrow-forward" size={20} color={canNext() ? '#fff' : '#C8C8CD'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnPrimary, styles.btnFinish, !canNext() && styles.btnDisabled]}
            onPress={finish}
            disabled={!canNext()}
          >
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.btnPrimaryText}>开始使用</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F2F2F7' },

  // 跳过按钮
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  skipText: { fontSize: 14, color: '#636366', fontWeight: '500' },

  // 进度条
  progressWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 12,
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2,
    overflow: 'hidden', marginRight: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#636366', fontWeight: '600', width: 36, textAlign: 'right' },

  // 主体
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  bodyInner: { alignItems: 'center' },
  stepTitle: { fontSize: 28, fontWeight: '800', color: '#000', textAlign: 'center' },
  stepSubtitle: { fontSize: 15, color: '#636366', textAlign: 'center', marginTop: 8, marginBottom: 32 },

  stepContent: { width: '100%', alignItems: 'center' },

  // ---- Step 0: Name ----
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%', fontSize: 22, fontWeight: '600', color: '#000',
    borderBottomWidth: 2, borderBottomColor: '#007AFF',
    paddingVertical: 10, paddingHorizontal: 4, textAlign: 'center',
    marginBottom: 12,
  },
  hint: { fontSize: 13, color: '#C8C8CD', textAlign: 'center' },

  // ---- Step 1: Grade ----
  optionCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 6,
  },
  optionCardActive: { backgroundColor: '#007AFF' },
  optionTextWrap: { flex: 1, marginLeft: 16 },
  optionLabel: { fontSize: 18, fontWeight: '700', color: '#000' },
  optionLabelActive: { color: '#fff' },
  optionDesc: { fontSize: 13, color: '#636366', marginTop: 2 },
  optionDescActive: { color: 'rgba(255,255,255,0.7)' },

  // ---- Step 2: City ----
  cityGrid: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 10,
  },
  cityChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18,
    shadowColor: '#000', shadowOffset: { w: 0, h: 1 }, shadowOpacity: 0.03, shadowRadius: 3,
    gap: 6,
  },
  cityChipActive: { backgroundColor: '#007AFF' },
  cityLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
  cityLabelActive: { color: '#fff' },

  // ---- Step 3: Self-eval ----
  scoreScroll: { width: '100%', maxHeight: 340 },
  scoreScrollInner: { paddingBottom: 8 },
  scoreIntro: {
    fontSize: 13, color: '#636366', textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 8, gap: 10,
  },
  scoreSubject: { fontSize: 15, fontWeight: '600', color: '#000', flex: 1 },
  scoreInput: {
    width: 60, fontSize: 16, fontWeight: '700', color: '#007AFF',
    borderBottomWidth: 1.5, borderBottomColor: '#007AFF',
    textAlign: 'center', paddingVertical: 4,
  },
  scoreMax: { fontSize: 14, color: '#636366', width: 35, textAlign: 'right' },

  // ---- Step 4: Target ----
  totalScoreHint: { fontSize: 14, color: '#636366', marginBottom: 16 },
  targetGrid: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 10, marginBottom: 20,
  },
  targetCard: {
    width: (width - 68) / 2, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { w: 0, h: 2 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  targetScore: { fontSize: 30, fontWeight: '800' },
  targetPct: { fontSize: 12, color: '#636366', marginTop: 2 },
  targetLabel: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 8 },
  targetDesc: { fontSize: 11, color: '#636366', marginTop: 2, textAlign: 'center' },
  customTarget: {
    width: '100%', fontSize: 16, color: '#000', textAlign: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    paddingVertical: 10,
  },

  // ---- 底部 ----
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    alignItems: 'center',
  },
  btnPlaceholder: { width: 80 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  btnSecondaryText: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#007AFF', borderRadius: 24,
    paddingVertical: 14, paddingHorizontal: 28, gap: 6,
    shadowColor: '#007AFF', shadowOffset: { w: 0, h: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  btnFinish: { paddingHorizontal: 32 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnDisabled: { backgroundColor: '#D1D1D6', shadowOpacity: 0 },
});
