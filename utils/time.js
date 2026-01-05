/**
 * 播放器工具函数集合
 * 包含时间转换、播放控制、歌词处理等功能
 */
// 延迟加载 util，避免循环依赖
let utils = null;
function getUtils() {
  if (!utils) {
    utils = require('./util');
  }
  return utils;
}

// ==================== 内部状态管理 ====================
let InitialValue = true;
let InitialValue1 = true;
let loopFlag = false;

// ==================== 工具函数 ====================

/**
 * 获取 app 实例（安全获取）
 * @returns {Object|null} app 实例或 null
 */
function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    console.error('获取 app 实例失败:', e);
    return null;
  }
}

/**
 * Promise 化微信 API
 * @param {Function} fn - 微信 API 函数
 * @returns {Function} Promise 化的函数
 */
function Promisify(fn) {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = resolve;
      obj.fail = reject;
      fn(obj);
    });
  };
}

// ==================== 时间处理函数 ====================

/**
 * 秒数转换为分钟:秒格式
 * @param {number} second - 秒数
 * @returns {string} 格式化的时间字符串 (MM:SS)
 */
function MinuteConversion(second) {
  if (!second || isNaN(second)) {
    return '00:00';
  }
  const minute = Math.floor(second / 60);
  const sec = Math.floor(second % 60);
  return `${minute < 10 ? '0' + minute : minute}:${sec < 10 ? '0' + sec : sec}`;
}

/**
 * 时间字符串转换为秒数
 * @param {string} timeStr - 时间字符串 (MM:SS 或 MM:SS.mm)
 * @returns {number} 秒数
 */
function Splitseconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }
  
  // 支持 MM:SS 和 MM:SS.mm 格式
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    return 0;
  }
  
  const minutes = parseInt(parts[0]) || 0;
  const seconds = parseFloat(parts[1]) || 0;
  
  return minutes * 60 + seconds;
}

// ==================== 防抖函数 ====================

/**
 * 防抖函数工厂
 * @returns {Function} 防抖函数
 */
function debounce() {
  let timeout = null;
  return function (fn, wait = 300) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn();
      timeout = null;
    }, wait);
  };
}

// ==================== 歌词处理 ====================

/**
 * 解析歌词并设置到页面
 * @param {Object} that - 页面实例
 * @param {Object} datas - 歌曲数据
 */
function Lrcget(that, datas) {
  if (!datas || !datas.lrc) {
    that.setData({ lrc: [{ lrc: '暂无歌词', time: 0 }] });
    return;
  }

  try {
    // 统一时间格式：将 [00:00:00] 转换为 [00:00.00]
    const unifiedLrc = datas.lrc.replace(/(\d{2}:\d{2}):(\d{2})/g, '$1.$2');
    
    // 匹配统一后的格式 [分:秒.毫秒]
    const timeRegex = /\[(\d{2}:\d{2}\.\d{2})\]/g;
    const lrc = [];

    for (const line of unifiedLrc.split('\n')) {
      const timeMatch = line.match(timeRegex);
      if (!timeMatch) continue;

      // 提取时间和歌词
      const timeStr = timeMatch[0].replace(/\[|\]/g, '');
      const lyric = line.replace(timeRegex, '').trim();
      if (!lyric) continue;

      // 转换为秒数
      const seconds = Splitseconds(timeStr);
      lrc.push({ lrc: lyric, time: seconds });
    }

    // 按时间排序
    lrc.sort((a, b) => a.time - b.time);

    // 处理最后一行时间（如果没有歌词，设置为最后一行时间+60秒）
    if (lrc.length > 1) {
      lrc[lrc.length - 1].time = lrc[lrc.length - 2].time + 60;
    }

    that.setData({ lrc: lrc.length > 0 ? lrc : [{ lrc: '暂无歌词', time: 0 }] });
  } catch (error) {
    console.error('解析歌词失败:', error);
    that.setData({ lrc: [{ lrc: '暂无歌词', time: 0 }] });
  }
}

// ==================== 播放列表管理 ====================

/**
 * 保存播放列表到本地存储
 * @param {Array} arr - 歌曲数组
 */
