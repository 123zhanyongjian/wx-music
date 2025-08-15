const app = getApp();
const tiem = require('./time.js');
const request = tiem.Promisify(wx.request);

// 获取歌曲资源（支持resource和level参数，默认不传递）
async function atSong(id, resource = null, level = null, callback) {
  try {
    const { data: userId } = await wx.getStorage({ key: 'openId', encrypt: true }).catch(() => ({ data: '' }));
    
    // 构造请求参数：默认不传递resource和level，其他情况传递
    const requestData = { id, userId };
    if (resource !== null) {
      requestData.resource = resource; // 仅非默认时传递resource=2
    }
    if (level !== null) {
      requestData.level = level; // 仅非默认时传递level=1/2/3
    }

    const res = await request({
      url: app.host + '/songinfo',
      method: 'post',
      data: requestData
    });
    if (res.data.url) {
      callback({
        stauts: true,
        src: res.data.url,
        lrc: res.data.lrc,
        pic: res.data.pic
      });
    } else {
      // 降级处理
      callback({ stauts: false });
    }
  } catch (err) {
    callback({ stauts: false });
  }
}

// 搜索歌曲
async function getSerachSongOrSinger(value, callback) {
  try {
    const res = await request({ url: `https://music-api.tonzhon.com/search/m/${value}` });
    const songs = (res.data.data?.songs || []).map(item => ({
      id: item.newId,
      title: item.name,
      singer: item.artists.map(a => a.name).join('-'),
      pic: '/image/cover.jpg',
      mId: 3
    }));
    callback(songs);
  } catch (err) {
    callback([]);
  }
}

// 获取周杰伦歌曲列表
async function getJaySongList(callback) {
  try {
    const res = await request({ url: app.host + '/list' });
    const songs = res.data.playlist.tracks.map(item => ({
      id: item.id,
      title: item.name,
      singer: item.ar.map(a => a.name).join('-'),
      pic: res.data.playlist.coverImgUrl,
      mId: 4
    }));
    callback(songs);
  } catch (err) {
    callback([]);
  }
}

module.exports = {
  atSong,
  getSerachSongOrSinger,
  getJaySongList
};
    