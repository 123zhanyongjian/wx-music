// pages/playlistInfo/playlistInfo.js
const app = getApp();
const api = require('../../utils/api.js');
const { getJaySongList } = require('../../utils/api');
const time = require('../../utils/time');
const API = require('../../services/api');
const errorHandler = require('../../utils/errorHandler');
const CONSTANTS = require('../../utils/constants');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loop: '../../image/sx.png',
    loopstate: CONSTANTS.PLAY_MODE.SEQUENCE, // 0代表顺序，1代表循环，2代表随机
    image: '',
    paydata: {},
    songids: [],
    songs: [],
    addSongListFlag: false,
    itemList: ['编辑歌单', '删除歌单'],
    itemList1: ['立即播放', '下一首播放', '移除列表'],
    id: '',
    name: '',
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad({id}) {
   
    this.getdata(id)
    
  },
  /**
   * 切换播放模式
   */
  changloop() {
    const modes = [
      { state: CONSTANTS.PLAY_MODE.LOOP, loop: '../../image/xh.png', name: CONSTANTS.PLAY_MODE_NAMES[1] },
      { state: CONSTANTS.PLAY_MODE.RANDOM, loop: '../../image/sj.png', name: CONSTANTS.PLAY_MODE_NAMES[2] },
      { state: CONSTANTS.PLAY_MODE.SEQUENCE, loop: '../../image/sx.png', name: CONSTANTS.PLAY_MODE_NAMES[0] }
    ];
    
    const currentIndex = modes.findIndex(m => m.state === this.data.loopstate);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    this.setData({
      loopstate: nextMode.state,
      loop: nextMode.loop
    });
    
    wx.showToast({
      title: nextMode.name,
      icon: 'none',
      duration: 1000
    });
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
          // time.newAddSong(app.data);
          time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);
        }
      })
      return
      api.getSongSrc(song.id, ({src, stauts}) => {
        console.log(src,stauts)
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
  more(e){
    this.showActionSheet(e)
  },
  /**
   * 排序改变
   */
  async sortChange(e) {
    const sortArr = e.detail?.sort;
    const ids = this.data.songs.map(i => i.id);
    const arrStr = sortArr.map(i => ids[i]).join(',');
    
    try {
      const res = await API.playlist.updatePlaylist({
        id: this.data.id,
        songIds: arrStr
      });
      
      if (res.success) {
        wx.showToast({
          title: res.message || '排序成功',
          icon: 'success'
        });
        this.setData({
          addSongListFlag: false
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  /**
   * 获取歌单数据
   */
  async getdata(id) {
    this.setData({ loading: true });
    
    try {
      // 1. 获取歌单信息
      const playlistRes = await API.playlist.getPlaylistInfo(id);
      if (!playlistRes.success) {
        throw new Error(playlistRes.message || '获取歌单信息失败');
      }
      
      const playlistInfo = playlistRes.data;
      
      // 2. 获取歌曲列表
      let songs = [];
      if (playlistInfo.songIds && playlistInfo.songIds.length > 0) {
        const songsRes = await API.song.getSongList(playlistInfo.songIds);
        if (songsRes.success) {
          songs = songsRes.data || [];
        }
      }
      
      // 3. 更新页面数据
      wx.setNavigationBarTitle({
        title: playlistInfo.name
      });
      
      this.setData({
        id,
        songs,
        paydata: app.data?.paythis?.data,
        name: playlistInfo.name,
        songids: playlistInfo.songIds || [],
        image: playlistInfo.img ? `${app.host}/${playlistInfo.img}` : '',
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      errorHandler.handleApiError(error);
    }
  },
  /**
   * 删除歌曲
   */
  async delsong(id) {
    try {
      const res = await API.playlist.removeSongs(this.data.id, [id]);
      
      if (res.success) {
        wx.showToast({
          title: res.message || '删除成功',
          icon: 'success'
        });
        // 刷新列表
        setTimeout(() => {
          this.getdata(this.data.id);
        }, 1000);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  close(){
    this.setData({
      addSongListFlag:false
    })
  },
  /**
   * 编辑歌单
   */
  async editSongList(e) {
    const datas = e.detail;
    if (!datas.title || !datas.title.trim()) {
      wx.showToast({
        title: '请输入歌单名称',
        icon: 'none'
      });
      return;
    }

    try {
      let imgUrl = null;
      
      // 如果修改了图片，先上传
      if (datas.image !== this.data.image) {
        const uploadRes = await API.upload.uploadFile(datas.image);
        if (!uploadRes.success) {
          return;
        }
        imgUrl = uploadRes.data;
      }

      // 更新歌单
      const updateData = {
        id: this.data.id,
        playlist: datas.title.trim()
      };
      
      if (imgUrl) {
        updateData.img = imgUrl;
      }

      const res = await API.playlist.updatePlaylist(updateData);
      
      if (res.success) {
        wx.showToast({
          title: res.message || '更新成功',
          icon: 'success'
        });
        this.setData({
          addSongListFlag: false
        });
        // 刷新数据
        setTimeout(() => {
          this.getdata(this.data.id);
        }, 1000);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  showActionSheet(ev) {
    let item = ev.detail.song;
    let that = this;
  
    console.log(item,app.data.song);
    wx.showActionSheet({
      itemList: this.data.itemList1,

      success(e) {
        console.log("success")
        console.log(e)
        if (!e.camcle) {
          if (e.tapIndex===1) {
            app.data.song = item;
            time.nextSongPay(app.data)
          } else if(e.tapIndex===0) {
            // app.data.song = item;
            that.pay(ev)
          }else{
           //移除歌单
           wx.showModal({
             title: '提示',
             content: '确定移除该歌曲?',
             complete: (res) => {
               if (res.cancel) {
                 
               }
           
               if (res.confirm) {
                 that.delsong(item.id)
               }
             }
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
  whole() {
    const that = this
    if(!this.data.songs.length){
      return wx.showToast({
        title: '没有可播放的歌曲',
        icon:'none'
      })
    }
    app.data.songlist = this.data.songs;
    const song =  app.data.songlist[0]
    const arr =  app.data.songlist.slice()
      app.data.song = song;
     
      wx.switchTab({
        url: "../../pages/newPlay/newPlay",
        success: function () {
          app.data.paythis.setData({
            value: 0,
            loopstate:that.data.loopstate,
            loop:that.data.loop,
          })
          time.saveStoreSongList(arr)
          time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);



        }
      })
    
   
 


  },
  moreClick(){
    const that = this
    wx.showActionSheet({
      itemList: this.data.itemList,

      success(e) {
        console.log("success")
        console.log(e)
        if (!e.camcle) {
          if (e.tapIndex===0) {
            that.setData({
              addSongListFlag:true
            })
          that.selectComponent('#addSongList')
          .setData({
            ['music.title']: that.data.name,
            ['music.image']:that.data.image,
            title:'编辑歌单'
          })
          } else {
            // that.pay(ev)
            wx.showModal({
              title: '删除歌单',
              content: '确定删除该歌单吗？一旦删除无法撤回，是否继续',
              complete: async (res) => {
                if (res.cancel) {
                  
                }
            
                if (res.confirm) {
                  try {
                    const res1 = await API.playlist.deletePlaylist(that.data.id);
                    if (res1.success) {
                      wx.showToast({
                        title: res1.message || '删除成功',
                        icon: 'success'
                      });
                      setTimeout(() => {
                        wx.navigateBack();
                      }, 500);
                    }
                  } catch (err) {
                    errorHandler.handleApiError(err);
                  }
                }
              }
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
  async onPullDownRefresh() {
    if (this.data.id) {
      await this.getdata(this.data.id);
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