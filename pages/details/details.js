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
        console.log(res.data, 55)
        song = res.data.result.songList[0];
        song['url'] = song.showLink;
        song['title'] = song.songName;
        song['pic'] = song.songPicRadio;
        song['author'] = song.artistName,

          that.setData({
            song: song
          })

        console.log(that.data.song);
        app.data.song = that.data.song;

        var flag
        wx.request({
          url: song.lrcLink,
          success: function (ret) {
            app.data.song.lrc = ret.data;
            wx.request({
              url: api.default.localhost + 'song',
              success: function (res) {
                for (let i of res.data) {
                  if (that.data.song.songId == i.songid || that.data.song.songId == i.songId) {
                    flag = true;
                    console.log('重复了', that.data.song.songid, i.songid, i.songId)
                  } else {
                    flag = false;
                    console.log('添加')
                  }
                }
                console.log(flag);
                tiem.pay(app.data.paythis, app.innerAudioContext, app.data.song);
                app.data.paythis.setData({
                  value: 0
                })
                setTimeout(() => {
                  if (!flag) {
                    wx.request({
                      url: api.default.localhost + 'song',
                      method: 'post',
                      data: that.data.song,
                      success: function (res) {
                        console.log(res)
                      }
                    })

                  }
                })
              }
            })
          }
        })




        wx.switchTab({
          url: "../../pages/play/play",
          success: function () {
            console.log(app.data);



          }
        })

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
 }
  
})