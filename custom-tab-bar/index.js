const app = getApp();

Component({
  data: {
    selected: app.data.tabSelected || 0,
    list: [
      { pagePath: "pages/index/index", text: "推荐", iconPath: "/image/tj.png", selectedIconPath: "/image/tj1.png" },
      { pagePath: "pages/newlogs/newlogs", text: "搜索", iconPath: "/image/ss.png", selectedIconPath: "/image/ss1.png" },
      { pagePath: "pages/newPlay/newPlay", text: "播放", iconPath: "/image/music.png", selectedIconPath: "/image/music1.png" },
      { pagePath: "pages/newSinger/newSinger", text: "歌手", iconPath: "/image/singer.png", selectedIconPath: "/image/singer1.png" },
      { pagePath: "pages/myinfo/myinfo", text: "个人", iconPath: "/image/me.png", selectedIconPath: "/image/me1.png" }
    ],
    isPlaying: false,
    currentCover: "/image/music.png"
  },
  lifetimes: {
    attached() {
      console.log("自定义 tabBar 已挂载");
      
      // 初始化全局状态
      this.setData({ selected: app.data.tabSelected || 0 });
      
      // 监听小程序全局显示事件（覆盖所有显示场景）
      this.appShowHandler = wx.onAppShow(() => {
        console.log("全局显示事件触发 → 更新 tabBar");
        this.updateTab();
      });
      
      // 监听页面切换事件（由 tab 页面主动触发）
      app.eventBus.on("tabPageShow", () => {
        console.log("页面切换事件触发 → 更新 tabBar");
        this.updateTab();
      });
      
      // 监听音频播放状态
      if (app.innerAudioContext) {
        app.innerAudioContext.onPlay(() => this.updatePlayStatus());
        app.innerAudioContext.onPause(() => this.updatePlayStatus());
        app.innerAudioContext.onStop(() => this.updatePlayStatus());
        app.innerAudioContext.onEnded(() => this.updatePlayStatus());
      }
      
      // 首次加载延迟执行（确保页面栈已初始化）
      setTimeout(() => this.updateTab(), 300);
    },
    detached() {
      // 移除监听，避免内存泄漏
      if (this.appShowHandler) this.appShowHandler();
      app.eventBus.off("tabPageShow");
    }
  },
  methods: {
    updateTab() {
      const pages = getCurrentPages();
      if (pages.length === 0) {
        console.log("页面栈为空，1秒后重试");
        setTimeout(() => this.updateTab(), 1000);
        return;
      }
      
      const currentRoute = pages[pages.length - 1].route;
      console.log("当前页面路由：", currentRoute);
      
      const idx = this.data.list.findIndex(item => {
        const itemPath = item.pagePath.replace(/^\//, "");
        return itemPath === currentRoute;
      });
      
      console.log("匹配到的索引：", idx);
      
      if (idx !== -1) {
        app.data.tabSelected = idx;
        this.setData({ selected: idx });
      }
      
      this.setData({
        isPlaying: app.innerAudioContext && !app.innerAudioContext.paused,
        currentCover: app.data.song?.pic || "/image/music.png"
      });
    },
    updatePlayStatus() {
      this.setData({
        isPlaying: app.innerAudioContext && !app.innerAudioContext.paused,
        currentCover: app.data.song?.pic || "/image/music.png"
      });
    },
    onTabTap(e) {
      const idx = e.currentTarget.dataset.index;
      const { pagePath } = this.data.list[idx];
      
      if (app.data.tabSelected === idx) return;
      
      app.data.tabSelected = idx;
      this.setData({ selected: idx });
      wx.switchTab({ url: `/${pagePath}` });
    },
    onPlayTap() {
      if (!this.data.isPlayPage) {
        wx.switchTab({ url: "/pages/newPlay/newPlay" });
      }
    }
  }
});