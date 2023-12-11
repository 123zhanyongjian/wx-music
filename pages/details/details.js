// pages/details/details.js
const app=getApp();
const time=require('../../utils/time.js')
const api = require('../../utils/api')
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
    var song = e.currentTarget.dataset.item;
    api.getSongSrc(song.id, ({src, stauts}) => {
      console.log(src,stauts)
      if (stauts) {
        song.src = src
        song['author'] = song.singer;
        app.data.song = song;
        wx.switchTab({
          url: "../../pages/play/play",
          success: function () {
            app.data.paythis.setData({
              value: 0
            })
            time.newAddSong(app.data);
            time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



          }
        })
      }
    })
    
  },
  
  whole() {
    app.data.songlist = this.data.list;
    const arr = this.data.list.slice()
   api.getwholeSongSrc(arr, ({src, stauts,item}) => {
    let song = item;
    console.log(item,44)
     if (stauts) {
       song.src = src
       song['author'] = song.singer;
       app.data.song = song;
      
       wx.switchTab({
         url: "../../pages/play/play",
         success: function () {
           app.data.paythis.setData({
             value: 0
           })
           wx.setStorage({
             key: 'songlist',
             data: app.data.songlist,
             success: function (res) {
               console.log('异步保存成功')
             }
           })
           time.newAddSong(app.data);
           time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



         }
       })
     }
   })



  },
 onLoad(e){
   var that=this;
   wx.showLoading({
    title: '加载中...',
  })
  wx.request({
    url: 'https://tonzhon.com/api/playlists/'+e.id,
    success:function(res){
     wx.hideLoading()
     if(res.data.success){
      that.setData({
        list:res.data.playlist.songs.map(i => ({
          title: i.name,
          id:i.newId,
          singer:i?.artists.map(it=>it.name).join('-'),
          islink:true,
          type:(i.newId)[0],
          pic:e.src,
          src:i.newId,
          author:i?.artists.map(it=>it.name).join('-'),
          mId:3 ,// 该资源下的搜索内容
         })),
        src:e.src

      })
     }

     
    },
    fail:()=>{
      wx.hideLoading()
    }
  })
 },
  onReachBottom() {
    console.log("3232")
  }
  
})