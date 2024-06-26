// pages/play/play.js
const util = require('../../utils/util.js')
const tiem = require('../../utils/time.js')
const app = getApp();
const api = require('../api/index.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    popusShow: false,
    logs: [],
    Mv: false,
    love: '../../image/love.png',
    Mvsrc: '',
    songList: [],
    Crack: false, //false未开启 true开启破解
    ins: '', //列表选中
    showtime: false,
    loopstate: 0, //0代表顺序，1代表循环，2代表随机
    loop: '../../image/sx.png',
    loveState: false,
    lrc: [{
      lrc: '暂无歌词'
    }],

    max: 0,
    t: "00:15",
    conduct: '', //播放进度时长
    Duration: '', //总时长
    value: 0,
    toLineNum: 0, //滚动条位置
    img: api.host + '/homebg.jpg',
    author: '暂无',
    src: '',
    title: '暂无歌曲',
    pay: '../../image/bf.png',
    state: true,
    animationData: {},
    setInterval: '',
    close: false,
    song: {},
    id: '', // 当前播放的id
    isScroll: false

  },
  binddragend(e) {
    const str = setTimeout(() => {
      this.setData({
        isScroll: false
      })
      clearTimeout(str)
    }, 2000);
  },
  binddragstart(e) {
    this.setData({
      isScroll: true
    })
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

    }, 300)

  },
  binderrorImg() {
    this.setData({
      img: 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
    })
  },
  popusShowChange() {
    this.setData({
      popusShow: false
    })
  },
  pushplaylist() {
    if (!this.data.song?.id) {
      return wx.showToast({
        title: '没有可添加的音乐',
        icon: 'none'
      })
    }
    this.setData({
      popusShow: true
    })
  },
  // 关闭mv
  cuos() {
    setTimeout(() => {
      this.setData({
        Mv: false
      })

    }, 300)
  },
  //打开歌曲列表
  open() {
    if (this.data.Mv) {
      return
    }
    this.setData({
      close: false
    })
    setTimeout(() => {
      this.setData({
        showtime: true
      })

    }, 300)

  },
  bindchangeSwiper(){
    if(this.data.isScroll){
      const str = setTimeout(() => {
        this.setData({
          isScroll:false
        })
        clearTimeout(str)
    }, 2000);
    }
  },
  changeSeek(e) {
    if (this.data.isScroll) {
      const obj = {
        detail: {
          value: e.currentTarget?.dataset?.time
        }
      }
      this.changeslider(obj);
      if (this.data.state) {
        // 如果暂停就播放
        app.innerAudioContext.play();
      }
      this.binddragend()
    }
  },
  // mv播放异常
  bindMvError(e) {
    console.log(e)
  },
  //切换播放模式
  changloop() {
    if (this.data.loopstate == 0) {
      this.setData({
        loopstate: 1,
        loop: '../../image/xh.png'

      })
      wx.showToast({
        title: '循环播放',
        icon: 'none',
        duration: 1000
      })
    } else if (this.data.loopstate == 1) {
      this.setData({
        loopstate: 2,
        loop: '../../image/sj.png'

      })
      wx.showToast({
        title: '随机播放',
        icon: 'none',
        duration: 1000
      })
    } else {
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
  changlove() {
    const that = this
    if (!this.data.loveState) {
      // 设置为喜欢
      this.setData({
        loveState: true
      })
      if (app.data.loveList.findIndex(i => i.id === this.data.song.id) === -1) {
        const obj = {
          ...app.data.song,
          love: true
        }
        delete obj.lrc
        app.data.loveList.push(obj)
      }
      wx.setStorage({
        key: 'loveList',
        data: app.data.loveList,
        success: function (res) {
          console.log('异步保存成功');
          that.getLoveList()

        }
      })
      return
    }
    // 取消喜欢
    this.setData({
      loveState: false
    })
    app.data.loveList.splice(app.data.loveList.findIndex(i => i.id === this.data.song.id), 1)
    wx.setStorage({
      key: 'loveList',
      data: app.data.loveList,
      success: function (res) {
        console.log('异步保存成功');

      }
    })
  },
  getLoveList() {
    wx.getStorage({
      key: 'loveList',
      success: (res) => {
        app.data.loveList = res.data
      },
      fail: () => {
        wx.showToast({
          title: '暂时没有收藏内容',
          icon: 'none'
        })
      }
    })
  },
  returnloveList() {
    return app.data.loveList
  },
  //切换进度条
  changeslider(e) {


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

          that.delSong(index)

        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },
  changeTitle() {
    wx.setNavigationBarTitle({
      title: app.data.song.title
    })
  },
  delSong(index) {
    const that = this;
    const arr = that.data.songList.slice() // 深拷贝
    that.data.songList.splice(index, 1)

    wx.setStorage({
      key: 'songlist',
      data: that.data.songList,
      success: function (res) {
        console.log('异步保存成功');
        var song = wx.getStorageSync('songlist');
        app.data.songlist = song
        that.setData({
          songList: song,
          ins: that.data.songList.findIndex(i => i.id === app.data.song.id)
        })
        if (that.data.ins === -1 && !that.data.state) {
          that.setData({
            value: 0
          })
          app.data.song = arr[index + 1]
          tiem.pay(that, app.innerAudioContext, app.data.song, 1)
        }
      }
    })
  },
  //清空列表
  clearse() {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确定删除所有歌曲？',
      success(res) {
        if (res.confirm) {
          var song = []
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.data.paythis = this;
    // this.getLoveList()
    if (this.data.state) {
      tiem.Readinfo(this, app.innerAudioContext, app)

    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    setTimeout(() => {
      var song = wx.getStorageSync('songlist');
      const loveList = wx.getStorageSync('loveList') || []
      app.data.songlist = song
      app.data.loveList = loveList
      console.log(app.data)
      console.log(this, 555)
      this.setData({
        songList: song
      })
      if (this.data.state) {}
    }, 500)

  },
  //MV播放
  MvSHOW() {
    //暂停音乐
    tiem.suspend(this, app.innerAudioContext)


    this.setData({
      Mv: true
    })

    setTimeout(() => {
      const mv = wx.createVideoContext('myMv')
      mv.seek(20);
      console.log(mv, 333)
    }, 5000);
  },
  //选择音乐
  pay(e) {
    this.setData({
      ins: e.currentTarget.dataset.index,
      value: 0
    })

    app.data.song = this.data.songList[e.currentTarget.dataset.index];
    if (!app.data.song.src) {
      app.data.song.src = 'https://zhanyj.cn/api/src'
    }

    if (app.data.song.mId === 3) {
      console.log(this.data.value, 444)
      tiem.pay(this, app.innerAudioContext, app.data.song, 1);
    } else {
      console.log('?3333??')
      tiem.Lrcget(this, app.data.song)
      tiem.pay(this, app.innerAudioContext, app.data.song, 1);
    }



  },
  // 下载
  // download() {
  //   const that = this
  //   if (!this.data.song?.id) return wx.showToast({
  //     title: '暂时没有可下载的资源',
  //     icon: 'none'
  //   })
  //   wx.showModal({
  //     title: '提示',
  //     content: '下载资源到本地吗?',
  //     success(res) {
  //       if (res.confirm) {
  //         const file = wx.downloadFile({
  //           url: that.data.song?.src,
  //           success: (data) => {
  //             const fileNameWithExt = (data.tempFilePath).split('/').pop(); // 获取路径中的最后一部分，即文件名名  
  //             // 构建目标路径，使用微信小程序的用户数据目录并加上文件名  
  //             const destPath = wx.env.USER_DATA_PATH + '/' + fileNameWithExt;
  //             wx.saveFile({
  //               tempFilePath: data.tempFilePath, // 源文件路径  
  //               destPath: destPath, // 目标文件路径  
  //               success: function (res) {
  //                 wx.showToast({
  //                   title: '下载成功',
  //                   icon:"success"
  //                 })
  //                 console.log(res)
  //                 // 在这里，你可以使用 destPath 来访问和操作保存的文件  
  //               },
  //               fail: function (err) {
  //                 console.error('文件保存失败', err);
  //                 // 处理保存失败的情况  
  //               }
  //             });
  //           },
  //           fail: (err) => {
  //             console.log(err)
  //           }
  //         })
  //         file.onProgressUpdate((ret) => {
  //           if (ret.progress < 100) {
  //             wx.showToast({
  //               title: `正在下载${ret.progress}%`,
  //               icon: 'loading'
  //             })
  //           } else {
  //             wx.hideLoading();
  //             file.offProgressUpdate()
  //           }
  //         })
  //       } else if (res.cancel) {
  //         console.log('用户点击取消')
  //       }
  //     }
  //   })

  // },
  //上一曲
  last() {
    if (this.data.Mv || !this.data.songList.length) {
      return
    }
    if (this.data.ins > 0) {
      tiem.Lastsong(this, app.innerAudioContext, app)
    } else {
      this.setData({
        ins: app.data.songlist.length
      })
      tiem.Lastsong(this, app.innerAudioContext, app)
    }
  },


  //下一曲
  next() {
    console.log(this.data)
    if (this.data.Mv || !this.data.songList.length) {
      return
    }
    if (this.data.songList.length - 1 > this.data.ins) {
      tiem.Nextsong(this, app.innerAudioContext, app)
    } else {
      this.setData({
        ins: 1
      })
      tiem.Lastsong(this, app.innerAudioContext, app)
    }

  },
  //播放暂停
  pays() {
    if (this.data.Mv) {
      return
    }
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




      } else {
        //暂停音乐
        tiem.suspend(this, app.innerAudioContext)
      }
    }
    // console.log(innerAudioContext, 123)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})