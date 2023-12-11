const app = getApp()
const song = require('../../utils/song.js')
const api = require('../../utils/api.js');
const time = require('../../utils/time.js')
Page({
  data: {
    songs: [],
    n: 0,
    itemList: ['立即播放', '下一首播放'],
    list: [],//临时列表
    timer: ''//定时器
  },
  showActionSheet(ev) {
    let item = ev.currentTarget.dataset.item;
    let that = this;
    app.data.song = item;
    console.log(item);
    wx.showActionSheet({
      itemList: this.data.itemList,

      success(e) {
        console.log("success")
        console.log(e)
        if (!e.camcle) {
          if (e.tapIndex) {
            time.nextSongPay(app.data)
          } else {
            that.pay(ev)
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
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: app.data.singer.name
    })

    if (app.data.singer.avatar == undefined) {
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.pic
      })
    } else {
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.avatar
      })
    }
    setTimeout(() => {
      this.getSingerDetail()
    }, 10);
    app.data.fromSinger = false

  },
  getSingerDetail: async function () {
    // 查询歌手歌单列表
    api.getSerachSongOrSinger(this.data.title, this.data.image, e => {
      this.setData({
        songs: e
      })
    })


  },
  _normallizeSongs: function (list) {
    let ret = []
    list.forEach((item) => {
      let { musicData } = item
      if (musicData.songid && musicData.albummid) {
        ret.push(song.createSong(musicData))
      }
    })
    return ret
  },
  //请求歌曲信息
  getDATA(song) {

  },

  whole() {
    app.data.songlist = this.data.songs.map(it=>({...it,title:it.name,author:it.singer}));
    const arr =  app.data.songlist.slice()
    console.log(arr,7777)
    api.getwholeSongSrc(arr, ({src, stauts,item}) => {
     let song = item
      if (stauts) {
        song.src = src
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
  //播放音乐
  async pay(e) {
    var song = e.currentTarget.dataset.item;
    api.getSongSrc(song.id, ({src, stauts}) => {
      console.log(src,stauts)
      if (stauts) {
        song.src = src
        song['title'] = song.name;
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

  /*上拉加载更多歌曲*/
  onReachBottom() {
    // this.getSingerDetail(app.data.singer.id, this.data.songs.length)
    // console.log("sdsd")
  }
})