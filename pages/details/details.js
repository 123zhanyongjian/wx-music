// pages/details/details.js
const api=require('../api/index.js');
const app=getApp();
const tiem=require('../../utils/time.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    src:''
  },
  pay(e) {
    var that = this;
    var item = e.currentTarget.dataset.item;

    var song;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: api.default.host + 'musicDetails?id=' + e.currentTarget.dataset.item.song_id,
      success: function (res) {
        wx.hideLoading();
        console.log(res.data, 55);
        if (res.data.result.songList == '') {
          wx.showToast({
            title: '链接已失效',
            icon: 'none',
            duration: 1500
          })
          return
        }
        song = res.data.result.songList[0];
        song['src'] = song.showLink;
        song['title'] = song.songName;
        song['pic'] = 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg';
        song['author'] = song.artistName,
        song['id']=song.songId

          that.setData({
            song: song
          })

        console.log(song,444);
        app.data.song = that.data.song;
        tiem.newAddSong(app.data);
        //将http转换为https
        song.lrcLink = song.lrcLink.replace('http', 'https')

        var flag
          if(song.lrcLink){
            wx.request({
              url: song.lrcLink,
              //http转https
    
              success: function (ret) {
                app.data.song.lrc = ret.data;
                //清空播放时长
                app.data.paythis.setData({
                  value: 0
                })
                tiem.pay(app.data.paythis, app.innerAudioContext, app.data.song)
              
                wx.switchTab({
                  url: "../../pages/play/play",
                  success: function () {
                    console.log(app.data);
    
    
    
    
                  }
                })
              
              }
            })
    
          }else{
            tiem.pay(app.data.paythis, app.innerAudioContext, app.data.song)
              
                wx.switchTab({
                  url: "../../pages/play/play",
                  success: function () {
                    console.log(app.data);
    
    
    
    
                  }
                })
          }




        app.data.state = true


        console.log(app.data)
      },

    })


  },
 onLoad(e){
   var that=this;
  wx.request({
    url: api.default.host +'musicRankingsDetails?type='+e.id,
    success:function(res){
      console.log(res)
      that.setData({
        list:res.data.result,
        src:e.src

      })
    }
  })
 },
  onReachBottom() {
    console.log("3232")
  }
  
})