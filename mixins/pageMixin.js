/**
 * 页面 Mixin
 * 提供通用的页面功能，如加载状态、分页等
 */
const CONSTANTS = require('../utils/constants');

module.exports = {
  data: {
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    pageNum: CONSTANTS.PAGINATION.DEFAULT_PAGE_NUM,
    pageSize: CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE
  },

  /**
   * 显示加载
   * @param {string} title - 加载提示文字
   */
  showLoading(title = '加载中') {
    this.setData({ loading: true });
    wx.showLoading({ title, mask: true });
  },

  /**
   * 隐藏加载
   */
  hideLoading() {
    this.setData({ loading: false });
    wx.hideLoading();
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    this.setData({
      refreshing: true,
      pageNum: CONSTANTS.PAGINATION.DEFAULT_PAGE_NUM
    });
    
    try {
      await this.loadData();
    } catch (error) {
      console.error('下拉刷新失败:', error);
    } finally {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 上拉加载
   */
  async onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore || this.data.loading) {
      return;
    }
    
    this.setData({ loadingMore: true });
    
    try {
      await this.loadMore();
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  /**
   * 加载数据（子类实现）
   */
  async loadData() {
    // 子类实现
    console.warn('loadData 方法需要在子类中实现');
  },

  /**
   * 加载更多（子类实现）
   */
  async loadMore() {
    // 子类实现
    console.warn('loadMore 方法需要在子类中实现');
  },

  /**
   * 重置分页
   */
  resetPagination() {
    this.setData({
      pageNum: CONSTANTS.PAGINATION.DEFAULT_PAGE_NUM,
      hasMore: true
    });
  }
};

