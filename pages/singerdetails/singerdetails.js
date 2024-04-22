const app = getApp()
const song = require('../../utils/song.js')
const api = require('../../utils/api.js');
const time = require('../../utils/time.js')
const utils = require('../../utils/util.js')
const request = time.Promisify(wx.request)
Page({
  data: {
    popusShow:false,
    range: ['选项1', '选项2', '选项3', '选项4', '选项5', '选项6', '选项7', '选项8', '选项9', '选项10'], // 初始选项列表，可以根据需要修改为100个选项  
    value: '', // 存储选中的值
    songs: [],
    albums:[],
    n: 0,
    pageNum:1,
    change:true,
    lastPage:false,
    pageSize:68,
    count:0,
    singerInfo:'',
    total:360,
    song:{},
    playlist:[],
    albumPage:1,
    loop: '../../image/sx.png',
    loopstate: 0, //0代表顺序，1代表循环，2代表随机
    paydata:'',
    type:1,//1单曲，2专辑
    itemList: ['立即播放', '下一首播放','添加到歌单'],
    list: [],//临时列表
    timer: ''//定时器
  },
  popusShowChange(e){
   this.setData({
     popusShow:e.detail
   })
   console.log(this.data.popusShow)
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
  changeType(e){
    
    this.setData({
      type:Number(e.currentTarget.dataset.type),
      change:false
    })
  const str=  setTimeout(() => {
      this.setData({
    
        change:Number(e.currentTarget.dataset.type)===2?false:true
      })
      clearTimeout(str)
    }, 600);
  },
  openSingerInfo(){
    if(this.data.singerInfo.length>110){
      wx.showModal({
        title:this.data.title,
        content:this.data.singerInfo,
        showCancel:false,
        confirmText:'我知道了',
        confirmColor:'#14B4BB'

      })
    }
  },
  onLoad: function () {
    wx.setNavigationBarTitle({
      title: app.data.singer.name
    })

    if (app.data.singer.avatar == undefined) {
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.pic
      })
    } else {
      this.setData({
        title: app.data.singer.name,
        image: app.data.singer.avatar
      })
    }
    setTimeout(() => {
      this.getSingerDetail()
    }, 10);
    app.data.fromSinger = false

  },
  getSingerDetail: async function () {
    // 查询歌手歌单列表(可用 但是不推荐，如果其他接口失效 可以使用这个方法)
    // api.getSerachSongOrSinger(this.data.title, this.data.image, e => {
    //   this.setData({
    //     songs:e.map(i => ({ ...i, title: i.name, author: i.singer })),
    //     paydata:app.data?.paythis?.data

    //   })
    // })
    this.getsongList()
   

  },
  getsongList(page=this.data.pageNum){
    const that = this
    if(page===1){
      this.setData({
        songs:[]
      })
    }
    if(this.data.albumPage===1){
      this.setData({
        albums:[]
      })
    }
      // 爱听音乐
      wx.showLoading({
        title: '加载中',
      })
      request({
        url:app.host+`/musicList?name=${this.data.title}&singer=1&page=${page}`
      })
      .then(res=>{
        
        if(res.data.code===200){
          that.setData({
            songs:this.data.songs.concat(res.data.data?.data?.map(i=>({...i,pic:this.data.image}))),
            // total:res.data.data.total*1,
            singerId:res.data.data.singerId,
            paydata:app.data?.paythis?.data
          })
          if(page===1){
            wx.hideLoading()
            request({
              url:app.host+'/singerInfo',
              method:'post',
              data:{
                id:res.data.data.singerId
              }
            })
            .then(ret=>{
             this.setData({
              singerInfo:ret.data.data?.singerInfo,
              albums:this.data.albums.concat(ret.data.data?.album),
              lastPage:ret.data.data?.lastPage
             })
            })
          }else{
            wx.hideLoading()
          }

          return
        }
      
        setTimeout(() => {
          wx.showToast({
            title:res.data.message,
            icon:'error'
          })
        }, 200);
      },err=>{
        wx.hideLoading()
        setTimeout(() => {
          wx.showToast({
            title:err.message,
            icon:'error'
          })
        }, 200);
      }) 
  
  },
  _normallizeSongs: function (list) {
    let ret = []
    list.forEach((item) => {
      let { musicData } = item
      if (musicData.songid && musicData.albummid) {
        ret.push(song.createSong(musicData))
      }
    })
    return ret
  },
  //请求歌曲信息
  getDATA(song) {

  },

  whole() {
    const that=this
    if(!this.data.songs.length){
      return wx.showToast({
        title: '没有可播放的歌曲',
        icon:'none'
      })
    }
    app.data.songlist = this.data.songs.map(it=>({...it,title:it.title,author:it.author}));
    const arr =  app.data.songlist.slice()
    console.log(arr,7777)
    app.data.song = arr[0];
       
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
  // 进入专辑详情
  goAlubms(e){
    const id = e.currentTarget.dataset.item.id;
    const name =  e.currentTarget.dataset.item.name;
    const img =  e.currentTarget.dataset.item.img;
    app.data.albumImg = img
    wx.navigateTo({
      url: `../alubms/alubms?id=${id}&name=${name}&img=${img}`
    })
  },
  /*上拉加载更多歌曲*/
  onReachBottom() {
   if(this.data.type===1){
    utils.changePage.call(this,'getsongList')
   }else if(this.data.type===2){
    if(!this.data.lastPage){
      wx.showLoading({
        title: '加载中',
      })
      request({
        url:app.host+'/singerInfo',
        method:'post',
        data:{
          id:this.data.singerId,
          page:++this.data.albumPage
        }
      })
      .then(ret=>{
        wx.hideLoading()
       this.setData({
        singerInfo:ret.data.data?.singerInfo,
        albums:this.data.albums.concat(ret.data.data?.album),
        lastPage:ret.data.data?.lastPage
       })
      })
    }else{
      wx.showToast({
        title: '我已经到底了',
        icon:'none'
      })
    }
   }
    // this.getSingerDetail(app.data.singer.id, this.data.songs.length)
    // console.log("sdsd")
  }
})