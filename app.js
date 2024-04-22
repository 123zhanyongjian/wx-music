//app.js
// const tiem=require('./utils/time.js')
const host = require('./pages/api/index').host
App({
  host,
  onLaunch:async function () {
    this.innerAudioContext = wx.getBackgroundAudioManager();
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    let openId = null
  try{
     openId = await wx.getStorage({key:'openId',encrypt:true})
    this.data.openId = openId.data
  }
  catch(err){
    console.log(err)
  }
   
    if(!openId?.data){
      wx.login({
        success: res => {
            wx.request({
              url:this.host+'/userGetopenId',
              data:{code:res.code},
            success:re=>{
             this.data.openId = re.data.data;
             wx.setStorage({
              key:'openId',
              data:re.data.data,
              encrypt:true,
             })
             wx.getUserInfo({
              success:ret=>{
              this.data.userInfo = ret.userInfo;
              wx.showLoading({
                title: '加载中'
              })
              wx.request({
                url:`${this.host}/userinfo?id=${re.data.data}`,
                success:res1=>{
                  if(res1.data?.data?.length){
                    wx.hideLoading()
                    // 有用户 将数据直接赋值到userinfo
                    this.data.userInfo =res1.data?.data[0]
                    if(this.data.userInfo.headimg){
                      this.data.userInfo.avatarUrl = this.host+'/'+this.data.userInfo.headimg
                    }
  
                    console.log(this.data.userInfo,333)
                  }else{
  
                    // 没有用户 新增接口
                    wx.request({
                      url:`${this.host}/addUser`,
                      method:'post',
                      data:{
                        userName:ret.userInfo.nickName,
                        userId:re.data.data
                      },
                      success:(val)=>{
                        
                        if(val.data.coed===200){
                          wx.request({
                            url:`${this.host}/userinfo?id=${re.data.data}`,
                            success:rets=>{
                              wx.hideLoading()
                              if(rets.data?.data?.length){
                                // 有用户 将数据直接赋值到userinfo
                                this.data.userInfo =rets.data?.data[0]
                                if(this.data.userInfo.headimg){
                                  this.data.userInfo.avatarUrl = this.host+'/'+this.data.userInfo.headimg
                                }
                              }},
                              fail:(err)=>{
                                wx.hideLoading()
                                setTimeout(() => {
                                  wx.showToast({
                                    title: err.errMsg,
                                    // icon:'error'
                                  })
                                 }, 200);
                              }
                            })
                                // console.log(this.data.userInfo,333)
                        }
                        wx.hideLoading()
                      },
                      fail:(err)=>{
                        wx.hideLoading()
                        setTimeout(() => {
                          wx.showToast({
                            title: err.errMsg,
                            // icon:'error'
                          })
                         }, 200);
                      }
                    })
                  }
                },
                fail:(err)=>{
                  wx.hideLoading()
                 setTimeout(() => {
                  wx.showToast({
                    title: err.errMsg,
                    // icon:'error'
                  })
                 }, 200);
                }
              })
              }
            })
             // 查询后端信息
  
            }
          })
         
  
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
        }
      })
    }
    
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
      if(wx.getAppBaseInfo().version>'8.0.47'){
        this.innerAudioContext.title = this.data.song?.title;
          this.innerAudioContext.singer = this.data.song?.author  
       }

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

    openId:'', // 用户唯一值
    userInfo: null,
    am:'aaa',
    song:'',
    songlist:[],
    state:false,
    first:0,
    loveList:[]
  }
})