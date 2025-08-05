const app = getApp();

Component({
  data: {
    list: [
      { pagePath: "pages/index/index", text: "推荐", iconPath: "/image/tj.png" },
      { pagePath: "pages/newlogs/newlogs", text: "搜索", iconPath: "/image/ss.png" },
      { pagePath: "pages/newPlay/newPlay", text: "播放", iconPath: "/image/music.png" },
      { pagePath: "pages/newSinger/newSinger", text: "歌手", iconPath: "/image/singer.png" },
      { pagePath: "pages/myinfo/myinfo", text: "个人", iconPath: "/image/me.png" }
    ],
    isPlaying: false,
    currentCover: "/image/music_default.png" // 默认封面（无歌曲时显示）
  },
  lifetimes: {
    attached() {
      if(app.data.paythis){
        this.syncCurrentSongCover();
        this.updatePlayStatus(app.data.paythis.data.isPlaying===true?true:false);
      
      }
      console.log("???attached?")
      // 1. 初始化时同步一次当前歌曲封面
      // this.syncCurrentSongCover();
      
      // 2. 监听音频播放状态（控制旋转动画）
      // if (app.innerAudioContext) {
      //   app.innerAudioContext.onPlay(() => this.updatePlayStatus());
      //   app.innerAudioContext.onPause(() => this.updatePlayStatus());
      //   app.innerAudioContext.onStop(() => this.updatePlayStatus());
      // }
      
      // 3. 监听歌曲切换事件（关键：实时更新封面）
      // 需在app.js中定义eventBus，用于跨页面传递歌曲切换事件
      app.eventBus.on("songChanged", (newSong) => {
        console.log("检测到歌曲切换 → 更新封面：", newSong.pic);
        this.setData({ currentCover: newSong.pic || "/image/music_default.png" });
        // 切换歌曲后如果是播放状态，保持旋转
        this.updatePlayStatus();
      });
      app.eventBus.on('updatePlayStatus',(e)=>this.updatePlayStatus(e))
      // 4. 监听小程序切前台（避免后台切回后封面未更新）
      this.appShowHandler = wx.onAppShow(() => {
        this.syncCurrentSongCover();
        this.updatePlayStatus();
      });
    },
    detached() {
      console.log(">>>33332222")
      // 移除监听，避免内存泄漏
      if (this.appShowHandler) this.appShowHandler();
      app.eventBus.off("songChanged");
      app.eventBus.off("updatePlayStatus");
    }
  },
  methods: {
    // 同步当前播放歌曲的封面（从全局状态获取）
    syncCurrentSongCover() {
      if (app.data.song) {
        this.setData({
          currentCover: app.data.song.pic || "/image/music_default.png"
        });
      }
    },
    // 更新播放状态（控制旋转动画）
    updatePlayStatus(isPlaying) {
      console.log("ddddd",isPlaying)
      this.setData({ isPlaying });
    },
    // Tab点击跳转
    onTabTap(e) {
      const idx = e.currentTarget.dataset.index;
      console.log(this.data.isPlaying)
      const { pagePath } = this.data.list[idx];
      wx.switchTab({ url: `/${pagePath}` });
    }
  }
});