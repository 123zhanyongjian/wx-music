//app.js
// const tiem=require('./utils/time.js')
App({
  onLaunch: function () {
    this.innerAudioContext = wx.getBackgroundAudioManager();

    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.data.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    //监听暂停事件
    this.innerAudioContext.onPause(()=>{
      this.data.paythis.setData({
        pay: '../../image/bf.png',
        state: true
      })
    })
    //监听播放事件
    this.innerAudioContext.onPlay(() => {
      this.data.paythis.setData({
        pay: '../../image/zt.png',
        state: false
      })
    })
  },
  //创建歌曲实例
  createdpay() {
   
  },
  //小程序关闭后下次进入还是上一次关闭时所保留的状态
   Closestate(that, datas){
  var obj1 = {
      max: that.data.max,
      InitialValue:true,
      state: that.data.state,
      value: that.data.value,
      pay: that.data.pay,
      ins:that.data.ins,
      t: that.data.t,
      // lrc: datas.lrc,
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
        console.log('缓存成功', res,obj)
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
  data: {
    userInfo: null,
    am:'aaa',
    song:'',
    songlist:[],
    state:false,
    first:0,
    loveList:[]
  }
})