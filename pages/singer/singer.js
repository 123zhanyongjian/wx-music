const HOT_NAME = '热门';
const HOT_SINGER_LEN = 10
const app = getApp();

function Singer(name, id) {
  this.id = id
  this.name = name
  this.avatar = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${id}.jpg?max_age=2592000`
}
Page({


  data: {
    singer: [],
    list:[],
    title: '',
    serach:''
  },
  onReachBottom() {
    console.log('到底了')
  },
  getSingerList: function () {
    const _that = this
    wx.request({
      url: 'https://c.y.qq.com/v8/fcg-bin/v8.fcg',
      data: {
        g_tk: 5380,
        inCharset: "utf-8",
        outCharset: "utf-8",
        notice: 0,
        format: "jsonp",
        channel: "singer",
        page: "list",
        key: "all_all_all",
        pagesize: 9,
        pagenum: 1,
        hostUin: 0,
        needNewCode: 0,
        platform: "yqq",
        jsonpCallback: "callback"
      },
      success: function (res) {
        console.log(res);
        if (res.statusCode === 200) {

          var res1 = res.data.replace("callback(", "");

          var res2 = JSON.parse(res1.substring(0, res1.length - 1))
          console.log(res2.data.list)
          _that.setData({
            singer: _that._normallizeSinger(res2.data.list)
          })
        }
      }
    })
  },
  serachs(e){
    var serach = e.detail.value;
    const that = this
    if(!serach){
      that.setData({
        list:[]
      })
      return
    }
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
          list: res2.data.singer.itemlist,

        })
      }
    })
  },
  //锚点定位
  Location(e) {
    var title = e.currentTarget.dataset.id;
    this.setData({
      title: title
    })
  },
  /*组装成需要的歌手列表数据*/
  _normallizeSinger: function (list) {
    let map = {
      hot: {
        title: HOT_NAME,
        items: []
      }
    }
    list.forEach((item, index) => {
      if (index < HOT_SINGER_LEN) {
        map.hot.items.push(new Singer(item.Fsinger_name, item.Fsinger_mid))
      }
      const key = item.Findex
      if (!map[key]) {
        map[key] = {
          title: key,
          items: []
        }
      }
      map[key].items.push(new Singer(item.Fsinger_name, item.Fsinger_mid));

    })
    // 为了得到有序列表,对map做进一步处理
    let hot = []
    let ret = []
    for (let key in map) {
      var val = map[key]
      if (val.title.match(/[a-zA-Z]/)) {
        ret.push(val)
      } else if (val.title === HOT_NAME) {
        hot.push(val)
      }
    }
    // 按a-z排序
    ret.sort((a, b) => {
      return a.title.charCodeAt(0) - b.title.charCodeAt(0)
    }),

      this.setData({
        singer: hot.concat(ret)
      })
    console.log(this.data.singer)
    return hot.concat(ret)
  },
  details(e) {
    app.data.singer = e.currentTarget.dataset.singer;
    
    wx.navigateTo({
      url: "../../pages/singerdetails/singerdetails"
    })
  },

  onLoad() {
    this.getSingerList();
    console.log(this.data.singer)
  },
  onReachBottom() {
    wx.showModal({
      title: '提示',
      content: '是否切换歌手列表',
      success(res) {
        if (res.confirm) { } else { }
      }
    })
  }

})