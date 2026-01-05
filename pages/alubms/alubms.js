// pages/alubms/alubms.js
const app = getApp()
const song = require('../../utils/song.js')
const api = require('../../utils/api.js');
const time = require('../../utils/time.js')
const utils = require('../../utils/util.js')
const API = require('../../services/api')
const errorHandler = require('../../utils/errorHandler')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    popusShow:false,
    songs:[],
    image:'',
    alumbsinfo:'',
    name:'',
    itemList: ['立即播放', '下一首播放','添加到歌单'],
    date:'',
    list:[],
    paydata:'',
  },
  popusShowChange(e){
    this.setData({
      popusShow:e.detail
    })
    // console.log(this.data.popusShow)
   },
  more(e){
    this.showActionSheet(e)
  },
  showActionSheet(ev) {
    let item = ev.detail.song;
    let that = this;
  
    // console.log(item,app.data.song);
    wx.showActionSheet({
      itemList: this.data.itemList,

      success(e) {
        // console.log("success")
        // console.log(e)
        if (!e.camcle) {
          if (e.tapIndex===1) {
            app.data.song = item;
            time.nextSongPay(app.data)
          } else if(e.tapIndex===0) {
            app.data.song = item;
            that.pay(ev)
          }else{
           that.setData({
            popusShow:true,
            song:item
           })
          }
        } else {
          // console.log("cancle")
        }
      },
      fail(e) {
        // console.log("fail")
        // console.log(e)
      },
      complete(e) {
        // console.log("complete")
        // console.log(e)
      }
    })
  },
  openSingerInfo(){
    if(this.data.alumbsinfo.length>80){
      wx.showModal({
        title:this.data.name,
        content:this.data.alumbsinfo,
        showCancel:false,
        confirmText:'我知道了',
        confirmColor:'#14B4BB'

      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */

  whole() {
    if(!this.data.songs.length){
      return wx.showToast({
        title: '没有可播放的歌曲',
        icon:'none'
      })
    }
    app.data.songlist = this.data.songs.map(it=>({...it,title:it.title,author:it.author}));
    const arr =  app.data.songlist.slice()
    // console.log(arr,7777)
    app.data.song = arr[0];
       
    wx.switchTab({
      url: "../../pages/newPlay/newPlay",
      success: function () {
        app.data.paythis.setData({
          value: 0
        })
         time.saveStoreSongList(arr)
        time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);



      }
    })
 


  },
  //播放音乐
  async pay(e) {
    var song = e.detail.song;
    // 判断当前播放歌曲
    if (app.data.song && app.data.song.id === song.id) {
      wx.showToast({
        title: '该歌曲正在播放中',
        icon: 'none'
      });
      return;
    }
    app.data.song = song;
    wx.switchTab({
      url: "../../pages/newPlay/newPlay",
      success: function () {
        app.data.paythis.setData({
          value: 0
        })
        time.newAddSong(app.data);
        time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
      }
    })
    return
    api.getSongSrc(song.id, ({src, stauts}) => {
      // console.log(src,stauts)
      if (stauts) {
        song.src = src
        song['title'] = song.name;
        song['author'] = song.singer;
        app.data.song = song;
        wx.switchTab({
          url: "../../pages/newPlay/newPlay",
          success: function () {
            app.data.paythis.setData({
              value: 0
            })
            time.newAddSong(app.data);
            time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
          }
        })
      }
    })
  },
  /**
   * 页面加载
   */
  async onLoad(options) {
    this.setData({
      image: app.data.albumImg,
      name: options.name
    });
    
    wx.setNavigationBarTitle({
      title: options.name
    });

    if (options.id) {
      await this.loadAlbumInfo(options.id);
    }
  },

  /**
   * 加载专辑信息
   */
  async loadAlbumInfo(albumId) {
    try {
      const res = await API.album.getAlbumInfo({
        id: albumId,
        page: 1,
        size: 100
      });

      if (res.success && res.data) {
        this.setData({
          songs: res.data.arr?.map(i => ({
            ...i,
            pic: this.data.image || i.image || i.pic
          })) || [],
          total: res.data.total || 0,
          alumbsinfo: res.data.description || '',
          paydata: app.data?.paythis?.data,
          date: res.data.date || ''
        });
      } else {
        errorHandler.handleApiError(res);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
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