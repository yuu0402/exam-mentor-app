import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { chat, getAIStatus, AI_STATUS, AI_UNCONFIGURED_MESSAGE, loadAIKey } from '../api/ai-service';

// ---------------------------------------------------------------------------
// Default quick prompts (shown when no context is passed)
// ---------------------------------------------------------------------------
const DEFAULT_QUICK_PROMPTS = [
  { icon: 'lightbulb', label: '讲知识点', prompt: '用简单的话解释一下' },
  { icon: 'help', label: '帮我解题', prompt: '这道题我不太懂，可以引导我思考吗：' },
  { icon: 'school', label: '中考考点', prompt: '陕西中考常考哪些内容？' },
  { icon: 'psychology', label: '学习建议', prompt: '我最近学习效率不高，有什么建议？' },
];

// ---------------------------------------------------------------------------
// Context-aware quick prompts — different sets per context type
// ---------------------------------------------------------------------------
const CONTEXT_QUICK_PROMPTS = {
  mistake: [
    { icon: 'error-outline', label: '分析错因', prompt: '这道题我做错了，能帮我分析一下错误原因吗？' },
    { icon: 'content-copy', label: '举一反三', prompt: '能给我出几道类似的题目练习吗？' },
    { icon: 'menu-book', label: '相关知识', prompt: '这道题涉及哪些知识点？请详细讲解' },
    { icon: 'bookmark', label: '记忆技巧', prompt: '这类题目有什么记忆技巧或解题口诀？' },
  ],
  diagnosis: [
    { icon: 'assessment', label: '分析薄弱点', prompt: '根据我的诊断结果，详细分析一下我的薄弱环节' },
    { icon: 'event-note', label: '制定计划', prompt: '根据我的诊断情况，帮我制定一个详细的提升计划' },
    { icon: 'quiz', label: '推荐题目', prompt: '根据我的薄弱知识点，推荐一些针对性练习题' },
    { icon: 'trending-up', label: '提升建议', prompt: '针对我的各科得分情况，给出具体的学习方法建议' },
  ],
  course: [
    { icon: 'import-contacts', label: '讲解本章', prompt: '请详细讲解本章的核心知识点' },
    { icon: 'star', label: '重点考点', prompt: '本章在中考中的重点考点有哪些？' },
    { icon: 'edit-note', label: '课后练习', prompt: '针对本章内容，出几道练习题并讲解' },
    { icon: 'contact-support', label: '提问答疑', prompt: '本章我有几个不太理解的地方，可以帮我解答吗？' },
  ],
};

// ---------------------------------------------------------------------------
// Helpers: build an initial greeting and a one-tap smart prompt from context
// ---------------------------------------------------------------------------

/**
 * Return a context-aware greeting that replaces the generic welcome message.
 */
function getContextGreeting(context) {
  if (!context) return '你好！我是你的AI学习助手 💪\n有什么学习问题尽管问我～';

  switch (context.type) {
    case 'mistake': {
      const subject = context.subject ? `（${context.subject}）` : '';
      return `你好！我看到你带来了一道错题${subject} 👀\n让我帮你分析一下，看看错在哪里～`;
    }
    case 'diagnosis': {
      const name = context.studentName ? `${context.studentName}，` : '';
      return `你好！${name}我看到了你的诊断报告 📊\n让我帮你深入分析薄弱环节，制定提升策略～`;
    }
    case 'course': {
      const subj = context.subject || '学科';
      const ch = context.chapter ? `《${context.chapter}》` : '';
      return `你好！你正在学习${subj}${ch} 📚\n我可以帮你梳理重点、讲解考点，随时问我～`;
    }
    default:
      return '你好！我是你的AI学习助手 💪\n有什么学习问题尽管问我～';
  }
}

/**
 * Build a high-quality "smart prompt" that a user can one-tap send.
 * This is also used for the auto-send flow (see useEffect below).
 */
