// pages/newlogs/newlogs.js
const time = require('../../utils/time.js')
const app = getApp();
const api = require('../../utils/api')
const API = require('../../services/api');
const searchHistory = require('../../utils/searchHistory');
const errorHandler = require('../../utils/errorHandler');
const debounce = time.debounce()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    song: [],
    key: 'netease',
    singer: '', //歌手
    logo: '../../image/qqjt.png',
    state: '6',
    itemList: ['立即播放', '下一首播放'],
    array: ['聚合', 'QQ', '网易云', '千千', '咪咕', '酷狗', '爱听'],
    serach: '', // 搜索关键词
    searchHistory: [], // 搜索历史
    showHistory: false, // 是否显示搜索历史
    hotKeywords: [], // 热门搜索词
    loading: false
  },
  /**
   * 输入监听
   */
  onSearchInput(e) {
    const serach = e.detail.value;
    this.setData({
      serach,
      showHistory: !serach.trim() // 没有输入时显示历史记录
    });

    if (!serach.trim()) {
      this.setData({
        song: [],
        singer: '',
        singerList: []
      });
      this.loadSearchHistory();
      return;
    }

    // 防抖搜索
    if (serach.length === 1) {
      this.getData();
    } else if (serach.length > 1) {
      debounce(this.getData.bind(this), 1000);
    }
  },

  /**
   * 填充搜索关键词
   */
  fillSearch(e) {
    const keyword = e.currentTarget.dataset.word;
    this.setData({
      serach: keyword,
      showHistory: false
    });
    this.getData();
  },

  /**
   * 清空搜索
   */
  clearSearch() {
    this.setData({
      serach: '',
      song: [],
      singer: '',
      singerList: [],
      showHistory: true
    });
    this.loadSearchHistory();
  },

  /**
   * 删除搜索历史项
   */
  async deleteHistoryItem(e) {
    const keyword = e.currentTarget.dataset.word;
    await searchHistory.remove(keyword);
    await this.loadSearchHistory();
  },

  /**
   * 清空搜索历史
   */
  async clearSearchHistory() {
    const confirmed = await errorHandler.showConfirm({
      title: '提示',
      content: '确定要清空搜索历史吗？'
    });
    
    if (confirmed) {
      await searchHistory.clear();
      await this.loadSearchHistory();
    }
  },

  /**
   * 加载搜索历史
   */
  async loadSearchHistory() {
    const history = await searchHistory.getHistory(10);
    const hotKeywords = searchHistory.getHotKeywords();
    this.setData({
      searchHistory: history,
      hotKeywords: hotKeywords
    });
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
  /**
   * 搜索数据
   */
  async getData() {
    const serach = this.data.serach.trim();
    if (!serach) {
      this.setData({
        song: [],
        singer: '',
        singerList: []
      });
      return;
    }

    // 保存搜索历史
    await searchHistory.add(serach);
    this.setData({
      showHistory: false,
      loading: true
    });

    try {
      // 优先使用 /serach 接口（酷我音乐源，支持歌曲和歌手搜索）
      if (this.data.state === '0' || this.data.state === '6') {
        await this.searchKuWo(serach);
      } else if (this.data.state === '3') {
        // 酷狗音乐搜索（外部API）
        await this.searchKuGou(serach);
      } else if (this.data.state !== '0') {
        // 使用后端搜索接口
        await this.searchBackend(serach);
      } else {
        // 聚合搜索（备用）
        await this.searchAggregate(serach);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 酷我音乐搜索（使用 /serach 接口）
   */
  async searchKuWo(serach) {
    const res = await API.song.searchKuWo({
      name: serach,
      pageNo: 1,
      pageSize: 3
    });

    if (res.success && res.data) {
      // 格式化歌曲数据
      const songs = (res.data.data || []).map(item => ({
        ...item,
        title: item.title || item.name,
        author: item.author || item.singer,
        pic: item.pic || item.image || 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
        mId: item.mId || 5, // 酷我音乐源标识
        id: item.id
      }));

      // 格式化歌手数据
      const singers = (res.data.singer || []).map(item => ({
        ...item,
        name: item.name,
        pic: item.pic || item.image,
        id: item.id,
        songNum: item.songNum
      }));

      this.setData({
        song: songs,
        singerList: singers
      });
    }
  },

  /**
   * 爱听音乐搜索（备用）
   */
  async searchAiTing(serach) {
    const res = await API.song.searchSong({
      input: serach,
      filter: 'name',
      type: 'aiting',
      page: 1
    });

    if (res.success) {
      this.setData({
        song: res.data?.data || [],
        singerList: res.data?.singer || []
      });
    }
  },

  /**
   * 酷狗音乐搜索（外部API）
   */
  async searchKuGou(serach) {
    // 使用外部API，保持原有逻辑
    const request = require('../../utils/time').Promisify(wx.request);
    const res = await request({
      url: 'https://dataiqs.com/api/kgmusic/?msg=' + serach
    });

    if (res.data && res.data.data) {
      const arr = res.data.data.map((item) => {
        return {
          title: item.name,
          author: item.singername,
          pic: 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
          mvid: item.mvid,
          id: item.hash,
          mId: 2 // 表示 gaiId的资源
        };
      });
      this.setData({ song: arr });
    }
  },

  /**
   * 后端搜索
   */
  async searchBackend(serach) {
    const res = await API.song.searchSong({
      input: serach,
      filter: 'name',
      type: this.data.key,
      page: 1
    });

    if (res.success && res.data) {
      const arr = res.data.map((item) => {
        return {
          ...item,
          title: item.title || item.name,
          author: item.author || item.singer,
          pic: item.pic || 'http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
          src: item.url,
          id: item.songid || item.id,
          lrc: item.lrc,
          type: item.type,
          mId: 1 // 表示/getSongList下的资源
        };
      });
      this.setData({ song: arr });
    }
  },

  /**
   * 聚合搜索
   */
  async searchAggregate(serach) {
    api.getSerachSongOrSinger(serach, undefined, (arr) => {
      this.setData({
        song: arr.map(i => ({
          ...i,
          title: i.name || i.title,
          author: i.singer || i.author
        }))
      });
    });
  },
  /**
   * 播放音乐
   */
  pay(e) {
    const song = e.currentTarget.dataset.song;
    
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
      success: () => {
        app.data.paythis.setData({
          value: 0
        });
        time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
      }
    });
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
  async onLoad(options) {
    await this.loadSearchHistory();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    // 如果搜索框为空，显示搜索历史
    if (!this.data.serach) {
      await this.loadSearchHistory();
      this.setData({ showHistory: true });
    }
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
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 搜索确认
   */
  onSearchConfirm() {
    this.getData();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    if (this.data.serach) {
      await this.getData();
    } else {
      await this.loadSearchHistory();
    }
    wx.stopPullDownRefresh();
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