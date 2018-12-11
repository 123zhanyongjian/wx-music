//logs.js
const util = require('../../utils/util.js')
const tiem = require('../../utils/time.js')
const app = getApp();
const api = require('../api/index.js')


Page({
  data: {
    logs: [],
    songList: [],
    ins: '', //列表选中
    showtime: false,
    loopstate:0,//f0代表顺序，1代表循环，2代表随机
    loop:'../../image/sx.png',
    lrc: [{
      lrc: '暂无歌词'
    }],

    max: 0,
    t: "00:15",
    conduct: '', //播放进度时长
    Duration: '', //总时长
    value: 0,
    toLineNum: 0, //滚动条位置
    img: 'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1542972480302&di=66796f3d0a9efc6e207ba1b3a6f7ac28&imgtype=0&src=http%3A%2F%2Fimg.25pp.com%2Fuploadfile%2Fsoft%2Fimages%2F2014%2F0820%2F20140820100344572.jpg',
    author: '暂无',
    src: '',
    title: '暂无歌曲',
    pay: '../../image/bf.png',
    state: true,
    animationData: {},
    setInterval: '',
    close: false
  },
  //关闭歌曲列表
  closese() {
    this.setData({
      close: true
    })
    setTimeout(() => {
      this.setData({
        showtime: false
      })
      console.log("111")
    }, 300)

  },

  //打开歌曲列表
  open() {
    this.setData({
      close: false
    })
    setTimeout(() => {
      this.setData({
        showtime: true
      })
      console.log("111")
    }, 300)

  },
  //切换播放模式
  changloop(){
      if(this.data.loopstate==0){
        this.setData({
          loopstate:1,
          loop: '../../image/xh.png'

        })
        wx.showToast({
          title: '循环播放',
          icon: 'none',
          duration: 1000
        })
      } else if (this.data.loopstate == 1){
        this.setData({
          loopstate:2,
          loop: '../../image/sj.png'

        })
        wx.showToast({
          title: '随机播放',
          icon: 'none',
          duration: 1000
        })
      }else{
        this.setData({
          loopstate: 0,
          loop: '../../image/sx.png'

        })
        wx.showToast({
          title: '顺序播放',
          icon: 'none',
          duration: 1000
        })
      }
  },
  //切换进度条
  changeslider(e) {

    console.log(e.detail.value);
    if (this.data.max != 0) {
      app.innerAudioContext.seek(e.detail.value);
      this.setData({
        value: e.detail.value,
        conduct: tiem.MinuteConversion(this.data.value)
      })
    }

  },
  //长按删除
  del(e) {

    var index = e.currentTarget.dataset.index,
    
      that = this;
    wx.showModal({
      title: '提示',
      content: '确定删除该歌曲？',
      success(res) {
        if (res.confirm) {
          that.data.songList.splice(index, 1)
         
          wx.setStorage({
            key: 'songlist',
            data: that.data.songList,
            success: function(res) {
              console.log('异步保存成功');
              var song = wx.getStorageSync('songlist');
              app.data.songlist = song
              that.setData({
                songList:song
              })
            }
          })

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },
  //清空列表
  clearse(){
   var that = this;
    wx.showModal({
      title: '提示',
      content: '确定删除所有歌曲？',
      success(res) {
        if (res.confirm) {
          var song =[]
          that.setData({
            songList: song
          });
          wx.setStorage({
            key: 'songlist',
            data: that.data.songList,
            success: function (res) {
              console.log('异步保存成功')
            }
          })

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },
  onShow() {
    
   setTimeout(()=>{
     var song = wx.getStorageSync('songlist');
     app.data.songlist=song
     tiem.addsong(app.data);
     this.setData({
       songList: song
     })
     if (this.data.state) {
       tiem.Readinfo(this, app.innerAudioContext, app)
     }
   },500)


  //   console.log(app.innerAudioContext, song);



  //   // if (app.data.song != '') {

  //   //   var song = app.data.song;
  //   //     console.log(song)
  //   //   this.setData({
  //   //     author: song.author,
  //   //     img: song.pic,
  //   //     title: song.title,
  //   //     src: song.url,



  //   //   })


  //   //   console.log("？？？3333")
  //   // }


  },
  onHide() {
    // clearInterval(this.data.setInterval)
  },

  //选择音乐
  pay(e) {
    this.setData({
      ins: e.currentTarget.dataset.index,
      value: 0
    })
    console.log(e.currentTarget.dataset.item)
    app.data.song = e.currentTarget.dataset.item;
  if(app.data.song.pic==undefined){
    tiem.wholelist(app)
  }else{
    tiem.Lrcget(this, app.data.song)
    tiem.pay(this, app.innerAudioContext, app.data.song);
  }
    console.log(tiem)
  
   
  },
  //上一曲
  last() {
    console.log(this.data.ins,app)
    if (this.data.ins > 0) {
      tiem.Lastsong(this, app.innerAudioContext,app)
    } else {
      wx.showToast({
        title: '已经是第一曲了',
        icon: 'none',
        duration: 1000
      })
    }
  },
  
  
  //下一曲
  next() {
    console.log(this.data.ins,app)
    if (this.data.songList.length - 1 > this.data.ins) {
      tiem.Nextsong(this, app.innerAudioContext,app)
    } else {
      wx.showToast({
        title: '已经是最后一曲了',
        icon: 'none',
        duration: 1000
      })
    }
  },
  //播放暂停
  pays() {
    var that = this;
    if (app.data.song == '') {
      wx.showToast({
        title: '暂无可播放的歌曲',
        icon: 'none',
        duration: 1000
      })
    } else {
      if (this.data.state) {
        //播放音乐
        tiem.pay(this, app.innerAudioContext, app.data.song);
       
         
          console.log(this.data.value)
      
      } else {
        //暂停音乐
        tiem.suspend(this, app.innerAudioContext)
      }
    }
    // console.log(innerAudioContext, 123)
  },
  onLoad: function() {
    app.data.paythis = this;
   

    app.innerAudioContext.onPlay(() => {
      if (this.data.state) {
        console.log("停我音乐？", this.data.state)
        app.innerAudioContext.pause();
      }
      })
    
  }
})