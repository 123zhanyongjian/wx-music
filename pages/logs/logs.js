//logs.js
const util = require('../../utils/util.js')
const app = getApp();
const time = require('../../utils/time.js')
// const pays = require('../play/play.js')
const api = require('../api/index.js');
Page({
  data: {
    logs: [],
    serach: "",
    interval: '',
    logo: '../../image/qqmusic.jpg',
    state: '1',
    singer: '',//歌手
    array: ['QQ音乐搜索', '网易云音乐搜索'],
    song: [

    ],

    state: false
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
    // console.log(serach, pays);

    if (serach != '') {
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
        wx.showLoading({
          title: '加载中...',
        })
        if (this.data.state == 1) {
          wx.request({
            url: api.default.host1 + 'search?keywords=' + serach,
            success: function (res) {
              wx.hideLoading();
              console.log(res.data);
              //数据处理
              let arr=[];
              res.data.result.songs.map((item,index,ite)=>{
                if(ite.length>0){
                  let obj={}
                  obj.title=item.name,
                  obj.author = item.artists[0].name;
                  obj.pic ='http://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg',
                  obj.src = `https://music.163.com/song/media/outer/url?id=${item.id}.mp3`,
                  obj.mvid=item.mvid
                  obj.id=item.id
                  arr.push(obj)
                }
                return arr;
              })
              console.log(res.data.result.songs)
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
              that.setData({
                singer: res2.data.singer.itemlist,
                song: res2.data.song.itemlist

              })
            }
          })
        }
      }
    } else {
      this.setData({

        song: [],
        singer: ''
      })
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
    wx.request({
      url: `https://music.163.com/api/song/media?id=${item.id}`,
      success:(res)=>{
        console.log(res)
        item.lrc = res.data.lyric;
        app.data.song = item;
        if (item.pic == undefined) {
          console.log(11222)
          time.wholelist(app);
    
         
        } else {
          console.log(222)
          console.log(app)
          if(item.mvid){
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
          }else{
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

        
        }
      }
    })
    
   





  },
  onLoad: function () {
    console.log(app)
  }
})