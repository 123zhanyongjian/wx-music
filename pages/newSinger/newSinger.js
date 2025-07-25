const HOT_NAME = '热门';
const HOT_SINGER_LEN = 10;
const app = getApp()
const utils = require('../../utils/util.js')
const time = require('../../utils/time.js');
const { img } = require('../../utils/loveBg.js');
const request = time.Promisify(wx.request)
function Singer(name, id) {
  this.id = id;
  this.name = name;
  this.avatar = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${id}.jpg?max_age=2592000`;
}

Page({
  data: {
    tabs: ['全部', '华语男', '华语女', '华语组合', '日韩男', '日韩女', '日韩组合', '欧美男', '欧美女', '欧美组合', '其他'],
    currentTab: 0,
    singer: [],
    title: '',
    total:0,
    page:1,
    size:50,
    prefix:'',
    azList: Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i))
  },
  onLoad() {
    this.getsingerList();
  },
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
    this.getsingerList(index);
  },
  // 侧边字母导航定位
  Location(e) {
    var title = e.currentTarget.dataset.id;
    this.setData({
      title: title
    });
  },
 
  // 跳转歌手详情（与singer页面一致，存入app.data.singer后跳转）
  details(e) {
    const singer = e.currentTarget.dataset.singer;
    app.data.singer = {...singer,avatar:singer.img};
    app.data.avatar=singer.img
    // console.log(singer)
    wx.navigateTo({
      url: "/pages/singerdetails/singerdetails?id="+singer.id
    });
  },
 async getsingerList(type=0){
  const res = await request({
    url: app.host + '/singer',
    data: {
      page:this.data.page,
      size:this.data.size,
      type,
      prefix:this.data.prefix
    }
   
  })
  // 将获取到的歌手数据进行分组,并且按照首字母进行排序,数据内已有prefix作为a-z的排序A-Z这样的
  const singerList = res.data.data.singerList
  const singerMap = {}
  singerList.forEach(singer => {
    const letter = singer.prefix
    if (!singerMap[letter]) {
      singerMap[letter] = []
    }
    singerMap[letter].push(singer)
  })
  // const singerList1 = Object.values(singerMap).sort((a, b) => a.name(b.name))
  const singerList1 = Object.keys(singerMap)
    .sort((a, b) => a.localeCompare(b))
    .map(k => ({ title: k, items: singerMap[k].map(i=>({...i,img:app.host+'/resource?url='+i.img}))}));
  // console.log(singerList1, 555)
  this.setData({
    singer: singerList1,
    total: res.data.data.total
  })

  },
  onImageError(e) {
    // console.log(e.detail.errMsg      , 555)
  }
}); 