// pages/details/details.js
const app = getApp();
const time = require('../../utils/time.js')
const api = require('../../utils/api')
const utils = require('../../utils/util')
const { img } = require('../../utils/loveBg')
Page({

  /**
   * 页面的初始数据
   */
  data: { 
    popusShow:false,
    list: [],
    src: '',
    total:300,
    pageSize:68,
    paydata:'',
    pageNum:1,
    time:'',
    synchronousLoading:false,
    loveId:'', // 喜欢的id
    id: '',
    itemList: ['立即播放', '下一首播放','添加到歌单'],
    itemList1: ['上传云端', '同步云端','拉取云端资源'],
  },
  popusShowChange(e){
    this.setData({
      popusShow:e.detail
    })
    console.log(this.data.popusShow)
   },
  showActionSheet(ev) {
    let item = ev.currentTarget.dataset.item;
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
      success:e=>{
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
        wx.request({
          url:app.host+'/addsong',
          method:'post',
          data:{
            id:that.data.loveId,
            userid:app.data.userInfo.userId,
            songList:that.data.list
    
          },
          success:res=>{
            wx.hideLoading()
            that.setData({
          synchronousLoading:false
    
            })
            if(res.data.code===200){
              setTimeout(() => {
                wx.showToast({
                  title:'同步成功'
                })
              }, 200);
            }
          },
          fail:err=>{
            that.setData({
              synchronousLoading:false
        
                })
            wx.hideLoading()
            setTimeout(() => {
              wx.showToast({
                title:err.message,
                icon:'error'
              })
            }, 200);
          },
        })
       }
       if(index === 1){
        // 同步云端（替换成云端的）
        wx.showModal({
          title: '提示',
          content: '将替换成云端内容，覆盖当前。\n如果想保留当前列表,建议使用拉取云端资源选项，是否继续覆盖当前?',
          success(res) {
            if (res.confirm) {
              wx.showLoading({
                title:'加载中'
              })
              wx.request({
                url:app.host+'/songList',
                method:'post',
                data:{
                  ids:app.data.userInfo?.playList?.filter(i=>i.islove)[0]?.songIds
                },
                success:res=>{
                  wx.hideLoading()
                  if(res.data.code===200){
                  
                    setTimeout(() => {
                      that.setData({
                        list:res.data.data
                      })
                      wx.showToast({
                        title:'同步成功',
                        icon:'success'
                      })
                      wx.setStorage({
                        key: 'loveList',
                        data:res.data.data,
                        success: function (res) {
                          console.log('异步保存成功')
                        }
                      })
                    }, 200);
                  }else{
                    setTimeout(() => {
                      wx.showToast({
                        title:res.data.message,
                        icon:'error'
                      })
                    }, 200);
                  }
                }
              })
            
    
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
        wx.request({
          url:app.host+'/songList',
          method:'post',
          data:{
            ids:iconIds.filter(i=>!localhostIds.includes(i))
          },
          success:res=>{
            wx.hideLoading()
            if(res.data.code===200){
             
              setTimeout(() => {
                that.setData({
                  list:that.data.list?.concat(res.data.data)
                })
                wx.showToast({
                  title:'同步成功',
                  icon:'success'
                })
                wx.setStorage({
                  key: 'loveList',
                  data:that.data.list,
                  success: function (res) {
                    console.log('异步保存成功')
                  }
                })
              }, 200);
            }else{
              setTimeout(() => {
                wx.showToast({
                  title:res.data.message,
                  icon:'error'
                })
              }, 200);
            }
          }
        })
       }
      }
    })
return



   
  },
  pay(e) {
    var that = this;
    var song = e.currentTarget.dataset.item;
    if(this.data.id==='jay'){
      if (!song['author']) {
        song['author'] = song.singer
      }
      api.getjaySongSrc(song.id,(e)=>{
        app.data.song = song;
        app.data.song.src = e.src
        app.data.song.lrc = e.lrc
       
      wx.switchTab({
        url: "../../pages/play/play",
        success: function () {
          app.data.paythis.setData({
            value: 0
          })
          time.newAddSong(app.data);
          time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



        }
      })
      })
        return
    }
    if(this.data.id==='kw'){
      app.data.song = song;
      wx.switchTab({
        url: "../../pages/play/play",
        success: function () {
          app.data.paythis.setData({
            value: 0
          })
          time.newAddSong(app.data);
          time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);
  
  
  
        }
      })
  
      return
    }

   
    if (song.src) {
      if (!song['author']) {
        song['author'] = song.singer
      }
      app.data.song = song;
      wx.switchTab({
        url: "../../pages/play/play",
        success: function () {
          app.data.paythis.setData({
            value: 0
          })
          time.newAddSong(app.data);
          time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



        }
      })
      return
    }
    api.getSongSrc(song.id, ({ src, stauts }) => {
      console.log(src, stauts)
      if (stauts) {
        song.src = src
        song['author'] = song.singer;
        app.data.song = song;
        wx.switchTab({
          url: "../../pages/play/play",
          success: function () {
            app.data.paythis.setData({
              value: 0
            })
            time.newAddSong(app.data);
            time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



          }
        })
      }
    })

  },
  getkwTop(page){
    wx.showLoading({
      title: '加载中...',
    })
  if(page===1){
    this.setData({
      list:[]
    })
  }
    wx.request({
      url: app.host+'/kwtop',
      data:{
        page,
      },
      method:'get',
      success:(res)=>{
        wx.hideLoading();
        this.setData({
          list:this.data.list.concat(res.data.data?.data),
          time:res.data.data?.time
        })
        wx.setNavigationBarTitle({
          title: `酷我热歌榜:${res.data.data.time}`,
        })
      },
      fail:(err)=>{
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title:err.message,
            icon:'none'
          })
        }, 200);
      }
    })
  },
  whole() {
    if (!this.data.list.length) {
      return wx.showToast({
        title: '没有可播放的歌曲',
        icon: 'none'
      })
    }
    app.data.songlist = this.data.list
    const arr = app.data.songlist.slice()
    
    if(this.data.id==='kw'){
      app.data.song = this.data.list[0];
      wx.switchTab({
        url: "../../pages/play/play",
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
          time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



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
          url: "../../pages/play/play",
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
            time.pay(app.data.paythis, app.innerAudioContext, app.data.song, 1);



          }
        })
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
        id:e.id
      })
     
     this.getkwTop(this.data.pageNum)
      return
    }
    var that = this;
    wx.showLoading({
      title: '加载中...',
    })
    
    wx.request({
      url: 'https://tonzhon.com/api/playlists/' + e.id,
      success: function (res) {
        wx.hideLoading()
        if (res.data.success) {
          that.setData({
            list: res.data.playlist.songs.map(i => ({
              title: i.name,
              id: i.newId,
              loveId:'',
              singer: i?.artists.map(it => it.name).join('-'),
              islink: true,
              type: (i.newId)[0],
              pic: e.src,
              src: i.newId,
              author: i?.artists.map(it => it.name).join('-'),
              mId: 3,// 该资源下的搜索内容
              classId:e.id // 属于哪个推荐类的ID 用于显示当前播放的是哪个推荐下的内容
            })),
            src: e.src,
            id:e.id,
            paydata:app.data?.paythis?.data

          })
        }


      },
      fail: () => {
        wx.hideLoading()
      }
    })
  },
  onReachBottom() {
  if(this.data.id==='kw'){
    utils.changePage.call(this,'getkwTop')
  }
  },
  

})
