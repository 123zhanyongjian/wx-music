//logs.js
const util = require('../../utils/util.js')
const app = getApp();
const time = require('../../utils/time.js')
// const pays = require('../play/play.js')
const api = require('../api/index.js');
const debounce = time.debounce()
Page({
  data: {
    logs: [],
    itemList:['立即播放','下一首播放'],
    serach: "",
    interval: '',
    logo: '../../image/wangyi.jpg',
    state: '1',
    singer: '',//歌手
    array: ['QQ音乐搜索', '网易云音乐搜索'],
    song: [

    ],

  },
  showActionSheet(ev) {
    let item = ev.currentTarget.dataset.item;
    let that=this;
    app.data.song = item;
    console.log(item);
    wx.showActionSheet({
      itemList: this.data.itemList,

      success(e) {
        console.log("success")
        console.log(e)
        if (!e.camcle) {
          if (e.tapIndex){
            time.nextSongPay(app.data)
          }else{
            that.pay(ev)
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
  //切换搜索模式
  bindPickerChange(e) {
    return 
    if (e.detail.value == '1') {
      this.setData({
        state: '1',
        logo: '../../image/wangyi.jpg'
      })
    } else {
      this.setData({
        state: '0',
        logo: '../../image/qqmusic.jpg'
      })
    }
  },
    // 输入监听
    serachs(e) {
      wx.hideLoading()
      wx.hideToast()
      var serach = e.detail.value;
      this.setData({
        serach
      })
      if (!serach.trim()) {
        this.setData({
          song: [],
          singer: ''
        })
        return
      }
  
      if (serach.length===1) {
        this.getData()
      
      }else if(serach.length>1){
        debounce(this.getData, 1000)
      }
  
  
    },
  getData(serach=this.data.serach){
    const that = this
    wx.request({
      url: api.default.host1 + '?msg=' + serach,
      success: function (res) {
        wx.hideLoading();
        console.log(res.data);
        //数据处理
        let arr=[];
        res.data.data.map((item,index,ite)=>{
          if(ite.length>0){
            let obj={}
            obj.title=item.name,
            obj.author = item.singername;
            obj.pic ='http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
            // obj.src = `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
            obj.mvid=item.mvid
            obj.id=item.id
            obj.mId=2 // 表示 gaiId的资源
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
  },
  //进入详情
  details(e) {
    app.data.singer = e.currentTarget.dataset.singer;

    wx.navigateTo({
      url: "../../pages/singerdetails/singerdetails"
    })
  },
  //播放音乐
   pay(e) {
    wx.hideLoading()
    setTimeout(() => {
      var that = this;
      var flag
      var item = e.currentTarget.dataset.item;
      wx.showLoading({
        title: '加载中',
      })
      const index = e.currentTarget.dataset.index
      
      app.data.song = item;
       if (this.data.state == 1&&index!==undefined){
        wx.request({
          url: api.default.host1 + '?msg=' + this.data.serach+'&type=song&n='+index,
          success: function (res) {
          
            const {data} =  res.data
            if((data.song_url&&data.song_url.indexOf('付费')!==-1)||!data.song_url){
              
              item.src = data.mv_url;
              item.isMv = true
              app.data.paythis.setData({
                Mvsrc: data.mv_url
              })
            }else{
              item.src = data.song_url
            }
            wx.hideLoading();
           
            if(!item.src){
              wx.showToast({
                title: '无法播放',
                icon:'error'
              })
            
              return
            }
            wx.switchTab({
              url: "../../pages/play/play",
              success: function () {
                app.data.paythis.setData({
                  value: 0
                })
                time.newAddSong(app.data);
                time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
               
  
                that.setData({
                  song: []
                })
   
              }
   
            })
          }})
        return  
         if (item.mvid) {
           wx.request({
             url: `https://musicapi.leanapp.cn/mv?mvid=${item.mvid}`,
             success: (ret) => {
               item.Mvsrc = ret.data.data.brs['480'];
               wx.switchTab({
                 url: "../../pages/play/play",
                 success: function () {
                   app.data.paythis.setData({
                     value: 0,
                     Mvsrc: item.Mvsrc
                   })
                   time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
  
                   that.setData({
                     song: []
                   })
  
                 }
  
               })
             }
           })
         } else {
           wx.switchTab({
             url: "../../pages/play/play",
             success: function () {
               app.data.paythis.setData({
                 value: 0
               })
               time.pay(app.data.paythis, app.innerAudioContext, app.data.song);
  
               that.setData({
                 song: []
               })
  
             }
  
           })
         }
       }else{
        //  wx.switchTab({
        //    url: "../../pages/play/play",
        //    success: function () {
  
        //      console.log(11222)
        //      time.wholelist(app);
        //    }
  
        //  })
       }
    }, 20);
    // wx.request({
    //   url: `https://music.163.com/api/song/media?id=${item.id}`,
    //   success:(res)=>{
    //     console.log(res)
    //     item.lrc = res.data.lyric;
    //     app.data.song = item;
    //     if (item.pic == undefined) {
         
    //       wx.switchTab({
    //         url: "../../pages/play/play",
    //         success: function () {
        
    //           console.log(11222)
    //           time.wholelist(app);
    //         }

    //       })
    
         
    //     } else {
    //       console.log(222)
    //       console.log(app)

        
    //     }
    //   }
    // })
    
   





  },
  onLoad: function () {
    console.log(app)
  }
})