// pages/myinfo/myinfo.js
const app = getApp();
const time = require('../../utils/time')
const request  = time.Promisify(wx.request)
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page:1,

    paegSize:10,
    addSongListFlag:false,
    userInfo:{
      username:"xxx",
      avatarUrl:"",
      gender:"男",
    
    },
    playlist:[
    
    ]
  },
  //
  bindgetuserinfo(e){
    const userInfo  =e.detail.userInfo
    this.setData({
      ["userInfo.avatarUrl"]:userInfo.avatarUrl
    })
    console.log(userInfo.avatarUrl)
  },
  newListBtn(){
  this.setData({
   addSongListFlag:true
  })

  },
  newSongList(e){
    const datas = e.detail;
    const that = this
    console.log(e)
    const uploadImg = time.Promisify(wx.uploadFile)
    uploadImg({
      url:app.host+'/upload',
      filePath:datas.image,
      name:'file'
    })
    .then(res=>{
      const data = JSON.parse(res.data)
      if(data.code===200){
        // 更新接口
        wx.showLoading({
          title: '加载中',
        })
        wx.request({
          url:app.host+'/playlist/Add',
          method:'post',
          data:{
      
            userid:that.data.userInfo.userId,
            img:data.data,
            name:datas.title
          },
          success:res1=>{
            wx.hideLoading()
            if(res1.data.code===200){
              setTimeout(() => {
                wx.showToast({
                  title:res1.data.message,
                  icon:"success"
                })
                that.setData({
                  addSongListFlag:false
                 })
                 this.getList(1,10)
              }, 200);
              return
            }
            setTimeout(() => {
              wx.showToast({
                title:res.data.message
              })
            }, 200);
          },
          fail:(err)=>{
            wx.hideLoading()
            setTimeout(() => {
              wx.showToast({
                title:err.message,
                icon:'error'
              })
            }, 200);
          }
        })
      }
    })
    
  },
  close(){
    console.log("???")
    this.setData({
      addSongListFlag:false
     })
  },
  onChooseAvatar(e){
    const { avatarUrl } = e.detail;
    const uploadImg = time.Promisify(wx.uploadFile)
    this.setData({
      ["userInfo.avatarUrl"]:avatarUrl
    })
    console.log(app.host+'/upload',222)
    uploadImg({
      url:app.host+'/upload',
      filePath:avatarUrl,
      name:'file'
    })
    .then(res=>{
      const data = JSON.parse(res.data)
      if(data.code===200){
        // 更新接口
        wx.showLoading({
          title: '加载中',
        })
        wx.request({
          url:app.host+'/userEdit',
          method:'post',
          data:{
            headimg:data.data,
            userId:this.data.userInfo.userId
          },
          success:(res1)=>{
            wx.hideLoading();
            if(res1.data.code===200){
              setTimeout(() => {
                wx.showToast({
                  title: '更新成功',
                  icon: 'none'
                })
              }, 0);
            }
          },
          fail:()=>{
            wx.hideLoading();
          }
        })
      }
    })
  },
  change(e){
    const id = e.currentTarget?.dataset?.id
    wx.navigateTo({
      url: `../playlistInfo/playlistInfo?id=${id}`,
    })
  },
  changeName(e){
    const value  = e.detail.value
    wx.showModal({
      title:"昵称修改",
      content:"确认修改昵称吗？",
      success:(res)=>{
        if(res.cancel){
          this.setData({
            ['userInfo.userName']:app.data.userInfo.userName
          })
          return
        }
        if(res.confirm){
           // 更新接口
        wx.showLoading({
          title: '加载中',
        })
        wx.request({
          url:app.host+'/userEdit',
          method:'post',
          data:{
            userName:value,
            userId:this.data.userInfo.userId
          },
          success:(res1)=>{
            wx.hideLoading();
            if(res1.data.code===200){
              setTimeout(() => {
                wx.showToast({
                  title: '更新成功',
                  icon: 'none'
                })
              }, 0);
            }
          },
          fail:()=>{
            wx.hideLoading();
          }
        })
        }
      }
    })
  },
 async getList(page,paegSize){
    if(page===1){
      this.data.playlist=[]
    }
    wx.showLoading({
      title: '加载中',
    })
    try{
      const res = await request({url:app.host+'/playlist',data:{userid:this.data.userInfo.userId,page,paegSize}})
      wx.hideLoading()
      if(res.data.code===200){
        this.setData({
          playlist:this.data.playlist.concat(res.data.data.data.map(i=>({...i,img:app.host+'/'+i.img}))),
          count:res.data.data.count
        })
      }
    }
    catch(err){
      wx.hideLoading()
      setTimeout(() => {
        wx.showToast({
          title:err.errMsg,
          // icon:'error'
        })
      }, 200);
    }
   
  },
  getdatas(){
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
      console.log(res,5555555555555555555)
      },
      fail:err=>{

        console.log(err)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if(app.data.userInfo){
     
      this.setData({
        // userInfo:app.data.userInfo,
        page:1,
        paegSize:10
      })
     
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
    if(app.data.openId&&this.data.userInfo?.username==='xxx'){
      wx.request({
        url:`${app.host}/userinfo?id=${app.data.openId}`,
        success:res1=>{
          if(res1.data?.data?.length){
            // 有用户 将数据直接赋值到userinfo
            app.data.userInfo =res1.data?.data[0]
            if(app.data.userInfo.headimg){
              app.data.userInfo.avatarUrl = app.host+'/'+app.data.userInfo.headimg
            }

            this.setData({
              userInfo:app.data.userInfo
            })
            this.getList(1,10)
          }else{
            // 没有用户 新增接口
            wx.request({
              url:`${app.host}/addUser`,
              method:'post',
              data:{
                userName:app.data.userInfo.nickName,
                userId:app.data.openId
              }
            })
          }
        }
      })
    }else{
      this.getList(1,10)
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})