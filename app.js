/**
 * 应用入口
 * 统一管理全局状态和应用生命周期
 */
const apiConfig = require('./pages/api/index');
const authService = require('./utils/auth');
const CONSTANTS = require('./utils/constants');

App({
  // API 配置
  host: apiConfig.host,
  
  // 全局数据（统一使用 globalData，移除冗余的 data）
  globalData: {
    // 用户信息
    userInfo: null,
    openId: '',
    
    // 播放相关
    song: null,           // 当前播放的歌曲
    songlist: [],        // 播放列表
    state: false,        // 播放状态（false=播放中，true=暂停）
    first: 0,            // 首次播放标记
    loveList: [],        // 收藏列表
    
    // 播放器实例引用
    paythis: null        // 播放页实例
  },
  
  eventBus: {
    events: {}, // 存储事件回调：{ "事件名": [回调1, 回调2] }
    // 监听事件
    on: function (eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = []; // 初始化事件数组
      }
      this.events[eventName].push(callback); // 添加回调
    },
    // 触发事件
    emit: function (eventName, data) {
      const callbacks = this.events[eventName];
      if (callbacks && callbacks.length) {
        callbacks.forEach(callback => {
          callback(data); // 执行所有回调
        });
      }
    },
    // 移除事件监听（可选，用于清理）
    off: function (eventName, callback) {
      const callbacks = this.events[eventName];
      if (callbacks && callbacks.length) {
        this.events[eventName] = callbacks.filter(cb => cb !== callback);
      }
    }
  },

  async onLaunch() {
    // 初始化音频管理器
    this.innerAudioContext = wx.getBackgroundAudioManager();
    
    // 初始化音频事件监听
    this.innerAudioContext.onStop(() => {
      // 播放停止事件处理
    });
    
    this.innerAudioContext.onError((e) => {
      console.error('音频播放错误:', e);
    });

    // 展示本地存储能力（保留原有功能）
    try {
      const logs = wx.getStorageSync('logs') || [];
      logs.unshift(Date.now());
      wx.setStorageSync('logs', logs);
    } catch (err) {
      console.error('保存日志失败:', err);
    }

    // 检查登录状态
    await this.checkAndInitUser();
  },

  /**
   * 检查并初始化用户信息
   */
  async checkAndInitUser() {
    try {
      // 检查是否已有登录信息
      const userInfo = await authService.checkLogin();
      
      if (userInfo) {
        // 已登录，直接使用
        this.globalData.userInfo = userInfo;
        this.globalData.openId = userInfo.userId || '';
        
        // 触发用户信息就绪回调
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(userInfo);
        }
      } else {
        // 未登录，尝试自动登录
        try {
          await this.autoLogin();
        } catch (error) {
          console.error('自动登录失败:', error);
          // 登录失败不影响小程序启动，用户可以在需要时手动登录
        }
      }
    } catch (error) {
      console.error('初始化用户信息失败:', error);
    }
  },

  /**
   * 自动登录
   */
  async autoLogin() {
    try {
      const userInfo = await authService.wxLogin();
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        this.globalData.openId = userInfo.userId || '';
        
        // 触发用户信息就绪回调
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback(userInfo);
        }
      }
    } catch (error) {
      // 自动登录失败，可能需要用户授权
      // 这里不抛出错误，让用户在使用时手动登录
      console.warn('自动登录失败，需要用户手动授权:', error);
    }
  },

  /**
   * 保存播放状态到本地存储
   * 小程序关闭后下次进入时恢复播放状态
   */
  savePlayState(that) {
    if (!that || !this.globalData.song) {
      return;
    }

    try {
      const datas = that.data;
      const playState = {
        max: datas.max || 0,
        InitialValue: true,
        state: datas.state || false,
        value: datas.value || 0,
        pay: datas.pay || false,
        ins: datas.ins || 0,
        t: datas.t || 0,
        lrc: datas.lrc || '',
        conduct: datas.conduct || '00:00',
        src: datas.src || '',
        title: datas.title || '',
        coverImgUrl: datas.pic || '',
        id: datas.id || '',
        mid: datas.mid || '',
        autoplay: false,
        author: datas.author || '',
        pic: datas.pic || '',
        url: datas.url || '',
        ...datas.datas
      };
      
      // 清除歌词以节省存储空间
      playState.lrc = '';
      
      wx.setStorage({
        key: CONSTANTS.STORAGE_KEY.LAST_SONG,
        data: playState,
        success: () => {
          console.log('播放状态保存成功');
        },
        fail: (err) => {
          console.error('保存播放状态失败:', err);
        }
      });
    } catch (error) {
      console.error('保存播放状态异常:', error);
    }
  },

  /**
   * 应用显示
   */
  onShow() {
    // 可以在这里处理应用从后台恢复的逻辑
  },

  /**
   * 应用隐藏
   */
  onHide() {
    // 保存播放状态
    if (this.globalData.paythis && this.globalData.song) {
      this.savePlayState(this.globalData.paythis);
    }
  },

  /**
   * 获取全局数据（兼容旧代码）
   * @deprecated 请使用 globalData
   */
  get data() {
    return this.globalData;
  }
});