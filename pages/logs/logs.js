//logs.js
const util = require('../../utils/util.js')
const app = getApp();
const time = require('../../utils/time.js')
// const pays = require('../play/play.js')
const api = require('../api/index.js');
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
  //输入框监听
  serachs(e) {
    var that = this;
    var serach = e.detail.value;
    this.setData({
      serach
    })
    if(!serach.trim()){
      this.setData({

        song: [],
        singer: ''
      })
     
      return
    }

    if (serach) { 
      if (e.timeStamp - this.data.interval < 1000) {
        return
      } else {
        wx.showLoading({
          title: '加载中',
        })
        this.setData({
          interval: e.timeStamp,
          song: [],
          singer: ''
        })
        if (this.data.state == 1) {
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
        } else {
          wx.request({
            url: `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?is_xml=0&format=jsonp&key=${serach}&g_tk=5381&jsonpCallback=SmartboxKeysCallbackmod_top_search3847&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`,
            success: function (res) {
              wx.hideLoading();
              let res1 = res.data.replace('SmartboxKeysCallbackmod_top_search3847(', '')
              let res2 = JSON.parse(res1.substring(0, res1.length - 1));
              console.log(res2)
              for (let i of res2.data.song.itemlist) {
                i.title = i.name;
                i.author = i.singer

              }
              //获取高清图
              for (let i of res2.data.singer.itemlist) {
                i.pic = 'https://y.gtimg.cn/music/photo_new/T001R300x300M000' + i.mid + '.jpg?max_age=2592000';
                i.id = i.mid
              }
              //将mv中歌名人名一样的赋值vid
              for (let i of res2.data.song.itemlist){
                for (let j of res2.data.mv.itemlist){
                  if (i.name === j.name && i.singer === j.singer){
                    i.vid = j.vid
                  }
                }
              }
              that.setData({
                singer: res2.data.singer.itemlist,
                song: res2.data.song.itemlist

              })
            }
          })
        }
      }
    } else {
      
    }



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
        url: api.default.host1 + '?msg=' + this.data.serach+'type=song&n='+index,
        success: function (res) {
          wx.hideLoading();
          const {data} =  res.data
          if((data.song_url&&data.song_url.indexOf('付费')!==-1)||!data.song_url){
            
            item.src = data.mv_url
          }else{
            item.src = data.song_url
          }
        
         
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
              time.newAddSong(app.data.paythis.data);
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