function saveStoreSongList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return;
  }

  wx.getStorage({
    key: 'songlist',
    success: (res) => {
      // 合并并去重
      const existingList = res.data || [];
      const newSongList = [...existingList, ...arr].filter((v, i, a) => 
        a.findIndex(t => t.id === v.id) === i
      );
      
      wx.setStorage({
        key: 'songlist',
        data: newSongList,
        success: () => {
          const appInst = getAppInstance();
          if (appInst?.data?.paythis) {
            appInst.data.paythis.setData({ songList: newSongList });
          }
        },
        fail: (err) => {
          console.error('保存播放列表失败:', err);
        }
      });
    },
    fail: () => {
      // 如果没有存储，直接保存新列表
      wx.setStorage({
        key: 'songlist',
        data: arr,
        success: () => {
          const appInst = getAppInstance();
          if (appInst?.data?.paythis) {
            appInst.data.paythis.setData({ songList: arr });
          }
        },
        fail: (err) => {
          console.error('保存播放列表失败:', err);
        }
      });
    }
  });
}

/**
 * 下一首播放（插入到当前播放位置之后）
 * @param {Object} data - 包含 songlist, paythis, song 的对象
 */
function nextSongPay(data) {
  if (!data || !data.song || !data.paythis) {
    console.error('nextSongPay: 参数不完整');
    return;
  }

  const songList = Array.isArray(data.songlist) ? data.songlist : [];
  const currentIndex = data.paythis.data.ins || 0;
  
  // 如果当前正在播放该歌曲，提示用户
  if (songList[currentIndex]?.id === data.song.id) {
    wx.showToast({ title: '正在播放中', icon: 'none' });
    return;
  }

  // 查找并移除已存在的相同歌曲
  const existingIndex = songList.findIndex(item => item.id === data.song.id);
  if (existingIndex !== -1) {
    songList.splice(existingIndex, 1);
  }

  // 延迟插入，避免立即触发播放
  setTimeout(() => {
    songList.splice(currentIndex + 1, 0, data.song);
    wx.setStorage({ 
      key: 'songlist', 
      data: songList,
      success: () => {
        wx.showToast({ title: '添加成功', icon: 'success' });
      },
      fail: (err) => {
        console.error('保存播放列表失败:', err);
      }
    });
  }, 500);
}

/**
 * 新添加歌曲到歌单（已废弃，保留兼容性）
 * @param {Object} data - 包含 songlist, paythis, song 的对象
 * @returns {Array} 空数组
 */
function newAddSong(data) {
  // 此函数已废弃，直接返回空数组
  console.warn('newAddSong 函数已废弃，请使用其他方法');
  return [];
}

// ==================== 播放控制函数 ====================

/**
 * 播放下一首
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 * @param {Object} appInst - app 实例（可选）
 */
function Nextsong(that, app, appInst) {
  if (!that || !that.data || !that.data.songList) {
    console.error('Nextsong: 参数无效');
    return;
  }

  const songList = that.data.songList;
  if (songList.length <= 1) {
    return;
  }

  const currentIndex = that.data.ins || 0;
  if (currentIndex >= songList.length - 1) {
    return;
  }

  const nextSong = songList[currentIndex + 1];
  if (!nextSong) {
    return;
  }

  that.setData({ value: 0, Crack: false, lastPlayTime: 0 });
  
  const appInstance = appInst || getAppInstance();
  if (appInstance?.data) {
    appInstance.data.song = nextSong;
  }

  if (!nextSong.pic) {
    wholelist(appInstance || app);
  } else {
    const quality = that.data.currentQuality || {};
    playCore(that, app, nextSong, 1, quality.resource, quality.level);
  }
}

/**
 * 播放上一首
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 * @param {Object} appInst - app 实例（可选）
 */
function Lastsong(that, app, appInst) {
  if (!that || !that.data || !that.data.songList) {
    console.error('Lastsong: 参数无效');
    return;
  }

  const songList = that.data.songList;
  const currentIndex = that.data.ins || 0;
  
  if (currentIndex <= 0) {
    return;
  }

  const prevSong = songList[currentIndex - 1];
  if (!prevSong) {
    return;
  }

  that.setData({ value: 0, Crack: false, lastPlayTime: 0 });
  
  const appInstance = appInst || getAppInstance();
  if (appInstance?.data) {
    appInstance.data.song = prevSong;
  }

  if (!prevSong.pic) {
    wholelist(appInstance || app);
  } else {
    const quality = that.data.currentQuality || {};
    playCore(that, app, prevSong, 0, quality.resource, quality.level);
  }
}

