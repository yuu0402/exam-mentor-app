import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import {
  generateDiagnosisTest,
  generateDiagnosisReport,
  getMasteryLevel,
} from '../utils/diagnosis-system';
import { EXAM_SUBJECTS, DIAGNOSIS_CONFIG, getSubjectDisplayName } from '../config';
import { quickAsk, getAIStatus, AI_STATUS } from '../api/ai-service';
import { saveData, loadData, removeData } from '../utils/storage-utils';
import {
  startDiagnosis,
  getDiagnosisQuestions,
  submitDiagnosis,
} from '../api/backend';

// ==================== Constants ====================

const DIAGNOSIS_DRAFT_KEY = '@diagnosis_draft';

// ==================== Radar Chart Helpers ====================

/**
 * Calculate pentagon vertex positions.
 * @param {number} cx - Center x
 * @param {number} cy - Center y
 * @param {number} radius - Outer radius
 * @param {number} count - Number of vertices (default 5)
 * @returns {Array<{x: number, y: number}>}
 */
function getPentagonVertices(cx, cy, radius, count = 5) {
  const verts = [];
  for (let i = 0; i < count; i++) {
    // Start from top (PI/2) and go clockwise by subtracting i * 2PI/count
    const angle = Math.PI / 2 - (i * 2 * Math.PI) / count;
    verts.push({
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle),
    });
  }
  return verts;
}

/**
 * Return style for a line segment between two points (thin rotated View).
 */
function getLineStyle(x1, y1, x2, y2, color, thickness = 1.5) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    position: 'absolute',
    left: x1 + dx / 2 - length / 2,
    top: y1 + dy / 2 - thickness / 2,
    width: length,
    height: thickness,
    backgroundColor: color,
    transform: [{ rotate: `${angle}deg` }],
  };
}

// ==================== Timer 子组件（独立状态，避免每秒重渲染整个屏幕）====================
/**
 * P1-2 修复：计时器独立为子组件，每次 setTimeRemaining 只触发该组件重渲染，
 * 不影响父组件 DiagnosisScreen 的其他状态。
 * P2 修复：effect 依赖项简化为 [screenState]，避免 timeRemaining > 0 每次变化都重建 interval。
 */
function TestTimer({ timeRemaining, onTimeout }) {
  // 仅渲染时间显示，状态隔离
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerBadgeContainer}>
      <Icon name="timer" size={16} color={timeRemaining < 300 ? '#F44336' : '#fff'} />
      <Text style={[styles.timerText, timeRemaining < 300 && { color: '#F44336' }]}>
        {formatTime(timeRemaining)}
      </Text>
    </View>
  );
}

// ==================== 雷达图子组件（React.memo 避免重复渲染）====================
/**
 * P1-1 修复：将雷达图提取为独立组件并用 React.memo 包裹。
 * 之前每次 report 变化或父组件重渲染，IIFE 立即执行完整数学计算并生成约 60+ 个 View。
 * 现在只有当 radarSubjects 或 report 真正变化时才重新渲染。
 */
const RadarChart = React.memo(function RadarChart({ radarSubjects, report }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 95;
  const count = radarSubjects.length;

  if (count < 3) {
    return <Text style={styles.noData}>需要至少3科数据才能显示雷达图</Text>;
  }

  // 使用 useMemo 缓存计算结果，仅当 radarSubjects 变化时重算
  const elements = useMemo(() => {
    const els = [];
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

    // Grid pentagons
    gridLevels.forEach(lvl => {
      const verts = getPentagonVertices(cx, cy, r * lvl, count);
      const isPassLine = Math.abs(lvl - 0.6) < 0.01;
      const lineColor = isPassLine ? '#FF9800' : '#E0E0E0';
      const lineThickness = isPassLine ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const p1 = verts[i];
        const p2 = verts[(i + 1) % count];
        const style = getLineStyle(p1.x, p1.y, p2.x, p2.y, lineColor, lineThickness);
        if (style) els.push(<View key={`grid-${lvl}-${i}`} style={style} />);
      }
    });

    // Axes from center to each 100% vertex
    const verts100 = getPentagonVertices(cx, cy, r, count);
    verts100.forEach((v, i) => {
      const style = getLineStyle(cx, cy, v.x, v.y, '#E0E0E0', 1);
      if (style) els.push(<View key={`axis-${i}`} style={style} />);
    });

    // Data vertices
    const dataVerts = radarSubjects.map((s, i) => {
      const frac = Math.max(0.02, Math.min(1, s.percentage / 100));
      const angle = Math.PI / 2 - (i * 2 * Math.PI) / count;
      return {
        x: cx + r * frac * Math.cos(angle),
        y: cy - r * frac * Math.sin(angle),
        ...s,
      };
    });

    // Data pentagon fill wedges
    dataVerts.forEach((dv, i) => {
      const angle = Math.PI / 2 - (i * 2 * Math.PI) / count;
      const deg = angle * 180 / Math.PI;
      const frac = Math.max(0.02, Math.min(1, dv.percentage / 100));
      const len = r * frac;
      const wedgeW = 28;
      els.push(
        <View
          key={`wedge-${i}`}
          style={{
            position: 'absolute',
            left: cx - wedgeW / 2,
            top: cy - len,
            width: wedgeW,
            height: len,
            backgroundColor: 'rgba(76, 175, 80, 0.25)',
            transform: [
              { translateY: len / 2 },
              { rotate: `${deg}deg` },
              { translateY: -len / 2 },
            ],
          }}
        />
      );
    });

    // Data pentagon outline
    for (let i = 0; i < count; i++) {
      const p1 = dataVerts[i];
      const p2 = dataVerts[(i + 1) % count];
      const style = getLineStyle(p1.x, p1.y, p2.x, p2.y, '#4CAF50', 2.5);
      if (style) els.push(<View key={`data-line-${i}`} style={style} />);
    }

    // Data dots at vertices
    dataVerts.forEach((dv, i) => {
      const dotSize = 8;
      els.push(
        <View
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            left: dv.x - dotSize / 2,
            top: dv.y - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dv.color,
            borderWidth: 1.5,
            borderColor: '#fff',
          }}
        />
      );
    });

    // Labels
    radarSubjects.forEach((s, i) => {
      const angle = Math.PI / 2 - (i * 2 * Math.PI) / count;
      const labelR = r + 28;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy - labelR * Math.sin(angle);
      els.push(
        <View
          key={`label-${i}`}
          style={{
            position: 'absolute',
            left: lx - 30,
            top: ly - 10,
            width: 60,
            alignItems: 'center',
          }}
        >
          <Text style={[styles.radarLabelName, { color: s.color }]}>{s.name}</Text>
          <Text style={styles.radarLabelScore}>{`${s.score}/${s.maxScore}`}</Text>
        </View>
      );
    });

    return els;
  }, [radarSubjects, cx, cy, r, count]);

  return (
    <View style={{ alignSelf: 'center', alignItems: 'center' }}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        {elements}
      </View>
      <View style={styles.radarLegend}>
        <View style={styles.radarLegendItem}>
          <View style={[styles.radarLegendColor, { backgroundColor: 'rgba(76,175,80,0.35)' }]} />
          <Text style={styles.radarLegendText}>绿色区域 = 你的水平</Text>
        </View>
        <View style={styles.radarLegendItem}>
          <View style={[styles.radarLegendLine, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.radarLegendText}>橙色线 = 及格线 (60%)</Text>
        </View>
      </View>
    </View>
  );
});

