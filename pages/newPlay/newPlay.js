const time = require('../../utils/time.js');
const app = getApp();
const playHistory = require('../../utils/playHistory');

Page({
  data: {
    // 歌词相关
    showLyric: false,
    lrc: [{ lrc: '暂无歌词' }],
    toLineNum: 0,
    scrollTop: 10,
    progressPercent: 0,
    windowHeight: 0,

    // 进度条相关
    sliderProgress: 0,
    isDragging: false,
    sliderStartX: 0,
    sliderLeft: 0,
    sliderWidth: 0,

    // 歌曲信息
    currentSong: {
      name: "海阔天空",
      singer: "Beyond",
      cover: "/image/cover.jpg",
      url: "",
      duration: 298,
      id: ""
    },
    title: "海阔天空",
    author: "Beyond",
    img: "/image/cover.jpg",
    currentTime: 0,
    conduct: "00:00",
    Duration: "04:58",
    duration: 298,

    // 播放状态
    isPlaying: false,
    loopMode: 0,
    loopstate: 0,

    // 播放列表
    showPlayList: false,
    songList: [],
    ins: 0,

    // 音质切换相关（4个选项，新参数规则）
    qualityList: [
      { text: '默认', resource: null, level: null },   // 默认：不传递参数
      { text: '低品质', resource: 2, level: 1 },      // 低品质：resource=2&level=1
      { text: '高品质', resource: 2, level: 2 },      // 高品质：resource=2&level=2
      { text: '无损音质', resource: 2, level: 3 }     // 无损音质：resource=2&level=3
    ],
    currentQuality: { text: '默认', resource: null, level: null },
    beforeCurrentQuality: { text: '默认', resource: null, level: null },
    showQualityPopup: false,
    isChangingQuality: false,
    lastPlayTime: 0,

    // 定时器
    progressTimer: null,
    lyricTimer: null
  },
  
  onLoad() {
    const { windowHeight } = wx.getSystemInfoSync();
    this.setData({ windowHeight });
    
    // 处理setData兼容
    const rawSetData = this.setData;
    this.setData = (obj, callback) => {
      if (obj.lrc) obj.lyricList = obj.lrc;
      if (obj.value !== undefined) {
        obj.currentTime = obj.value;
        obj.conduct = this.formatTime(obj.value);
        if (!this.data.isDragging) {
          obj.sliderProgress = (obj.value / obj.max * 100) || 0;
        }
      }
      if (obj.max !== undefined) {
        obj.duration = obj.max;
        obj.Duration = this.formatTime(obj.max);
      }
      if (obj.state !== undefined) obj.isPlaying = !obj.state;
      obj.currentSong = {
        ...this.data.currentSong,
        cover: obj.img || this.data.currentSong.cover
      };
      return rawSetData.call(this, obj, callback);
    };
    
    app.data.paythis = this;
    
    if (app.data.song) {
      this.setData({ 
        currentSong: app.data.song,
        title: app.data.song.name,
        author: app.data.song.singer,
        img: app.data.song.cover
      });
    }
    
    time.Readinfo(this, app.innerAudioContext, app);
    this.measureSlider();
    
    // 监听歌曲变化事件，添加播放历史
    app.eventBus.on('songChanged', this.onSongChanged.bind(this));
  },
  
  onShow() {
    const songList = wx.getStorageSync('songlist') || [];
    app.data.songlist = songList;
    this.setData({ songList });
    
    // 恢复播放状态：检查背景音频是否正在播放
    this.restorePlayState();
  },
  
  /**
   * 恢复播放状态
   * 当小程序重新进入时，如果背景音频还在播放，需要恢复页面显示
   * 优先从背景音频管理器获取实际状态，处理系统控制栏操作的情况
   */
  restorePlayState() {
    const audioContext = app.innerAudioContext;
    
    // 检查背景音频是否有音频源（表示正在播放或暂停中）
    if (audioContext && audioContext.src) {
      // 优先从背景音频管理器获取实际状态
      const actualTitle = audioContext.title || '';
      const actualSinger = audioContext.singer || '';
      const actualCover = audioContext.coverImgUrl || '';
      const actualSrc = audioContext.src || '';
      const actualCurrentTime = audioContext.currentTime || 0;
      const actualDuration = audioContext.duration || 0;
      
      // 从本地存储读取上次的播放状态（作为参考）
      wx.getStorage({
        key: 'lastsong',
        success: (res) => {
          const savedState = res.data;
          
          // 从播放列表中查找当前播放的歌曲（通过 src 匹配）
          let currentSong = null;
          let currentIndex = savedState?.ins || 0;
          
          // 尝试通过 src 匹配找到当前歌曲
          if (this.data.songList && this.data.songList.length > 0) {
            const matchedIndex = this.data.songList.findIndex(song => {
              return song.src === actualSrc || 
                     (savedState && song.id === savedState.id) ||
                     (actualTitle && song.title === actualTitle);
            });
            
            if (matchedIndex >= 0) {
              currentSong = this.data.songList[matchedIndex];
              currentIndex = matchedIndex;
            } else if (savedState && savedState.song) {
              // 如果找不到匹配的歌曲，使用保存的歌曲信息
              currentSong = savedState.song;
            }
          }
          
          // 如果还是找不到，尝试从保存的状态恢复
          if (!currentSong && savedState) {
            currentSong = savedState.song || {
              id: savedState.id,
              name: savedState.title,
              singer: savedState.author,
              cover: savedState.coverImgUrl || savedState.img,
              src: savedState.src || actualSrc,
              duration: savedState.max || actualDuration
            };
          }
          
          // 如果仍然找不到，使用背景音频管理器的信息
          if (!currentSong) {
            currentSong = {
              id: '',
              name: actualTitle,
              singer: actualSinger,
              cover: actualCover,
              src: actualSrc,
              duration: actualDuration
            };
          }
          
          // 更新歌曲信息（优先使用背景音频管理器的实际信息）
          const song = {
            ...currentSong,
            name: actualTitle || currentSong.name || currentSong.title,
            singer: actualSinger || currentSong.singer || currentSong.author,
            cover: actualCover || currentSong.cover || currentSong.pic || currentSong.img,
            src: actualSrc || currentSong.src,
            duration: actualDuration || currentSong.duration || currentSong.max || 0
          };
          
          // 更新全局歌曲数据
          app.data.song = song;
          
          // 获取当前播放进度（优先使用背景音频管理器的实际进度）
          const currentTime = actualCurrentTime || savedState?.value || 0;
          const duration = actualDuration || savedState?.max || 0;
          
          // 判断播放状态：通过检查背景音频管理器的状态
          // 注意：微信小程序没有直接的 paused 属性，需要通过其他方式判断
          // 我们通过检查时间是否在更新来判断播放状态
          // 先使用保存的状态作为初始值，然后在事件绑定后通过时间更新来验证
          let isPlaying = savedState?.state === false; // 默认使用保存的状态
          
          // 恢复页面状态（使用实际找到的歌曲和索引）
          this.setData({
            currentSong: {
              name: song.name || song.title || actualTitle,
              singer: song.singer || song.author || actualSinger,
              cover: song.cover || song.pic || song.img || actualCover,
              url: song.src || actualSrc,
              duration: duration,
              id: song.id || ''
            },
            title: song.name || song.title || actualTitle,
            author: song.singer || song.author || actualSinger,
            img: song.cover || song.pic || song.img || actualCover,
            currentTime: currentTime,
            conduct: this.formatTime(currentTime),
            Duration: this.formatTime(duration),
            duration: duration,
            isPlaying: isPlaying,
            sliderProgress: duration > 0 ? (currentTime / duration * 100) : 0,
            ins: currentIndex, // 使用实际找到的索引
            song: { ...song, readStorage: true }, // 设置 song 数据，playCore 会检查它
            state: !isPlaying // state: false表示播放中，true表示暂停
          });
          
          // 无论播放状态如何，都需要重新绑定事件以确保进度更新和状态同步
          // 因为用户可能通过系统控制栏操作了播放/暂停/切换歌曲
          if (app.data.paythis === this && song && audioContext.src) {
            // 延迟一下，确保音频上下文和页面数据已准备好
            setTimeout(() => {
              // 重新绑定事件（无论音频源是否匹配，都需要绑定以确保状态同步）
              if (audioContext.src) {
                // 解绑旧事件（如果存在）
                if (audioContext._onTimeUpdateHandler && audioContext.offTimeUpdate) {
                  audioContext.offTimeUpdate(audioContext._onTimeUpdateHandler);
                }
                if (audioContext._onEndedHandler && audioContext.offEnded) {
                  audioContext.offEnded(audioContext._onEndedHandler);
                }
                
                // 直接绑定时间更新事件
                // 注意：时间更新事件只有在播放时才会触发，暂停时不会触发
                audioContext._onTimeUpdateHandler = () => {
                  // 时间更新事件触发，说明正在播放，同步播放状态
                  if (app.data.paythis === this && !this.data.isPlaying) {
                    this.setData({ 
                      state: false, 
                      isPlaying: true 
                    });
                  }
                  
                  // 获取当前实际播放的歌曲信息（从背景音频管理器）
                  const currentSrc = audioContext.src || '';
                  const currentTitle = audioContext.title || '';
                  
                  // 检查是否是当前播放的歌曲（通过 src 或 title 匹配）
                  // 如果歌曲已切换，需要更新页面显示的歌曲信息
                  if (currentSrc && currentSrc !== this.data.currentSong?.url) {
                    // 歌曲已切换，需要查找新歌曲并更新页面
                    const newSongIndex = this.data.songList?.findIndex(s => 
                      s.src === currentSrc || s.title === currentTitle
                    );
                    
                    if (newSongIndex >= 0) {
                      const newSong = this.data.songList[newSongIndex];
                      app.data.song = newSong;
                      this.setData({
                        currentSong: {
                          name: newSong.name || newSong.title,
                          singer: newSong.singer || newSong.author,
                          cover: newSong.cover || newSong.pic || newSong.img,
                          url: newSong.src,
                          duration: audioContext.duration || newSong.duration || 0,
                          id: newSong.id || ''
                        },
                        title: newSong.name || newSong.title,
                        author: newSong.singer || newSong.author,
                        img: newSong.cover || newSong.pic || newSong.img,
                        ins: newSongIndex,
                        song: { ...newSong, readStorage: true }
                      });
                    }
                  }
                  
                  const currentTime = audioContext.currentTime || 0;
                  const duration = audioContext.duration || 0;
                  
                  this.setData({
                    Duration: this.formatTime(duration),
                    max: duration,
                    value: currentTime,
                    t: currentTime,
                    conduct: this.formatTime(currentTime),
                    currentTime: currentTime,
                    duration: duration,
                    sliderProgress: duration > 0 ? (currentTime / duration * 100) : 0
                  });
                  
                  // 更新歌词显示
                  if (this.data.lrc && this.data.lrc.length > 1) {
                    const lrc = this.data.lrc;
                    for (let i = 0; i < lrc.length; i++) {
                      if (i < lrc.length - 1 &&
                          lrc[i + 1].time > currentTime &&
                          lrc[i].time < currentTime &&
                          i !== this.data.toLineNum) {
                        this.setData({ toLineNum: i });
                        break;
                      }
                    }
                  }
                };
                
                // 绑定结束事件
                audioContext._onEndedHandler = () => {
                  const loopstate = this.data.loopstate || 0;
                  
                  if (loopstate === 0) {
                    // 顺序播放
                    this.onNext?.();
                  } else if (loopstate === 1) {
                    // 单曲循环
                    this.setData({ value: 0 });
                    const quality = this.data.currentQuality || {};
                    time.playCore(this, audioContext, this.data.song, 0, quality.resource, quality.level);
                  } else {
                    // 随机播放
                    time.Randomplay(this, audioContext, app);
                  }
                };
                
                // 注册事件监听
                audioContext.onTimeUpdate(audioContext._onTimeUpdateHandler);
                audioContext.onEnded(audioContext._onEndedHandler);
                
                // 绑定播放/暂停事件监听器（确保播放状态正确更新）
                // 注意：需要先解绑旧的事件监听器，避免重复绑定
                if (audioContext._onPlayHandler && audioContext.offPlay) {
                  audioContext.offPlay(audioContext._onPlayHandler);
                }
                if (audioContext._onPauseHandler && audioContext.offPause) {
                  audioContext.offPause(audioContext._onPauseHandler);
                }
                
                audioContext._onPlayHandler = () => {
                  if (app.data.paythis === this) {
                    this.setData({ 
                      state: false, 
                      isPlaying: true 
                    });
                  }
                  if (app.eventBus) {
                    app.eventBus.emit('updatePlayStatus', true);
                  }
                };
                
                audioContext._onPauseHandler = () => {
                  if (app.eventBus) {
                    app.eventBus.emit('updatePlayStatus', false);
                  }
                  if (app.data.paythis === this) {
                    this.setData({ 
                      state: true, 
                      isPlaying: false 
                    });
                  }
                };
                
                audioContext.onPlay(audioContext._onPlayHandler);
                audioContext.onPause(audioContext._onPauseHandler);
                
                // 在事件绑定后，通过检查时间更新来判断实际播放状态
                // 如果音频正在播放，时间更新事件会持续触发；如果暂停，时间更新事件不会触发
                // 我们通过检查一段时间内时间是否变化来判断
                let checkTimeTimer = null;
                const checkPlayState = () => {
                  const checkTime = audioContext.currentTime || 0;
                  const checkDuration = audioContext.duration || 0;
                  
                  if (checkDuration > 0 && app.data.paythis === this) {
                    // 延迟检查，如果时间在更新，说明正在播放
                    setTimeout(() => {
                      const newCheckTime = audioContext.currentTime || 0;
                      const timeChanged = Math.abs(newCheckTime - checkTime) > 0.2; // 允许0.2秒的误差
                      
                      // 根据时间是否变化来更新播放状态
                      if (timeChanged) {
                        // 时间在更新，说明正在播放
                        if (!this.data.isPlaying) {
                          this.setData({ 
                            state: false, 
                            isPlaying: true 
                          });
                        }
                      } else {
                        // 时间没有变化，可能是暂停状态
                        // 但如果时间接近0或接近duration，也可能是刚开始或刚结束
                        if (checkTime > 1 && checkTime < checkDuration - 1) {
                          // 时间在中间位置但没有变化，说明是暂停状态
                          if (this.data.isPlaying) {
                            this.setData({ 
                              state: true, 
                              isPlaying: false 
                            });
                          }
                        }
                      }
                    }, 800); // 延迟800ms检查，给足够的时间让时间更新事件触发
                  }
                };
                
                // 立即检查一次
                checkPlayState();
                
                // 如果时间更新事件没有触发（说明可能是暂停状态），再次检查
                checkTimeTimer = setTimeout(() => {
                  if (app.data.paythis === this && this.data.isPlaying) {
                    // 如果标记为播放但时间更新事件没有触发，可能是暂停状态
                    const currentTime = audioContext.currentTime || 0;
                    const duration = audioContext.duration || 0;
                    
                    // 如果时间在中间位置，说明可能是暂停状态
                    if (duration > 0 && currentTime > 1 && currentTime < duration - 1) {
                      // 再次检查时间是否变化
                      setTimeout(() => {
                        const newTime = audioContext.currentTime || 0;
                        if (Math.abs(newTime - currentTime) < 0.1) {
                          // 时间没有变化，确认是暂停状态
                          this.setData({ 
                            state: true, 
                            isPlaying: false 
                          });
                        }
                      }, 500);
                    }
                  }
                }, 1500);
                
                // 绑定系统控制事件（上一曲/下一曲）
                // 注意：需要先解绑旧的事件监听器，避免重复绑定
                if (audioContext._onNextHandler && audioContext.offNext) {
                  audioContext.offNext(audioContext._onNextHandler);
                }
                if (audioContext._onPrevHandler && audioContext.offPrev) {
                  audioContext.offPrev(audioContext._onPrevHandler);
                }
                
                audioContext._onNextHandler = () => {
                  // 系统控制栏点击下一曲，需要更新页面状态
                  setTimeout(() => {
                    // 延迟一下，等待歌曲切换完成
                    const currentSrc = audioContext.src || '';
                    const currentTitle = audioContext.title || '';
                    
                    // 查找当前播放的歌曲
                    const newSongIndex = this.data.songList?.findIndex(s => 
                      s.src === currentSrc || s.title === currentTitle
                    );
                    
                    if (newSongIndex >= 0) {
                      const newSong = this.data.songList[newSongIndex];
                      app.data.song = newSong;
                      this.setData({
                        currentSong: {
                          name: newSong.name || newSong.title,
                          singer: newSong.singer || newSong.author,
                          cover: newSong.cover || newSong.pic || newSong.img,
                          url: newSong.src,
                          duration: audioContext.duration || newSong.duration || 0,
                          id: newSong.id || ''
                        },
                        title: newSong.name || newSong.title,
                        author: newSong.singer || newSong.author,
                        img: newSong.cover || newSong.pic || newSong.img,
                        ins: newSongIndex,
                        song: { ...newSong, readStorage: true }
                      });
                    }
                  }, 500);
                  
                  if (this.data.songList.length - 1 > this.data.ins) {
                    time.Nextsong(this, audioContext, app);
                  } else {
                    this.setData({ ins: -1 });
                    time.Nextsong(this, audioContext, app);
                  }
                };
                
                audioContext._onPrevHandler = () => {
                  // 系统控制栏点击上一曲，需要更新页面状态
                  setTimeout(() => {
                    // 延迟一下，等待歌曲切换完成
                    const currentSrc = audioContext.src || '';
                    const currentTitle = audioContext.title || '';
                    
                    // 查找当前播放的歌曲
                    const newSongIndex = this.data.songList?.findIndex(s => 
                      s.src === currentSrc || s.title === currentTitle
                    );
                    
                    if (newSongIndex >= 0) {
                      const newSong = this.data.songList[newSongIndex];
                      app.data.song = newSong;
                      this.setData({
                        currentSong: {
                          name: newSong.name || newSong.title,
                          singer: newSong.singer || newSong.author,
                          cover: newSong.cover || newSong.pic || newSong.img,
                          url: newSong.src,
                          duration: audioContext.duration || newSong.duration || 0,
                          id: newSong.id || ''
                        },
                        title: newSong.name || newSong.title,
                        author: newSong.singer || newSong.author,
                        img: newSong.cover || newSong.pic || newSong.img,
                        ins: newSongIndex,
                        song: { ...newSong, readStorage: true }
                      });
                    }
                  }, 500);
                  
                  if (this.data.ins > 0) {
                    time.Lastsong(this, audioContext, app);
                  } else {
                    const songlistLength = app.data.songlist?.length || 0;
                    this.setData({ ins: songlistLength });
                    time.Lastsong(this, audioContext, app);
                  }
                };
                
                audioContext.onNext(audioContext._onNextHandler);
                audioContext.onPrev(audioContext._onPrevHandler);
                
                console.log('播放状态恢复：事件已重新绑定');
              }
            }, 300);
          }
        },
        fail: (err) => {
          console.log('读取播放状态失败:', err);
          // 即使读取失败，也尝试从背景音频管理器恢复基本信息
          if (audioContext.src && audioContext.title) {
            this.setData({
              title: audioContext.title,
              author: audioContext.singer || '',
              img: audioContext.coverImgUrl || ''
            });
          }
        }
      });
    } else {
      // 如果没有音频源，尝试从本地存储恢复（可能是暂停状态）
      time.Readinfo(this, audioContext, app);
    }
  },

  /**
   * 歌曲变化事件处理
   */
  async onSongChanged(song) {
    if (song && song.id) {
      // 添加播放历史记录
      await playHistory.add({
        id: song.id,
        title: song.title || song.name,
        singer: song.author || song.singer,
        pic: song.pic || song.img || song.cover
      });
    }
  },
  
  // 播放/暂停
  async onPlayPause() {
    if (this.data.isPlaying) {
      time.suspend(this, app.innerAudioContext);
    } else {
      // 如果当前有歌曲，添加播放历史
      if (app.data.song && app.data.song.id) {
        await playHistory.add({
          id: app.data.song.id,
          title: app.data.song.title || app.data.song.name,
          singer: app.data.song.author || app.data.song.singer,
          pic: app.data.song.pic || app.data.song.img || app.data.song.cover
        });
      }
      
      time.playCore(
        this, 
        app.innerAudioContext, 
        app.data.song, 
        false, 
        this.data.currentQuality.resource,
        this.data.currentQuality.level
      );
    }
  },
  
 // 上一曲
  onPrev() {
    if (this.data.songList.length === 1) {
      return;
    }
    if (this.data.Mv || !this.data.songList.length) {
      return;
    }
    if (this.data.ins > 0) {
      time.Lastsong(this, app.innerAudioContext, app);
    } else {
      this.setData({
        ins: app.data.songlist.length
      });
      time.Lastsong(this, app.innerAudioContext, app);
    }
  },
  
  // 下一曲
  onNext() {
    if (this.data.songList.length === 1) {
      return;
    }
    if (this.data.Mv || !this.data.songList.length) {
      return;
    }
    if (this.data.songList.length - 1 > this.data.ins) {
      time.Nextsong(this, app.innerAudioContext, app);
    } else {
      this.setData({
        ins: 1
      });
      time.Lastsong(this, app.innerAudioContext, app);
    }
  },
  
  // 切换循环模式
  onLoop() {
    let loopMode = (this.data.loopstate + 1) % 3;
    const modeText = ["顺序播放", "单曲循环", "随机播放"][loopMode];
    wx.showToast({ title: modeText, icon: "none" });
    this.setData({ loopstate: loopMode });
  },
  
  // 切换歌词显示
  toggleLyric() {
    this.setData({ showLyric: !this.data.showLyric });
  },
  
  // 播放列表控制
  showPlayList() { this.setData({ showPlayList: true }); },
  hidePlayList() { this.setData({ showPlayList: false }); },
  
  // 清空播放列表
  closeList() {
    wx.showModal({
      title: '提示',
      content: '确定清空列表吗?',
      complete: (res) => {
        if (res.confirm) {
          wx.setStorageSync('songlist', []);
          this.setData({ songList: [] });
        }
      }
    });
  },
  
  // 切换歌曲
  async switchSong(e) {
    const index = e.currentTarget.dataset.index;
    // if (index === this.data.ins) return;

    this.setData({ ins: index });
    const song = this.data.songList[index];
    app.data.song = song;
    
    this.setData({
      title: song.title,
      author: song.author,
      img: song.img,
      lastPlayTime: 0,
    });
    
    // 添加播放历史
    await playHistory.add({
      id: song.id,
      title: song.title || song.name,
      singer: song.author || song.singer,
      pic: song.pic || song.img || song.cover
    });
    
    // 更新全局状态
    app.globalData.song = song;
    
    time.playCore(
      this, 
      app.innerAudioContext, 
      song, 
      1, 
      this.data.currentQuality.resource,
      this.data.currentQuality.level
    );
    
    // 关闭播放列表
    this.setData({ showPlayList: false });
    this.hidePlayList();
  },
  
  // 进度条测量
  measureSlider() {
    const query = wx.createSelectorQuery();
    query.select('.progress-bar').boundingClientRect(rect => {
      if (rect) {
        this.setData({
          sliderWidth: rect.width,
          sliderLeft: rect.left
        });
      }
    }).exec();
  },
  
  // 滑块触摸事件
  onSliderTouchStart(e) {
    this.setData({
      isDragging: true,
      sliderStartX: e.touches[0].clientX
    });
  },
  
  onSliderTouchMove(e) {
    if (!this.data.isDragging) return;
    
    const moveX = e.touches[0].clientX - this.data.sliderLeft;
    let percent = (moveX / this.data.sliderWidth) * 100;
    percent = Math.max(0, Math.min(100, percent));
    
    this.setData({ sliderProgress: percent });
  },
  
  onSliderTouchEnd(e) {
    if (!this.data.isDragging) return;
    
    this.setData({ isDragging: false });
    const endX = e.changedTouches[0].clientX - this.data.sliderLeft;
    const percent = Math.max(0, Math.min(100, (endX / this.data.sliderWidth) * 100));
    const targetTime = (percent / 100) * this.data.duration;
    
    this.setData({
      currentTime: targetTime,
      conduct: this.formatTime(targetTime),
      sliderProgress: percent
    });
    
    app.innerAudioContext.seek(targetTime);
    app.innerAudioContext.play();
  },
  
  // 格式化时间
  formatTime(seconds) {
    return time.MinuteConversion(seconds);
  },
  
  // 返回
  onBack() {
    wx.navigateBack();
  },
  
  // 删除歌曲
  deleteSong(e) {
    const songIndex = e.currentTarget.dataset.songindex;
    const song = this.data.songList[songIndex];
    
    wx.showModal({
      title: '提示',
      content: `确定删除"${song.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          let songList = this.data.songList;
          songList.splice(songIndex, 1);
          
          this.setData({ songList });
          wx.setStorageSync('songlist', songList);
          
          if (songIndex === this.data.ins) {
            if (songList.length > 0) {
              const nextIndex = songIndex >= songList.length ? 0 : songIndex;
              this.setData({ ins: nextIndex });
              time.playCore(
                this, 
                app.innerAudioContext, 
                songList[nextIndex], 
                false, 
                this.data.currentQuality.resource,
                this.data.currentQuality.level
              );
            } else {
              time.suspend(this, app.innerAudioContext);
              this.setData({ isPlaying: false });
            }
          } else if (songIndex < this.data.ins) {
            this.setData({ ins: this.data.ins - 1 });
          }
        }
      }
    });
  },
  
  // 音质切换相关
  toggleQualityPopup() {
    this.setData({ showQualityPopup: !this.data.showQualityPopup });
  },
  
  chooseQuality(e) {
    if(this.data.song?.id === undefined){
      wx.showToast({
        title: '请先选择歌曲',
        icon: 'none'
      });
      this.setData({ showQualityPopup: false });
      return;
    };
    const selectedQuality = e.currentTarget.dataset.quality;
    const currentSong = this.data.songList[this.data.ins];
    // 保存当前进度
    this.setData({
      lastPlayTime: app.innerAudioContext.currentTime || 0,
      isChangingQuality: true,
      currentQuality: selectedQuality,
      showQualityPopup: false
    });

    // 暂停当前播放并切换音质（传递resource和level参数）
    time.suspend(this, app.innerAudioContext);
    time.playCore(
      this, 
      app.innerAudioContext, 
      app.data.song, 
      false, 
      selectedQuality.resource,  // 传递resource参数（默认时为null）
      selectedQuality.level      // 传递level参数（默认时为null）
    );
  },
  
  // 清理音频事件
  cleanAudioEvents() {
    tiem.suspend(this, app.innerAudioContext);
  }
});
