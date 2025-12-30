/**
 * 播放历史记录工具
 * 管理用户的播放历史记录
 */
const STORAGE_KEY = 'playHistory';
const MAX_HISTORY_COUNT = 100; // 最多保存 100 条记录

class PlayHistory {
  /**
   * 添加播放记录
   * @param {Object} song - 歌曲信息
   * @param {string} song.id - 歌曲 ID
   * @param {string} song.title - 歌曲标题
   * @param {string} song.singer - 歌手
   * @param {string} song.pic - 封面图
   * @returns {Promise<void>}
   */
  async add(song) {
    try {
      if (!song || !song.id) {
        console.warn('添加播放记录失败：歌曲信息不完整');
        return;
      }

      const history = await this.getHistory();
      
      // 移除重复项（相同 ID 的记录）
      const filtered = history.filter(item => item.id !== song.id);
      
      // 添加到开头
      filtered.unshift({
        ...song,
        playTime: Date.now(),
        playCount: (song.playCount || 0) + 1
      });
      
      // 限制数量
      const limited = filtered.slice(0, MAX_HISTORY_COUNT);
      
      await wx.setStorage({
        key: STORAGE_KEY,
        data: limited
      });
    } catch (error) {
      console.error('添加播放记录失败:', error);
    }
  }

  /**
   * 获取播放历史
   * @param {number} limit - 限制返回数量（可选）
   * @returns {Promise<Array>}
   */
  async getHistory(limit = null) {
    try {
      const res = await wx.getStorage({ key: STORAGE_KEY });
      const history = res.data || [];
      
      // 按播放时间倒序排序
      const sorted = history.sort((a, b) => (b.playTime || 0) - (a.playTime || 0));
      
      if (limit && limit > 0) {
        return sorted.slice(0, limit);
      }
      
      return sorted;
    } catch {
      return [];
    }
  }

  /**
   * 获取最近播放的歌曲
   * @param {number} count - 返回数量，默认 10
   * @returns {Promise<Array>}
   */
  async getRecent(count = 10) {
    return await this.getHistory(count);
  }

  /**
   * 获取播放次数最多的歌曲
   * @param {number} count - 返回数量，默认 10
   * @returns {Promise<Array>}
   */
  async getMostPlayed(count = 10) {
    try {
      const history = await this.getHistory();
      
      // 按播放次数排序
      const sorted = history.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      
      return sorted.slice(0, count);
    } catch {
      return [];
    }
  }

  /**
   * 删除指定记录
   * @param {string} songId - 歌曲 ID
   * @returns {Promise<boolean>}
   */
  async remove(songId) {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(item => item.id !== songId);
      
      await wx.setStorage({
        key: STORAGE_KEY,
        data: filtered
      });
      
      return true;
    } catch (error) {
      console.error('删除播放记录失败:', error);
      return false;
    }
  }

  /**
   * 清空播放历史
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      await wx.removeStorage({ key: STORAGE_KEY });
      return true;
    } catch (error) {
      console.error('清空播放历史失败:', error);
      return false;
    }
  }

  /**
   * 获取播放统计信息
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    try {
      const history = await this.getHistory();
      
      const totalSongs = history.length;
      const totalPlays = history.reduce((sum, item) => sum + (item.playCount || 0), 0);
      const uniqueArtists = new Set(history.map(item => item.singer)).size;
      
      // 最常播放的歌曲
      const mostPlayed = await this.getMostPlayed(1);
      
      return {
        totalSongs,
        totalPlays,
        uniqueArtists,
        mostPlayedSong: mostPlayed[0] || null
      };
    } catch {
      return {
        totalSongs: 0,
        totalPlays: 0,
        uniqueArtists: 0,
        mostPlayedSong: null
      };
    }
  }

  /**
   * 检查歌曲是否在播放历史中
   * @param {string} songId - 歌曲 ID
   * @returns {Promise<boolean>}
   */
  async has(songId) {
    try {
      const history = await this.getHistory();
      return history.some(item => item.id === songId);
    } catch {
      return false;
    }
  }
}

module.exports = new PlayHistory();

