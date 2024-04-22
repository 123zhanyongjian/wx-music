// pages/playlistInfo/playlistInfo.js
const app = getApp();
const api = require('../../utils/api.js');
const { getJaySongList } = require('../../utils/api');
const time = require('../../utils/time')
const request  = time.Promisify(wx.request)
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loop: '../../image/sx.png',
    loopstate: 0, //0代表顺序，1代表循环，2代表随机
    image:'',
    paydata:{},
    songids:[],
    songs:[],
    addSongListFlag:false,
    itemList: ['编辑歌单', '删除歌单'],
    itemList1: ['立即播放', '下一首播放','移除列表'],

  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad({id}) {
   
    this.getdata(id)
    
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
    //播放音乐
    async pay(e) {
      var song = e.currentTarget.dataset.item;
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
      api.getSongSrc(song.id, ({src, stauts}) => {
        console.log(src,stauts)
        if (stauts) {
          song.src = src
          song['title'] = song.name;
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
  more(e){
    this.showActionSheet(e)
  },
  sortChange(e){
    const sortArr = e.detail?.sort;
    const that=this;
    const ids = this.data.songs.map(i=>i.id)
    const arrStr = (sortArr.map(i=>ids[i])).join(',')
    wx.request({
      url:app.host+'/playlist/edit',
      method:'post',
      data:{
  
        id:this.data.id,
        songIds:arrStr,
        userId:app.data.openId,
      },
      success:res1=>{
        wx.hideLoading()
        if(res1.data.code===200){
          setTimeout(() => {
            wx.showToast({
              title:res1.data.data,
              icon:"success"
            })
            that.setData({
              addSongListFlag:false
             })
            // setTimeout(() => {
            //   that.getdata(that.data.id)
            // }, 1000);
          }, 200);
          return
        }
        setTimeout(() => {
          wx.showToast({
            title:res1.data.data,
            icon:"error"
          })
        }, 200);
      },
      fail:(err)=>{
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title:err.errMsg,
            icon:'error'
          })
        }, 200);
      }
    })
  },
  async getdata(id){
    wx.showLoading({
      title: '加载中',
    })
    try{
      const res =await request({url:app.host+`/playlist/info?id=${id}`})
      const res1 = await request({url:app.host+`/songList`, method:'post',data:{
        ids:res.data.data.songIds,
       
      }})
      wx.hideLoading()
      if(res.data.code===200){
        wx.setNavigationBarTitle({
          title: res.data.data.name
        })
        this.setData({
          id,
          songs:res1.data.data,
          paydata:app.data?.paythis?.data,
          name: res.data.data.name,
          songids:res.data.data.songIds,
          image:app.host+'/'+res.data.data.img
        })
      }
      
     

    }catch(err){
      wx.hideLoading()
      setTimeout(() => {
        wx.showToast({
          title: err.message,
          icon:'error'
        })
      }, 200);
    }
  },
  async delsong(id){
    wx.showLoading({
      title: '加载中',
    })
    try{
      const res = await request({url:app.host+`/playlist/delsong`, method:'post',data:{
        ids:[id],
        id:this.data.id,
        userId:app.data.openId,
       
      }})
      wx.hideLoading()
      if(res.data.code===200){
        setTimeout(() => {
          wx.showToast({
            title: res.data.data,
            icon:'success'
          })
          setTimeout(() => {
            this.getdata(this.data.id)
          }, 1000);
        }, 200);
      }
      
     

    }catch(err){
      wx.hideLoading()
      setTimeout(() => {
        wx.showToast({
          title: err.message,
          icon:'error'
        })
      }, 200);
    }
  },
  close(){
    this.setData({
      addSongListFlag:false
    })
  },
  editSongList(e){
    const datas = e.detail;
    const that = this
   if(datas.image === that.data.image){
     // 没有修改图片
     wx.request({
      url:app.host+'/playlist/edit',
      method:'post',
      data:{
  
        id:that.data.id,
        playlist:datas.title,
        userId:app.data.openId,
      },
      success:res1=>{
        wx.hideLoading()
        if(res1.data.code===200){
          setTimeout(() => {
            wx.showToast({
              title:res1.data.data,
              icon:"success"
            })
            that.setData({
              addSongListFlag:false
             })
            setTimeout(() => {
              that.getdata(that.data.id)
            }, 1000);
          }, 200);
          return
        }
        setTimeout(() => {
          wx.showToast({
            title:res1.data.data,
            icon:"error"
          })
        }, 200);
      },
      fail:(err)=>{
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title:err.errMsg,
            icon:'error'
          })
        }, 200);
      }
    })
    return
   }
    const uploadImg = time.Promisify(wx.uploadFile)
    uploadImg({
      url:app.host+'/upload',
      filePath:datas.image,
      name:'file'
    })
    .then(res=>{
      const data = JSON.parse(res.data)
      if(data.code===200){
        // 更新接口
        wx.showLoading({
          title: '加载中',
        })
        wx.request({
          url:app.host+'/playlist/edit',
          method:'post',
          data:{
      
            id:that.data.id,
            userId:app.data.openId,
            img:data.data,
            playlist:datas.title
          },
          success:res1=>{
            wx.hideLoading()
            if(res1.data.code===200){
              setTimeout(() => {
                wx.showToast({
                  title:res1.data.message,
                  icon:"success"
                })
                that.setData({
                  addSongListFlag:false
                 })
                 that.getdata(that.data.id)
              }, 200);
              return
            }
            setTimeout(() => {
              wx.showToast({
                title:res.data.data,
                icon:'error'
              })
            }, 200);
          },
          fail:(err)=>{
            wx.hideLoading()
            setTimeout(() => {
              wx.showToast({
                title:err.errMsg,
                icon:'error'
              })
            }, 200);
          }
        })
      }
    })
    
  },
  showActionSheet(ev) {
    let item = ev.currentTarget.dataset.item;
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
            app.data.song = item;
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
        url: "../../pages/play/play",
        success: function () {
          app.data.paythis.setData({
            value: 0,
            loopstate:that.data.loopstate,
            loop:that.data.loop,
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
                    const res1 = await request({
                      url:app.host+'/playlist/del',
                      method:'delete',
                      data:{
                        id:that.data.id,
                        userId:app.data.openId,
                      }
                    })
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