/**
 * 随机播放
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 * @param {Object} appInst - app 实例（可选）
 */
function Randomplay(that, app, appInst) {
  if (!that || !that.data || !that.data.songList) {
    console.error('Randomplay: 参数无效');
    return;
  }

  const songList = that.data.songList;
  if (songList.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * songList.length);
  const randomSong = songList[randomIndex];
  
  if (!randomSong) {
    return;
  }

  that.setData({ value: 0, Crack: false });
  
  const appInstance = appInst || getAppInstance();
  if (appInstance?.data) {
    appInstance.data.song = randomSong;
  }

  if (!randomSong.pic) {
    wholelist(appInstance || app);
  } else {
    const quality = that.data.currentQuality || {};
    playCore(that, app, randomSong, 0, quality.resource, quality.level);
  }
}

/**
 * 暂停播放
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 */
function suspend(that, app) {
  if (!that || !app) {
    console.error('suspend: 参数无效');
    return;
  }

  InitialValue = false;
  app.pause();
  
  if (that.data.setInterval) {
    clearInterval(that.data.setInterval);
  }
  
  that.setData({ state: true, pay: "../../image/bf.png" });
  
  const appInst = getAppInstance();
  
  app.onPause(() => {
    if (appInst?.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', false);
    }
    if (appInst?.data?.paythis) {
      appInst.data.paythis.setData({ 
        pay: '../../image/bf.png', 
        state: true, 
        isPlaying: false 
      });
    }
  });
  
  app.onPlay(() => {
    if (appInst?.data?.paythis) {
      appInst.data.paythis.setData({ 
        pay: '../../image/zt.png', 
        state: false, 
        isPlaying: true 
      });
    }
    if (appInst?.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', true);
    }
  });
}

// ==================== 状态保存和读取 ====================

/**
 * 保存播放状态（已废弃，使用 app.js 中的 savePlayState）
 * @param {Object} that - 页面实例
 * @param {Object} datas - 歌曲数据
 */
function Closestate(that, datas) {
  if (!that || !datas) {
    console.error('Closestate: 参数无效');
    return;
  }

  const playState = {
    max: that.data.max || 0,
    state: that.data.state || false,
    value: that.data.value || 0,
    pay: that.data.pay || false,
    Crack: that.data.Crack || false,
    t: that.data.t || 0,
    conduct: that.data.conduct || '00:00',
    src: datas.url || datas.src || '',
    title: datas.title || '',
    coverImgUrl: datas.pic || '',
    autoplay: false,
    author: datas.author || '',
    pic: datas.pic || '',
    url: datas.url || datas.src || '',
    ins: that.data.ins || 0
  };

  wx.setStorage({ 
    key: 'lastsong', 
    data: playState,
    fail: (err) => {
      console.error('保存播放状态失败:', err);
    }
  });
}

/**
 * 读取缓存的播放状态
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 * @param {Object} appInst - app 实例（可选）
 */
function Readinfo(that, app, appInst) {
  if (!that) {
    console.error('Readinfo: 参数无效');
    return;
  }

  wx.getStorage({
    key: 'lastsong',
    success: (res) => {
      const datas = res.data;
      if (!datas) {
        return;
      }

      const appInstance = appInst || getAppInstance();
      if (appInstance?.data && datas.song) {
        appInstance.data.song = datas.song;
      }

      that.setData({
        max: datas.max || 0,
        conduct: datas.conduct || '00:00',
        title: datas.title || '',
        author: datas.author || '',
        Duration: MinuteConversion(datas.max || 0),
        src: datas.song?.src || datas.src || '',
        t: datas.t || 0,
        ins: datas.ins || 0,
        state: datas.state || false,
        song: datas.song ? { ...datas.song, readStorage: true } : null,
        lrc: datas.song?.lrc || '',
        value: datas.value || 0,
        pay: datas.pay || '../../image/bf.png',
        id: datas.id || '',
        img: datas.coverImgUrl || datas.img || ''
      });
    },
    fail: (err) => {
      console.error('读取播放状态失败:', err);
    }
  });
}

// ==================== QQ 音乐特殊处理 ====================

/**
 * QQ 音乐歌单处理（获取播放地址）
 * @param {Object} app - app 实例
 */
