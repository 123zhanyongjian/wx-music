/**
 * 常量定义
 * 统一管理项目中的常量
 */

module.exports = {
  // 播放状态
  PLAY_STATUS: {
    PAUSE: 'pause',
    PLAYING: 'playing',
    LOADING: 'loading',
    STOPPED: 'stopped'
  },

  // 播放模式
  PLAY_MODE: {
    SEQUENCE: 0,  // 顺序播放
    LOOP: 1,     // 循环播放
    RANDOM: 2     // 随机播放
  },

  // 播放模式名称
  PLAY_MODE_NAMES: {
    0: '顺序播放',
    1: '循环播放',
    2: '随机播放'
  },

  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,
    DEFAULT_PAGE_NUM: 1
  },

  // 缓存 Key
  STORAGE_KEY: {
    OPEN_ID: 'openId',
    USER_INFO: 'userInfo',
    LAST_SONG: 'lastsong',
    SONG_LIST: 'songlist',
    PLAY_HISTORY: 'playHistory',
    SEARCH_HISTORY: 'searchHistory',
    LOGS: 'logs'
  },

  // 音质等级
  QUALITY: {
    STANDARD: { resource: null, level: null, name: '标准' },
    HIGH: { resource: 2, level: 1, name: '高品质' },
    LOSSLESS: { resource: 2, level: 3, name: '无损' }
  },

  // 歌曲来源类型
  SONG_SOURCE: {
    TYPE_1: 1,  // 类型1
    TYPE_2: 2,  // 类型2
    TYPE_3: 3,  // 类型3（爱听音乐）
    TYPE_4: 4,  // 类型4（周杰伦）
    TYPE_5: 5,  // 类型5
    TYPE_6: 6   // 类型6（gqb）
  },

  // 错误消息
  ERROR_MESSAGE: {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    TIMEOUT: '请求超时，请检查网络',
    UNKNOWN: '操作失败，请稍后重试',
    LOGIN_FAILED: '登录失败，请重试',
    UPLOAD_FAILED: '上传失败，请重试'
  },

  // 成功消息
  SUCCESS_MESSAGE: {
    LOGIN_SUCCESS: '登录成功',
    UPLOAD_SUCCESS: '上传成功',
    SAVE_SUCCESS: '保存成功',
    DELETE_SUCCESS: '删除成功'
  },

  // 时间常量（毫秒）
  TIME: {
    SECOND: 1000,
    MINUTE: 60000,
    HOUR: 3600000,
    DAY: 86400000
  },

  // 缓存过期时间（毫秒）
  CACHE_EXPIRE: {
    SHORT: 300000,    // 5 分钟
    MEDIUM: 3600000,  // 1 小时
    LONG: 86400000,   // 24 小时
    WEEK: 604800000   // 7 天
  },

  // 列表限制
  LIMIT: {
    PLAY_HISTORY: 100,    // 播放历史最多 100 条
    SEARCH_HISTORY: 20,   // 搜索历史最多 20 条
    SUGGESTIONS: 5        // 搜索建议最多 5 条
  }
};

