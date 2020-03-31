//index.js
//获取应用实例
const app = getApp();
const api = require('../api/index.js')
const tiem=require('../../utils/time.js')
Page({
  data: {
    motto: 'Hello World',
    data:[],
    song:'',
    src:'',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
 //播放音乐
  
  pay(e) {
    var that = this;
    var item = e.currentTarget.dataset.item;
    console.log(item)
    var song;
    wx.request({
      url: api.default.host+'musicDetails?id='+e.currentTarget.dataset.item.song_id,
      success:function(res){
        console.log(res.data,55)
        if (res.data.result.songList==''){
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
          
       
        console.log(666,song);
        app.data.song =song;
        tiem.newAddSong(app.data);
        //将http转换为https
        song.lrcLink=song.lrcLink.replace('http','https'),
        console.log(song.lrcLink)
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
  //跳转到详情
  change(e){
    var id = e.currentTarget.dataset.data.type;
    var src = e.currentTarget.dataset.data.pic_s444
    console.log(e)
    wx.navigateTo({
      url:"../../pages/details/details?id="+id+'&&src='+src
    })
  },
  onLoad: function () {
    var that=this;
    wx.showLoading({
      title: '加载中',

    })
    wx.request({
      url: api.default.host +'musicRankings',
      success:function(res){
        wx.hideLoading();
        console.log(res);
        that.setData({
         data:res.data.result
        })
      }
    })
    
  },
  getUserInfo: function(e) {
  
  }
})