function wholelist(app) {
  if (!app || !app.data || !app.data.song) {
    console.error('wholelist: 参数无效');
    return;
  }

  const request = Promisify(wx.request);
  app.data.paythis.setData({ Crack: false });
  
  const songmidid = app.data.song.mid;
  const mvid = app.data.song.vid;

  if (!songmidid) {
    console.error('wholelist: 缺少歌曲 mid');
    return;
  }

  request({
    url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg`,
    data: {
      g_tk: 5381,
      inCharset: 'utf-8',
      outCharset: 'utf-8',
      notice: 0,
      format: 'jsonp',
      hostUin: 0,
      loginUin: 0,
      platform: 'yqq',
      needNewCode: 0,
      cid: 205361747,
      uin: 0,
      filename: `C400${songmidid}.m4a`,
      guid: 3913883408,
      songmid: songmidid,
      callback: 'callback'
    }
  }).then(res => {
    try {
      const res1 = res.data.replace("callback(", "");
      const res2 = JSON.parse(res1.substring(0, res1.length - 1));
      
      if (!res2.data?.items?.[0]) {
        console.error('wholelist: 获取播放地址失败');
        return;
      }

      const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`;
      
      app.data.song.src = playUrl;
      app.data.song.title = app.data.song.name || app.data.song.title;
      app.data.song.author = app.data.song.singer || app.data.song.author;
      app.data.song.pic = app.data.song.image || app.data.song.pic;

      if (!app.data.song.pic) {
        // 获取封面
        request({
          url: `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${songmidid}&tpl=yqq_song_detail&format=jsonp&callback=getOneSongInfoCallback&g_tk=5381&jsonpCallback=getOneSongInfoCallback&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`
        }).then(res => {
          try {
            const data = res.data.replace('getOneSongInfoCallback(', '');
            const songData = JSON.parse(data.substring(0, data.length - 1));
            
            if (songData.data?.[0]?.album?.mid) {
              app.data.song.pic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${songData.data[0].album.mid}.jpg?max_age=2592000`;
            }
            
            // 处理 MV
            if (mvid) {
              request({ url: `https://v1.itooi.cn/tencent/mv?id=${mvid}` }).then(rev => {
                try {
                  const mvData = rev.data.data;
                  if (mvData && Object.keys(mvData).length > 0) {
                    const firstKey = Object.keys(mvData)[0];
                    const mvInfo = mvData[firstKey];
                    if (mvInfo?.gmid) {
                      app.data.song.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${mvInfo.gmid}&quality=270`;
                      app.data.paythis.setData({ Mvsrc: app.data.song.Mvsrc, value: 0 });
                    }
                  }
                  playCore(app.data.paythis, app.innerAudioContext, app.data.song);
                } catch (err) {
                  console.error('获取 MV 信息失败:', err);
                  app.data.paythis.setData({ Mvsrc: '', value: 0 });
                  playCore(app.data.paythis, app.innerAudioContext, app.data.song);
                }
              }).catch(err => {
                console.error('请求 MV 信息失败:', err);
                app.data.paythis.setData({ Mvsrc: '', value: 0 });
                playCore(app.data.paythis, app.innerAudioContext, app.data.song);
              });
            } else {
              app.data.paythis.setData({ Mvsrc: '', value: 0 });
              playCore(app.data.paythis, app.innerAudioContext, app.data.song);
            }
          } catch (err) {
            console.error('解析歌曲信息失败:', err);
            app.data.paythis.setData({ Mvsrc: '', value: 0 });
            playCore(app.data.paythis, app.innerAudioContext, app.data.song);
          }
        }).catch(err => {
          console.error('请求歌曲信息失败:', err);
          app.data.paythis.setData({ Mvsrc: '', value: 0 });
          playCore(app.data.paythis, app.innerAudioContext, app.data.song);
        });
      } else {
        app.data.paythis.setData({ value: 0 });
        playCore(app.data.paythis, app.innerAudioContext, app.data.song);
      }
    } catch (err) {
      console.error('解析播放地址失败:', err);
    }
  }).catch(err => {
    console.error('请求播放地址失败:', err);
  });
}

// ==================== 核心播放方法 ====================

/**
 * 核心播放方法（支持音质切换）
 * @param {Object} that - 页面实例
 * @param {Object} app - 音频上下文
 * @param {Object} datas - 歌曲数据
 * @param {number} restart - 是否重新开始（0/1）
 * @param {number} resource - 资源类型（可选）
 * @param {number} level - 音质等级（可选）
 */
async function playCore(that, app, datas, restart, resource = null, level = null) {
  if (!that || !app || !datas) {
    console.error('playCore: 参数无效');
    return;
  }

  const appInst = getAppInstance();
  
  // 设置播放/暂停事件监听
  setupPlaybackListeners(app, appInst);
  
  // 单曲循环处理
  if (that.data.songList?.length === 1) {
    that.setData({ loopstate: 1 });
  }

  // 同一首歌继续播放（相同音质）
  if (that.data.song && datas && 
      that.data.song.id === datas.id && 
      !loopFlag && 
      level === that.data.beforeCurrentQuality?.level) {
    
    if (that.data.state) {
      // 继续播放
      if (!app._onTimeUpdateHandler || !app._onEndedHandler) {
        if (that.data.song.readStorage) {
          setupAudioProperties(app, datas);
          app.onCanplay(() => {
            if (InitialValue && InitialValue1) {
              app.seek(that.data.value || 0);
              InitialValue1 = false;
            }
          });
          Lrcget(that, datas);
          emitSongChanged(appInst, datas);
        }
        bindTimeUpdateHandler(that, app, datas);
        bindEndedHandler(that, app);
      }
      app.play();
      return;
    } else {
      wx.showToast({ title: '该歌曲正在播放中', icon: 'none' });
      return;
    }
  } 
  
  // 循环播放
  if (loopFlag) {
    setupAudioProperties(app, datas);
    app.seek(0);
    app.play();
    loopFlag = false;
    return;
  }

  // 重置进度
  that.setData({ value: 0, max: 0, Duration: '00:00', conduct: '00:00' });

  // 获取音频资源
  await loadAudioResource(that, app, datas, resource, level, appInst);
  
  // 解绑旧事件
  unbindOldHandlers(app);
  
  // 绑定新事件
  bindTimeUpdateHandler(that, app, datas);
  bindEndedHandler(that, app, appInst);
  
  // 绑定系统控制事件
  bindSystemControls(that, app, appInst);
  
  // 启动播放
  app.play();
}

/**
 * 设置播放/暂停事件监听
 */
function setupPlaybackListeners(app, appInst) {
  app.onPause(() => {
    if (appInst?.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', false);
    }
    if (appInst?.data?.paythis) {
      appInst.data.paythis.setData({ 
        pay: '../../image/bf.png', 
        state: true, 
        isPlaying: false 
      });
    }
    if (wx.getAppBaseInfo().version > '8.0.47' && appInst?.data?.song) {
      app.title = appInst.data.song?.title;
      app.singer = appInst.data.song?.author;
    }
  });

  app.onPlay(() => {
    if (appInst?.data?.paythis) {
      appInst.data.paythis.setData({ 
        pay: '../../image/zt.png', 
        state: false, 
        isPlaying: true 
      });
    }
    if (appInst?.eventBus) {
      appInst.eventBus.emit('updatePlayStatus', true);
    }
  });
}

/**
 * 设置音频属性
 */
function setupAudioProperties(app, datas) {
  app.src = datas.src;
  app.title = datas.title;
  app.coverImgUrl = datas.pic;
  app.singer = datas.author;
}

/**
 * 触发歌曲改变事件
 */
function emitSongChanged(appInst, datas) {
  if (appInst?.eventBus) {
    appInst.eventBus.emit("songChanged", datas);
  }
}

/**
 * 绑定时间更新处理器
 */
function bindTimeUpdateHandler(that, app, datas) {
  app._onTimeUpdateHandler = function () {
    if (that.data.song?.id !== datas.id) return;
    
    that.setData({
      Duration: MinuteConversion(app.duration),
      max: app.duration,
      value: app.currentTime,
      t: app.currentTime,
      conduct: MinuteConversion(app.currentTime)
    });

    // 歌词滚动
    updateLyricDisplay(that, app, datas);
  };
  
  app.onTimeUpdate(app._onTimeUpdateHandler);
}

/**
 * 更新歌词显示
 */
function updateLyricDisplay(that, app, datas) {
  if (!that.data.lrc || that.data.lrc.length <= 1) {
    return;
  }

  const currentTime = that.data.t;
  const lrc = that.data.lrc;

  for (let i = 0; i < lrc.length; i++) {
    if (i < lrc.length - 1 &&
        lrc[i + 1].time > currentTime &&
        lrc[i].time < currentTime &&
        i !== that.data.toLineNum && 
        !that.data.isScroll) {
      that.setData({ toLineNum: i });
      
      if (wx.getAppBaseInfo().version > '8.0.47') {
        app.title = lrc[i].lrc;
        app.singer = `${datas.title} - ${datas.author}`;
      }
      break;
    }
  }
}

/**
 * 绑定结束事件处理器
 */
function bindEndedHandler(that, app, appInst) {
  app._onEndedHandler = function () {
    const loopstate = that.data.loopstate || 0;
    
    if (loopstate === 0) {
      // 顺序播放
      that.onNext?.();
    } else if (loopstate === 1) {
      // 单曲循环
      loopFlag = true;
      that.setData({ value: 0 });
      const quality = that.data.currentQuality || {};
      playCore(that, app, that.data.song, 0, quality.resource, quality.level);
    } else {
      // 随机播放
      Randomplay(that, app, appInst);
    }
  };
  
  app.onEnded(app._onEndedHandler);
}

/**
 * 绑定系统控制事件
 */
function bindSystemControls(that, app, appInst) {
  app.onNext(() => {
    if (that.data.songList.length - 1 > that.data.ins) {
      Nextsong(that, app, appInst);
    } else {
      that.setData({ ins: -1 });
      Nextsong(that, app, appInst);
    }
  });

  app.onPrev(() => {
    if (that.data.ins > 0) {
      Lastsong(that, app, appInst);
    } else {
      const songlistLength = appInst?.data?.songlist?.length || 0;
      that.setData({ ins: songlistLength });
      Lastsong(that, app, appInst);
    }
  });
}

/**
 * 解绑旧的事件处理器
 */
function unbindOldHandlers(app) {
  if (app._onTimeUpdateHandler && app.offTimeUpdate) {
    app.offTimeUpdate(app._onTimeUpdateHandler);
  }
  if (app._onEndedHandler && app.offEnded) {
    app.offEnded(app._onEndedHandler);
  }
}

/**
 * 加载音频资源
 */
async function loadAudioResource(that, app, datas, resource, level, appInst) {
  return new Promise((resolve) => {
    wx.showLoading({ title: '加载中' });
    
    const utils = getUtils();
    utils.errorSong(5, datas, resource, level, async (e) => {
      if (e.stauts) {
        loopFlag = false;
        
        // 更新全局歌曲数据
        if (appInst?.data) {
          appInst.data.song = { ...e, id: datas.id };
        }
        
        // 更新歌曲数据
        datas.src = e.src;
        if (e.lrc) datas.lrc = e.lrc;
        if (e.pic) datas.pic = e.pic;
        if (e.newid) datas.newid = e.newid;

        // 设置音频属性
        setupAudioProperties(app, datas);

        // 保存到播放列表
        saveStoreSongList([datas]);
        
        // 触发歌曲改变事件
        emitSongChanged(appInst, datas);
        
        // 音质切换时恢复播放位置
        if (that.data.paythis && app && 
            that.data.beforeCurrentQuality?.level !== level) {
          app.onCanplay(() => {
            app.seek(that.data.lastPlayTime || 0);
          });
        }

        // 更新页面数据
        that.setData({
          title: datas.title,
          song: datas,
          author: datas.author,
          img: datas.pic,
          beforeCurrentQuality: that.data.currentQuality,
          ins: (that.data.songList || []).findIndex(i => i.id === datas.id)
        });
        
        // 处理歌词
        if (e.lrc) {
          Lrcget(that, datas);
        }

        // 播放
        app.play();
        wx.hideLoading();
        resolve();
      } else {
        // 加载失败，播放下一首
        that.Next?.();
        wx.hideLoading();
        resolve();
      }
    });
  });
}

// ==================== 导出 ====================

module.exports = {
  saveStoreSongList,
  debounce,
  MinuteConversion,
  suspend,
  Nextsong,
  Lastsong,
  Splitseconds,
  Lrcget,
  wholelist,
  Closestate,
  Readinfo,
  Promisify,
  newAddSong,
  nextSongPay,
  playCore,
  Randomplay
};
