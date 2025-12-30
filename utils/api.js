const API = require('../services/api');

/**
 * 获取 app 实例
 * @returns {Object}
 */
function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    return null;
  }
}

/**
 * 获取歌曲资源（支持resource和level参数，默认不传递）
 * @param {string} id - 歌曲 ID
 * @param {number} resource - 资源类型（可选）
 * @param {number} level - 音质等级（可选）
 * @param {Function} callback - 回调函数
 */
async function atSong(id, resource = null, level = null, callback) {
  console.log(id, resource, level,'22222222222');
  try {
    const res = await API.song.getSongInfo(id, resource, level);
    console.log(res,'33333333333');
    if (res.success && res.data && res.data.url) {
      callback({
        stauts: true,
        src: res.data.url,
        lrc: res.data.lrc || '',
        pic: res.data.pic || ''
      });
    } else {
      callback({ stauts: false });
    }
  } catch (err) {
    console.error('获取歌曲资源失败:', err);
    callback({ stauts: false });
  }
}

/**
 * 搜索歌曲（聚合搜索，使用外部API）
 * @param {string} value - 搜索关键词
 * @param {Function} callback - 回调函数
 */
async function getSerachSongOrSinger(value, callback) {
  try {
    // 使用外部 API（保持原有逻辑）
    const request = require('./time').Promisify(wx.request);
    const res = await request({ 
      url: `https://music-api.tonzhon.com/search/m/${value}`,
      showLoading: false // 不显示加载提示
    });
    
    const songs = (res.data?.data?.songs || []).map(item => ({
      id: item.newId,
      title: item.name,
      singer: item.artists.map(a => a.name).join('-'),
      pic: '/image/cover.jpg',
      mId: 3
    }));
    
    callback(songs);
  } catch (err) {
    console.error('搜索歌曲失败:', err);
    callback([]);
  }
}

/**
 * 获取周杰伦歌曲列表
 * @param {Function} callback - 回调函数
 */
async function getJaySongList(callback) {
  try {
    // 使用后端推荐接口（如果支持）
    // 这里保持原有逻辑，使用 /list 接口
    const app = getAppInstance();
    const host = app?.host || '';
    const request = require('./time').Promisify(wx.request);
    const res = await request({ 
      url: host + '/list',
      showLoading: false
    });
    
    if (res.data && res.data.playlist && res.data.playlist.tracks) {
      const songs = res.data.playlist.tracks.map(item => ({
        id: item.id,
        title: item.name,
        singer: item.ar.map(a => a.name).join('-'),
        pic: res.data.playlist.coverImgUrl,
        mId: 4
      }));
      callback(songs);
    } else {
      callback([]);
    }
  } catch (err) {
    console.error('获取周杰伦歌曲列表失败:', err);
    callback([]);
  }
}

/**
 * 获取歌曲源（兼容旧接口）
 * @param {string} id - 歌曲 ID
 * @param {Function} callback - 回调函数
 */
async function getSongSrc(id, callback) {
  await atSong(id, null, null, callback);
}

module.exports = {
  atSong,
  getSerachSongOrSinger,
  getJaySongList,
  getSongSrc
};
    