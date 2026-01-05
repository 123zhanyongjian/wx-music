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
    recentPlayList: [], // 最近播放列表
    moreActions: ['立即播放', '下一首播放', '添加到歌单'],
    moreSongId: null,
    popusShow: false,
    songToAdd: null,
  },
  //事件处理函数
  //播放音乐

  /**
   * 跳转到详情
   * @param {Object} e - 事件对象
   */
  change(e) {
    // 阻止事件冒泡
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const data = e.currentTarget.dataset.data;
    if (!data || !data.id) {
      return;
    }

    const id = data.id;
    const src = data.img || '';
    
    wx.navigateTo({
      url: `../../pages/details/details?id=${id}&src=${encodeURIComponent(src)}`
    });
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
   * 获取推荐歌单列表（带缓存）
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
      // 使用缓存工具（第一页缓存1小时）
      const cache = require('../../utils/cache');
      const cacheKey = `recommen_${page}`;
      
      if (page === 1) {
        const cached = await cache.get(cacheKey);
        if (cached && cached.data && Array.isArray(cached.data)) {
          // 处理图片url
          const list = cached.data.map(item => {
            const imgUrl = '/' + fixImgUrl(item.img);
            return {
              ...item,
              img: app.host + imgUrl
            };
          });
          this.setData({
            musicList: this.data.musicList.concat(list),
            total: cached.total || 0,
            pageNum: page
          });
          console.log('使用缓存数据:', cached);
          return;
        }
      }

      console.log('请求推荐歌单接口，页码:', page);
      const res = await request.get('/recommen', { page });
      console.log('推荐歌单接口响应:', res);
      
      if (res.success && res.data && res.data.data) {
        // 处理图片url
        const list = res.data.data.map(item => {
          const imgUrl = '/' + fixImgUrl(item.img);
          return {
            ...item,
            img: app.host + imgUrl
          };
        });
        
        // 缓存第一页数据（1小时）- 正确存储数据结构
        if (page === 1) {
          await cache.set(cacheKey, {
            data: res.data.data,
            total: res.data.total
          }, 3600000);
          console.log('已缓存推荐歌单数据');
        }
        
        this.setData({
          musicList: this.data.musicList.concat(list),
          total: res.data.total || 0,
          pageNum: page
        });
      } else {
        console.error('推荐歌单接口返回失败:', res);
        if (!res.success) {
          errorHandler.handleApiError(res);
        }
      }
    } catch (error) {
      console.error('获取推荐歌单失败:', error);
      errorHandler.handleApiError(error);
    }
  },
  /**
   * 加载最近播放
   */
  async loadRecentPlay() {
    try {
      const recentList = await playHistory.getRecent(10);
      this.setData({ 
        recentPlayList: recentList.map(item => ({
          ...item,
          title: item.title || item.name,
          author: item.singer || item.author,
          img: item.pic || item.img || item.cover
        }))
      });
    } catch (error) {
      console.error('加载最近播放失败:', error);
    }
  },

  onLoad: function () {
    this.getRecommen()
    this.getRecommendSong()
    this.loadRecentPlay()
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
  /**
   * 播放歌曲
   * @param {Object} e - 事件对象
   */
  async playSong(e) {
    // 阻止事件冒泡
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const song = e.currentTarget.dataset.song;
    if (!song || !song.id) {
      return;
    }

    // 检查是否正在播放
    if (app.globalData.song && app.globalData.song.id === song.id) {
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

    // 更新全局状态（兼容新旧两种方式）
    app.globalData.song = song;
    app.data = app.data || {};
    app.data.song = song;
    
    // 切换到播放页面
    wx.switchTab({
      url: "../../pages/newPlay/newPlay",
      success: () => {
        // 延迟执行，确保播放页面已加载完成
        setTimeout(() => {
          // 兼容新旧两种方式获取 paythis
          const paythis = app.data?.paythis || app.globalData?.paythis;
          const audioContext = app.innerAudioContext;
          
          if (paythis && audioContext && song) {
            paythis.setData({
              value: 0
            });
            time.playCore(paythis, audioContext, song, 1);
          } else {
            console.warn('播放页面未初始化，等待页面加载...');
            // 如果页面还未加载，使用事件总线或延迟重试
            const retryCount = 0;
            const maxRetries = 10;
            const checkAndPlay = () => {
              const paythis = app.data?.paythis || app.globalData?.paythis;
              if (paythis && audioContext && song) {
                paythis.setData({ value: 0 });
                time.playCore(paythis, audioContext, song, 1);
              } else if (retryCount < maxRetries) {
                setTimeout(checkAndPlay, 100);
              } else {
                console.error('播放页面初始化超时');
                wx.showToast({
                  title: '播放失败，请重试',
                  icon: 'none'
                });
              }
            };
            setTimeout(checkAndPlay, 200);
          }
        }, 300);
      }
    });
  },
  /**
   * 更多操作
   * @param {Object} e - 事件对象
   */
  onMore(e) {
    // 阻止事件冒泡
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const id = e.currentTarget.dataset.id;
    const song = this.data.songList.find(item => item.id == id);
    if (!song) {
      return;
    }

    this.setData({ moreSongId: id });
    wx.showActionSheet({
      itemList: this.data.moreActions,
      success: (res) => {
        if (res.tapIndex === 0) {
          // 立即播放
          this.playSong({ currentTarget: { dataset: { song } } });
        } else if (res.tapIndex === 1) {
          // 下一首播放
          try {
            const app = getApp();
            let songlist = wx.getStorageSync('songlist') || [];
            let currentIndex = songlist.findIndex(i => i.id === (app.globalData.song?.id));
            if (currentIndex === -1) currentIndex = 0;
            songlist.splice(currentIndex + 1, 0, song);
            wx.setStorageSync('songlist', songlist);
            app.globalData.songlist = songlist;
            wx.showToast({ title: '已插入下一首', icon: 'success' });
          } catch (err) {
            console.error('插入歌曲失败:', err);
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
  },

  /**
   * 页面显示时刷新最近播放
   */
  onShow() {
    this.loadRecentPlay();
  }
})
