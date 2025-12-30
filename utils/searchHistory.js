/**
 * 搜索历史工具
 * 管理用户的搜索历史记录
 */
const STORAGE_KEY = 'searchHistory';
const MAX_HISTORY_COUNT = 20; // 最多保存 20 条记录

class SearchHistory {
  /**
   * 添加搜索记录
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<void>}
   */
  async add(keyword) {
    try {
      if (!keyword || !keyword.trim()) {
        return;
      }

      const trimmedKeyword = keyword.trim();
      const history = await this.getHistory();
      
      // 移除重复项（不区分大小写）
      const filtered = history.filter(
        item => item.toLowerCase() !== trimmedKeyword.toLowerCase()
      );
      
      // 添加到开头
      filtered.unshift(trimmedKeyword);
      
      // 限制数量
      const limited = filtered.slice(0, MAX_HISTORY_COUNT);
      
      await wx.setStorage({
        key: STORAGE_KEY,
        data: limited
      });
    } catch (error) {
      console.error('添加搜索记录失败:', error);
    }
  }

  /**
   * 获取搜索历史
   * @param {number} limit - 限制返回数量（可选）
   * @returns {Promise<Array>}
   */
  async getHistory(limit = null) {
    try {
      const res = await wx.getStorage({ key: STORAGE_KEY });
      const history = res.data || [];
      
      if (limit && limit > 0) {
        return history.slice(0, limit);
      }
      
      return history;
    } catch {
      return [];
    }
  }

  /**
   * 删除指定记录
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<boolean>}
   */
  async remove(keyword) {
    try {
      const history = await this.getHistory();
      const filtered = history.filter(
        item => item.toLowerCase() !== keyword.toLowerCase()
      );
      
      await wx.setStorage({
        key: STORAGE_KEY,
        data: filtered
      });
      
      return true;
    } catch (error) {
      console.error('删除搜索记录失败:', error);
      return false;
    }
  }

  /**
   * 清空搜索历史
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      await wx.removeStorage({ key: STORAGE_KEY });
      return true;
    } catch (error) {
      console.error('清空搜索历史失败:', error);
      return false;
    }
  }

  /**
   * 获取热门搜索词（可以扩展为从服务器获取）
   * @returns {Array}
   */
  getHotKeywords() {
    // 这里可以返回固定的热门搜索词，或者从服务器获取
    return [
      '周杰伦',
      '邓紫棋',
      '林俊杰',
      'Taylor Swift',
      '流行音乐'
    ];
  }

  /**
   * 搜索建议（可以扩展为从服务器获取）
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>}
   */
  async getSuggestions(keyword) {
    if (!keyword || !keyword.trim()) {
      return [];
    }

    try {
      const history = await this.getHistory();
      const trimmedKeyword = keyword.trim().toLowerCase();
      
      // 从历史记录中匹配
      const suggestions = history.filter(item => 
        item.toLowerCase().includes(trimmedKeyword)
      );
      
      return suggestions.slice(0, 5); // 最多返回 5 条建议
    } catch {
      return [];
    }
  }
}

module.exports = new SearchHistory();

