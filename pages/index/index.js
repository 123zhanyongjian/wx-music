//index.js
//获取应用实例
const app = getApp();
const api = require('../../utils/api')
const tiem=require('../../utils/time.js')
const {img} = require('../../utils/loveBg')

Page({
  data: {
    imgUrl: '',
    title: '',
    name: '',
    myLovesrc:img,
    musicList: [
      {
        src:app.host+'/kw.jpg',
        name:'酷我热歌榜（每天更新）',
        id:'kw',
        img:app.host+'/kw.jpg',
        noRefresh:true
      },
      {
        src: 'https://p1.music.126.net/sby9mSmSydldzT0fsEE6MQ==/109951167965618537.jpg',
        name: '周杰伦',
        id:'jay'
      },
      
    
    ]
  },
  //事件处理函数
 //播放音乐

  //跳转到详情
  change(e){
    console.log(e)
    var id = e.currentTarget.dataset.data.id;
    var src = e.currentTarget.dataset.data.img
    console.log(e)
    wx.navigateTo({
      url:"../../pages/details/details?id="+id+'&&src='+src
    })
  },
  change1(){
    wx.navigateTo({
      url:"../../pages/details/details?id=my&&src="+this.data.myLovesrc
    })
  },
  onLoad: function () {
    var that=this;
    wx.showLoading({
      title: '加载中',

    })
    api.getJaySongList((res)=>{
      that.setData({
        [`musicList[1].img`]:res[0].pic||'https://p1.music.126.net/sby9mSmSydldzT0fsEE6MQ==/109951167965618537.jpg'
      })
    })
    wx.request({
      url: 'https://tonzhon.com/api/recommended_playlists',
      success:function(res){
        wx.hideLoading();
        console.log(res);
        that.setData({
         musicList:that.data.musicList.concat(res.data.playlists.map(i=>({...i,img:`https://static.tonzhon.com/${i.cover}`})))
        })
      },
      fail:()=>{
        wx.hideLoading();
      }
    })
    
  },
  getUserInfo: function(e) {
  
  }
})
