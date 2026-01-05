// pages/details/details.js
const app = getApp();
const time = require('../../utils/time.js')
const api = require('../../utils/api')
const utils = require('../../utils/util')
const API = require('../../services/api')
const errorHandler = require('../../utils/errorHandler')
const request = require('../../utils/request')

const { img } = require('../../utils/loveBg')
Page({

  /**
   * 页面的初始数据
   */
  data: { 
    popusShow:false,
    list: [],
    tag:'',
    src: '',
    total:300,
    pageSize:68,
    pageNum:1,
    loop: '../../image/sx.png',
    loopstate: 0, //0代表顺序，1代表循环，2代表随机
    time:'',
    synchronousLoading:false,
    loveId:'', // 喜欢的id
    id: '',
    itemList: ['立即播放', '下一首播放','添加到歌单'],
    itemList1: ['上传云端', '同步云端','拉取云端资源'],
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
  popusShowChange(e){
    this.setData({
      popusShow:e.detail
    })
    console.log(this.data.popusShow)
   },
  showActionSheet(ev) {
    let item = ev.detail.song;
    let that = this;
  
    console.log(item,app.data.song);
    wx.showActionSheet({
      itemList: this.data.itemList,

      success(e) {
        console.log("success")
        console.log(e)
        if (!e.camcle) {
          if (e.tapIndex===1) {
            app.data.song = item;
            time.nextSongPay(app.data)
          } else if(e.tapIndex===0) {
            app.data.song = item;
            that.pay(ev)
          }else{
           that.setData({
            popusShow:true,
            song:item
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
  more(e){
    this.showActionSheet(e)
  },
  synchronous(){
    const that = this
    wx.showActionSheet({
      itemList: that.data.itemList1,
      success: async (e) => {
       const index = e.tapIndex
       if(index===0){
        if(that.data.synchronousLoading){
          return 
        }
        that.setData({
          synchronousLoading:true
        })
        wx.showLoading({
          title:'加载中'
        })
        try {
          const songIds = that.data.list.map(song => song.id);
          const res = await API.playlist.addSongs(that.data.loveId, songIds);
          
          that.setData({ synchronousLoading: false });
          
          if (res.success) {
            wx.showToast({
              title: '同步成功',
              icon: 'success'
            });
          } else {
            errorHandler.handleApiError(res);
          }
        } catch (err) {
          that.setData({ synchronousLoading: false });
          errorHandler.handleApiError(err);
        }
       }
       if(index === 1){
        // 同步云端（替换成云端的）
        wx.showModal({
          title: '提示',
          content: '将替换成云端内容，覆盖当前。\n如果想保留当前列表,建议使用拉取云端资源选项，是否继续覆盖当前?',
          success: async (res) => {
            if (res.confirm) {
              wx.showLoading({
                title:'加载中'
              })
              try {
                const songIds = app.data.userInfo?.playList?.filter(i => i.islove)[0]?.songIds || [];
                const result = await API.song.getSongList(songIds);
                
                if (result.success && result.data) {
                  that.setData({ list: result.data });
                  
                  wx.setStorage({
                    key: 'loveList',
                    data: result.data,
                    success: () => {
                      console.log('异步保存成功');
                    }
                  });
                  
                  wx.showToast({
                    title: '同步成功',
                    icon: 'success'
                  });
                } else {
                  errorHandler.handleApiError(result);
                }
              } catch (err) {
                errorHandler.handleApiError(err);
              }
            
    
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
       }
       if(index===2){
        // 获取本地不存在的音乐数据
        const iconIds = app.data.userInfo?.playList?.filter(i=>i.islove)[0]?.songIds
        const localhostIds = that.data.list.map(i=>(i.id).toString())
        console.log(iconIds,localhostIds)
        wx.showLoading({
          title:'加载中'
        })
        try {
          const newIds = iconIds.filter(i => !localhostIds.includes(i));
          const res = await API.song.getSongList(newIds);
          
          if (res.success && res.data) {
            const newList = that.data.list?.concat(res.data) || res.data;
            that.setData({ list: newList });
            
            wx.setStorage({
              key: 'loveList',
              data: newList,
              success: () => {
                console.log('异步保存成功');
              }
            });
            
            wx.showToast({
              title: '同步成功',
              icon: 'success'
            });
          } else {
            errorHandler.handleApiError(res);
          }
        } catch (err) {
          errorHandler.handleApiError(err);
        }
       }
      }
    })
return



   
  },
  pay(e) {
    var that = this;
    var song = e.detail.song;
    // 判断当前播放歌曲
    if (app.data.song && app.data.song.id === song.id) {
      wx.showToast({
        title: '该歌曲正在播放中',
        icon: 'none'
      });
      return;
    }
    if(this.data.id!=='my'){
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
    }

  },
  splitSongInfo(str) {
   if(!str)return{}
    // 检查字符串是否包含分隔符“ - ”（注意中间有空格）
    if (str.includes(" - ")) {
      // 按“ - ”分割为数组（最多分割1次，避免歌曲名中包含“ - ”）
      const [author, title] = str.split(" - ", 2);
    return {author,title}
    } else {
      // 没有分隔符时，默认整个字符串为歌曲名，歌手为空
      return {author:'',title:str}
    }
  },
  /**
   * 获取酷我热歌榜
   */
  async getkwTop(page) {
    if (page === 1) {
      this.setData({ list: [] });
    }

    try {
      // 使用 /kwtop 接口获取酷我热歌榜
      const res = await API.rank.getKwTop({ page });

      if (res.success && res.data) {
        const list = (res.data.data || []).map(k => ({
          ...k,
          ...this.splitSongInfo(k?.author || k?.title)
        }));

        this.setData({
          list: this.data.list.concat(list),
          time: res.data.time || ''
        });

        if (res.data.time) {
          wx.setNavigationBarTitle({
            title: `酷我热歌榜:${res.data.time}`
          });
        }
      } else {
        errorHandler.handleApiError(res);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  whole() {
    const that=this
    if (!this.data.list.length) {
      return wx.showToast({
        title: '没有可播放的歌曲',
        icon: 'none'
      })
    }
    app.data.songlist = this.data.list
    const arr = app.data.songlist.slice()
    
    if(this.data.id!=='my'){
      app.data.song = this.data.list[0];
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
    
      return
    }
    api.getwholeSongSrc(arr, ({ src, stauts, item }) => {
      let song = item;
      console.log(item, 44)
      if (stauts) {
        song.src = src
        song['author'] = song.singer;
        song['title'] = song.title;
        app.data.song = song;

        wx.switchTab({
          url: "../../pages/newPlay/newPlay",
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
            time.playCore(app.data.paythis, app.innerAudioContext, app.data.song, 1);



          }
        })
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
                  try{
                    wx.showLoading({
                      title: '加载中',
                    })
                    const res1 = await API.playlist.deletePlaylist(that.data.id)
                    wx.hideLoading()
                    if(res1.data.code===200){
                      setTimeout(() => {
                        wx.showToast({
                          title: '删除成功',
                          icon:'success'
                        })
                        wx.navigateBack(-1)
                      }, 200);
                    }
                  }catch(err){
                    wx.hideLoading()
                    wx.showToast({
                      title: err.message,
                      icon:'error'
                    })
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
  onLoad(e) {
    if (e.id === 'my') {
      // 收藏列表
      wx.getStorage({
        key: 'loveList',
        success: (res) => {
          this.setData({
            src: img,
            list: res.data,
            id: 'my',
            title:'我喜欢',
            time:'',
            loveId:app.data.userInfo?.playList?.filter(i=>i.islove)[0]?.id,
            paydata:app.data?.paythis?.data
          })
        },
        fail: () => {
          wx.showToast({
            title: '暂时没有收藏内容',
            icon: 'none'
          })
          this.setData({
            id: 'my',
            src: img,
            title:'我喜欢',
            loveId:app.data.userInfo?.playList?.filter(i=>i.islove)[0]?.id,
            paydata:app.data?.paythis?.data
          })
        }
      })

      return
    }
    else if(e.id==='jay'){
      api.getJaySongList((res)=>{
        this.setData({
          list:res,
          src:res[0].pic,
          loveId:'',
          id:e.id,
          time:'',
          paydata:app.data?.paythis?.data

        })
      })
      return
    } else if(e.id==='kw'){
      this.setData({
        src:e.src,
        id:e.id,
        title:'酷我热歌榜',
        pageSize:68
      })
     
     this.getkwTop(this.data.pageNum)
      return
    }else{
      this.setData({
        id:e.id,
        pageSize:10
      })
      this.getSongList()
    }
    
    
  
  },
  /**
   * 获取推荐歌单歌曲列表
   */
  async getSongList(page = this.data.pageNum) {
    if (page === 1) {
      this.setData({ list: [] });
    }

    try {
      const res = await API.playlist.getRecommendInfo({
        id: this.data.id,
        page,
        size: this.data.pageSize
      });

      if (res.success && res.data) {
        // 处理图片URL
        const list = (res.data.list || []).map(k => ({
          ...k,
          pic: app.host + '/resource?url=' + k.pic
        }));

        this.setData({
          list: this.data.list.concat(list),
          time: res.data.time || '',
          src: res.data.img || '',
          singerInfo: res.data.info || '',
          total: res.data.total || 0,
          tag: res.data.tag || '',
          paydata: app.data?.paythis?.data
        });

        if (res.data.name) {
          wx.setNavigationBarTitle({
            title: res.data.name
          });
        }
      } else {
        errorHandler.handleApiError(res);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  onReachBottom() {
  if(this.data.id==='kw'){
    utils.changePage.call(this,'getkwTop')
  }else if(this.data.id!=='kw'&&this.data.id!=='my'){
    utils.changePage.call(this,'getSongList')
  }
  },
  

})
