import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert, Dimensions, PanResponder } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShareToken, getVideoPlayUrl } from '../api/quark-api';
import { extractShareCode } from '../api/share-link-parser';
import { QUARK_CONFIG } from '../config';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }) {
  const { fileId, title, subject, chapter } = route.params || {};
  const videoRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showRatePicker, setShowRatePicker] = useState(false);
  const [resumePos, setResumePos] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const hideTimer = useRef(null);
  const savedPosRef = useRef(0);
  const toggleGuardRef = useRef(false);
  const isSeekingRef = useRef(false);
  const trackPageXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const rateRef = useRef(1.0);

  // 视频完成状态
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const completionSavedRef = useRef(false);

  useEffect(() => {
    if (fileId) {
      loadVideo();
      checkCompletionStatus();
    } else {
      setLoading(false);
      setError('缺少文件信息');
    }
    return () => {
      // 退出时保存进度和倍速
      if (fileId && savedPosRef.current > 0) {
        AsyncStorage.setItem(`@video_pos_${fileId}`, String(savedPosRef.current));
      }
      if (fileId) {
        AsyncStorage.setItem(`@video_rate_${fileId}`, String(rateRef.current));
      }
    };
  }, [fileId]);

  // 加载保存的进度
  useEffect(() => {
    if (!loading && videoUrl && fileId) {
      AsyncStorage.getItem(`@video_pos_${fileId}`).then(v => {
        if (v) { setResumePos(Number(v)); setShowResume(true); }
      });
    }
  }, [loading, videoUrl, fileId]);

  // 加载保存的倍速偏好
  useEffect(() => {
    if (fileId) {
      AsyncStorage.getItem(`@video_rate_${fileId}`).then(v => {
        if (v) {
          const savedRate = Number(v);
          setRate(savedRate);
          rateRef.current = savedRate;
          if (videoRef.current) {
            videoRef.current.setRateAsync(savedRate, true);
          }
        }
      });
    }
  }, [fileId]);

  // 每5秒持久化播放进度
  useEffect(() => {
    if (!fileId) return;
    const interval = setInterval(() => {
      if (savedPosRef.current > 0) {
        AsyncStorage.setItem(`@video_pos_${fileId}`, String(savedPosRef.current));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fileId]);

  // ── 检查是否已完成 ────────────────────────────────────────
  const checkCompletionStatus = async () => {
    try {
      const val = await AsyncStorage.getItem(`@video_completed_${fileId}`);
      setAlreadyCompleted(val === '1');
    } catch (e) {}
  };

  // ── 标记完成 ──────────────────────────────────────────────
  const markCompleted = useCallback(async () => {
    if (completionSavedRef.current) return;
    completionSavedRef.current = true;
    try {
      await AsyncStorage.setItem(`@video_completed_${fileId}`, '1');
      setAlreadyCompleted(true);
      // 同时更新完成时间
      await AsyncStorage.setItem(`@video_completed_time_${fileId}`, new Date().toISOString());
    } catch (e) {
      console.log('保存完成状态失败:', e);
    }
  }, [fileId]);

  // ── 跳转练习 ──────────────────────────────────────────────
  const goToPractice = () => {
    setShowCompletionPrompt(false);
    navigation.navigate('QuickPractice', {
      fileId,
      title,
      subject,
      chapter,
      count: 3,
    });
  };

  const loadVideo = async () => {
    setLoading(true); setError(null);
    try {
      const code = extractShareCode(QUARK_CONFIG?.shareLinks?.shareCode || 'e622c8366282');
      const { stoken } = await getShareToken(code);
      const url = await getVideoPlayUrl(fileId);
      if (url) setVideoUrl(url);
      else setError('无法获取视频播放地址');
    } catch (err) {
      setError(err.message || '获取视频地址失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current || toggleGuardRef.current) return;
    toggleGuardRef.current = true;
    try {
      if (playing) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setPlaying(!playing);
    } finally {
      toggleGuardRef.current = false;
    }
  };

  const seek = async (value) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(value);
      setPosition(value);
    }
  };

  const changeRate = async (newRate) => {
    if (videoRef.current) {
      await videoRef.current.setRateAsync(newRate, true);
      setRate(newRate);
      rateRef.current = newRate;
      if (fileId) {
        AsyncStorage.setItem(`@video_rate_${fileId}`, String(newRate));
      }
    }
    setShowRatePicker(false);
  };

  const toggleControls = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  // ── 播放进度回调 ─────────────────────────────────────────
  const handlePlaybackUpdate = (status) => {
    if (status.isLoaded) {
      if (!isSeekingRef.current) {
        setPosition(status.positionMillis);
        savedPosRef.current = status.positionMillis;
      }
      setDuration(status.durationMillis || 0);
      setPlaying(status.isPlaying);

      // 检测视频播放完成
      if (status.didJustFinish) {
        markCompleted();
        setShowCompletionPrompt(true);
      }
    }
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>正在加载视频...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={55} color="#FF3B30" />
        <Text style={[styles.statusText, { color: '#FF3B30', marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={loadVideo}><Text style={styles.btnText}>重试</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } else { navigation.navigate('Today'); } }}><Text style={styles.btnOutlineText}>返回</Text></TouchableOpacity>
      </View>
    );
  }

  // No video URL
  if (!videoUrl) {
    return (
      <View style={styles.center}>
        <Icon name="videocam-off" size={55} color="#636366" />
        <Text style={styles.statusText}>无可播放的视频</Text>
        <TouchableOpacity style={styles.btnOutline} onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } else { navigation.navigate('Today'); } }}><Text style={styles.btnOutlineText}>返回</Text></TouchableOpacity>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;

  const sliderPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      isSeekingRef.current = true;
    },
    onPanResponderMove: (_, gs) => {
      if (trackWidthRef.current > 0 && duration > 0) {
        const relX = gs.moveX - trackPageXRef.current;
        const ratio = Math.max(0, Math.min(1, relX / trackWidthRef.current));
        setPosition(Math.floor(ratio * duration));
      }
    },
    onPanResponderRelease: (_, gs) => {
      isSeekingRef.current = false;
      if (trackWidthRef.current > 0 && duration > 0) {
        const relX = gs.moveX - trackPageXRef.current;
        const ratio = Math.max(0, Math.min(1, relX / trackWidthRef.current));
        const newPos = Math.floor(ratio * duration);
        seek(newPos);
      }
    },
  }), [duration]);

  return (
    <View style={styles.container}>
      {/* Video area */}
      <TouchableOpacity style={styles.videoArea} activeOpacity={1} onPress={toggleControls}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={handlePlaybackUpdate}
          onError={(e) => setError('视频加载失败: ' + (e.error || ''))}
          rate={rate}
          shouldPlay={false}
          progressUpdateIntervalMillis={500}
        />

        {/* Resume prompt */}
        {showResume && !playing && showControls && !showCompletionPrompt && (
          <TouchableOpacity style={styles.resumeBar} onPress={() => {
            if (videoRef.current && resumePos) {
              videoRef.current.setPositionAsync(resumePos);
              videoRef.current.playAsync();
              setPlaying(true);
              setShowResume(false);
            }
          }}>
            <Icon name="replay" size={20} color="#007AFF" />
            <Text style={styles.resumeText}>继续上次 {formatTime(resumePos||0)}</Text>
          </TouchableOpacity>
        )}

        {/* Center play button */}
        {!playing && showControls && !showResume && !showCompletionPrompt && (
          <TouchableOpacity style={styles.bigPlay} onPress={togglePlay}>
            <Icon name="play-arrow" size={60} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Tap to pause indicator */}
        {playing && showControls && (
          <TouchableOpacity style={styles.pauseOverlay} onPress={togglePlay}>
            <Icon name="pause" size={50} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        )}

        {/* ── 课后练习完成提示 ─────────────────────────────── */}
        {showCompletionPrompt && (
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              {/* 顶部装饰 */}
              <View style={styles.compIconWrap}>
                <Icon name="emoji-events" size={40} color="#FF9500" />
              </View>
              <Text style={styles.compTitle}>太棒了！</Text>
              <Text style={styles.compSub}>你已完成本课学习</Text>
              <Text style={styles.compHint}>课后练习能帮助你巩固知识点</Text>

              {/* 进度条 */}
              <View style={styles.compProgressBar}>
                <View style={styles.compProgressFill} />
              </View>

              {/* 按钮区 */}
              <TouchableOpacity style={styles.practiceBtn} onPress={goToPractice} activeOpacity={0.8}>
                <Icon name="quiz" size={20} color="#fff" />
                <Text style={styles.practiceBtnText}>做3道练习题</Text>
              </TouchableOpacity>

              <View style={styles.compActions}>
                <TouchableOpacity
                  style={styles.compActionBtn}
                  onPress={() => {
                    setShowCompletionPrompt(false);
                    if (videoRef.current) {
                      videoRef.current.replayAsync();
                      setPlaying(true);
                    }
                  }}
                >
                  <Icon name="replay" size={16} color="#007AFF" />
                  <Text style={styles.compActionText}>重播</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.compActionBtn}
                  onPress={() => {
                    setShowCompletionPrompt(false);
                    navigation.goBack();
                  }}
                >
                  <Icon name="arrow-back" size={16} color="#636366" />
                  <Text style={[styles.compActionText, { color: '#636366' }]}>返回</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls overlay */}
      {showControls && !showCompletionPrompt && (
        <View style={styles.controls}>
          {/* Header */}
          <View style={styles.ctrlHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ctrlBtn}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.ctrlTitle} numberOfLines={1}>{title || '视频播放'}</Text>
            <View style={styles.ctrlRight}>
              {/* Cast */}
              <TouchableOpacity onPress={() => { if(videoUrl) Linking.openURL(videoUrl); }} style={styles.ctrlBtn}>
                <Icon name="cast" size={24} color="#fff" />
              </TouchableOpacity>
              {/* Rate */}
              <TouchableOpacity onPress={() => setShowRatePicker(!showRatePicker)} style={styles.ctrlBtn}>
                <Text style={styles.rateBtn}>{rate}x</Text>
              </TouchableOpacity>
              {/* 已完成标记 */}
              {alreadyCompleted && (
                <View style={styles.completedBadge}>
                  <Icon name="check-circle" size={18} color="#34C759" />
                </View>
              )}
            </View>
          </View>

          {/* Rate picker */}
          {showRatePicker && (
            <View style={styles.ratePicker}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rateItem, rate === r && styles.rateItemActive]}
                  onPress={() => changeRate(r)}
                >
                  <Text style={[styles.rateItemText, rate === r && styles.rateItemTextActive]}>{r}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={togglePlay} style={styles.ctrlBtn}>
              <Icon name={playing ? 'pause' : 'play-arrow'} size={34} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <View style={styles.sliderWrap}>
              <View
                style={styles.sliderTrack}
                ref={(ref) => {
                  if (ref) {
                    setTimeout(() => {
                      ref.measure((x, y, w, h, pageX) => {
                        trackPageXRef.current = pageX;
                        trackWidthRef.current = w;
                      });
                    }, 0);
                  }
                }}
                {...sliderPanResponder.panHandlers}
              >
                <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 30 },
  statusText: { color: '#636366', fontSize: 15, marginTop: 12, textAlign: 'center' },
  btn: { backgroundColor: '#007AFF', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: '#8E8E93', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 12, marginTop: 10 },
  btnOutlineText: { color: '#636366', fontSize: 15 },

  videoArea: { width, height: height * 0.45, justifyContent: 'center', alignItems: 'center' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  resumeBar: {
    position:'absolute', bottom:100, alignSelf:'center', flexDirection:'row', alignItems:'center',
    backgroundColor:'rgba(0,0,0,0.8)', borderRadius:20, paddingHorizontal:16, paddingVertical:10, gap:8,
  },
  resumeText: { color:'#fff', fontSize:14, fontWeight:'500' },
  bigPlay: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  pauseOverlay: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  // ── 完成提示 ──
  completionOverlay: {
    position:'absolute', top:0, left:0, right:0, bottom:0,
    backgroundColor:'rgba(0,0,0,0.85)',
    justifyContent:'center', alignItems:'center',
    paddingHorizontal:30,
  },
  completionCard: {
    backgroundColor:'#1C1C1E', borderRadius:24, padding:28,
    alignItems:'center', width:'100%', maxWidth:340,
  },
  compIconWrap: {
    width:72, height:72, borderRadius:36, backgroundColor:'#FF9500' + '1A',
    justifyContent:'center', alignItems:'center', marginBottom:14,
  },
  compTitle: { color:'#fff', fontSize:22, fontWeight:'700', marginBottom:4 },
  compSub: { color:'#E5E5EA', fontSize:14, fontWeight:'500', marginBottom:2 },
  compHint: { color:'#8E8E93', fontSize:12, marginBottom:18 },
  compProgressBar: {
    width:'100%', height:4, backgroundColor:'rgba(255,255,255,0.12)',
    borderRadius:2, marginBottom:20, overflow:'hidden',
  },
  compProgressFill: {
    width:'100%', height:'100%', backgroundColor:'#34C759', borderRadius:2,
  },
  practiceBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center',
    backgroundColor:'#FF9500', borderRadius:14, paddingVertical:14, paddingHorizontal:32,
    width:'100%', gap:8,
    shadowColor:'#FF9500', shadowOffset:{w:0,h:4}, shadowOpacity:0.3, shadowRadius:8,
  },
  practiceBtnText: { color:'#fff', fontSize:17, fontWeight:'700' },
  compActions: {
    flexDirection:'row', marginTop:16, gap:24,
  },
  compActionBtn: {
    flexDirection:'row', alignItems:'center', gap:4, paddingVertical:6,
  },
  compActionText: { fontSize:13, fontWeight:'500', color:'#007AFF' },

  // ── 控制栏 ──
  controls: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  ctrlHeader: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 10,
  },
  ctrlBtn: { padding: 6 },
  ctrlTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', marginHorizontal: 8, textAlign: 'center' },
  ctrlRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rateBtn: { color: '#fff', fontSize: 14, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  completedBadge: { paddingHorizontal: 4 },

  ratePicker: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  rateItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  rateItemActive: { backgroundColor: '#007AFF' },
  rateItemText: { color: '#ccc', fontSize: 14, fontWeight: '500' },
  rateItemTextActive: { color: '#fff' },

  bottomControls: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 10,
  },
  timeText: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 40, textAlign: 'center' },
  sliderWrap: { flex: 1, marginHorizontal: 10, justifyContent: 'center' },
  sliderTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  sliderThumb: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', marginLeft: -8 },
});
