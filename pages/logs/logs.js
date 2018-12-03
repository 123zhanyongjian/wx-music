//logs.js
const util = require('../../utils/util.js')
const app=getApp();
const time=require('../../utils/time.js')
const pays=require('../play/play.js')
const api = require('../api/index.js');
const patt=require('../play/play.js')
Page({
  data: {
    logs: [],
    serach: "",
    interval: '',
    song: [

    ],

    state: false
  },
  //输入框监听
  serachs(e) {

    var that = this;
    var serach = e.detail.value;
    console.log(serach,pays);
    
    if (serach != '') {
      if (e.timeStamp - this.data.interval < 1000) {
        return
      } else {
        wx.showLoading({
          title: '加载中',
        })
        this.setData({
          interval: e.timeStamp,
          song: []
        })
        wx.showLoading({
          title: '加载中...',
        })
        wx.request({
          url: api.default.host + 'searchMusic?name=?' + serach,
          success: function(res) {
            wx.hideLoading();
            that.setData({
              song: res.data.result
            })
          }
        })
      }
    } else {
      this.setData({

        song: []
      })
    }



  },
  //播放音乐
  pay(e){
    var that=this;
    var flag
    var item=e.currentTarget.dataset.item;
    app.data.song=item;
    console.log(app)
    wx.switchTab({
      url: "../../pages/play/play",
      success:function(){
        time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
        app.data.paythis.setData({
          value:0
        })
        that.setData({
          song:[]
        })
        
      }
     
    })
  
    
    

  },
  onLoad: function() {
    console.log(app)
  }
})