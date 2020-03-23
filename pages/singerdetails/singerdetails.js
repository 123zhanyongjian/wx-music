const app = getApp()
const song = require('../../utils/song.js')
const api = require('../../utils/api.js');
const time=require('../../utils/time.js')
Page({
  data: {
    songs: [],
    n:0,
    list:[],//临时列表
    timer:''//定时器
  },
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: app.data.singer.name
    })
    
    if (app.data.singer.avatar==undefined){
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.pic
      })
    }else{
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.avatar
      })
    }
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
      console.log(ret)
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
  getDATA(song){
   
  },

  whole(){
    var request = time.Promisify(wx.request)
    app.data.song = this.data.songs[0]
    var songmidid = app.data.song.mid
    var mvid = app.data.song.vid
    request({
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
      }

    })
      .then(res => {

        var res1 = res.data.replace("callback(", "")
        var res2 = JSON.parse(res1.substring(0, res1.length - 1))
        const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
        app.data.song.src = playUrl;
        app.data.song['title'] = app.data.song.name;
        app.data.song['author'] = app.data.song.singer;
        app.data.song['pic'] = app.data.song.image;
        wx.switchTab({
          url: "../../pages/play/play",
          success: function () {
            console.log(app.data.paythis)


          }

        })
        //获取mv
        if (mvid) {
          request({
            url: `https://v1.itooi.cn/tencent/mv?id=${mvid}`
          })
            .then(rev => {
              console.log(rev, '2222222222222222222222222222222222222222222222222222');
              let id;
              Object.keys(rev.data.data).forEach((item, index) => {
                if (index === 0) {
                  id = { ...rev.data.data[item] }
                }
              })
              app.data.paythis.data.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=480`
              app.data.song.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=480`
              app.data.paythis.setData({
                value: 0,
                ins: 0
              })
              time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
            })
            .catch(err => {
              app.data.paythis.setData({
                value: 0,
                ins: 0
              })
              time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
            })
        }
      })
    app.data.songlist=this.data.songs;
    
    wx.setStorage({
      key: 'songlist',
      data: app.data.songlist,
      success: function (res) {
        console.log('异步保存成功')
      }
    })
   
   
  },
  //播放音乐
  pay(e){
    var request = time.Promisify(wx.request)
    var song = e.currentTarget.dataset.item;
    var songmidid = e.currentTarget.dataset.item.mid
    var mvid = e.currentTarget.dataset.item.vid
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
        song.src=playUrl;
        song['title'] = song.name;
        song['author']=song.singer;
        song['pic']=song.image;
        app.data.song = song;
        wx.switchTab({
          url: "../../pages/play/play",
          success: function () {
            console.log(app.data);



          }
        })
        setTimeout(() => {
          app.data.paythis.setData({
            value: 0
          })
          time.pay(app.data.paythis, app.innerAudioContext, app.data.song, app);


        }, 200)
        //获取mv
        if (mvid) {
          request({
            url: `https://v1.itooi.cn/tencent/mv?id=${mvid}`
          })
            .then(rev => {
              console.log(rev, '2222222222222222222222222222222222222222222222222222');
              let id;
              Object.keys(rev.data.data).forEach((item, index) => {
                if (index === 0) {
                  id = { ...rev.data.data[item] }
                }
              })
              app.data.paythis.data.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=270`;
              console.log(app.data.paythis)
              app.data.song.Mvsrc = `https://v1.itooi.cn/tencent/mvUrl?id=${id.gmid}&quality=270`
            })
        }
      
      }
    })
  
  },

   /*上拉加载更多歌曲*/
  onReachBottom(){
    this.getSingerDetail(app.data.singer.id, this.data.songs.length)
    console.log("sdsd")
  }
})