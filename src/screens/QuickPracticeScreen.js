import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getQuestionsBySubject } from '../utils/diagnosis-system';
import {
  getReviewQueue,
  getTodayReviewQueue,
  reviewWrongQuestion,
} from '../api/backend';
import { useApp } from '../context/AppContext';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#007AFF', '#FF9500', '#34C759', '#FF3B30'];

export default function QuickPracticeScreen({ navigation, route }) {
  const { subject, chapter, title, count = 3 } = route.params || {};
  const { addWrongAnswer } = useApp();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // 优先从后端拉取待复习错题
      let pool = [];
      try {
        const res = subject
          ? await getReviewQueue()
          : await getTodayReviewQueue();
        const items = res?.items || res || [];
        pool = items.map(item => ({
          id: item.id || item.question_id,
          question: item.question || item.content || item.title || '练习题',
          options: item.options || ['A', 'B', 'C', 'D'],
          answer: item.answer,
          explanation: item.explanation || '',
          difficulty: item.difficulty || 'medium',
          subject: item.subject || subject || 'math',
          chapter: item.chapter || '',
        }));
      } catch (e) {
        console.warn('后端错题队列获取失败，使用本地题库:', e.message);
      }
      // fallback: 本地题库
      if (pool.length === 0) {
        if (subject) {
          pool = getQuestionsBySubject(subject, chapter);
        }
        if (pool.length === 0) {
          const allSubjects = ['math', 'physics', 'english', 'chinese', 'politics', 'history'];
          for (const s of allSubjects) {
            const qs = getQuestionsBySubject(s);
            if (qs.length > 0) {
              pool = pool.concat(qs);
              if (pool.length >= 20) break;
            }
          }
        }
      }
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, Math.min(count, shuffled.length)));
    } catch (e) {
      setQuestions([]);
      setFetchError('网络异常，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setFinished(false);
    await loadQuestions();
    setRefreshing(false);
  }, []);

  const currentQ = questions[currentIndex] || null;

  const handleSelect = async (optIdx) => {
    if (selectedAnswer !== null) return; // already answered
    const label = OPTION_LABELS[optIdx];
    const isCorrect = label === currentQ?.answer;
    setSelectedAnswer(optIdx);
    setAnswers(prev => ({ ...prev, [currentIndex]: label }));
    // 答错题时记录到错题本
    if (!isCorrect && addWrongAnswer) {
      addWrongAnswer(currentQ);
    }
    // 上报复习结果到后端
    if (currentQ?.id) {
      try {
        await reviewWrongQuestion(currentQ.id, { is_correct: isCorrect, answer: label });
      } catch (e) {
        console.warn('复习结果上报失败:', e.message);
      }
    }
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setFinished(true);
      }
    }, 800);
  };

  const score = useMemo(() => {
    if (!finished) return null;
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correct++;
    });
    return { correct, total: questions.length, pct: Math.round((correct / questions.length) * 100) };
  }, [finished, answers, questions]);

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setFinished(false);
    setShowResult(false);
    loadQuestions();
  };

  // Loading
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在准备练习题...</Text>
      </View>
    );
  }

  if (!currentQ && !finished) {
    return (
      <View style={[styles.container, styles.center]}>
        <Icon name="quiz" size={50} color="#C7C7CC" />
        <Text style={styles.emptyText}>暂无对应练习题</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── 结果页 ──
  if (finished && score) {
    const isPerfect = score.correct === score.total;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultContent} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        {/* 结果头部 */}
        <View style={styles.resultHeader}>
          <View style={[styles.resultIconWrap, { backgroundColor: isPerfect ? '#34C759' + '1A' : '#FF9500' + '1A' }]}>
            <Icon name={isPerfect ? 'emoji-events' : 'school'} size={48} color={isPerfect ? '#34C759' : '#FF9500'} />
          </View>
          <Text style={styles.resultTitle}>
            {isPerfect ? '全对！太厉害了！' : score.pct >= 60 ? '不错，继续加油！' : '还需多加练习'}
          </Text>
          <Text style={styles.resultScore}>
            {score.correct}/{score.total} 正确 ({score.pct}%)
          </Text>
          {/* 进度条 */}
          <View style={styles.resultBarTrack}>
            <View style={[styles.resultBarFill, { width: `${score.pct}%`, backgroundColor: isPerfect ? '#34C759' : score.pct >= 60 ? '#FF9500' : '#FF3B30' }]} />
          </View>
        </View>

        {/* 逐题回顾 */}
        {questions.map((q, idx) => {
          const userAns = answers[idx];
          const isCorrect = userAns === q.answer;
          return (
            <View key={q.id || idx} style={styles.reviewCard}>
              <View style={styles.reviewQHead}>
                <View style={[styles.reviewIdx, { backgroundColor: isCorrect ? '#34C759' : '#FF3B30' }]}>
                  <Text style={styles.reviewIdxText}>{idx + 1}</Text>
                </View>
                <Text style={styles.reviewQText}>{q.question}</Text>
              </View>
              <View style={styles.reviewOptions}>
                {q.options.map((opt, oi) => {
                  const label = OPTION_LABELS[oi];
                  const isUserChoice = userAns === label;
                  const isRightAnswer = q.answer === label;
                  let bg = '#F2F2F7';
                  let borderColor = 'transparent';
                  if (isRightAnswer) { bg = '#E8F8EE'; borderColor = '#34C759'; }
                  if (isUserChoice && !isCorrect) { bg = '#FEE8E8'; borderColor = '#FF3B30'; }
                  return (
                    <View key={oi} style={[styles.reviewOpt, { backgroundColor: bg, borderColor }]}>
                      <Text style={[styles.reviewOptLabel, { color: OPTION_COLORS[oi] }]}>{label}</Text>
                      <Text style={styles.reviewOptText}>{opt}</Text>
                      {isRightAnswer && <Icon name="check-circle" size={16} color="#34C759" />}
                      {isUserChoice && !isCorrect && <Icon name="cancel" size={16} color="#FF3B30" />}
                    </View>
                  );
                })}
              </View>
              <Text style={styles.explanation}>{q.explanation}</Text>
            </View>
          );
        })}

        {/* 底部按钮 */}
        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.resultBtnPrimary} onPress={handleRetry}>
            <Icon name="refresh" size={18} color="#fff" />
            <Text style={styles.resultBtnPrimaryText}>再来一组</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultBtnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.resultBtnSecondaryText}>返回课程</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── 答题页 ──
  return (
    <View style={styles.container}>
      {/* 顶部进度 */}
      <View style={styles.quizHead}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.quizBackBtn}>
          <Icon name="close" size={22} color="#8E8E93" />
        </TouchableOpacity>
        <View style={styles.quizProgressBar}>
          <View style={[styles.quizProgressFill, { width: `${((currentIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100}%` }]} />
        </View>
        <Text style={styles.quizCounter}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      {/* 网络错误提示 */}
      {fetchError && (
        <TouchableOpacity style={styles.errorBanner} onPress={loadQuestions}>
          <Icon name="wifi-off" size={16} color="#fff" />
          <Text style={styles.errorBannerText}>{fetchError}</Text>
          <Text style={styles.errorBannerRetry}>点击重试</Text>
        </TouchableOpacity>
      )}

      {/* 题目 */}
      <ScrollView style={styles.quizBody} contentContainerStyle={styles.quizBodyInner} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
      }>
        {/* 题目标签 */}
        <View style={styles.qMeta}>
          {currentQ.chapter && <Text style={styles.qMetaText}>{currentQ.chapter}</Text>}
          {currentQ.knowledgePoint && <Text style={styles.qMetaKP}>{currentQ.knowledgePoint}</Text>}
          {currentQ.difficulty && (
            <View style={[styles.diffBadge, {
              backgroundColor: currentQ.difficulty === 'easy' ? '#34C759' + '1A' : currentQ.difficulty === 'hard' ? '#FF3B30' + '1A' : '#FF9500' + '1A'
            }]}>
              <Text style={[styles.diffText, {
                color: currentQ.difficulty === 'easy' ? '#34C759' : currentQ.difficulty === 'hard' ? '#FF3B30' : '#FF9500'
              }]}>
                {currentQ.difficulty === 'easy' ? '基础' : currentQ.difficulty === 'hard' ? '拔高' : '进阶'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.qText}>{currentQ.question}</Text>

        {/* 选项 */}
        <View style={styles.optionsList}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectAnswer = currentQ.answer === OPTION_LABELS[idx];
            let bg = '#F2F2F7';
            let borderColor = 'transparent';
            let textStyle = {};

            if (selectedAnswer !== null) {
              if (isCorrectAnswer) { bg = '#E8F8EE'; borderColor = '#34C759'; textStyle = { color: '#34C759', fontWeight: '700' }; }
              else if (isSelected) { bg = '#FEE8E8'; borderColor = '#FF3B30'; textStyle = { color: '#FF3B30', fontWeight: '700' }; }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optBtn, { backgroundColor: bg, borderColor }]}
                onPress={() => handleSelect(idx)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.7}
              >
                <View style={[styles.optLabel, { backgroundColor: OPTION_COLORS[idx] + '1A' }]}>
                  <Text style={[styles.optLabelText, { color: OPTION_COLORS[idx] }]}>{OPTION_LABELS[idx]}</Text>
                </View>
                <Text style={[styles.optText, textStyle]}>{opt}</Text>
                {selectedAnswer !== null && isCorrectAnswer && (
                  <Icon name="check-circle" size={20} color="#34C759" />
                )}
                {selectedAnswer !== null && isSelected && !isCorrectAnswer && (
                  <Icon name="cancel" size={20} color="#FF3B30" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#8E8E93', marginTop: 12 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12, marginBottom: 20 },
  backBtn: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // ── 答题头部 ──
  quizHead: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 48, paddingBottom: 10,
    backgroundColor: '#fff', gap: 10,
  },
  quizBackBtn: { padding: 4 },
  quizProgressBar: { flex: 1, height: 4, backgroundColor: '#E5E5EA', borderRadius: 2, overflow: 'hidden' },
  quizProgressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  quizCounter: { fontSize: 13, fontWeight: '600', color: '#8E8E93', minWidth: 36, textAlign: 'right' },

  // 网络错误提示
  errorBanner: { flexDirection:'row', alignItems:'center', backgroundColor:'#FF3B30', paddingVertical:10, paddingHorizontal:16, marginHorizontal:16, marginTop:8, borderRadius:10, gap:6 },
  errorBannerText: { color:'#fff', fontSize:13, fontWeight:'500', flex:1 },
  errorBannerRetry: { color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:'600' },

  // ── 题目区 ──
  quizBody: { flex: 1 },
  quizBodyInner: { padding: 20, paddingTop: 16 },
  qMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  qMetaText: { fontSize: 12, color: '#007AFF', backgroundColor: '#007AFF' + '10', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  qMetaKP: { fontSize: 12, color: '#8E8E93', backgroundColor: '#F0F0F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 11, fontWeight: '600' },
  qText: {
    fontSize: 17, fontWeight: '600', color: '#000', lineHeight: 26, marginBottom: 24,
  },
  optionsList: { gap: 10 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1.5, gap: 10,
  },
  optLabel: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  optLabelText: { fontSize: 15, fontWeight: '700' },
  optText: { flex: 1, fontSize: 15, color: '#000', lineHeight: 22 },

  // ── 结果页 ──
  resultContent: { padding: 20, paddingBottom: 40 },
  resultHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 20 },
  resultIconWrap: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  resultTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 6 },
  resultScore: { fontSize: 15, color: '#8E8E93', marginBottom: 12 },
  resultBarTrack: { width: '80%', height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' },
  resultBarFill: { height: '100%', borderRadius: 4 },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { w: 0, h: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
  },
  reviewQHead: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  reviewIdx: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  reviewIdxText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  reviewQText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#000', lineHeight: 20 },
  reviewOptions: { marginBottom: 8, gap: 4 },
  reviewOpt: {
    flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 10,
    borderRadius: 8, gap: 8, borderWidth: 1,
  },
  reviewOptLabel: { fontSize: 13, fontWeight: '700', minWidth: 20 },
  reviewOptText: { flex: 1, fontSize: 13, color: '#000' },
  explanation: { fontSize: 12, color: '#8E8E93', lineHeight: 18, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', marginTop: 4 },

  resultActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  resultBtnPrimary: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 14, gap: 6,
  },
  resultBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultBtnSecondary: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#E5E5EA',
  },
  resultBtnSecondaryText: { color: '#8E8E93', fontSize: 15, fontWeight: '600' },
});
