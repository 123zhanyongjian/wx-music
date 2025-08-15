const time = require('./time');
const request = time.Promisify(wx.request);
const base = require('./base');
const api = require('./api');
const apiHost = getApp().host;

// 格式化时间为年/月/日 时:分:秒
const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + 
         [hour, minute, second].map(formatNumber).join(':');
};

// 数字补零格式化
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

// 获取歌词
const GETlRC = async (id) => {
  if (id[0] === 'k') {
    return '';
  }
  
  try {
    const res = await request({
      url: `https://music-api.tonzhon.com/lyrics/${id}`
    });
    
    if (id[0] === 'q' && res.data?.data) {
      // 处理QQ音乐的base64编码歌词
      return decodeURIComponent(escape(base.weAtob(res.data.data)));
    }
    
    return res.data?.data || '';
  } catch (err) {
    console.error('获取歌词失败:', err);
    return '';
  }
};

// 处理歌曲播放错误，获取可用播放源（支持音质参数）
const errorSong = async (type, datas, resource = null, level = null, callback) => {
  // 确保callback始终是函数
  if (typeof callback !== 'function') {
    callback = () => {};
  }

  // 处理不同类型的歌曲源
  if (type === 1) {
    try {
      const requestData = {
        input: datas.id,
        filter: 'id',
        type: datas.type || 'baidu',
        page: 1
      };
      
      // 添加音质参数（如果提供）
      if (resource !== null) requestData.resource = resource;
      if (level !== null) requestData.level = level;
      
      const res = await request({
        url: `${apiHost}/getSongList`,
        method: 'post',
        data: requestData
      });
      
      if (res.data?.data?.[0]?.url) {
        callback({
          src: res.data.data[0].url,
          lrc: res.data.data[0].lrc || '',
          stauts: true
        });
      } else {
        callback({ stauts: false });
      }
    } catch (err) {
      console.error('type=1 歌曲加载失败:', err);
      callback({ stauts: false });
    }
    return;
  } 
  else if (type === 2) {
    // 类型2直接返回失败
    callback({ stauts: false });
    return;
  }
  else if (type === 4) {
    // 获取周杰伦歌曲源
    api.getjaySongSrc(datas.id, ({ src, lrc }) => {
      callback({ src, lrc: lrc || '', stauts: src ? true : false });
    });
    return;
  }
  else if (type === 5 || type === 3) {
    // 爱听音乐或其他类型
    api.atSong(datas.id, resource, level, ({ src, lrc, pic, newid }) => {
      callback({ 
        src, 
        lrc: lrc || '', 
        pic: pic || datas.pic,
        newid,
        stauts: src ? true : false 
      });
    });
    return;
  }
  else if (type === 6) {
    // gqb歌曲源
    api.gqbSong(datas.id, ({ src, lrc, pic }) => {
      callback({ 
        src, 
        lrc: lrc || '', 
        pic: pic || datas.pic,
        stauts: src ? true : false 
      });
    });
    return;
  }
  else {
    // 未匹配的类型
    callback({ stauts: false });
  }
};

// 分页功能处理
function changePage(getAthletesList, Array, obj = { 
  total: 'total', 
  pageNum: 'pageNum', 
  pageSize: 'pageSize' 
}) {
  const pageTotal = Math.ceil(this.data[obj.total] / this.data[obj.pageSize]);
  
  if (this.data[obj.pageNum] < pageTotal) {
    this.setData({
      [obj.pageNum]: this.data[obj.pageNum] + 1
    });
    
    if (Array && Array.length > 0) {
      this[getAthletesList](this.data[obj.pageNum], this.data[obj.pageSize], ...Array);
    } else {
      this[getAthletesList](this.data[obj.pageNum], this.data[obj.pageSize]);
    }
  } else {
    wx.showToast({
      title: '我已经到底了',
      icon: 'none'
    });
  }
}

module.exports = {
  formatTime,
  GETlRC,
  errorSong,
  changePage
};
    