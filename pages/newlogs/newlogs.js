// pages/newlogs/newlogs.js
const time = require('../../utils/time.js')
const app = getApp();
const api = require('../../utils/api')
const request = time.Promisify(wx.request)
const debounce = time.debounce()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    song: [

    ],
    key: 'netease',
    singer: '', //歌手
    logo: '../../image/qqjt.png',
    state: '6',
    itemList: ['立即播放', '下一首播放'],
    array: ['聚合', 'QQ', '网易云', '千千', '咪咕', '酷狗', '爱听'],
  },
  // 输入监听
  onSearchInput(e) {
    const that = this
    wx.hideLoading()
    wx.hideToast()
    var serach = e.detail.value;
    that.setData({
      serach
    })
    if (!serach.trim()) {
      that.setData({
        song: [],
        singer: '',
        singerList: []
      })
      return
    }

    if (serach.length === 1) {
      that.getData()

    } else if (serach.length > 1) {
      debounce(that.getData.bind(this), 1000)
    }


  },
  fillSearch(e) {
    this.setData({
      serach: e.currentTarget.dataset.word
    })
    this.getData()
  },
  goToSingerDetail(e) {
    const singer = e.currentTarget.dataset.singer;
    app.data.singer = { ...singer, avatar: singer.img };
    app.data.avatar = singer.img
    console.log(singer.id)
    wx.navigateTo({
      url: "/pages/singerdetails/singerdetails?id=" + singer.id
    });
  },
  getData() {
    const that = this
    console.log(that, 'that')
    const serach = that.data.serach
    if (!serach.trim()) {
      that.setData({
        song: [],
        singer: ''
      })
      return
    }
    if (that.data.state === '3') {
      wx.showLoading({
        title: '加载中',
      })
      wx.request({
        url: 'https://dataiqs.com/api/kgmusic/' + '?msg=' + serach,
        success: function (res) {
          wx.hideLoading();
          // console.log(res.data);
          //数据处理
          let arr = [];
          res.data.data.map((item, index, ite) => {
            if (ite.length > 0) {
              let obj = {}
              obj.title = item.name,
                obj.author = item.singername;
              obj.pic = 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
                // obj.src = `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
                obj.mvid = item.mvid
              obj.id = item.hash
              obj.mId = 2 // 表示 gaiId的资源
              arr.push(obj)
            }
            return arr;
          })
          // console.log(res.data.result.songs)
          that.setData({
            song: arr

          })
        }
      })


      return
    }

    if (that.data.state === '6') {
      // 爱听音乐
      wx.showLoading({
        title: '加载中',
      })
      request({
        url: app.host + `/serach?name=${serach}`
      })
        .then(res => {
          wx.hideLoading()
          if (res.data.code === 200) {
            that.setData({
              song: res.data.data?.data,
              singerList: res.data.data?.singer
            })
            return
          }

          setTimeout(() => {
            wx.showToast({
              title: res.data.message,
              icon: 'error'
            })
          }, 200);
        }, err => {
          wx.hideLoading()
          setTimeout(() => {
            wx.showToast({
              title: err.message,
              icon: 'error'
            })
          }, 200);
        })
      return
    }

    if (that.data.state !== '0') {
      wx.showLoading({
        title: '加载中',
      })
      request({
        url: app.host + '/getSongList',
        method: 'post',
        data: {
          input: serach,
          filter: 'name',
          type: that.data.key,
          page: 1,

        },

      })
        .then(res => {
          setTimeout(() => {
            wx.hideLoading();
          }, 300);
          if (!res.data.data) {
            wx.showToast({
              title: '查询失败',
              icon: 'error'
            })
            return
          }
          const arr = res.data.data.map((item, index, ite) => {
            let obj = { ...item }
            if (ite.length > 0) {

              obj.title = item.title,
                obj.author = item.author;
              obj.pic = item.pic || 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
                obj.src = item.url,
                obj.id = item.songid
              obj.lrc = item.lrc;
              obj.type = item.type
              obj.mId = 1 // 表示/getSongList下的资源

            }
            return obj;
          })
          that.setData({
            song: arr

          })
          // console.log(that.data.song,444)
        }, err => {
          setTimeout(() => {
            wx.hideLoading();
          }, 300);
          if (err.errMsg === 'request:fail url not in domain list') {
            wx.showToast({
              title: '请打开开发者模式',
              icon: 'none'
            })
          }
          // console.log(err)
        })
    }
    else {
      // console.log(123456)
      api.getSerachSongOrSinger(serach, undefined, arr => {

        that.setData({
          song: arr.map(i => ({ ...i, title: i.name, author: i.singer }))
        })
      })
    }
  },
  //播放音乐
  pay(e) {
    var song = e.currentTarget.dataset.song;
    // console.log(e)
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
        // time.newAddSong(app.data);
        time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
      }
    })
    return
  },
  //切换搜索模式
  bindPickerChange(e) {
    return  // 暂时不用搜索

    if (e.detail.value == '2') {
      this.setData({
        state: '1',
        key: 'netease',
        logo: '../../image/wangyi.jpg'
      })
    } else if (e.detail.value == '1') {
      this.setData({
        state: '1',
        key: 'qq',
        logo: '../../image/qqmusic.jpg'
      })
    } else if (e.detail.value == '3') {
      this.setData({
        state: '1',
        key: 'baidu',
        logo: '../../image/qianqian.png'
      })
    } else if (e.detail.value == '4') {
      this.setData({
        state: '1',
        key: 'migu',
        logo: '../../image/mg.png'
      })
    } else if (e.detail.value == '0') {
      this.setData({
        state: '0',
        key: 'migu',
        logo: '../../image/jh.png'
      })
    }
    else if (e.detail.value == '5') {
      this.setData({
        state: '3',
        key: 'qq',
        logo: '../../image/kg.png'
      })
    }
    else if (e.detail.value == '6') {
      this.setData({
        state: '6',
        logo: '../../image/qqjt.png'
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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