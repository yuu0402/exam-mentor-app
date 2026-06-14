import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApp } from '../context/AppContext';
import { parseFullCourseDirectory, organizeBySubject, getStatistics } from '../api/course-parser';
import { COURSE_SOURCES } from '../config/course-sources';
import { STORAGE_KEYS } from '../config';

// 优先显示的精选源（前6个）
const FEATURED_SOURCES = [
  { id: 'main', shareCode: 'e622c8366282', title: '📚 我的课程', subjects: [], type: 'main' },
  ...COURSE_SOURCES.slice(0, 8),
];

const SUBJECT_ICONS = {
  math: 'functions', physics: 'science', english: 'language', chinese: 'menu-book',
  chemistry: 'biotech', biology: 'eco', history: 'history-edu', geography: 'public',
  politics: 'gavel', other: 'folder',
};

const SUBJECT_COLORS = {
  math: '#FF3B30', physics: '#007AFF', english: '#FF9500', chinese: '#34C759',
  chemistry: '#AF52DE', biology: '#34C759', history: '#FF9500', geography: '#007AFF',
  politics: '#5856D6', other: '#8E8E93',
};

const SUBJECT_NAMES = {
  math: '数学', physics: '物理', english: '英语', chinese: '语文',
  chemistry: '化学', biology: '生物', history: '历史', geography: '地理',
  politics: '道法', other: '综合',
};

// ── helpers ────────────────────────────────────────────────────

/** 从 file_name 提取知识点标签（去掉扩展名和章节前缀的剩余部分） */
function extractKnowledgePoint(fileName, chapter) {
  let name = (fileName || '').replace(/\.[^.]+$/, '');
  if (chapter && name.startsWith(chapter)) {
    name = name.slice(chapter.length).replace(/^[-_\s]+/, '');
  }
  // 去掉常见的章节数字前缀
  name = name.replace(/^第?\d+[\.\、\s-]*[章课节讲]?\s*/, '');
  name = name.replace(/^Unit\s*\d+\s*/i, '');
  name = name.replace(/^Chapter\s*\d+\s*/i, '');
  name = name.replace(/^专题[一二三四五六七八九十\d]+\s*/, '');
  name = name.replace(/^0?\d+[-_\s]+/, '');
  if (!name || name.length < 2) return fileName.replace(/\.[^.]+$/, '');
  return name.trim();
}

/** 将平铺文件列表组织为 3 级树 */
function buildThreeLevelTree(files) {
  const tree = {};
  for (const f of files) {
    const subject = f.subject || 'other';
    const chapter = f.chapter || '其他章节';
    const kp = extractKnowledgePoint(f.file_name, f.chapter);
    if (!tree[subject]) tree[subject] = {};
    if (!tree[subject][chapter]) tree[subject][chapter] = {};
    if (!tree[subject][chapter][kp]) tree[subject][chapter][kp] = [];
    tree[subject][chapter][kp].push(f);
  }
  // 排序：按每个层级的条目数降序
  const sorted = {};
  Object.entries(tree)
    .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
    .forEach(([subject, chapters]) => {
      sorted[subject] = {};
      Object.entries(chapters)
        .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length)
        .forEach(([chapter, kps]) => {
          sorted[subject][chapter] = {};
          Object.entries(kps)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([kp, vids]) => {
              sorted[subject][chapter][kp] = vids;
            });
        });
    });
  return sorted;
}

/** 判断某个文件是否匹配诊断弱项 —— 统一使用 extractKnowledgePoint 提取文件知识点，再与薄弱点名称做子串/关键词匹配 */
function isRecommended(file, weakPoints) {
  if (!weakPoints || weakPoints.length === 0) return false;
  const subject = file.subject || 'other';
  const fileKP = extractKnowledgePoint(file.file_name, file.chapter).toLowerCase();
  if (!fileKP || fileKP.length < 2) return false;

  return weakPoints.some(wp => {
    if (wp.subject !== subject) return false;
    const wpKP = (wp.knowledgePoint || '').toLowerCase();
    if (!wpKP || wpKP.length < 2) return false;

    // 子串匹配：薄弱知识点名包含文件知识点名 或 反过来
    if (wpKP.includes(fileKP) || fileKP.includes(wpKP)) return true;

    // 中文双字关键词重叠匹配（bigram）
    const wpBigrams = new Set();
    for (let i = 0; i < wpKP.length - 1; i++) {
      const b = wpKP.slice(i, i + 2);
      if (b.trim().length === 2) wpBigrams.add(b);
    }
    const fileBigrams = [];
    for (let i = 0; i < fileKP.length - 1; i++) {
      const b = fileKP.slice(i, i + 2);
      if (b.trim().length === 2) fileBigrams.push(b);
    }
    if (fileBigrams.length === 0) return false;
    const overlap = fileBigrams.filter(b => wpBigrams.has(b)).length;
    return overlap >= fileBigrams.length * 0.5;
  });
}

