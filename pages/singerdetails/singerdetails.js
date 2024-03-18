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
    n: 0,
    pageNum:1,
    pageSize:68,
    count:0,
    total:360,
    song:{},
    playlist:[],
    paydata:'',
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
      // 爱听音乐
      wx.showLoading({
        title: '加载中',
      })
      request({
        url:app.host+`/musicList?name=${this.data.title}&page=${page}`
      })
      .then(res=>{
        wx.hideLoading()
        if(res.data.code===200){
          that.setData({
            songs:this.data.songs.concat(res.data.data?.data?.map(i=>({...i,pic:this.data.image}))),
            // total:res.data.data.total*1,
            paydata:app.data?.paythis?.data
          })
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

  /*上拉加载更多歌曲*/
  onReachBottom() {
   utils.changePage.call(this,'getsongList')
    // this.getSingerDetail(app.data.singer.id, this.data.songs.length)
    // console.log("sdsd")
  }
})