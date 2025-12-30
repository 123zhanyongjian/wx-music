/**
 * API 服务层
 * 统一管理所有 API 接口调用
 */
const request = require('../utils/request');

const API = {
  // 用户相关接口
  user: {
    /**
     * 获取 OpenID
     * @param {string} code - 微信登录 code
     * @returns {Promise<Object>}
     */
    getOpenId(code) {
      return request.get('/userGetopenId', { code });
    },
    
    /**
     * 获取用户信息
     * @param {string} userId - 用户 ID
     * @returns {Promise<Object>}
     */
    getUserInfo(userId) {
      return request.get('/userinfo', { id: userId });
    },
    
    /**
     * 添加用户
     * @param {Object} data - 用户数据
     * @param {string} data.userName - 用户名
     * @param {string} data.userId - 用户 ID
     * @returns {Promise<Object>}
     */
    addUser(data) {
      return request.post('/addUser', data);
    },
    
    /**
     * 更新用户信息
     * @param {Object} data - 用户数据
     * @returns {Promise<Object>}
     */
    updateUserInfo(data) {
      return request.post('/userEdit', data);
    }
  },

  // 歌曲相关接口
  song: {
    /**
     * 获取歌曲信息
     * @param {string} id - 歌曲 ID
     * @param {number} resource - 资源类型（可选）
     * @param {number} level - 音质等级（可选）
     * @returns {Promise<Object>}
     */
    getSongInfo(id, resource = null, level = null) {
      const data = { id };
      if (resource !== null) data.resource = resource;
      if (level !== null) data.level = level;
      return request.post('/songinfo', data);
    },
    
    /**
     * 批量查询歌曲
     * @param {Array<string>} ids - 歌曲 ID 数组
     * @returns {Promise<Object>}
     */
    getSongList(ids) {
      return request.post('/songList', { ids });
    },
    
    /**
     * 搜索歌曲
     * @param {Object} params - 搜索参数
     * @param {string} params.input - 搜索关键词或ID
     * @param {string} params.filter - 过滤条件
     * @param {string} params.type - 搜索类型
     * @param {number} params.page - 页码
     * @returns {Promise<Object>}
     */
    searchSong(params) {
      return request.post('/getSongList', params);
    }
  },

  // 歌单相关接口
  playlist: {
    /**
     * 获取歌单列表
     * @param {string} userId - 用户 ID
     * @returns {Promise<Object>}
     */
    getPlaylistList(userId) {
      return request.get('/playlist/', { userid: userId });
    },
    
    /**
     * 获取歌单详情
     * @param {string} id - 歌单 ID
     * @returns {Promise<Object>}
     */
    getPlaylistInfo(id) {
      return request.get('/playlist/info', { id });
    },
    
    /**
     * 创建歌单
     * @param {Object} data - 歌单数据
     * @param {string} data.userid - 用户 ID
     * @param {string} data.name - 歌单名称
     * @param {string} data.img - 封面图片
     * @returns {Promise<Object>}
     */
    createPlaylist(data) {
      return request.post('/playlist/Add', data);
    },
    
    /**
     * 更新歌单
     * @param {Object} data - 歌单数据
     * @returns {Promise<Object>}
     */
    updatePlaylist(data) {
      return request.post('/playlist/edit', data);
    },
    
    /**
     * 删除歌单
     * @param {string} id - 歌单 ID
     * @returns {Promise<Object>}
     */
    deletePlaylist(id) {
      return request.delete('/playlist/del', { id });
    },
    
    /**
     * 添加歌曲到歌单
     * @param {string} playlistId - 歌单 ID
     * @param {Array<string>} songIds - 歌曲 ID 数组
     * @returns {Promise<Object>}
     */
    addSongs(playlistId, songIds) {
      return request.post('/playlist/addsong', {
        playlistId,
        songIds
      });
    },
    
    /**
     * 从歌单删除歌曲
     * @param {string} playlistId - 歌单 ID
     * @param {Array<string>} songIds - 歌曲 ID 数组
     * @returns {Promise<Object>}
     */
    removeSongs(playlistId, songIds) {
      return request.post('/playlist/delsong', {
        playlistId,
        songIds
      });
    }
  },

  // 文件上传接口
  upload: {
    /**
     * 上传文件
     * @param {string} filePath - 文件路径
     * @param {Object} formData - 额外的 form data
     * @returns {Promise<Object>}
     */
    uploadFile(filePath, formData = {}) {
      return request.upload({
        url: '/upload',
        filePath,
        formData
      });
    }
  }
};

module.exports = API;

