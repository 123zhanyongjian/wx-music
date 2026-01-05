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
