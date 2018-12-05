const app = getApp()
const song = require('../../utils/song.js')
const api = require('../../utils/api.js');
const time=require('../../utils/time.js')
Page({
  data: {
    songs: [],
  },
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: app.data.singer.name
    })
    this.setData({
      title: app.data.singer.name,
      image: app.data.singer.avatar
    })
    console.log(app.data.singer)
    this.getSingerDetail(app.data.singer.id)
    app.data.fromSinger = false

  },
  getSingerDetail: function (singermid, startIndex = 0) {
    api.getSingerSongs(singermid, startIndex).then((res) => {
      var res1 = res.data.replace("callback(", "")
      var res2 = res1.substring(0, res1.length - 1)
      let ret = this._normallizeSongs(JSON.parse(res2).data.list)
      let nowData = this.data.songs
      nowData.length > 0 ? nowData = nowData.concat(ret) : nowData = ret
      this.setData({
        songs: nowData
      })
      console.log(this.data.songs)
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

  whole(){
    app.data.songlist = []
    for(let i of this.data.songs){
      var song = i
      var songmidid =i.mid
      const _this = this;
      wx.request({
        url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&loginUin=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&filename=C400${songmidid}.m4a&guid=3913883408&songmid=${songmidid}&callback=callback`,
        data: {
          g_tk: 5381,
          inCharset: 'utf-8',
          outCharset: 'utf-8',
          notice: 0,
          format: 'jsonp',
          hostUin: 0,
          loginUin: 0,
          platform: 'yqq',
          needNewCode: 0,
          cid: 205361747,
          uin: 0,
          filename: `C400${songmidid}.m4a`,
          guid: 3913883408,
          songmid: songmidid,
          callback: 'callback',
        },
        success: function (res) {
          var res1 = res.data.replace("callback(", "")
          var res2 = JSON.parse(res1.substring(0, res1.length - 1))
          const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
          song.url = playUrl;
          song['title'] = song.name;
          song['author'] = song.singer;
          song['pic'] = song.image;
        
          //获取歌词
          wx.request({
            url: `https://route.showapi.com/213-2?showapi_appid=54411&musicid=${songmidid}&showapi_sign=55b7ca99e210452a86269a9f09def34c`,
            success: function (res) {

              song.lrc = res.data.showapi_res_body.lyric;
              app.data.songlist.push(song)
              console.log(app.data.songlist)         
              
            }
          })

        }
      })
    }
    setTimeout(() => {
      console.log(app.data.songlist)
      time.pay(app.data.paythis, app.innerAudioContext, app.data.songlist[0], app);
      app.data.paythis.setData({
        value: 0
      })
      wx.switchTab({
        url: "../../pages/play/play",
        success: function () {
          console.log(app.data);



        }
      })

    }, 200)
    
    
  },
  //播放音乐
  pay(e){
   
    var song = e.currentTarget.dataset.item;
    var songmidid = e.currentTarget.dataset.item.mid
    const _this = this;
 
    wx.request({
      url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&loginUin=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&filename=C400${songmidid}.m4a&guid=3913883408&songmid=${songmidid}&callback=callback`,
      data: {
        g_tk: 5381,
        inCharset: 'utf-8',
        outCharset: 'utf-8',
        notice: 0,
        format: 'jsonp',
        hostUin: 0,
        loginUin: 0,
        platform: 'yqq',
        needNewCode: 0,
        cid: 205361747,
        uin: 0,
        filename: `C400${songmidid}.m4a`,
        guid: 3913883408,
        songmid: songmidid,
        callback: 'callback',
      },
      success: function (res) {
        var res1 = res.data.replace("callback(", "")
        var res2 = JSON.parse(res1.substring(0, res1.length - 1))
        const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
        song.url=playUrl;
        song['title'] = song.name;
        song['author']=song.singer;
        song['pic']=song.image;
        app.data.song = song;
        //获取歌词
        wx.request({
          url: `https://route.showapi.com/213-2?showapi_appid=54411&musicid=${songmidid}&showapi_sign=55b7ca99e210452a86269a9f09def34c`,
          success: function (res) {

            song.lrc = res.data.showapi_res_body.lyric;
            setTimeout(() => {
              time.pay(app.data.paythis, app.innerAudioContext, app.data.song, app);
              app.data.paythis.setData({
                value: 0
              })
              wx.switchTab({
                url: "../../pages/play/play",
                success: function () {
                  console.log(app.data);



                }
              })

            }, 200)

          }
        })
      
      }
    })
  
  },
  
   /*上拉加载更多歌曲*/
  onReachBottom(){
    this.getSingerDetail(app.data.singer.id, this.data.songs.length)
    console.log("sdsd")
  }
})