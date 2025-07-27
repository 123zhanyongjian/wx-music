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
    loopstate:0,
    duration: 298,
    isPlaying: false,
    loopMode: 0,
    showPlayList:false,
    // 定时器
    progressTimer: null,
    lyricTimer: null
  },
  showPlayList() {
    console.log("显示播放列表");
    this.setData({ showPlayList: true });
  },

  // 隐藏播放列表
  hidePlayList() {
    this.setData({ showPlayList: false });
  },
  closeList(){
    wx.showModal({
      title: '提示',
      content: '确定清空列表吗?',
      complete: (res) => {
        if (res.cancel) {
          
        }
    
        if (res.confirm) {
          wx.setStorage({
            key:'songlist',
            data:[],
            success:()=>{
              this.setData({
                songList:[]
              })
            }
          })
        }
      }
    })
  },
   switchSong(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.currentIndex) return; // 点击当前歌曲不切换

    // 更新当前播放索引
    this.setData({ currentIndex: index,ins:index });
    // 获取选中的歌曲数据
    const song = this.data.songList[index];
    app.data.song=song
    // 更新播放器数据
    this.setData({
      title: song.title,
      author: song.author,
      img: song.img,
      // ...其他需要更新的歌曲信息
    });
    // 播放新歌曲
    tiem.playCore(this, app.innerAudioContext,app.data.song);
    // 隐藏列表
    this.hidePlayList();
  },
  onLoad() {
    const { windowHeight } = wx.getSystemInfoSync();
       // 页面加载后，测量进度条的实际宽度和位置
    this.measureProgressBar();
    this.setData({ windowHeight });
    // patch setData，避免递归
    const rawSetData = this.setData;
    this.setData = (obj, callback) => {
      if (obj.lrc) obj.lyricList = obj.lrc;
      if (obj.value !== undefined) obj.currentTime = obj.value;obj.stratTime=this.formatTime(obj.value)
      if (obj.max !== undefined) obj.duration = obj.max;obj.endTime=this.formatTime(obj.max)
      if (obj.state !== undefined) obj.isPlaying = !obj.state ? true : false;
      obj.currentSong={
        cover:obj.img
      }
      return rawSetData.call(this, obj, callback);
    };
    app.data.paythis = this;
    // 兼容play.js的初始化
    if (app.data.song) {
      this.setData({ currentSong: app.data.song });
    }
    tiem.Readinfo(this, app.innerAudioContext, app);
  },

  onShow() {
    // 同步全局播放列表
    const songList = wx.getStorageSync('songlist') || [];
    app.data.songlist = songList;
    this.setData({ songList });
    // 这里不直接setData songList，除非你wxml用到
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
      tiem.playCore(this, app.innerAudioContext,app.data.song);
    }
  },
  returnloveList() {
    return app.data.loveList
  },
  // 上一曲
  onPrev() {
    if(this.data.songList.length===1){
      return
    }
    if (this.data.Mv || !this.data.songList.length) {
      return
    }
    if (this.data.ins > 0) {
      tiem.Lastsong(this, app.innerAudioContext, app)
    } else {
      this.setData({
        ins: app.data.songlist.length
      })
      tiem.Lastsong(this, app.innerAudioContext, app)
    }
  },


  //下一曲
  onNext() {
    if(this.data.songList.length===1){
      return
    }
    if (this.data.Mv || !this.data.songList.length) {
      return
    }
    if (this.data.songList.length - 1 > this.data.ins) {
      tiem.Nextsong(this, app.innerAudioContext, app)
    } else {
      this.setData({
        ins: 1
      })
      tiem.Lastsong(this, app.innerAudioContext, app)
    }
  },

  // 切换循环模式
  onLoop() {
    let loopMode = this.data.loopstate + 1;
    if (loopMode > 2) loopMode = 0;
    console.log(loopMode,'111111')
    const modeText = ["顺序播放", "单曲循环", "随机播放"][loopMode];
    wx.showToast({ title: modeText, icon: "none" });
    this.setData({ loopstate:loopMode });
  },

  // 切换歌词显示
  toggleLyric() {
    this.setData({ showLyric: !this.data.showLyric });
  },

  // 打开播放列表
  onPlayList() {
    wx.showToast({ title: "播放列表", icon: "none" });
  },

  // 测量进度条的实际宽度和位置
  measureProgressBar() {
    const query = wx.createSelectorQuery();
    query.select('.progress-bar')
      .boundingClientRect(rect => {
        if (rect) {
          this.setData({
            progressBarWidth: rect.width,  // 进度条实际宽度
            progressBarLeft: rect.left     // 进度条左边界位置
          });
        }
      })
      .exec();
  },

  // 监听页面尺寸变化（处理横竖屏切换等场景）
  onResize() {
    this.measureProgressBar();
  },

  // 进度条点击事件（核心方法）
  onProgressTap(e) {
    // console.log("点击进度条", e,this.data.progressBarWidth);
    if (this.data.progressBarWidth <= 0) {
      // 如果进度条宽度未获取到，重新测量
      this.measureProgressBar();
      return;
    }
    
    // 获取点击位置相对于进度条左边界的距离（关键修正！）
    const tapPosition = e.detail.x - this.data.progressBarLeft;
    
    // 确保点击位置在进度条范围内（防止越界）
    const validPosition = Math.max(0, Math.min(tapPosition, this.data.progressBarWidth));
    
    // 计算目标时间
    const targetTime = (validPosition / this.data.progressBarWidth) * this.data.duration;
    // console.log(targetTime, '目标时间');
    this.onSeek(targetTime)
    // // 更新 UI 和播放进度
    // this.setData({ currentTime: targetTime });
    
    // // 跳转到指定时间
    // const bgAudio = wx.getBackgroundAudioManager();
    // bgAudio.seek(targetTime);
  },

  onSeek(val){
    app.innerAudioContext.seek(val);
    app.innerAudioContext.play()
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

  // 歌词、进度等字段同步（在 tiem 的 setData 里做字段适配）
  // 清理音频事件
  cleanAudioEvents() {
    tiem.suspend(this, app.innerAudioContext);
  }
});