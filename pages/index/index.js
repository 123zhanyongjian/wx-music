//index.js
//获取应用实例
const app = getApp();
const api = require('../../utils/api')
const time = require('../../utils/time.js')
const { img } = require('../../utils/loveBg')
const request = require('../../utils/request')
const utils = require('../../utils/util.js')
const errorHandler = require('../../utils/errorHandler')
const playHistory = require('../../utils/playHistory')

// 工具函数：去除/api前缀
function fixImgUrl(url) {
  return url ? url.replace(/^\/?api\//, '') : '';
}

Page({
  data: {
    total: 0,
    pageSize: 10,
    imgUrl: '',
    title: '',
    name: '',
    myLovesrc: img,
    pageNum: 1,
    musicList: [
      {
        src: app.host + '/kw.jpg',
        name: '酷我热歌榜（每天更新）',
        id: 'kw',
        img: app.host + '/kw.jpg',
        noRefresh: true
      },
      // {
      //   src: 'https://p1.music.126.net/sby9mSmSydldzT0fsEE6MQ==/109951167965618537.jpg',
      //   name: '周杰伦',
      //   id:'jay'
      // },


    ],
    currentTab: 0, // 当前tab索引
    songList: [
    
    ],
    moreActions: ['立即播放', '下一首播放', '添加到歌单'],
    moreSongId: null,
    popusShow: false,
    songToAdd: null,
  },
  //事件处理函数
  //播放音乐

  //跳转到详情
  change(e) {
    // console.log(e)
    var id = e.currentTarget.dataset.data.id;
    var src = e.currentTarget.dataset.data.img
    // console.log(e)
    wx.navigateTo({
      url: "../../pages/details/details?id=" + id + '&&src=' + src
    })
  },
  /**
   * 获取推荐歌单
   */
  async getRecommend(id, page, size) {
    try {
      const res = await request.get('/top', {
        id,
        page,
        size
      });
      return res;
    } catch (error) {
      console.error('获取推荐失败:', error);
      return { success: false };
    }
  },
  /**
   * 获取推荐歌曲
   */
  async getRecommendSong() {
    try {
      const res = await this.getRecommend('93', 1, 10);
      if (res.success && res.data && res.data.arr) {
        const songList = res.data.arr.map(k => ({
          ...k,
          img: app.host + '/resource?url=' + k.image
        }));
        this.setData({ songList });
      }
    } catch (error) {
      console.error('获取推荐歌曲失败:', error);
    }
  },


  change1() {
    wx.navigateTo({
      url: "../../pages/details/details?id=my&&src=" + this.data.myLovesrc
    })
  },
  /**
   * 获取推荐歌单列表
   */
  async getRecommen(page = this.data.pageNum) {
    if (page === 1) {
      this.setData({
        musicList: [
          {
            src: app.host + '/kw.jpg',
            name: '酷我热歌榜（每天更新）',
            id: 'kw',
            img: app.host + '/kw.jpg',
            noRefresh: true
          },
        ]
      });
    }

    try {
      const res = await request.get('/recommen', { page });
      
      if (res.success && res.data && res.data.data) {
        // 处理图片url
        const list = res.data.data.map(item => {
          const imgUrl = '/' + fixImgUrl(item.img);
          return {
            ...item,
            img: app.host + imgUrl
          };
        });
        
        this.setData({
          musicList: this.data.musicList.concat(list),
          total: res.data.total || 0,
          pageNum: page
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  onLoad: function () {
    // console.log(this.getRecommen)
    this.getRecommen()
    this.getRecommendSong()
    // api.getJaySongList((res)=>{
    //   that.setData({
    //     [`musicList[1].img`]:res[0].pic||'https://p1.music.126.net/sby9mSmSydldzT0fsEE6MQ==/109951167965618537.jpg'
    //   })
    // })
    // wx.request({
    //   url: 'https://tonzhon.com/api/recommended_playlists',
    //   success:function(res){
    //     wx.hideLoading();
    //     // console.log(res);
    //     that.setData({
    //      musicList:that.data.musicList.concat(res.data.playlists.map(i=>({...i,img:`https://static.tonzhon.com/${i.cover}`})))
    //     })
    //   },
    //   fail:()=>{
    //     wx.hideLoading();
    //   }
    // })

  },
  getUserInfo: function (e) {

  },
  /*
  onReachBottom(){
    // console.log(333)
    utils.changePage.call(this,'getRecommen')
  },
  */
  onTabChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (this.data.currentTab !== index) {
      this.setData({ currentTab: index });
      // 这里可以根据index加载不同tab的数据，后续可扩展
    }
  },
  onDailyRecommend() {
    wx.showToast({ title: '每日推荐功能开发中', icon: 'none' });
  },
  onPlaylist() {
    wx.showToast({ title: '歌单功能开发中', icon: 'none' });
  },
  onRank() {
    wx.showToast({ title: '排行榜功能开发中', icon: 'none' });
  },
  /**
   * 播放歌曲
   */
  async playSong(e) {
    const song = e.currentTarget.dataset.song;

    if (app.data.song && app.data.song.id === song.id) {
      wx.showToast({
        title: '该歌曲正在播放中',
        icon: 'none'
      });
      return;
    }

    // 添加播放历史
    await playHistory.add({
      id: song.id,
      title: song.title || song.name,
      singer: song.author || song.singer,
      pic: song.pic || song.img || song.cover
    });

    app.data.song = song;
    wx.switchTab({
      url: "../../pages/newPlay/newPlay",
      success: () => {
        app.data.paythis.setData({
          value: 0
        });
        time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
      }
    });
  },
  onMore(e) {
    const id = e.currentTarget.dataset.id;
    const song = this.data.songList.find(item => item.id == id);
    this.setData({ moreSongId: id });
    wx.showActionSheet({
      itemList: this.data.moreActions,
      success: (res) => {
        if (res.tapIndex === 0) {
          // 立即播放
          this.playSong({ currentTarget: { dataset: { id } } });
        } else if (res.tapIndex === 1) {
          // 下一首播放
          try {
            let songlist = wx.getStorageSync('songlist') || [];
            let currentIndex = songlist.findIndex(i => i.id === (getApp().data.song?.id));
            if (currentIndex === -1) currentIndex = 0;
            songlist.splice(currentIndex + 1, 0, song);
            wx.setStorageSync('songlist', songlist);
            getApp().data.songlist = songlist;
            wx.showToast({ title: '已插入下一首', icon: 'success' });
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        } else if (res.tapIndex === 2) {
          // 添加到歌单
          this.setData({ popusShow: true, songToAdd: song });
        }
      }
    });
  },
  onCloseAddSongList() {
    this.setData({ popusShow: false });
  },
  onRecommendScroll(e) {
    const { scrollLeft, scrollWidth } = e.detail;
    // 获取scroll-view的实际宽度
    wx.createSelectorQuery().select('.netease-recommend-scroll').boundingClientRect(rect => {
      if (rect) {
        const clientWidth = rect.width;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          utils.changePage.call(this, 'getRecommen')
        }
      }
    }).exec();
  }
})