export default function CourseListScreen({ navigation }) {
  const { isCookieExpired, quarkCookie, diagnosisResult } = useApp();
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [organized, setOrganized] = useState({});
  const [stats, setStats] = useState(null);
  const [currentSource, setCurrentSource] = useState(FEATURED_SOURCES[0]);
  const [completedIds, setCompletedIds] = useState({});

  // 三级展开状态
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedKPs, setExpandedKPs] = useState({});
  const [recommendOnly, setRecommendOnly] = useState(false);
  const [lastWatched, setLastWatched] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [generalRecommend, setGeneralRecommend] = useState([]);

  const weakPoints = diagnosisResult?.weakPoints || [];

  // 加载完成状态
  useEffect(() => {
    if (courses && courses.length > 0) {
      loadCompletedStatus(courses);
      loadLastWatched(courses);
      loadGeneralRecommend(courses);
    }
  }, [courses]);

  // 屏幕聚焦时刷新完成状态和最近观看
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (courses && courses.length > 0) {
        loadCompletedStatus(courses);
        loadLastWatched(courses);
      }
    });
    return unsubscribe;
  }, [navigation, courses]);

  const loadCompletedStatus = async (files) => {
    try {
      const keys = files.map(f => `@video_completed_${f.fid}`);
      const vals = await AsyncStorage.multiGet(keys);
      const map = {};
      vals.forEach(([k, v]) => {
        if (v === '1') {
          const fid = k.replace('@video_completed_', '');
          map[fid] = true;
        }
      });
      setCompletedIds(map);
    } catch (e) {}
  };

  // 查找最近观看的视频（按完成时间排序，取最新的；若无完成记录则按播放位置）
  const loadLastWatched = async (files) => {
    try {
      // 先找有播放位置的
      const posKeys = files.map(f => `@video_pos_${f.fid}`);
      const posVals = await AsyncStorage.multiGet(posKeys);
      let bestFile = null;
      let bestTime = 0;
      posVals.forEach(([k, v]) => {
        if (v) {
          const fid = k.replace('@video_pos_', '');
          const pos = Number(v);
          if (pos > bestTime) {
            bestTime = pos;
            bestFile = files.find(f => f.fid === fid);
          }
        }
      });
      // 再检查完成时间
      const timeKeys = files.map(f => `@video_completed_time_${f.fid}`);
      const timeVals = await AsyncStorage.multiGet(timeKeys);
      let latestCompleted = null;
      let latestTime = '';
      timeVals.forEach(([k, v]) => {
        if (v) {
          const fid = k.replace('@video_completed_time_', '');
          if (v > latestTime) {
            latestTime = v;
            latestCompleted = files.find(f => f.fid === fid);
          }
        }
      });
      // 优先使用最近完成的（且未100%完成，仍有继续价值）
      if (latestCompleted) {
        setLastWatched(latestCompleted);
      } else if (bestFile) {
        setLastWatched(bestFile);
      }
    } catch (e) {}
  };

  // 通用推荐：各科取前2个视频
  const loadGeneralRecommend = (files) => {
    const bySubject = {};
    files.forEach(f => {
      const s = f.subject || 'other';
      if (!bySubject[s]) bySubject[s] = [];
      if (bySubject[s].length < 2) bySubject[s].push(f);
    });
    const recs = [];
    Object.entries(bySubject).forEach(([subject, vids]) => {
      vids.forEach(f => recs.push(f));
    });
    setGeneralRecommend(recs.slice(0, 10));
  };

  // 构建3级树（带推荐标记）
  const treeData = useMemo(() => {
    if (!courses || courses.length === 0) return {};
    return buildThreeLevelTree(courses);
  }, [courses]);

  // 获取推荐文件fid集合
  const recommendedFids = useMemo(() => {
    if (!courses || weakPoints.length === 0) return new Set();
    return new Set(courses.filter(f => isRecommended(f, weakPoints)).map(f => f.fid));
  }, [courses, weakPoints]);

  // ── 本地课程缓存（离线/无Cookie时的降级方案）────
  const loadCoursesFromCache = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.COURSE_CACHE);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // 缓存最多 7 天有效
      if (Date.now() - (parsed.timestamp || 0) < 7 * 24 * 60 * 60 * 1000) {
        return parsed.files || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const saveCoursesToCache = async (files, shareTitle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COURSE_CACHE, JSON.stringify({
        files,
        shareTitle,
        timestamp: Date.now(),
      }));
    } catch (e) {
      // 缓存写入失败不阻塞主流程
    }
  };

  const load = useCallback(async (forceRefresh = false, source = currentSource) => {
    setError(null);
    const code = source.id === 'main' ? undefined : source.shareCode;
    try {
      const result = await parseFullCourseDirectory(forceRefresh, code);
      if (result.error) throw new Error(result.error);
      if (result.files?.length > 0) {
        setCourses(result.files);
        const org = organizeBySubject(result.files);
        setOrganized(org);
        // 写入本地缓存（异步，不阻塞UI）
        saveCoursesToCache(result.files, result.shareTitle);
      } else {
        setCourses([]);
        setOrganized({});
        setError(`${source.title} 中未找到课程文件`);
      }
      if (!forceRefresh) {
        try { const s = await getStatistics(); setStats(s); } catch(e){}
      }
    } catch (e) {
      setError(e.message);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentSource]);

  const switchSource = (source) => {
    if (source.id === currentSource.id) return;
    setCurrentSource(source);
    setLoading(true);
    setCourses(null);
    setOrganized({});
    setExpandedSubjects({});
    setExpandedChapters({});
    setExpandedKPs({});
    load(false, source);
  };

  useEffect(() => {
    // 先尝试从缓存恢复（即使无Cookie也能展示内容）
    loadCoursesFromCache().then(cachedFiles => {
      if (cachedFiles && cachedFiles.length > 0) {
        setCourses(cachedFiles);
        setOrganized(organizeBySubject(cachedFiles));
        setLoading(false);
      }
    });
    load();
  }, []);

  // ── 展开/折叠 ──────────────────────────────────────────────

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
    if (!expandedSubjects[subject]) {
      setBreadcrumb([{ label: SUBJECT_NAMES[subject] || subject, type: 'subject', key: subject }]);
    } else {
      setBreadcrumb([]);
    }
  };

  const toggleChapter = (subject, chapter, key) => {
    setExpandedChapters(prev => ({ ...prev, [key]: !prev[key] }));
    if (!expandedChapters[key]) {
      setBreadcrumb([
        { label: SUBJECT_NAMES[subject] || subject, type: 'subject', key: subject },
        { label: chapter, type: 'chapter', key },
      ]);
    }
  };

  const toggleKP = (subject, chapter, kp, key) => {
    setExpandedKPs(prev => ({ ...prev, [key]: !prev[key] }));
    if (!expandedKPs[key]) {
      setBreadcrumb([
        { label: SUBJECT_NAMES[subject] || subject, type: 'subject', key: subject },
        { label: chapter, type: 'chapter', key: `${subject}||${chapter}` },
        { label: kp, type: 'kp', key },
      ]);
    }
  };

  // 筛选后的搜索结果
  const filtered = searchQuery.trim()
    ? (courses || []).filter(f => f.file_name?.includes(searchQuery) || f.subject?.includes(searchQuery))
    : null;

  // ── 检查是否有推荐内容 ────────────────────────────────────
  const hasRecommendations = weakPoints.length > 0 && recommendedFids.size > 0;

  // 检测是否在离线/无Cookie模式下运行
  const isOfflineMode = isCookieExpired() || !quarkCookie;

  // 简化版 Cookie 配置指引
  const showSetupGuide = () => {
    Alert.alert(
      '配置夸克网盘',
      '方法一（推荐）：让家长帮忙操作\n在电脑浏览器打开 pan.quark.cn 登录后，复制整个Cookie发给你\n\n方法二：自行操作\n在浏览器登录 pan.quark.cn，按地址栏左侧的锁图标 → Cookie → 复制全部内容\n\n粘贴后即可浏览课程视频',
      [{ text: '知道了' }],
    );
  };

  // No cookie and no cached courses — show setup screen
  if (isOfflineMode && (!courses || courses.length === 0) && !loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <Icon name="cloud-off" size={60} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>课程加载需要登录夸克网盘</Text>
        <Text style={styles.emptyDesc}>别担心，让家长帮你操作一下就好</Text>
        <TouchableOpacity style={styles.btn} onPress={showSetupGuide}>
          <Text style={styles.btnText}>如何配置</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { marginTop: 12, backgroundColor: '#34C759' }]}
          onPress={() => navigation.navigate('CourseList')}
        >
          <Text style={styles.btnText}>刷新页面</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在加载课程...</Text>
      </View>
    );
  }

  if (error && !courses?.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="error-outline" size={50} color="#FF3B30" />
        <Text style={styles.emptyTitle}>加载失败</Text>
        <Text style={styles.emptyDesc}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={()=>load(true)}>
          <Text style={styles.btnText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const display = filtered || organized;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜索课程..."
          placeholderTextColor="#C7C7CC"
        />
        {searchQuery ? <TouchableOpacity onPress={()=>setSearchQuery('')}><Icon name="close" size={18} color="#8E8E93" /></TouchableOpacity> : null}
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);load(true);}} tintColor="#007AFF" />}
      >
        {/* 离线模式提示条（无Cookie但有缓存课程时显示） */}
        {isOfflineMode && (
          <View style={styles.cookieBanner}>
            <View style={styles.cookieBannerLeft}>
              <Icon name="info-outline" size={15} color="#FF9500" />
              <Text style={styles.cookieBannerText}>离线模式 — 课程数据未更新</Text>
            </View>
            <TouchableOpacity style={styles.cookieBannerBtn} onPress={showSetupGuide}>
              <Text style={styles.cookieBannerBtnText}>配置</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        {stats && !searchQuery && (
          <View style={styles.statsRow}>
            <View style={styles.statBadge}><Text style={styles.statNum}>{stats.totalVideos}</Text><Text style={styles.statLbl}>个视频</Text></View>
            <View style={styles.statBadge}><Text style={styles.statNum}>{Object.keys(stats.bySubject||{}).length}</Text><Text style={styles.statLbl}>门学科</Text></View>
            <View style={styles.statBadge}><Text style={styles.statNum}>{stats.shareTitle||'课程'}</Text><Text style={styles.statLbl}>来自分享</Text></View>
          </View>
        )}

        {/* ── 继续观看卡片 ── */}
        {lastWatched && !searchQuery && !recommendOnly && (
          <TouchableOpacity
            style={styles.continueCard}
            onPress={() => navigation.navigate('VideoPlayer', {
              fileId: lastWatched.fid,
              title: lastWatched.file_name,
              subject: lastWatched.subject,
              chapter: lastWatched.chapter,
            })}
            activeOpacity={0.8}
          >
            <View style={styles.continueIconWrap}>
              <Icon name="play-circle" size={36} color="#fff" />
            </View>
            <View style={styles.continueInfo}>
              <Text style={styles.continueLabel}>继续观看</Text>
              <Text style={styles.continueTitle} numberOfLines={1}>
                {lastWatched.file_name?.replace(/\.[^.]+$/, '')}
              </Text>
              <Text style={styles.continueMeta}>
                {SUBJECT_NAMES[lastWatched.subject] || lastWatched.subject}
                {lastWatched.chapter ? ` · ${lastWatched.chapter}` : ''}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}

        {/* ── 为你推荐横滑栏 ── */}
        {!searchQuery && !recommendOnly && generalRecommend.length > 0 && !hasRecommendations && (
          <View style={styles.recSection}>
            <View style={styles.recHead}>
              <Icon name="stars" size={18} color="#007AFF" />
              <Text style={styles.recTitle}>为你推荐</Text>
              <Text style={styles.recSub}>精选好课</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
              {generalRecommend.slice(0, 8).map((f, i) => {
                const subjColor = SUBJECT_COLORS[f.subject] || '#8E8E93';
                const subjName = SUBJECT_NAMES[f.subject] || f.subject;
                return (
                  <TouchableOpacity
                    key={`gen-rec-${i}`}
                    style={styles.recCard}
                    onPress={() => navigation.navigate('VideoPlayer', {
                      fileId: f.fid, title: f.file_name,
                      subject: f.subject, chapter: f.chapter,
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.recBadge, { backgroundColor: subjColor+'18' }]}>
                      <Icon name={SUBJECT_ICONS[f.subject]||'book'} size={18} color={subjColor} />
                      <Text style={[styles.recBadgeText, { color: subjColor }]}>{subjName}</Text>
                    </View>
                    <Text style={styles.recCardTitle} numberOfLines={2}>
                      {f.file_name?.replace(/\.[^.]+$/, '')}
                    </Text>
                    <Text style={styles.recCardMeta}>
                      {f.chapter ? f.chapter.slice(0, 20) : '精选视频'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 推荐筛选栏 */}
        {hasRecommendations && !searchQuery && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, recommendOnly && styles.filterBtnActive]}
              onPress={() => setRecommendOnly(!recommendOnly)}
              activeOpacity={0.7}
            >
              <Icon name="auto-awesome" size={15} color={recommendOnly ? '#fff' : '#FF9500'} />
              <Text style={[styles.filterBtnText, recommendOnly && styles.filterBtnTextActive]}>
                只看推荐 ({recommendedFids.size})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart recommendations banner */}
        {weakPoints.length > 0 && !searchQuery && !recommendOnly && (
          <View style={styles.recSection}>
            <View style={styles.recHead}>
              <Icon name="auto-awesome" size={18} color="#FF9500" />
              <Text style={styles.recTitle}>智能推荐</Text>
              <Text style={styles.recSub}>基于你的诊断结果</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
              {weakPoints.slice(0, 5).map((wp, i) => {
                const subjName = SUBJECT_NAMES[wp.subject] || wp.subject;
                const color = SUBJECT_COLORS[wp.subject] || '#8E8E93';
                const wpLabel = wp.knowledgePoint || wp.section || wp.chapter || '';
                // 用统一匹配逻辑筛选真正相关的课程（不只是同科目）
                const relatedCourses = (courses||[]).filter(c => isRecommended(c, [wp])).slice(0, 3);
                if (relatedCourses.length === 0) {
                  // 诚实告知：没有真正匹配该知识点的视频
                  return (
                    <View key={`rec-none-${i}`} style={styles.recNoneCard}>
                      <View style={[styles.recBadge,{backgroundColor:color+'18'}]}>
                        <Icon name={SUBJECT_ICONS[wp.subject]||'book'} size={18} color={color} />
                        <Text style={[styles.recBadgeText,{color}]}>{subjName}</Text>
                      </View>
                      <Text style={styles.recNoneText} numberOfLines={3}>
                        暂无针对「{wpLabel}」的推荐视频
                      </Text>
                    </View>
                  );
                }
                return relatedCourses.map((c, j) => (
                  <TouchableOpacity key={`${i}-${j}`} style={styles.recCard} onPress={() => navigation.navigate('VideoPlayer',{fileId:c.fid,title:c.file_name,subject:c.subject,chapter:c.chapter})}>
                    <View style={[styles.recBadge,{backgroundColor:color+'18'}]}>
                      <Icon name={SUBJECT_ICONS[wp.subject]||'book'} size={18} color={color} />
                      <Text style={[styles.recBadgeText,{color}]}>{subjName}</Text>
                    </View>
                    <Text style={styles.recCardTitle} numberOfLines={2}>{c.file_name?.replace(/\.[^.]+$/,'')}</Text>
                    <Text style={styles.recCardMeta}>薄弱: {wpLabel}</Text>
                  </TouchableOpacity>
                ));
              }).flat().filter(Boolean).slice(0, 6)}
            </ScrollView>
          </View>
        )}

        {/* Source picker */}
        {!recommendOnly && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow} contentContainerStyle={styles.sourceRowInner}>
            {FEATURED_SOURCES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sourceChip, currentSource.id === s.id && styles.sourceChipActive]}
                onPress={() => switchSource(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sourceChipText, currentSource.id === s.id && styles.sourceChipTextActive]} numberOfLines={1}>
                  {s.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── 面包屑导航 ── */}
        {breadcrumb.length > 0 && !searchQuery && !recommendOnly && (
          <View style={styles.breadcrumbBar}>
            <TouchableOpacity onPress={() => {
              setExpandedSubjects({});
              setExpandedChapters({});
              setExpandedKPs({});
              setBreadcrumb([]);
            }}>
              <Text style={styles.breadcrumbHome}>课程</Text>
            </TouchableOpacity>
            {breadcrumb.map((crumb, i) => (
              <View key={crumb.key} style={styles.breadcrumbItem}>
                <Icon name="chevron-right" size={14} color="#C7C7CC" />
                <TouchableOpacity onPress={() => {
                  if (crumb.type === 'subject') {
                    setExpandedChapters({});
                    setExpandedKPs({});
                    setBreadcrumb(breadcrumb.slice(0, i + 1));
                  } else if (crumb.type === 'chapter') {
                    setExpandedKPs({});
                    setBreadcrumb(breadcrumb.slice(0, i + 1));
                  }
                }}>
                  <Text style={[
                    styles.breadcrumbText,
                    i === breadcrumb.length - 1 && styles.breadcrumbTextActive,
                  ]} numberOfLines={1}>
                    {crumb.label.length > 12 ? crumb.label.slice(0, 12) + '...' : crumb.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Course subjects — flat search result or 3-level tree */}
        {searchQuery && filtered ? (
          <View style={styles.flatList}>
            <Text style={styles.sectionTitle}>搜索结果 ({filtered.length})</Text>
            {filtered.map((f,i)=>renderVideoItem(f,i, completedIds, recommendedFids, recommendOnly, (fid, title, subject, chapter) => navigation.navigate('VideoPlayer', { fileId: fid, title, subject, chapter })) )}
          </View>
        ) : recommendOnly ? (
          /* 只看推荐模式 */
          <View style={styles.recommendOnlyList}>
            <Text style={styles.sectionTitle}>
              <Icon name="auto-awesome" size={17} color="#FF9500" /> 推荐课程 ({recommendedFids.size})
            </Text>
            {(courses||[]).filter(f => recommendedFids.has(f.fid)).map((f, i) =>
              renderVideoItem(f, i, completedIds, recommendedFids, true, (fid, title, subject, chapter) => navigation.navigate('VideoPlayer', { fileId: fid, title, subject, chapter }))
            )}
          </View>
        ) : (
          /* 3级树 */
          Object.entries(treeData).map(([subject, chapters]) => {
            const color = SUBJECT_COLORS[subject] || '#8E8E93';
            const subjectName = SUBJECT_NAMES[subject] || subject;
            const subjectRecommended = recommendOnly ? false : hasRecommendations;
            const subjectTotalVids = Object.values(chapters).reduce((sum, kps) => sum + Object.values(kps).reduce((s, v) => s + v.length, 0), 0);
            const subjectCompletedVids = Object.values(chapters).reduce((sum, kps) => sum + Object.values(kps).reduce((s, v) => s + v.filter(f => completedIds[f.fid]).length, 0), 0);

            return (
              <View key={subject} style={styles.subjectCard}>
                {/* ── 第1级：学科卡片 ── */}
                <TouchableOpacity
                  style={styles.subjectHeader}
                  onPress={() => toggleSubject(subject)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subjectIconWrap, { backgroundColor: color+'14' }]}>
                    <Icon name={SUBJECT_ICONS[subject]||'folder'} size={22} color={color} />
                  </View>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectTitle}>{subjectName}</Text>
                    <Text style={styles.subjectMeta}>
                      {Object.keys(chapters).length} 章节 · {subjectTotalVids} 视频
                      {subjectCompletedVids > 0 && (
                        <Text style={{color:'#34C759',fontWeight:'600'}}> | {subjectCompletedVids}/{subjectTotalVids} 已完成</Text>
                      )}
                    </Text>
                  </View>
                  <Icon name={expandedSubjects[subject] ? 'expand-less' : 'expand-more'} size={24} color="#C7C7CC" />
                </TouchableOpacity>

                {expandedSubjects[subject] && (
                  <View style={styles.subjectBody}>
                    {/* ── 第2级：章节 ── */}
                    {Object.entries(chapters).map(([chapter, kps]) => {
                      const chapterKey = `${subject}||${chapter}`;
                      const chapterVidCount = Object.values(kps).reduce((s, v) => s + v.length, 0);
                      const chapterCompletedCount = Object.values(kps).flat().filter(f => completedIds[f.fid]).length;
                      // 计算该章节下有多少推荐视频
                      const chapterRecCount = Object.values(kps).flat().filter(f => recommendedFids.has(f.fid)).length;

                      return (
                        <View key={chapterKey} style={styles.chapterBlock}>
                          <View style={styles.chapterRow}>
                            <TouchableOpacity
                              style={styles.chapterHeader}
                              onPress={() => toggleChapter(subject, chapter, chapterKey)}
                              activeOpacity={0.7}
                            >
                              <View style={[styles.chapterDot, { backgroundColor: chapterCompletedCount === chapterVidCount ? '#34C759' : color }]} />
                              <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>{chapter}</Text>
                                <Text style={styles.chapterMeta}>
                                  {Object.keys(kps).length} 知识点 · {chapterVidCount} 视频
                                  {chapterCompletedCount > 0 && (
                                    <Text style={{color:'#34C759',fontWeight:'600'}}> | {chapterCompletedCount}/{chapterVidCount} 已完成</Text>
                                  )}
                                  {chapterRecCount > 0 && (
                                    <Text style={styles.chapterRecMeta}> | <Icon name="auto-awesome" size={11} color="#FF9500" /> {chapterRecCount}推荐</Text>
                                  )}
                                </Text>
                              </View>
                              <Icon name={expandedChapters[chapterKey] ? 'expand-less' : 'expand-more'} size={20} color="#C7C7CC" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.chapterAiBtn}
                              onPress={() => {
                                navigation.navigate('AITab', {
                                  screen: 'AIChat',
                                  params: {
                                    context: {
                                      type: 'course',
                                      subject: SUBJECT_NAMES[subject] || subject,
                                      chapter,
                                    },
                                  },
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Icon name="psychology" size={14} color="#AF52DE" />
                              <Text style={styles.chapterAiBtnText}>AI</Text>
                            </TouchableOpacity>
                          </View>

                          {expandedChapters[chapterKey] && (
                            <View style={styles.chapterBody}>
                              {/* ── 第3级：知识点 → 视频列表 ── */}
                              {Object.entries(kps).map(([kp, vids]) => {
                                const kpKey = `${chapterKey}||${kp}`;
                                const kpCompletedCount = vids.filter(f => completedIds[f.fid]).length;
                                const kpAllDone = kpCompletedCount === vids.length;
                                return (
                                  <View key={kpKey} style={styles.kpBlock}>
                                    <TouchableOpacity
                                      style={styles.kpHeader}
                                      onPress={() => toggleKP(subject, chapter, kp, kpKey)}
                                      activeOpacity={0.7}
                                    >
                                      <Icon name={kpAllDone ? 'check-circle' : (expandedKPs[kpKey] ? 'radio-button-checked' : 'radio-button-unchecked')} size={14} color={kpAllDone ? '#34C759' : color} style={{marginRight:6}} />
                                      <Text style={[styles.kpTitle, kpAllDone && styles.kpTitleDone]} numberOfLines={1}>{kp}</Text>
                                      <View style={styles.kpTags}>
                                        {vids.some(f => recommendedFids.has(f.fid)) && (
                                          <View style={styles.recTagMini}>
                                            <Text style={styles.recTagMiniText}>推荐</Text>
                                          </View>
                                        )}
                                        <Text style={styles.kpCount}>
                                          {kpCompletedCount > 0 ? `${kpCompletedCount}/${vids.length}` : `${vids.length}视频`}
                                        </Text>
                                      </View>
                                      <Icon name={expandedKPs[kpKey] ? 'expand-less' : 'expand-more'} size={16} color="#C7C7CC" />
                                    </TouchableOpacity>

                                    {expandedKPs[kpKey] && (
                                      <View style={styles.kpBody}>
                                        {vids.map((f, i) =>
                                          renderVideoItem(
                                            f, i, completedIds, recommendedFids, false,
                                            (fid, title, subject, chapter) => navigation.navigate('VideoPlayer', { fileId: fid, title, subject, chapter })
                                          )
                                        )}
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{height:50}} />
      </ScrollView>
    </View>
  );
}

// ── 视频条目渲染（含完成状态/推荐标签/知识点标签）──────
function renderVideoItem(file, idx, completedIds, recommendedFids, isRecOnly, onPress) {
  const subjectColor = SUBJECT_COLORS[file.subject] || '#8E8E93';
  const isCompleted = !!completedIds[file.fid];
  const isRec = recommendedFids.has(file.fid);
  const kpTag = extractKnowledgePoint(file.file_name, file.chapter);
  // 尝试从文件名中提取时长（如 "1h30m", "45min", "90分钟"）
  const durationMatch = (file.file_name || '').match(/(\d+)\s*(分|min|分钟)/i) ||
                        (file.file_name || '').match(/(\d+)\s*h\s*(\d+)?\s*mi?/i);
  let duration = null;
  if (durationMatch) {
    duration = durationMatch[2]
      ? `${durationMatch[1]}h${durationMatch[2]}m`
      : `${durationMatch[1]}min`;
  }

  return (
    <TouchableOpacity
      key={file.fid || idx}
      style={[styles.videoItem, isRec && !isRecOnly && styles.videoItemRec]}
      onPress={() => onPress(file.fid, file.file_name, file.subject, file.chapter)}
      activeOpacity={0.6}
    >
      {/* 左侧图标 */}
      <View style={[styles.videoIconWrap, { backgroundColor: subjectColor+'12' }]}>
        <Icon name={isCompleted ? 'check-circle' : 'play-circle'} size={22} color={isCompleted ? '#34C759' : subjectColor} />
      </View>

      {/* 中间信息 */}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, isCompleted && styles.videoTitleDone]} numberOfLines={2}>
          {file.file_name?.replace(/\.[^.]+$/,'')}
        </Text>
        <View style={styles.videoMetaRow}>
          {/* 知识点标签 */}
          {kpTag && kpTag.length < 30 ? (
            <View style={styles.kpTag}>
              <Text style={styles.kpTagText} numberOfLines={1}>{kpTag}</Text>
            </View>
          ) : null}
          {/* 时长 */}
          {duration && (
            <View style={styles.durationTag}>
              <Icon name="schedule" size={10} color="#8E8E93" />
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          )}
          {/* 完成状态 */}
          {isCompleted && (
            <View style={styles.doneTag}>
              <Icon name="check" size={11} color="#34C759" />
              <Text style={styles.doneText}>已完成</Text>
            </View>
          )}
        </View>
      </View>

      {/* 右侧推荐标签 */}
      {isRec && !isRecOnly && (
        <View style={styles.recTag}>
          <Icon name="auto-awesome" size={11} color="#FF9500" />
          <Text style={styles.recTagText}>推荐</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F2F2F7' },
  centerContent: { justifyContent:'center', alignItems:'center', padding:40 },
  searchBar: {
    flexDirection:'row', alignItems:'center', backgroundColor:'#E5E5EA', borderRadius:12,
    marginHorizontal:16, marginTop:8, marginBottom:12, paddingHorizontal:12, height:40,
  },
  searchInput: { flex:1, fontSize:15, color:'#000', marginLeft:6 },
  list: { flex:1, paddingHorizontal:16 },

  // ── 离线/Cookie提示条 ──
  cookieBanner: {
    flexDirection:'row', alignItems:'center', backgroundColor:'#FFF5E6',
    borderRadius:10, paddingVertical:10, paddingHorizontal:12, marginBottom:12,
    borderWidth:1, borderColor:'#FFE0B2',
  },
  cookieBannerLeft: { flexDirection:'row', alignItems:'center', flex:1, gap:8 },
  cookieBannerText: { fontSize:12, color:'#FF9500', fontWeight:'500', flex:1 },
  cookieBannerBtn: {
    backgroundColor:'#FF9500', borderRadius:14, paddingHorizontal:12, paddingVertical:5,
  },
  cookieBannerBtnText: { fontSize:12, fontWeight:'600', color:'#fff' },

  statsRow: { flexDirection:'row', gap:8, marginBottom:16 },
  statBadge: {
    flex:1, backgroundColor:'#fff', borderRadius:12, padding:12, alignItems:'center',
    shadowColor:'#000', shadowOffset:{w:0,h:1}, shadowOpacity:0.03, shadowRadius:4,
  },
  statNum: { fontSize:18, fontWeight:'700', color:'#000' },
  statLbl: { fontSize:11, color:'#8E8E93', marginTop:2 },

  // ── 继续观看卡片 ──
  continueCard: {
    flexDirection:'row', alignItems:'center', backgroundColor:'#007AFF', borderRadius:16,
    padding:16, marginBottom:14, gap:12,
    shadowColor:'#007AFF', shadowOffset:{w:0,h:4}, shadowOpacity:0.25, shadowRadius:8,
  },
  continueIconWrap: { width:48, height:48, borderRadius:24, backgroundColor:'rgba(255,255,255,0.2)', justifyContent:'center', alignItems:'center' },
  continueInfo: { flex:1 },
  continueLabel: { fontSize:11, fontWeight:'600', color:'rgba(255,255,255,0.7)', marginBottom:2 },
  continueTitle: { fontSize:15, fontWeight:'700', color:'#fff', lineHeight:20 },
  continueMeta: { fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 },

  // ── 面包屑导航 ──
  breadcrumbBar: { flexDirection:'row', alignItems:'center', paddingHorizontal:4, marginBottom:12, flexWrap:'wrap' },
  breadcrumbHome: { fontSize:13, fontWeight:'600', color:'#007AFF' },
  breadcrumbItem: { flexDirection:'row', alignItems:'center', gap:4 },
  breadcrumbText: { fontSize:13, color:'#3C3C43', fontWeight:'500' },
  breadcrumbTextActive: { color:'#007AFF', fontWeight:'700' },

  // ── 推荐筛选 ──
  filterRow: { flexDirection:'row', marginBottom:12, paddingHorizontal:4 },
  filterBtn: {
    flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8,
    backgroundColor:'#FFF5E6', borderRadius:20, borderWidth:1, borderColor:'#FFB84D',
  },
  filterBtnActive: { backgroundColor:'#FF9500', borderColor:'#FF9500' },
  filterBtnText: { fontSize:13, fontWeight:'600', color:'#FF9500' },
  filterBtnTextActive: { color:'#fff' },

  // ── 推荐横滑 ──
  recSection: { marginBottom:16 },
  recHead: { flexDirection:'row', alignItems:'center', paddingHorizontal:4, marginBottom:8, gap:6 },
  recTitle: { fontSize:15, fontWeight:'700', color:'#000' },
  recSub: { fontSize:12, color:'#FF9500', flex:1, textAlign:'right' },
  recScroll: { paddingLeft:4 },
  recCard: { backgroundColor:'#fff', borderRadius:14, padding:14, marginRight:10, width:160, shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.04, shadowRadius:6 },
  recBadge: { flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:3, borderRadius:8, alignSelf:'flex-start', marginBottom:8, gap:4 },
  recBadgeText: { fontSize:11, fontWeight:'600' },
  recCardTitle: { fontSize:13, fontWeight:'600', color:'#000', lineHeight:18, marginBottom:6 },
  recCardMeta: { fontSize:11, color:'#FF3B30' },
  recNoneCard: { backgroundColor:'#F2F2F7', borderRadius:14, padding:14, marginRight:10, width:160, justifyContent:'center', alignItems:'center' },
  recNoneText: { fontSize:12, color:'#8E8E93', textAlign:'center', lineHeight:18, marginTop:8 },
  recommendOnlyList: { marginTop:6 },
  sectionTitle: { fontSize:16, fontWeight:'700', color:'#000', marginBottom:10 },

  // ── 来源选择 ──
  sourceRow: { maxHeight:44, marginBottom:12 },
  sourceRowInner: { paddingHorizontal:0, gap:6, alignItems:'center' },
  sourceChip: { backgroundColor:'#fff', borderRadius:20, paddingHorizontal:14, paddingVertical:8, shadowColor:'#000', shadowOffset:{w:0,h:1}, shadowOpacity:0.03, shadowRadius:2 },
  sourceChipActive: { backgroundColor:'#007AFF' },
  sourceChipText: { fontSize:13, color:'#3C3C43', fontWeight:'500' },
  sourceChipTextActive: { color:'#fff' },

  // ── 第1级：学科卡片 ──
  subjectCard: {
    backgroundColor:'#fff', borderRadius:16, marginBottom:14,
    shadowColor:'#000', shadowOffset:{w:0,h:2}, shadowOpacity:0.04, shadowRadius:6,
    overflow:'hidden',
  },
  subjectHeader: {
    flexDirection:'row', alignItems:'center', padding:14, gap:10,
  },
  subjectIconWrap: { width:40, height:40, borderRadius:12, justifyContent:'center', alignItems:'center' },
  subjectInfo: { flex:1 },
  subjectTitle: { fontSize:16, fontWeight:'700', color:'#000' },
  subjectMeta: { fontSize:12, color:'#8E8E93', marginTop:2 },
  subjectBody: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor:'#E5E5EA',
    paddingHorizontal:6, paddingBottom:6,
  },

  // ── 第2级：章节 ──
  chapterBlock: {
    marginTop:2, marginHorizontal:4, borderRadius:12,
    backgroundColor:'#FAFAFA',
  },
  chapterHeader: {
    flex:1,
    flexDirection:'row', alignItems:'center', padding:10, gap:8,
  },
  chapterRow: {
    flexDirection:'row', alignItems:'center',
  },
  chapterAiBtn: {
    flexDirection:'row', alignItems:'center', paddingHorizontal:10, paddingVertical:6,
    marginRight:4, borderRadius:14, backgroundColor:'#F5F0FF', gap:3,
  },
  chapterAiBtnText: { fontSize:11, fontWeight:'600', color:'#AF52DE' },
  chapterDot: { width:8, height:8, borderRadius:4 },
  chapterInfo: { flex:1 },
  chapterTitle: { fontSize:14, fontWeight:'600', color:'#1C1C1E' },
  chapterMeta: { fontSize:11, color:'#8E8E93', marginTop:2 },
  chapterRecMeta: { color:'#FF9500' },
  chapterBody: { paddingLeft:4, paddingRight:4, paddingBottom:4 },

  // ── 第3级：知识点 ──
  kpBlock: {
    marginTop:2, marginHorizontal:2, borderRadius:10,
    backgroundColor:'#fff',
  },
  kpHeader: {
    flexDirection:'row', alignItems:'center', padding:8, paddingRight:6, gap:4,
  },
  kpTitle: { flex:1, fontSize:13, fontWeight:'500', color:'#3C3C43' },
  kpTitleDone: { color:'#34C759' },
  kpTags: { flexDirection:'row', alignItems:'center', gap:6, marginRight:4 },
  kpCount: { fontSize:11, color:'#8E8E93' },
  recTagMini: {
    backgroundColor:'#FFF5E6', borderRadius:6, paddingHorizontal:6, paddingVertical:1,
  },
  recTagMiniText: { fontSize:10, fontWeight:'600', color:'#FF9500' },
  kpBody: { paddingHorizontal:4, paddingBottom:4 },

  // ── 视频条目 ──
  videoItem: {
    flexDirection:'row', alignItems:'center', backgroundColor:'#F9F9FB',
    borderRadius:10, padding:10, marginVertical:2, gap:8,
  },
  videoItemRec: {
    backgroundColor:'#FFF9F0',
    borderWidth:1, borderColor:'#FFE0B2',
  },
  videoIconWrap: { width:34, height:34, borderRadius:9, justifyContent:'center', alignItems:'center' },
  videoInfo: { flex:1 },
  videoTitle: { fontSize:13, fontWeight:'500', color:'#000', lineHeight:18 },
  videoTitleDone: { color:'#8E8E93', textDecorationLine:'line-through' },
  videoMetaRow: { flexDirection:'row', flexWrap:'wrap', alignItems:'center', gap:6, marginTop:3 },
  kpTag: {
    backgroundColor:'#F0F0F5', borderRadius:6, paddingHorizontal:6, paddingVertical:2,
  },
  kpTagText: { fontSize:10, color:'#636366' },
  durationTag: { flexDirection:'row', alignItems:'center', gap:2 },
  durationText: { fontSize:10, color:'#8E8E93' },
  doneTag: { flexDirection:'row', alignItems:'center', gap:2 },
  doneText: { fontSize:10, color:'#34C759', fontWeight:'500' },
  recTag: {
    backgroundColor:'#FFF5E6', borderRadius:8, paddingHorizontal:8, paddingVertical:3,
    flexDirection:'row', alignItems:'center', gap:3,
  },
  recTagText: { fontSize:11, fontWeight:'600', color:'#FF9500' },

  // ── 通用 ──
  flatList: {},
  emptyTitle: { fontSize:18, fontWeight:'700', color:'#000', marginTop:16 },
  emptyDesc: { fontSize:14, color:'#8E8E93', marginTop:6, marginBottom:20, textAlign:'center' },
  btn: { backgroundColor:'#007AFF', borderRadius:20, paddingHorizontal:28, paddingVertical:12 },
  btnText: { fontSize:15, fontWeight:'600', color:'#fff' },
  loadingText: { fontSize:14, color:'#8E8E93', marginTop:12 },
});