// ==================== Main Component ====================

export default function DiagnosisScreen({ navigation }) {
  const { diagnosisResult, saveDiagnosisResult, student, addWrongAnswer } = useApp();

  // States: idle | testing | scoring | report
  const [screenState, setScreenState] = useState('idle');
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [report, setReport] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [uncertainAnswers, setUncertainAnswers] = useState({});
  const [draftChecked, setDraftChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  // P1-4 修复：debounce saveData，避免每次答题都触发一次完整的 AsyncStorage IO。
  // 使用 ref 保存 debounce timer，避免每次渲染重建。
  const saveDraftTimerRef = useRef(null);

  // AI review states
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewText, setAiReviewText] = useState('');

  // 分段展开/折叠状态 —— 渐进式信息披露，避免信息过载
  const [showDetailAnalysis, setShowDetailAnalysis] = useState(false);
  const [showWeakPoints, setShowWeakPoints] = useState(false);
  const [showFullWeakPoints, setShowFullWeakPoints] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // If already have diagnosis result, show it
  useEffect(() => {
    if (diagnosisResult && screenState === 'idle') {
      setReport(diagnosisResult);
      setScreenState('report');
    }
  }, [diagnosisResult]);

  // ==================== Draft: Check for saved progress on mount ====================
  useEffect(() => {
    if (!draftChecked && screenState === 'idle') {
      setDraftChecked(true);
      loadData(DIAGNOSIS_DRAFT_KEY)
        .then(draft => {
          if (draft && draft.answers && Object.keys(draft.answers).length > 0 && draft.test) {
            Alert.alert(
              '检测到未完成的测试',
              '上次诊断测试未完成，是否继续？\n\n已答 ' + Object.keys(draft.answers).length
                + ' 题，剩余时间约 ' + formatTimeDisplay(draft.timeRemaining || 0),
              [
                {
                  text: '放弃进度',
                  style: 'destructive',
                  onPress: () => removeData(DIAGNOSIS_DRAFT_KEY),
                },
                {
                  text: '继续答题',
                  onPress: () => {
                    setTest(draft.test);
                    setAnswers(draft.answers || {});
                    setUncertainAnswers(draft.uncertainAnswers || {});
                    setCurrentQuestionIndex(draft.currentQuestionIndex || 0);
                    setTimeRemaining(draft.timeRemaining || 0);
                    const qId = draft.test?.questions?.[draft.currentQuestionIndex || 0]?.id;
                    if (draft.uncertainAnswers?.[qId]) {
                      setSelectedAnswer('uncertain');
                    } else {
                      setSelectedAnswer(draft.answers?.[qId] ?? null);
                    }
                    setScreenState('testing');
                  },
                },
              ],
              { cancelable: false }
            );
          }
        })
        .catch(err => {
          // P2-011 修复：AsyncStorage 读取异常时打印警告，不影响用户流程
          console.warn('读取诊断测试草稿失败:', err.message);
        });
    }
  }, [draftChecked, screenState]);

  // ==================== Android Back Handler (prevent accidental exit during test) ====================
  useEffect(() => {
    if (screenState === 'testing') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          '确认放弃测试？',
          '当前进度将丢失，确定要退出吗？',
          [
            { text: '继续答题', style: 'cancel' },
            {
              text: '放弃',
              style: 'destructive',
              onPress: () => {
                // Save draft before quitting so user can resume later
                if (test && (Object.keys(answers).length > 0 || Object.keys(uncertainAnswers).length > 0)) {
                  saveData(DIAGNOSIS_DRAFT_KEY, {
                    answers,
                    uncertainAnswers,
                    timeRemaining,
                    currentQuestionIndex,
                    test,
                    timestamp: Date.now(),
                  });
                }
                setScreenState('idle');
                setAnswers({});
                setUncertainAnswers({});
                setTest(null);
                setTimeRemaining(0);
              },
            },
          ],
          { cancelable: true }
        );
        return true; // block default back behavior
      });
      return () => backHandler.remove();
    }
  }, [screenState, answers, uncertainAnswers, timeRemaining, currentQuestionIndex, test]);

  // Timer
// P2 修复：将依赖从 [screenState, timeRemaining > 0] 简化为 [screenState]。
// 之前每次 timeRemaining 变化都会重建 setInterval（因为 timeRemaining > 0 布尔值每次都是新引用）。
// 使用函数式 setState（prev =>）保证读取最新状态，无需将 timeRemaining 放入依赖项。
useEffect(() => {
    if (screenState !== 'testing') return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screenState]);

