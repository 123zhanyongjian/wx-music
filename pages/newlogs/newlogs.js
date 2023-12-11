// pages/newlogs/newlogs.js
const time = require('../../utils/time.js')
const app = getApp();
const api = require('../../utils/api')
const request = time.Promisify(wx.request)
const debounce = time.debounce()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    song: [

    ],
    key: 'netease',
    singer: '', //歌手
    logo: '../../image/jh.png',
    state: '0',
    itemList: ['立即播放', '下一首播放'],
    array: ['聚合', 'QQ', '网易云', '千千', '咪咕'],
  },
  // 输入监听
  serachs(e) {
    wx.hideLoading()
    wx.hideToast()
    var serach = e.detail.value;
    this.setData({
      serach
    })
    if (!serach.trim()) {
      this.setData({
        song: [],
        singer: ''
      })
      return
    }

    if (serach.length===1) {
      this.getData()
    
    }else if(serach.length>1){
      debounce(this.getData, 1000)
    }


  },
  getData( serach = this.data.serach){
    if (!serach.trim()) {
      this.setData({
        song: [],
        singer: ''
      })
      return
    }
    var that = this;
    if (this.data.state !== '0') {
      wx.showLoading({
        title: '加载中',
      })
      request({
        url: 'http://www.xmsj.org/',
        method: 'post',
        data: {
          input: serach,
          filter: 'name',
          type: this.data.key,
          page: 1,

        },
        header: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(res => {
          setTimeout(() => {
            wx.hideLoading();
          }, 300);
          if(!res.data.data){
            wx.showToast({
              title:'查询失败',
              icon:'error'
            })
            return
          }
          const arr = res.data.data.map((item, index, ite) => {
            let obj = { ...item }
            if (ite.length > 0) {

              obj.title = item.title,
                obj.author = item.author;
              obj.pic = item.pic || 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
                obj.src = item.url,
                obj.id = item.songid
              obj.lrc = item.lrc;
              obj.mId = 1 // 表示 http://www.xmsj.org/下的资源

            }
            return obj;
          })
          that.setData({
            song: arr

          })
         
        }, err => {
          setTimeout(() => {
            wx.hideLoading();
          }, 300);
          if (err.errMsg === 'request:fail url not in domain list') {
            wx.showToast({
              title: '请打开开发者模式',
              icon: 'none'
            })
          }
          console.log(err)
        })
    }
    else {
      api.getSerachSongOrSinger(serach, undefined, arr => {

        that.setData({
          song: arr.map(i => ({ ...i, title: i.name, author: i.singer }))
        })
      })
    }
  },
  //播放音乐
  pay(e) {
    var that = this;
    var flag
    var item = e.currentTarget.dataset.item;
    const index = e.currentTarget.dataset.index
    if(this.data.state==='0'){
      api.getSongSrc(item.id,({src,stauts})=>{
          if(stauts){
            item.src = src
            app.data.song = item;
            wx.switchTab({
              url: "../../pages/play/play",
              success: function () {
                app.data.paythis.setData({
                  value: 0
                })
                time.newAddSong(app.data);
                time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
                time.Lrcget(app.data.paythis, app.data.song)
        
                that.setData({
                  song: []
                })
        
              }
        
            })
          }
      })
    }else{

    
 

    app.data.song = item;
    wx.switchTab({
      url: "../../pages/play/play",
      success: function () {
        app.data.paythis.setData({
          value: 0
        })
        time.newAddSong(app.data);
        time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
        time.Lrcget(app.data.paythis, app.data.song)

        that.setData({
          song: []
        })

      }

    })
  }

  },
  //切换搜索模式
  bindPickerChange(e) {

    if (e.detail.value == '2') {
      this.setData({
        state: '1',
        key: 'netease',
        logo: '../../image/wangyi.jpg'
      })
    } else if (e.detail.value == '1') {
      this.setData({
        state: '1',
        key: 'qq',
        logo: '../../image/qqmusic.jpg'
      })
    } else if (e.detail.value == '3') {
      this.setData({
        state: '1',
        key: 'baidu',
        logo: '../../image/qianqian.png'
      })
    } else if (e.detail.value == '4') {
      this.setData({
        state: '1',
        key: 'migu',
        logo: '../../image/mg.png'
      })
    } else if (e.detail.value == '0') {
      this.setData({
        state: '0',
        key: 'migu',
        logo: '../../image/jh.png'
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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