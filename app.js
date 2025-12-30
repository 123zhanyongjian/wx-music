//app.js
const host = require('./pages/api/index').host
const authService = require('./utils/auth')

App({
  host,
  globalData: {
    userInfo: null,
    openId: '',
    song: '',
    songlist: [],
    state: false,
    first: 0,
    loveList: []
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
        this.data.userInfo = userInfo;
        this.data.openId = userInfo.userId || '';
        
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
        this.data.userInfo = userInfo;
        this.data.openId = userInfo.userId || '';
        
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
  //创建歌曲实例
  createdpay() {
   
  },
  //小程序关闭后下次进入还是上一次关闭时所保留的状态
   Closestate(that){
    const datas= that.data
  var obj1 = {
      max: that.data.max,
      InitialValue:true,
      state: that.data.state,
      value: that.data.value,
      pay: that.data.pay,
      ins:that.data.ins,
      t: that.data.t,
      lrc: datas.lrc,
      conduct: that.data.conduct,
      src: datas.src,
      title: datas.title,
      coverImgUrl: datas.pic,
      id:datas.id,
      mid:datas.mid,
      autoplay: false,
      author: datas.author,
      pic: datas.pic,
      url: datas.url,
      datas
     
    };
     let obj={};
     Object.assign(obj, obj1, datas.datas)
    obj.lrc='';
    wx.setStorage({
      key: 'lastsong',
      data: obj,
      success: function (res) {
        console.log('缓存成功', res,obj,that)
      }
    })

  },
  onShow(){
    
  },
  onHide(){
   
    if(this.data.paythis!=undefined&&this.data.song!=''){
      this.Closestate(this.data.paythis,this.data.song);
    }
    
  },
  // 兼容旧代码的 data 属性
  data: {
    openId: '', // 用户唯一值
    userInfo: null,
    am: 'aaa',
    song: '',
    songlist: [],
    state: false,
    first: 0,
    loveList: []
  }
})