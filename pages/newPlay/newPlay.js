const tiem = require('../../utils/time.js');
const app = getApp();

Page({
  data: {
    // 歌词相关
    showLyric: false,
    lyricList: [],
    currentLine: 0,
    scrollTop: 10,
    progressPercent: 0,
    windowHeight: 0, // 窗口高度
    sliderProgress: 0, // 自定义滑块进度
    isDragging: false, // 是否正在拖动滑块
    sliderStartX: 0, // 滑块触摸开始X坐标
    sliderLeft: 0, // 滑块左边界位置
    sliderWidth: 0, // 滑块宽度

    // 播放器相关
    currentSong: {
      name: "海阔天空",
      singer: "Beyond",
      cover: "/image/cover.jpg",
      url: "https://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d3033&uin=346897220&vkey=6292F51C653481CBDEC64C975E6205D5F7C0C3B81A3B806827E8D56E6CBC52DDF55861B34E5F0EAD246506C470202E5D4E87300C47BF83BBEAGf4e5e",
      duration: 298
    },
    currentTime: 0,
    stratTime: 0,
    endTime: 0,
    loopstate: 0,
    duration: 298,
    isPlaying: false,
    loopMode: 0,
    showPlayList: false,
    // 定时器
    progressTimer: null,
    lyricTimer: null
  },
  
  onLoad() {
    const { windowHeight } = wx.getSystemInfoSync();
    this.setData({ windowHeight });
    
    // patch setData，避免递归
    const rawSetData = this.setData;
    this.setData = (obj, callback) => {
      if (obj.lrc) obj.lyricList = obj.lrc;
      if (obj.value !== undefined) {
        obj.currentTime = obj.value;
        obj.stratTime = this.formatTime(obj.value);
        // 更新滑块进度
        if (!this.data.isDragging) {
          obj.sliderProgress = (obj.value / obj.max * 100) || 0;
        }
      }
      if (obj.max !== undefined) {
        obj.duration = obj.max;
        obj.endTime = this.formatTime(obj.max);
      }
      if (obj.state !== undefined) obj.isPlaying = !obj.state ? true : false;
      obj.currentSong = {
        cover: obj.img
      };
      return rawSetData.call(this, obj, callback);
    };
    
    app.data.paythis = this;
    
    // 兼容play.js的初始化
    if (app.data.song) {
      this.setData({ currentSong: app.data.song });
    }
    
    tiem.Readinfo(this, app.innerAudioContext, app);
    
    // 测量进度条尺寸
    this.measureSlider();
  },
  
  onShow() {
    // 同步全局播放列表
    const songList = wx.getStorageSync('songlist') || [];
    app.data.songlist = songList;
    this.setData({ songList });
  },
  
  onHide() {
    // tiem.suspend(this, app.innerAudioContext);
  },
  
  onUnload() {
    // tiem.suspend(this, app.innerAudioContext);
  },
  
  // 播放/暂停
  onPlayPause() {
    if (this.data.isPlaying) {
      tiem.suspend(this, app.innerAudioContext);
    } else {
      tiem.playCore(this, app.innerAudioContext, app.data.song);
    }
  },
  
  returnloveList() {
    return app.data.loveList;
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
      tiem.Lastsong(this, app.innerAudioContext, app);
    } else {
      this.setData({
        ins: app.data.songlist.length
      });
      tiem.Lastsong(this, app.innerAudioContext, app);
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
      tiem.Nextsong(this, app.innerAudioContext, app);
    } else {
      this.setData({
        ins: 1
      });
      tiem.Lastsong(this, app.innerAudioContext, app);
    }
  },
  
  // 切换循环模式
  onLoop() {
    let loopMode = this.data.loopstate + 1;
    if (loopMode > 2) loopMode = 0;
    console.log(loopMode, '111111');
    const modeText = ["顺序播放", "单曲循环", "随机播放"][loopMode];
    wx.showToast({ title: modeText, icon: "none" });
    this.setData({ loopstate: loopMode });
  },
  
  // 切换歌词显示
  toggleLyric() {
    this.setData({ showLyric: !this.data.showLyric });
  },
  
  // 打开播放列表
  showPlayList() {
    this.setData({ showPlayList: true });
  },
  
  // 隐藏播放列表
  hidePlayList() {
    this.setData({ showPlayList: false });
  },
  
  // 清空播放列表
  closeList() {
    wx.showModal({
      title: '提示',
      content: '确定清空列表吗?',
      complete: (res) => {
        if (res.cancel) {
          // 用户取消操作
        }
    
        if (res.confirm) {
          wx.setStorage({
            key: 'songlist',
            data: [],
            success: () => {
              this.setData({
                songList: []
              });
            }
          });
        }
      }
    });
  },
  
  // 切换歌曲
  switchSong(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.ins) return; // 点击当前歌曲不切换

    // 更新当前播放索引
    this.setData({ ins: index });
    
    // 获取选中的歌曲数据
    const song = this.data.songList[index];
    app.data.song = song;
    
    // 更新播放器数据
    this.setData({
      title: song.title,
      author: song.author,
      img: song.img,
      // ...其他需要更新的歌曲信息
    });
    
    // 播放新歌曲
    tiem.playCore(this, app.innerAudioContext, app.data.song);
    
    // 隐藏列表
    this.hidePlayList();
  },
  
  // 测量滑块尺寸
  measureSlider() {
    const query = wx.createSelectorQuery();
    query.select('.progress-bar')
      .boundingClientRect(rect => {
        if (rect) {
          this.setData({
            sliderWidth: rect.width,  // 进度条实际宽度
            sliderLeft: rect.left     // 进度条左边界位置
          });
        }
      })
      .exec();
  },
  
  // 监听页面尺寸变化
  onResize() {
    this.measureSlider();
  },
  
  // 滑块触摸开始
  onSliderTouchStart(e) {
    this.setData({
      isDragging: true,
      sliderStartX: e.touches[0].clientX
    });
  },
  
  // 滑块触摸移动
  onSliderTouchMove(e) {
    if (!this.data.isDragging) return;
    
    const moveX = e.touches[0].clientX - this.data.sliderLeft;
    let percent = (moveX / this.data.sliderWidth) * 100;
    
    // 限制范围在0-100%
    percent = Math.max(0, Math.min(100, percent));
    
    this.setData({
      sliderProgress: percent
    });
  },
  
  // 滑块触摸结束
  onSliderTouchEnd(e) {
    if (!this.data.isDragging) return;
    
    this.setData({
      isDragging: false
    });
    
    const endX = e.changedTouches[0].clientX - this.data.sliderLeft;
    let percent = (endX / this.data.sliderWidth) * 100;
    
    // 限制范围在0-100%
    percent = Math.max(0, Math.min(100, percent));
    
    // 计算目标时间
    const targetTime = (percent / 100) * this.data.duration;
    
    // 更新进度
    this.setData({
      currentTime: targetTime,
      stratTime: this.formatTime(targetTime),
      sliderProgress: percent
    });
    
    // 跳转到指定时间
    this.onSeek(targetTime);
  },
  
  // 进度条点击事件
  onProgressTap(e) {
    if (this.data.sliderWidth <= 0) {
      // 如果进度条宽度未获取到，重新测量
      this.measureSlider();
      return;
    }
    
    // 获取点击位置相对于进度条左边界的距离
    const tapPosition = e.detail.x - this.data.sliderLeft;
    
    // 确保点击位置在进度条范围内
    const validPosition = Math.max(0, Math.min(tapPosition, this.data.sliderWidth));
    
    // 计算百分比
    const percent = (validPosition / this.data.sliderWidth) * 100;
    
    // 计算目标时间
    const targetTime = (percent / 100) * this.data.duration;
    
    // 更新进度
    this.setData({
      currentTime: targetTime,
      stratTime: this.formatTime(targetTime),
      sliderProgress: percent
    });
    
    // 跳转到指定时间
    this.onSeek(targetTime);
  },
  
  // 跳转到指定时间
  onSeek(val) {
    app.innerAudioContext.seek(val);
    app.innerAudioContext.play();
  },
  
  // 歌曲播放结束
  handleSongEnd() {
    if (this.data.loopMode === 1) {
      app.innerAudioContext.seek(0);
      app.innerAudioContext.play();
    } else {
      this.onNext();
    }
  },
  
  // 格式化时间
  formatTime(seconds) {
    return tiem.MinuteConversion(seconds);
  },
  
  // 返回
  onBack() {
    wx.navigateBack();
  },
  
  // 长按删除歌曲
  deleteSong(e) {
    const songIndex = e.currentTarget.dataset.songindex;
    const song = this.data.songList[songIndex];
    
    wx.showModal({
      title: '提示',
      content: `确定删除"${song.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          // 删除歌曲
          let songList = this.data.songList;
          songList.splice(songIndex, 1);
          
          // 更新数据
          this.setData({ songList });
          wx.setStorageSync('songlist', songList);
          
          // 如果删除的是当前播放的歌曲
          if (songIndex === this.data.ins) {
            if (songList.length > 0) {
              // 切换到下一首
              const nextIndex = songIndex >= songList.length ? 0 : songIndex;
              this.setData({ ins: nextIndex });
              tiem.playCore(this, app.innerAudioContext, songList[nextIndex]);
            } else {
              // 没有歌曲了，暂停播放
              tiem.suspend(this, app.innerAudioContext);
              this.setData({ isPlaying: false });
            }
          } else if (songIndex < this.data.ins) {
            // 更新当前索引
            this.setData({ ins: this.data.ins - 1 });
          }
        }
      }
    });
  },
  
  // 清理音频事件
  cleanAudioEvents() {
    tiem.suspend(this, app.innerAudioContext);
  }
});  