function generateContextPrompt(context) {
  if (!context) return null;

  switch (context.type) {
    case 'mistake': {
      const question = context.question ? `📝 题目：${context.question}` : '';
      const answer = context.answer ? `❌ 我的答案：${context.answer}` : '';
      const correct = context.correct ? `✅ 正确答案：${context.correct}` : '';
      return [
        '这是一道我做错的题目，请帮我详细分析：',
        question,
        answer,
        correct,
        '',
        '请从以下几个方面帮助我：',
        '1. 分析我为什么会选错',
        '2. 正确的解题思路是什么',
        '3. 这道题涉及哪些知识点',
      ].filter(Boolean).join('\n');
    }
    case 'diagnosis': {
      const weakPoints = context.weakPoints?.length
        ? context.weakPoints.map((w, i) => `${i + 1}. ${w.subject ? `【${w.subject}】` : ''}${w.knowledgePoint || w}`).join('\n')
        : '（待分析）';
      const scores = context.scores?.length
        ? context.scores.map(s => `- ${s.subject || s.name}：${s.score ?? '?'}/${s.maxScore ?? '?'}`).join('\n')
        : '（待分析）';
      return [
        '我刚完成诊断测试，这是我的情况：',
        '',
        `📊 各科得分：\n${scores}`,
        '',
        `⚠️ 薄弱知识点：\n${weakPoints}`,
        '',
        '请帮我：',
        '1. 分析我的整体学习情况',
        '2. 针对薄弱点给出具体提升建议',
        '3. 推荐一个高效的学习计划',
      ].join('\n');
    }
    case 'course': {
      const subject = context.subject || '当前学科';
      const chapter = context.chapter || '本章';
      return [
        `我正在学习${subject}的${chapter}章节，请帮我：`,
        '',
        `1. 梳理${chapter}的核心知识点`,
        '2. 讲解中考常考的考点',
        '3. 出几道典型例题并讲解',
      ].join('\n');
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIChatScreen({ route }) {
  // ── Read context from route params ──────────────────────────
  const context = route?.params?.context || null;

  // ── Detect AI configuration status (async load on mount) ──
  const [isAIUnconfigured, setIsAIUnconfigured] = useState(true);

  useEffect(() => {
    loadAIKey()
      .then(() => {
        setIsAIUnconfigured(getAIStatus() === AI_STATUS.UNCONFIGURED);
      })
      .catch((e) => {
        console.warn('加载AI配置失败:', e?.message || e);
        setIsAIUnconfigured(true);
      });
  }, []);

  // ── Build initial assistant greeting ────────────────────────
  const initialGreeting = getContextGreeting(context);

  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', content: initialGreeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);
  const lastAutoSentKey = useRef(null);

  // ── Core send function ──────────────────────────────────────
  const send = useCallback(async (text) => {
    if (!text?.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await chat(history);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (e) {
      let errorMsg = '抱歉，AI暂时不可用 😢\n请检查网络后重试。';
      if (e?.code === 'AI_UNCONFIGURED') {
        errorMsg = AI_UNCONFIGURED_MESSAGE;
      } else if (e?.code === 'AI_RATE_LIMITED') {
        errorMsg = 'AI 请求过于频繁，请稍后再试 ⏳';
      } else if (e?.code === 'AI_NETWORK_ERROR') {
        errorMsg = '网络连接失败，请检查网络后重试 📶';
      } else if (e?.code === 'AI_SERVER_ERROR') {
        errorMsg = 'AI 服务异常，请稍后重试 🔧';
      }
      console.warn('AI chat error:', e?.message || e);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  // Keep the latest send in a ref so the auto-send effect can call it safely.
  const sendRef = useRef(send);
  sendRef.current = send;

  // ── Auto-send the smart prompt when a context is provided ───
  // Uses a content-based key so that navigating back with a new
  // context re-triggers the auto-send, while the same context is not resent.
  useEffect(() => {
    if (!context) return;

    const contextKey = JSON.stringify(context);
    if (lastAutoSentKey.current === contextKey) return;

    const prompt = generateContextPrompt(context);
    if (!prompt) return;

    lastAutoSentKey.current = contextKey;
    const timer = setTimeout(() => {
      sendRef.current(prompt);
    }, 600);
    return () => clearTimeout(timer);
  }, [context]);

  // ── If AI is not configured, show the configuration guide (blocks all AI interactions) ──
  if (isAIUnconfigured) {
    return (
      <View style={styles.configContainer}>
        <View style={styles.configCard}>
          <Icon name="psychology" size={72} color="#C7C7CC" />
          <Text style={styles.configTitle}>AI 学习助手</Text>
          <Text style={styles.configStatus}>未配置</Text>
          <View style={styles.configDivider} />
          <Text style={styles.configDesc}>
            AI 智能辅导功能需要由家长完成配置后使用。
          </Text>
          <View style={styles.configSteps}>
            <View style={styles.configStep}>
              <View style={styles.configStepNum}>
                <Text style={styles.configStepNumText}>1</Text>
              </View>
              <Text style={styles.configStepText}>
                家长打开「我的」→「设置」
              </Text>
            </View>
            <View style={styles.configStep}>
              <View style={styles.configStepNum}>
                <Text style={styles.configStepNumText}>2</Text>
              </View>
              <Text style={styles.configStepText}>
                找到「AI 配置」入口
              </Text>
            </View>
            <View style={styles.configStep}>
              <View style={styles.configStepNum}>
                <Text style={styles.configStepNumText}>3</Text>
              </View>
              <Text style={styles.configStepText}>
                输入 AI 服务密钥并保存
              </Text>
            </View>
          </View>
          <View style={styles.configNote}>
            <Icon name="info-outline" size={16} color="#8E8E93" />
            <Text style={styles.configNoteText}>
              配置后即可使用 AI 答疑、错题讲解、作文批改等功能
            </Text>
          </View>
        </View>
      </View>
    );
  }

    return () => clearTimeout(timer);
  }, [context]);

  // ── Pick the right quick-prompts set ────────────────────────
  const quickPrompts = context?.type && CONTEXT_QUICK_PROMPTS[context.type]
    ? CONTEXT_QUICK_PROMPTS[context.type]
    : DEFAULT_QUICK_PROMPTS;

  // ── Render a single message bubble ──────────────────────────
  const renderMsg = ({ item }) => (
    <View style={[styles.msgRow, item.role === 'user' && styles.msgRowRight]}>
      {item.role === 'assistant' && (
        <View style={styles.avatar}>
          <Icon name="psychology" size={22} color="#4CAF50" />
        </View>
      )}
      <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  // ── UI ──────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderMsg}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        ListHeaderComponent={
          messages.length <= 1 && (
            <View style={styles.quickArea}>
              <Text style={styles.quickTitle}>
                {context ? '智能推荐提问' : '快速提问'}
              </Text>
              <View style={styles.quickGrid}>
                {quickPrompts.map((p, i) => (
                  <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => send(p.prompt)}>
                    <Icon name={p.icon} size={22} color="#4CAF50" />
                    <Text style={styles.quickLabel}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        }
      />
      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.typingText}>AI正在思考...</Text>
        </View>
      )}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="问AI任何学习问题..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={500}
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendDisabled]} onPress={() => send(input)} disabled={!input.trim()}>
          <Icon name="send" size={22} color={input.trim() ? '#fff' : '#ccc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  list: { padding: 16, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  bubble: {
    maxWidth: '75%', padding: 14, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleAI: { backgroundColor: '#fff', borderBottomLeftRadius: 6 },
  bubbleUser: { backgroundColor: '#4CAF50', borderBottomRightRadius: 6 },
  bubbleText: { fontSize: 15, color: '#333', lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  quickArea: { marginBottom: 20 },
  quickTitle: { fontSize: 13, color: '#888', marginBottom: 10, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1,
  },
  quickLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
  typing: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  typingText: { fontSize: 12, color: '#888' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#fff',
    borderTopWidth: 0.5, borderTopColor: '#E0E0E0', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  sendDisabled: { backgroundColor: '#E0E0E0' },

  // ── AI 未配置引导页 ──
  configContainer: {
    flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center',
    padding: 30,
  },
  configCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center',
    width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  configTitle: {
    fontSize: 24, fontWeight: '800', color: '#000', marginTop: 16,
  },
  configStatus: {
    fontSize: 13, color: '#FF9500', fontWeight: '600', marginTop: 4,
    backgroundColor: '#FFF5E6', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10,
    overflow: 'hidden',
  },
  configDivider: {
    width: 40, height: 3, backgroundColor: '#E5E5EA', borderRadius: 2, marginVertical: 16,
  },
  configDesc: {
    fontSize: 15, color: '#3C3C43', textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  configSteps: {
    width: '100%', marginBottom: 16,
  },
  configStep: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12,
  },
  configStepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
  },
  configStepNumText: {
    fontSize: 14, fontWeight: '700', color: '#fff',
  },
  configStepText: {
    flex: 1, fontSize: 14, color: '#3C3C43', lineHeight: 20,
  },
  configNote: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F2F2F7',
    borderRadius: 10, padding: 12, gap: 8,
  },
  configNoteText: {
    flex: 1, fontSize: 12, color: '#8E8E93', lineHeight: 18,
  },
});