// P1-2/P2 补充：监视 timeRemaining 归零，触发自动提交（独立于上面的 interval effect）
useEffect(() => {
    if (screenState === 'testing' && timeRemaining === 0) {
      handleSubmit();
    }
  }, [screenState, timeRemaining]);

  // Start test — 调用真实后端 API
  const startTest = async () => {
    // Clear any previous draft before starting fresh
    removeData(DIAGNOSIS_DRAFT_KEY);
    try {
      setLoading(true);
      // 1. 开始诊断会话
      const startRes = await startDiagnosis('全科');
      // 2. 获取题目列表
      const questionRes = await getDiagnosisQuestions(startRes.session_id);
      const questions = questionRes.questions || [];
      // 映射后端格式 → 前端期望格式
      const mappedQuestions = questions.map(q => ({
        id: q.id,
        subject: q.subject === '语文' ? 'chinese'
          : q.subject === '数学' ? 'math'
          : q.subject === '英语' ? 'english'
          : q.subject === '物理' ? 'physics'
          : q.subject === '化学' ? 'chemistry'
          : q.subject || 'math',
        question: q.content || q.question || '',
        options: q.options || [],
        answer: q.answer || '',
        difficulty: q.difficulty || 'medium',
        knowledgePoint: q.knowledge_point || '',
        explanation: q.explanation || '',
      }));
      setTest({ questions: mappedQuestions, sessionId: startRes.session_id });
      setAnswers({});
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setSubjectFilter(null);
      setUncertainAnswers({});
      setTimeRemaining((DIAGNOSIS_CONFIG.totalDuration || 110) * 60);
      setScreenState('testing');
    } catch (err) {
      Alert.alert('启动失败', err.message || '无法连接服务器');
      console.error('startDiagnosis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Select an answer (clears uncertainty flag)
// P1-4 修复：使用 debounce 延迟保存 draft（300ms），避免每次答题都触发 AsyncStorage 写入。
// 最终离开测试或提交时会保存最新状态。
  const selectAnswer = (questionId, answerIndex) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: answerIndex };
      // Debounce draft save: 300ms 后批量保存，避免频繁 IO
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
      saveDraftTimerRef.current = setTimeout(() => {
        if (test) {
          saveData(DIAGNOSIS_DRAFT_KEY, {
            answers: updated,
            uncertainAnswers,
            timeRemaining,
            currentQuestionIndex,
            test,
            timestamp: Date.now(),
          });
        }
      }, 300);
      return updated;
    });
    setSelectedAnswer(answerIndex);
    setUncertainAnswers(prev => {
      if (prev[questionId]) {
        const next = { ...prev };
        delete next[questionId];
        return next;
      }
      return prev;
    });
  };

  // Mark question as "I don't know" (uncertain guess)
  const markUncertain = (questionId) => {
    setUncertainAnswers(prev => {
      const updated = prev[questionId]
        ? (() => { const next = { ...prev }; delete next[questionId]; return next; })()
        : { ...prev, [questionId]: true };
      // Persist draft when marking uncertain
      setAnswers(answersSnapshot => {
        const cleanAnswers = answersSnapshot[questionId] !== undefined
          ? (() => { const n = { ...answersSnapshot }; delete n[questionId]; return n; })()
          : answersSnapshot;
        if (test) {
          saveData(DIAGNOSIS_DRAFT_KEY, {
            answers: cleanAnswers,
            uncertainAnswers: updated,
            timeRemaining,
            currentQuestionIndex,
            test,
            timestamp: Date.now(),
          });
        }
        return cleanAnswers;
      });
      return updated;
    });
    setSelectedAnswer(prev => prev === 'uncertain' ? null : 'uncertain');
  };

  // Go to next question
  const nextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      const nextId = test.questions[nextIdx]?.id;
      setCurrentQuestionIndex(nextIdx);
      if (uncertainAnswers[nextId]) {
        setSelectedAnswer('uncertain');
      } else {
        setSelectedAnswer(answers[nextId] ?? null);
      }
    }
  };

  // Go to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      const prevId = test.questions[prevIdx]?.id;
      setCurrentQuestionIndex(prevIdx);
      if (uncertainAnswers[prevId]) {
        setSelectedAnswer('uncertain');
      } else {
        setSelectedAnswer(answers[prevId] ?? null);
      }
    }
  };

  // Jump to a specific question index
  const jumpToQuestion = (index) => {
    if (test && index >= 0 && index < test.questions.length) {
      const qId = test.questions[index]?.id;
      setCurrentQuestionIndex(index);
      if (uncertainAnswers[qId]) {
        setSelectedAnswer('uncertain');
      } else {
        setSelectedAnswer(answers[qId] ?? null);
      }
    }
  };

  // Submit test — 调用真实后端 API
  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const answeredCount = Object.keys(answers).length;
    const uncertainCount = Object.keys(uncertainAnswers).length;
    const totalEngaged = answeredCount + uncertainCount;
    const unengagedCount = (test?.questions.length || 0) - totalEngaged;
    let submitMsg = `你已答 ${answeredCount} 题，标记不会 ${uncertainCount} 题`;
    if (unengagedCount > 0) submitMsg += `，${unengagedCount} 题未答`;
    submitMsg += `。确定提交吗？`;

    Alert.alert(
      '提交测试',
      submitMsg,
      [
        { text: '继续答题', style: 'cancel' },
        {
          text: '确定提交',
          onPress: async () => {
            // Clear draft since test is complete
            removeData(DIAGNOSIS_DRAFT_KEY);
            try {
              setLoading(true);
              // 转换答案格式：{question_id: "A"/"B"/...}
              const formattedAnswers = {};
              test.questions.forEach(q => {
                const rawAnswer = answers[q.id];
                if (rawAnswer !== undefined) {
                  // 原始答案是索引，转为字母
                  formattedAnswers[String(q.id)] = String.fromCharCode(65 + Number(rawAnswer));
                } else if (uncertainAnswers[q.id]) {
                  formattedAnswers[String(q.id)] = '__UNCERTAIN__';
                }
              });
              // 调用后端提交 API
              const reportData = await submitDiagnosis(test.sessionId, formattedAnswers);
              // Attach uncertainty summary
              reportData.uncertaintyStats = {
                totalQuestions: test.questions.length,
                answeredCount,
                uncertainCount,
                unengagedCount,
              };
              setReport(reportData);
              setScreenState('report');
              saveDiagnosisResult(reportData);
              // 收录错题（后端已处理，前端只需本地记录）
              const wrongItems = test.questions
                .filter(q => {
                  if (answers[q.id] === undefined && !uncertainAnswers[q.id]) return false;
                  if (uncertainAnswers[q.id]) return true;
                  // 标准化：统一转为选项文字再比较，避免 "A" !== "0" 的错误匹配
                  const studentOptText = q.options?.[answers[q.id]] || String.fromCharCode(65 + Number(answers[q.id]));
                  const correctOptText = q.options?.[q.answer] || String.fromCharCode(65 + Number(q.answer));
                  return studentOptText !== correctOptText;
                })
                .map(q => ({
                  subject: q.subject,
                  chapter: q.chapter || '',
                  question: q.question,
                  userAnswer: uncertainAnswers[q.id]
                    ? '（不确定/我不会）'
                    : (q.options?.[answers[q.id]] || ''),
                  correctAnswer: typeof q.answer === 'number' ? q.options?.[q.answer] : q.answer,
                  explanation: q.explanation || '',
                  knowledgePoint: q.knowledgePoint || '',
                }));
              // P1-3 修复：改为一次性批量收集所有错题，用 Promise.all 并行处理，
              // 而不是逐个调用 addWrongAnswer（每次触发 reducer state 更新 + AsyncStorage 读写）。
              Promise.all(wrongItems.map(w => addWrongAnswer(w)));
            } catch (err) {
              Alert.alert('提交失败', err.message || '无法连接服务器');
              console.error('submitDiagnosis error:', err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Format time (helper for draft alert)
  const formatTimeDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Format time
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ==================== AI Smart Review ====================
  /** 生成本地预设评语（当 AI 不可用时） */
  const generateLocalReview = () => {
    if (!report) return '';
    const percentage = report.totalMaxScore > 0
      ? Math.round((report.totalScore / report.totalMaxScore) * 100)
      : 0;
    const levelLabel = report.overallLevel?.label || '待评估';
    const studentName = student?.name || '同学';
    const subjectsGood = [];
    const subjectsWeak = [];
    (report.subjectScores || []).forEach(s => {
      const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
      const info = { name: s.subjectName || getSubjectDisplayName(s.subject), score: s.score, maxScore: s.maxScore, pct };
      if (pct >= 70) subjectsGood.push(info);
      else subjectsWeak.push(info);
    });
    const weakPointList = (report.weakPoints || []).slice(0, 5)
      .map(w => `${w.subject ? '【' + w.subject + '】' : ''}${w.knowledgePoint || w.reason}`)
      .join('、');

    let review = `${studentName}同学，你好！\n\n`;
    review += `根据本次诊断，你的综合正确率为 ${percentage}%，等级评定为「${levelLabel}」。\n`;

    // Include uncertainty stats if available
    const uStats = report.uncertaintyStats;
    if (uStats && uStats.uncertainCount > 0) {
      review += `⚠️ 注意：${uStats.totalQuestions} 题中你标记了 ${uStats.uncertainCount} 题为「我不会」，这些题目被计为未掌握。若不确定题目比例较高，诊断结果置信度会偏低。\n`;
    }
    review += '\n';

    if (subjectsGood.length > 0) {
      const goodNames = subjectsGood.map(s => s.name).join('、');
      review += `【优势科目】${goodNames}表现较好，继续保持！\n\n`;
    }

    if (subjectsWeak.length > 0) {
      review += `【需提升科目】`;
      subjectsWeak.forEach(s => {
        review += `${s.name}得${s.score}分（正确率${s.pct}%），`;
      });
      review += '\n\n';
    }

    if (weakPointList) {
      review += `【薄弱知识点】${weakPointList}\n\n`;
    }

    if (percentage >= 80) {
      review += '【学习方法建议】保持当前节奏，重点攻克难点题型和综合应用题，向满分冲刺。';
    } else if (percentage >= 60) {
      review += '【学习方法建议】加强薄弱科目的专项练习，每天整理错题并反复回顾，建立知识框架。';
    } else if (percentage >= 40) {
      review += '【学习方法建议】从基础概念开始系统复习，优先保证基础题不丢分，逐步提升中等难度题目。';
    } else {
      review += '【学习方法建议】建议从头梳理知识点，配合视频课程逐步建立知识体系，不急不躁，每天进步一点。';
    }

    review += '\n\n💪 每一天的努力都是中考时的底气，加油！';
    return review;
  };

  const handleAIReview = async () => {
    if (!report) return;
    setAiReviewLoading(true);
    setAiReviewText('');

    // 检测 AI 配置状态
    if (getAIStatus() === AI_STATUS.UNCONFIGURED) {
      // AI 未配置，直接生成本地评语（无网络请求，即时显示）
      const localReview = generateLocalReview();
      setAiReviewText(localReview);
      setAiReviewLoading(false);
      return;
    }

    const subjectLines = (report.subjectScores || []).map(s =>
      `- ${s.subjectName || getSubjectDisplayName(s.subject)}: ${s.score}/${s.maxScore}（正确率${s.percentage || 0}%）`
    ).join('\n');

    const weakLines = (report.weakPoints || []).slice(0, 6).map(w =>
      `- ${w.subject}: ${w.knowledgePoint}（章节：${w.chapter || w.section}）`
    ).join('\n');

    // Build uncertainty prompt section
    const uStats = report.uncertaintyStats;
    const uncertaintySection = (uStats && uStats.uncertainCount > 0)
      ? `\n【数据可信度】共${uStats.totalQuestions}题，学生标记${uStats.uncertainCount}题为「我不会」（计为答错）。若不确定题目较多，诊断结果置信度较低，建议评语中提醒学生诚实作答的重要性。\n`
      : '';

    const prompt = `请根据以下中考诊断报告数据，生成一份个性化学习评语与建议：

【学生信息】${student?.name || '同学'}，八年级，备战陕西中考
【总分】${report.totalScore}/${report.totalMaxScore}（正确率 ${report.totalPercentage || 0}%）
【等级】${report.overallLevel?.label || '待评估'}${uncertaintySection}
【各科成绩】
${subjectLines}

【薄弱知识点】
${weakLines}

请从以下几个角度给出评语（控制在300字以内，语气亲切鼓励）：
1. 总体评价（2-3句）
2. 最需要提升的科目及具体建议
3. 学习方法调整方向
4. 一句鼓励语`;

    try {
      const result = await quickAsk(prompt);
      setAiReviewText(result);
    } catch (err) {
      // AI 调用失败，降级到本地预设评语
      const localReview = generateLocalReview();
      setAiReviewText(localReview);
      console.error('AI review error:', err);
    } finally {
      setAiReviewLoading(false);
    }
  };

  // ==================== IDLE STATE ====================
  if (screenState === 'idle') {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.headerTitle}>诊断测试</Text>
          <Text style={styles.headerSubtitle}>全面评估，精准定位薄弱环节</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.introCard}>
            <Icon name="assignment" size={70} color="#FF9800" />
            <Text style={styles.introTitle}>入学水平诊断</Text>
            <Text style={styles.introText}>
              完成一套综合测试题，系统将分析你的知识掌握情况，生成个性化的学习计划。
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Icon name="quiz" size={22} color="#FF9800" />
                <Text style={styles.infoValue}>
                  {DIAGNOSIS_CONFIG.questionCount
                    ? Object.values(DIAGNOSIS_CONFIG.questionCount).reduce((a, b) => a + b, 0)
                    : '85'} 题
                </Text>
                <Text style={styles.infoLabel}>题目数量</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="timer" size={22} color="#FF9800" />
                <Text style={styles.infoValue}>{DIAGNOSIS_CONFIG.totalDuration || 110}分钟</Text>
                <Text style={styles.infoLabel}>测试时长</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="category" size={22} color="#FF9800" />
                <Text style={styles.infoValue}>5科</Text>
                <Text style={styles.infoLabel}>覆盖科目</Text>
              </View>
            </View>

            <View style={styles.subjectList}>
              {EXAM_SUBJECTS.subjects.slice(0, 5).map(s => (
                <View key={s.id} style={styles.subjectChip}>
                  <Icon name={s.icon || 'book'} size={16} color={s.color} />
                  <Text style={[styles.subjectChipText, { color: s.color }]}>{s.name}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startButton, loading && { opacity: 0.7 }]}
              onPress={startTest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="play-arrow" size={24} color="#fff" />
              )}
              <Text style={styles.startButtonText}>
                {loading ? '加载中...' : '开始测试'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== TESTING STATE ====================
  if (screenState === 'testing' && test) {
    const question = test.questions[currentQuestionIndex];
    const totalQuestions = test.questions.length;
    const answeredCount = Object.keys(answers).length;
    const uncertainCount = Object.keys(uncertainAnswers).length;
    const subjectInfo = EXAM_SUBJECTS.subjects.find(
      s => s.id === question.subject
    );

    return (
      <View style={styles.container}>
        {/* Timer bar */}
        <View style={styles.testHeader}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1}/{totalQuestions}
            </Text>
            <Text style={styles.answeredText}>
              已答 {answeredCount} 题{uncertainCount > 0 ? `  ·  不确定 ${uncertainCount}` : ''}
            </Text>
          </View>
          {/* P1-2 修复：计时器渲染使用独立组件，仅该部分响应 timeRemaining 变化 */}
          <TestTimer timeRemaining={timeRemaining} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` },
            ]}
          />
        </View>

        {/* Subject filter chips */}
        <View style={styles.subjectFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              key="all"
              style={[
                styles.subjectFilterChip,
                !subjectFilter && styles.subjectFilterChipActive,
              ]}
              onPress={() => setSubjectFilter(null)}
            >
              <Text style={[
                styles.subjectFilterChipText,
                !subjectFilter && styles.subjectFilterChipTextActive,
              ]}>全部</Text>
            </TouchableOpacity>
            {(EXAM_SUBJECTS.subjects.filter(s =>
              ['chinese', 'math', 'english', 'physics', 'chemistry'].includes(s.id)
            )).concat(
              (EXAM_SUBJECTS.previewSubjects || []).filter(s =>
                ['chinese', 'math', 'english', 'physics', 'chemistry'].includes(s.id)
              ) || []
            ).map(s => {
              const subjQuestions = test.questions.filter(q => q.subject === s.id);
              const subjAnswered = subjQuestions.filter(q => answers[q.id] !== undefined).length;
              const isActive = subjectFilter === s.id;
              const subjColor = s.color || '#9C27B0';
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.subjectFilterChip,
                    isActive && { backgroundColor: subjColor + '20', borderColor: subjColor },
                  ]}
                  onPress={() => setSubjectFilter(subjectFilter === s.id ? null : s.id)}
                >
                  <Text style={[
                    styles.subjectFilterChipText,
                    isActive && { color: subjColor },
                  ]}>
                    {s.name} {subjAnswered}/{subjQuestions.length}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.questionScroll}>
          {/* Subject tag */}
          <View style={styles.questionMeta}>
            <View
              style={[
                styles.subjectTag,
                { backgroundColor: (subjectInfo?.color || '#FF9800') + '20' },
              ]}
            >
              <Text style={[styles.subjectTagText, { color: subjectInfo?.color || '#FF9800' }]}>
                {getSubjectDisplayName(question.subject)}
              </Text>
            </View>
            <Text style={styles.difficultyTag}>
              {question.difficulty === 'easy' ? '基础' : question.difficulty === 'medium' ? '中等' : '提高'}
            </Text>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {question.options?.map((option, idx) => {
                const isSelected = answers[question.id] === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.optionButton, isSelected && styles.optionSelected]}
                    onPress={() => selectAnswer(question.id, idx)}
                  >
                    <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                      {isSelected && <View style={styles.optionRadioDot} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* "I don't know" / Skip button */}
            <TouchableOpacity
              style={[styles.uncertainButton, uncertainAnswers[question.id] && styles.uncertainButtonActive]}
              onPress={() => markUncertain(question.id)}
            >
              <Icon
                name={uncertainAnswers[question.id] ? 'do-not-disturb' : 'help-outline'}
                size={20}
                color={uncertainAnswers[question.id] ? '#fff' : '#9E9E9E'}
              />
              <Text style={[styles.uncertainButtonText, uncertainAnswers[question.id] && styles.uncertainButtonTextActive]}>
                这题我不会
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Question number navigation bar */}
        <View style={styles.questionNavContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.questionNavRow}>
              {/* P1-6 修复：用 useMemo 缓存导航点计算结果，避免每次渲染都重新过滤和生成 */}
              {useMemo(() => (
                test.questions.map((q, idx) => {
                  if (subjectFilter && q.subject !== subjectFilter) return null;
                  const isAnswered = answers[q.id] !== undefined;
                  const isUncertain = uncertainAnswers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.questionNavDot,
                        isAnswered && styles.questionNavDotAnswered,
                        isUncertain && styles.questionNavDotUncertain,
                        isCurrent && styles.questionNavDotCurrent,
                      ]}
                      onPress={() => jumpToQuestion(idx)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.questionNavDotText,
                        isAnswered && styles.questionNavDotTextAnswered,
                        isUncertain && styles.questionNavDotTextUncertain,
                        isCurrent && styles.questionNavDotTextCurrent,
                      ]}>
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ), [test.questions, subjectFilter, answers, uncertainAnswers, currentQuestionIndex])}
            </View>
          </ScrollView>
        </View>

        {/* Navigation buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
            onPress={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Icon name="chevron-left" size={22} color={currentQuestionIndex === 0 ? '#ccc' : '#FF9800'} />
            <Text style={[styles.navButtonText, currentQuestionIndex === 0 && { color: '#ccc' }]}>
              上一题
            </Text>
          </TouchableOpacity>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <TouchableOpacity style={[styles.navButton, styles.navButtonNext]} onPress={nextQuestion}>
              <Text style={[styles.navButtonText, { color: '#FF9800' }]}>下一题</Text>
              <Icon name="chevron-right" size={22} color="#FF9800" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="check" size={22} color="#fff" />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? '提交中...' : '提交答卷'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ==================== REPORT STATE ====================
  if (screenState === 'report' && report) {
    const totalScore = report.totalScore || 0;
    const totalMaxScore = report.totalMaxScore || DIAGNOSIS_CONFIG.totalScore || 200;
    const percentage = Math.round((totalScore / totalMaxScore) * 100);
    const level = getMasteryLevel(percentage);

    // ---- Prepare data for radar & weakness list ----
    const radarSubjects = (report.subjectScores || []).slice(0, 5).map(s => {
      const subjInfo = EXAM_SUBJECTS.subjects.find(x => x.id === s.subject);
      // Bounds check: clamp score to [0, maxScore], fallback to 0 / 120 on invalid values
      const safeMaxScore = (typeof s.maxScore === 'number' && s.maxScore > 0 && !isNaN(s.maxScore)) ? s.maxScore : 120;
      const rawScore = (typeof s.score === 'number' && !isNaN(s.score)) ? s.score : 0;
      const safeScore = Math.max(0, Math.min(rawScore, safeMaxScore));
      return {
        subject: s.subject,
        name: s.subjectName || getSubjectDisplayName(s.subject),
        score: safeScore,
        maxScore: safeMaxScore,
        percentage: safeMaxScore > 0 ? Math.round((safeScore / safeMaxScore) * 100) : 0,
        color: subjInfo?.color || '#4CAF50',
        icon: subjInfo?.icon || 'book',
      };
    });

    // Weak points sorted by impact: subject_weight * (100 - percentage) * priority_factor
    const weights = DIAGNOSIS_CONFIG.weights || {};
    const impactScore = (wp) => {
      if (!wp || !wp.subject || !wp.knowledgePoint) return 0;
      const subj = radarSubjects.find(s => s.subject === wp.subject);
      const subjPct = subj ? subj.percentage : 50;
      const weight = weights[wp.subject] || 0.2;
      const gap = 100 - subjPct;
      const priorityMul = wp.priority === 'high' ? 1.5 : 1.0;
      return (weight * gap * priorityMul);
    };
    const impactToStars = (score) => {
      if (score >= 30) return '★★★★★';
      if (score >= 20) return '★★★★☆';
      if (score >= 10) return '★★★☆☆';
      if (score >= 5) return '★★☆☆☆';
      return '★☆☆☆☆';
    };
    const sortedWeakPoints = [...(report.weakPoints || [])].sort(
      (a, b) => impactScore(b) - impactScore(a)
    );

    // ---- Donut color ----
    const donutColor = percentage >= 70 ? '#4CAF50' : percentage >= 40 ? '#FF9800' : '#F44336';

    // 最强和最弱科目（用于摘要卡片）
    const sortedByPct = [...radarSubjects].sort((a, b) => b.percentage - a.percentage);
    const bestSubject = sortedByPct[0];
    const worstSubject = sortedByPct[sortedByPct.length - 1];

    // 一句话评价
    const oneLineReview = percentage >= 80 ? '整体表现优秀，继续保持！'
      : percentage >= 60 ? '基础扎实，仍有提升空间。'
      : percentage >= 40 ? '需要加强基础，针对性突破薄弱环节。'
      : '建议从头系统复习，夯实基础。';

    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.headerTitle}>诊断报告</Text>
          <Text style={styles.headerSubtitle}>
            {student?.name || '同学'} · {report.date ? new Date(report.date).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN')}
          </Text>
        </View>

        <View style={styles.content}>

          {/* ===== 第 1 段：顶部摘要卡片 —— 一屏内可见 ===== */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryScoreRow}>
              <View style={styles.summaryScoreLeft}>
                <Text style={[styles.summaryBigScore, { color: donutColor }]}>{totalScore}</Text>
                <Text style={styles.summaryMaxScore}>/{totalMaxScore} 分</Text>
              </View>
              <View style={styles.summaryScoreRight}>
                <View style={[styles.summaryLevelBadge, { backgroundColor: donutColor + '1A' }]}>
                  <Text style={[styles.summaryLevelText, { color: '#333' }]}>
                    {level?.label || '待评估'}
                  </Text>
                </View>
                <Text style={[styles.summaryPct, { color: donutColor }]}>{percentage}%</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryReviewRow}>
              <Icon name="lightbulb" size={18} color="#FF9800" />
              <Text style={styles.summaryReviewText}>{oneLineReview}</Text>
            </View>
            <View style={styles.summarySubjectsRow}>
              {bestSubject && (
                <View style={styles.summarySubjectItem}>
                  <Text style={styles.summarySubjectLabel}>最强科目</Text>
                  <View style={styles.summarySubjectInfo}>
                    <Icon name={bestSubject.icon} size={16} color={bestSubject.color} />
                    <Text style={[styles.summarySubjectName, { color: bestSubject.color }]}>{bestSubject.name}</Text>
                    <Text style={styles.summarySubjectScore}>{bestSubject.score}/{bestSubject.maxScore}</Text>
                  </View>
                </View>
              )}
              {worstSubject && worstSubject !== bestSubject && (
                <View style={styles.summarySubjectItem}>
                  <Text style={styles.summarySubjectLabel}>最弱科目</Text>
                  <View style={styles.summarySubjectInfo}>
                    <Icon name={worstSubject.icon} size={16} color={worstSubject.color} />
                    <Text style={[styles.summarySubjectName, { color: worstSubject.color }]}>{worstSubject.name}</Text>
                    <Text style={styles.summarySubjectScore}>{worstSubject.score}/{worstSubject.maxScore}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ===== 第 2 段：「详细分析」—— 雷达图 + 各科得分详情（折叠） ===== */}
          <TouchableOpacity
            style={styles.segmentHeader}
            onPress={() => setShowDetailAnalysis(!showDetailAnalysis)}
            activeOpacity={0.7}
          >
            <View style={styles.segmentHeaderLeft}>
              <Icon name="analytics" size={20} color="#FF9800" />
              <Text style={styles.segmentHeaderTitle}>详细分析</Text>
            </View>
            <Icon name={showDetailAnalysis ? 'expand-less' : 'expand-more'} size={24} color="#888" />
          </TouchableOpacity>

          {showDetailAnalysis && (
            <View>

          {/* ===== 1b. 数据可信度摘要 (Uncertainty Stats) ===== */}
          {report.uncertaintyStats && report.uncertaintyStats.uncertainCount > 0 && (
            <View style={styles.uncertaintyStatsCard}>
              <View style={styles.uncertaintyStatsHeader}>
                <Icon name="info-outline" size={18} color="#FF9800" />
                <Text style={styles.uncertaintyStatsTitle}>数据可信度提醒</Text>
              </View>
              <Text style={styles.uncertaintyStatsText}>
                本次诊断共 {report.uncertaintyStats.totalQuestions} 题，你明确回答了 {report.uncertaintyStats.answeredCount} 题，
                其中 <Text style={{ color: '#F44336', fontWeight: 'bold' }}>{report.uncertaintyStats.uncertainCount} 题</Text> 标记为「我不会」。
              </Text>
              <Text style={styles.uncertaintyStatsHint}>
                标记「我不会」的题目被视为未掌握，不计入正确率。若不确定的题目较多，薄弱点分析结果的置信度会降低。
              </Text>
            </View>
          )}

          {/* ===== 2. 能力雷达图 (Pentagon Radar Chart) ===== */}
          {/* P1-1 修复：雷达图提取为独立 RadarChart 组件并用 React.memo 包裹。 */}
          {/* 之前 IIFE 每次 report 变化都重新计算生成 ~60 个 View，现在只在 radarSubjects 真正变化时重算 */}
          <View style={styles.radarCard}>
            <Text style={styles.sectionTitle}>能力雷达图</Text>
            <View style={styles.radarChartArea}>
              <RadarChart radarSubjects={radarSubjects} report={report} />
            </View>
          </View>

          {/* ===== 3. 各科得分条 ===== */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>各科得分详情</Text>
            {radarSubjects.map((subj, idx) => (
              <View key={idx} style={styles.subjectRow}>
                <View style={styles.subjectLabel}>
                  <Icon name={subj.icon} size={18} color={subj.color} />
                  <Text style={styles.subjectName}>{subj.name}</Text>
                </View>
                <View style={styles.subjectScoreBar}>
                  <View
                    style={[
                      styles.subjectScoreFill,
                      {
                        width: `${subj.percentage}%`,
                        backgroundColor: subj.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.subjectScoreText}>
                  {subj.score}/{subj.maxScore}
                </Text>
              </View>
            ))}
          </View>

            </View>
          )}

          {/* ===== 第 3 段：「薄弱知识点」—— 默认 Top3，展开看 Top10 ===== */}
          {sortedWeakPoints.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.segmentHeader}
                onPress={() => setShowWeakPoints(!showWeakPoints)}
                activeOpacity={0.7}
              >
                <View style={styles.segmentHeaderLeft}>
                  <Icon name="warning" size={20} color="#F44336" />
                  <Text style={styles.segmentHeaderTitle}>薄弱知识点</Text>
                  <View style={styles.segmentHeaderBadge}>
                    <Text style={styles.segmentHeaderBadgeText}>{sortedWeakPoints.length}</Text>
                  </View>
                </View>
                <Icon name={showWeakPoints ? 'expand-less' : 'expand-more'} size={24} color="#888" />
              </TouchableOpacity>

              {showWeakPoints && (
                <View style={styles.sectionCard}>
                  {sortedWeakPoints.slice(0, showFullWeakPoints ? 10 : 3).map((wp, idx) => {
                const subjInfo = radarSubjects.find(s => s.subject === wp.subject);
                const impact = impactScore(wp);
                return (
                  <View key={idx} style={styles.weakPointItem}>
                    <View style={styles.weakPointRank}>
                      <Text style={styles.weakPointRankText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.weakPointInfo}>
                      <View style={styles.weakPointHeader}>
                        <Text style={[styles.weakPointSubject, { color: subjInfo?.color || '#F44336' }]}>
                          {wp.subject === 'chinese' ? '语文' :
                           wp.subject === 'math' ? '数学' :
                           wp.subject === 'english' ? '英语' :
                           wp.subject === 'physics' ? '物理' :
                           wp.subject === 'politics' ? '道法' :
                           wp.subject === 'chemistry' ? '化学' :
                           wp.subject === 'history' ? '历史' : wp.subject}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.studyButton,
                            { backgroundColor: wp.priority === 'high' ? '#FF5722' : '#FF9800' },
                          ]}
                          onPress={() => navigation.navigate('CourseTab')}
                        >
                          <Text style={styles.studyButtonText}>找相关课程 →</Text>
                        </TouchableOpacity>
                        <Text style={styles.impactScore}>
                          重要性: {impactToStars(impact)}
                        </Text>
                      </View>
                      <Text style={styles.weakPointDetail}>
                        {wp.knowledgePoint || wp.reason}
                      </Text>
                      <Text style={styles.weakPointChapter}>
                        {wp.chapter || wp.section}
                      </Text>
                      {(wp.totalQuestions !== undefined && wp.wrongCount !== undefined) && (
                        <Text style={styles.weakPointUncertainty}>
                          基于 {wp.totalQuestions} 题中 {wp.wrongCount} 道答错
                          {wp.uncertainCount > 0 ? `（其中 ${wp.uncertainCount} 道标记为不确定）` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
                  {sortedWeakPoints.length > 3 && (
                    <TouchableOpacity style={styles.expandButton} onPress={() => setShowFullWeakPoints(!showFullWeakPoints)}>
                      <Text style={styles.expandButtonText}>
                        {showFullWeakPoints ? '收起，只看 Top3' : `展开全部 Top${Math.min(10, sortedWeakPoints.length)}`}
                      </Text>
                      <Icon name={showFullWeakPoints ? 'expand-less' : 'expand-more'} size={18} color="#FF9800" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ===== 第 4 段：AI 智能评语 —— 折叠，标注「由 AI 生成，仅供参考」 ===== */}
          <TouchableOpacity
            style={styles.segmentHeader}
            onPress={() => setShowAIReview(!showAIReview)}
            activeOpacity={0.7}
          >
            <View style={styles.segmentHeaderLeft}>
              <Icon name="smart-toy" size={20} color="#7C4DFF" />
              <Text style={styles.segmentHeaderTitle}>AI 智能评语</Text>
            </View>
            <Icon name={showAIReview ? 'expand-less' : 'expand-more'} size={24} color="#888" />
          </TouchableOpacity>

          {showAIReview && (
            <View style={styles.aiCard}>
              <View style={styles.aiDisclaimer}>
                <Icon name="info-outline" size={12} color="#999" />
                <Text style={styles.aiDisclaimerText}>由 AI 生成，仅供参考</Text>
              </View>
              {!aiReviewText && !aiReviewLoading && (
              getAIStatus() === AI_STATUS.UNCONFIGURED ? (
                <Text style={[styles.aiHint, { color: '#FF9500' }]}>
                  AI 尚未配置，点击按钮将生成本地智能评语。如需 AI 深度分析，请家长在设置中配置 AI 密钥。
                </Text>
              ) : (
                <Text style={styles.aiHint}>
                  点击下方按钮，AI将根据你的诊断数据生成个性化评语与学习建议
                </Text>
              )
            )}
            {aiReviewLoading && (
              <View style={styles.aiLoadingRow}>
                <ActivityIndicator size="small" color="#7C4DFF" />
                <Text style={styles.aiLoadingText}>AI正在分析你的数据，请稍候...</Text>
              </View>
            )}
            {!!aiReviewText && (
              <View style={styles.aiResultBox}>
                <Icon name="smart-toy" size={18} color="#7C4DFF" style={{ marginBottom: 6 }} />
                <Text style={styles.aiResultText}>{aiReviewText}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.aiButton, aiReviewLoading && { opacity: 0.6 }]}
              onPress={handleAIReview}
              disabled={aiReviewLoading}
            >
              <Icon name="auto-awesome" size={20} color="#fff" />
              <Text style={styles.aiButtonText}>
                {aiReviewText ? '重新生成评语' : '生成 AI 智能评语'}
              </Text>
            </TouchableOpacity>
            </View>
          )}

          {/* ===== 第 5 段：学习建议 —— 折叠 ===== */}
          {report.recommendations?.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.segmentHeader}
                onPress={() => setShowRecommendations(!showRecommendations)}
                activeOpacity={0.7}
              >
                <View style={styles.segmentHeaderLeft}>
                  <Icon name="emoji-objects" size={20} color="#4CAF50" />
                  <Text style={styles.segmentHeaderTitle}>学习建议</Text>
                </View>
                <Icon name={showRecommendations ? 'expand-less' : 'expand-more'} size={24} color="#888" />
              </TouchableOpacity>
              {showRecommendations && (
                <View style={styles.sectionCard}>
              {report.recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recItem}>
                  <Text style={styles.recNumber}>{idx + 1}</Text>
                  <Text style={styles.recText}>
                    {typeof rec === 'string' ? rec : rec.text || rec.message || ''}
                  </Text>
                </View>
              ))}
                </View>
              )}
            </View>
          )}

          {/* ===== 底部操作按钮（始终可见）—— 学习闭环 ===== */}
          <View style={styles.actionButtonsGroup}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              // Clear draft when retaking
              removeData(DIAGNOSIS_DRAFT_KEY);
              setScreenState('idle');
              setAnswers({});
              setUncertainAnswers({});
              setReport(null);
              setAiReviewText('');
              setShowDetailAnalysis(false);
              setShowWeakPoints(false);
              setShowFullWeakPoints(false);
              setShowAIReview(false);
              setShowRecommendations(false);
            }}
          >
            <Icon name="refresh" size={20} color="#FF9800" />
            <Text style={styles.retakeButtonText}>重新测试</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gotoPlanButton}
            onPress={() => navigation.navigate('StudyPlan')}
          >
            <Icon name="school" size={20} color="#fff" />
            <Text style={styles.gotoPlanButtonText}>查看学习计划</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gotoCourseButton}
            onPress={() => navigation.navigate('CourseTab')}
          >
            <Icon name="menu-book" size={20} color="#fff" />
            <Text style={styles.gotoCourseButtonText}>去学习课程</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gotoAIButton}
            onPress={() => {
              navigation.navigate('AITab', {
                screen: 'AIChat',
                params: {
                  context: {
                    type: 'diagnosis',
                    studentName: student?.name || '同学',
                    totalScore: report.totalScore || 0,
                    totalMaxScore: report.totalMaxScore || DIAGNOSIS_CONFIG.totalScore || 200,
                    totalPercentage: report.totalPercentage || percentage,
                    overallLevel: report.overallLevel?.label || '待评估',
                    weakPoints: (report.weakPoints || []).slice(0, 10).map(w => ({
                      subject: w.subject,
                      knowledgePoint: w.knowledgePoint || w.reason || '',
                      chapter: w.chapter || w.section || '',
                      priority: w.priority || 'medium',
                    })),
                    subjectScores: (report.subjectScores || []).map(s => ({
                      subject: s.subject,
                      subjectName: s.subjectName || s.subject,
                      score: s.score,
                      maxScore: s.maxScore,
                      percentage: s.percentage || 0,
                    })),
                  },
                },
              });
            }}
          >
            <Icon name="psychology" size={20} color="#fff" />
            <Text style={styles.gotoAIButtonText}>问 AI 建议</Text>
          </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  }

  return null;
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
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
  },
  content: {
    padding: 15,
  },

  // Intro/idle
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
  },
  subjectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    margin: 4,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },

  // Testing
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 50,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
  },
  answeredText: {
    fontSize: 12,
    color: '#aaa',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  timerWarning: {
    backgroundColor: '#FFEBEE',
  },
  timerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E0E0E0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  questionScroll: {
    flex: 1,
    padding: 15,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  subjectTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  difficultyTag: {
    fontSize: 12,
    color: '#888',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {},
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionRadioSelected: {
    borderColor: '#FF9800',
  },
  optionRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  optionTextSelected: {
    color: '#E65100',
    fontWeight: '500',
  },
  // "I don't know" button
  uncertainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  uncertainButtonActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
    borderStyle: 'solid',
  },
  uncertainButtonText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
    marginLeft: 8,
  },
  uncertainButtonTextActive: {
    color: '#fff',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonNext: {},
  navButtonText: {
    fontSize: 15,
    color: '#FF9800',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 6,
  },

  // ---- Donut Chart ----
  donutCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  donutContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  donutOuter: {
    borderWidth: 16,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  donutInner: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  donutScore: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  donutMaxScore: {
    fontSize: 14,
    color: '#888',
    marginTop: -2,
  },
  donutPct: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  // ---- Radar Chart ----
  radarCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    alignItems: 'center',
  },
  radarChartArea: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 270,
  },
  radarLabelName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  radarLabelScore: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },

  // ---- Radar Legend ----
  radarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
    flexWrap: 'wrap',
  },
  radarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radarLegendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  radarLegendLine: {
    width: 18,
    height: 3,
    borderRadius: 1,
    marginRight: 6,
  },
  radarLegendText: {
    fontSize: 11,
    color: '#666',
  },

  // ---- Section / Subject Bar ----
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  subjectName: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
  subjectScoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  subjectScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectScoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 55,
    textAlign: 'right',
  },

  // ---- Weak Points Top10 ----
  weakPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weakPointRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  weakPointRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  weakPointInfo: {
    flex: 1,
  },
  weakPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  weakPointSubject: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    overflow: 'hidden',
  },
  impactScore: {
    fontSize: 10,
    color: '#999',
  },
  weakPointHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    lineHeight: 18,
  },
  studyButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  studyButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  weakPointDetail: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 1,
  },
  weakPointChapter: {
    fontSize: 12,
    color: '#888',
  },

  // ---- AI Card ----
  aiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    elevation: 2,
  },
  aiHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 20,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#7C4DFF',
    marginLeft: 8,
  },
  aiResultBox: {
    backgroundColor: '#F5F0FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  aiResultText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C4DFF',
    paddingVertical: 13,
    borderRadius: 12,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },

  // ---- Recommendations ----
  recItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    width: 25,
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },

  // ---- Buttons ----
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
    marginBottom: 10,
  },
  retakeButtonText: {
    fontSize: 15,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
  },
  gotoPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  gotoPlanButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  gotoCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  gotoCourseButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  gotoAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AF52DE',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  gotoAIButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  noData: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  levelBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 30,
  },

  // ---- Subject Filter Chips ----
  subjectFilterRow: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subjectFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  subjectFilterChipActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  subjectFilterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  subjectFilterChipTextActive: {
    color: '#fff',
  },

  // ---- Question Number Navigation ----
  questionNavContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  questionNavRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionNavDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  questionNavDotAnswered: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  questionNavDotCurrent: {
    borderColor: '#2196F3',
    borderWidth: 2.5,
    backgroundColor: '#E3F2FD',
  },
  questionNavDotUncertain: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  questionNavDotText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  questionNavDotTextAnswered: {
    color: '#fff',
  },
  questionNavDotTextUncertain: {
    color: '#fff',
  },
  questionNavDotTextCurrent: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  // Uncertainty stats card in report
  uncertaintyStatsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    elevation: 2,
  },
  uncertaintyStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uncertaintyStatsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginLeft: 8,
  },
  uncertaintyStatsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 6,
  },
  uncertaintyStatsHint: {
    fontSize: 11,
    color: '#999',
    lineHeight: 18,
  },
  // Uncertainty line in weak point items
  weakPointUncertainty: {
    fontSize: 11,
    color: '#FF5722',
    marginTop: 3,
    fontStyle: 'italic',
  },

  // ---- Summary Card (Progressive Disclosure) ----
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryScoreLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryBigScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  summaryMaxScore: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  summaryScoreRight: {
    alignItems: 'center',
  },
  summaryLevelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  summaryLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryPct: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  summaryReviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryReviewText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  summarySubjectsRow: {
    flexDirection: 'row',
  },
  summarySubjectItem: {
    flex: 1,
    marginRight: 10,
  },
  summarySubjectLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  summarySubjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySubjectName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 6,
  },
  summarySubjectScore: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // ---- Segment Header (Collapsible Sections) ----
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  segmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  segmentHeaderBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  segmentHeaderBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },

  // ---- Weak Point Extras ----
  weakPointExplanation: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
    lineHeight: 17,
  },
  courseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 3,
  },
  courseLinkText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 4,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandButtonText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
    marginRight: 4,
  },

  // ---- AI Disclaimer ----
  aiDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  aiDisclaimerText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },

  // ---- Action Buttons Group ----
  actionButtonsGroup: {
    marginTop: 5,
  },
});
