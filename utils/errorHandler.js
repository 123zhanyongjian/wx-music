/**
 * 错误处理工具
 * 统一处理各种错误情况
 */
class ErrorHandler {
  /**
   * 处理 API 错误
   * @param {Object} error - 错误对象
   * @param {string} customMessage - 自定义错误消息
   */
  handleApiError(error, customMessage) {
    let message = customMessage;
    
    if (!message) {
      if (error.code) {
        // 业务错误码
        message = this.getBusinessErrorMessage(error.code);
      } else if (error.errMsg) {
        // 网络错误
        message = this.getNetworkErrorMessage(error.errMsg);
      } else {
        message = '操作失败，请稍后重试';
      }
    }
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    
    // 记录错误日志（开发环境）
    // if (process.env.NODE_ENV === 'development') {
    //   console.error('API Error:', error);
    // }
  }

  /**
   * 业务错误码映射
   * @param {number} code - 错误码
   * @returns {string}
   */
  getBusinessErrorMessage(code) {
    const errorMap = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '没有权限',
      404: '资源不存在',
      500: '服务器错误',
      503: '服务暂不可用'
    };
    return errorMap[code] || '操作失败';
  }

  /**
   * 网络错误处理
   * @param {string} errMsg - 错误消息
   * @returns {string}
   */
  getNetworkErrorMessage(errMsg) {
    if (errMsg.includes('timeout')) {
      return '请求超时，请检查网络';
    }
    if (errMsg.includes('fail')) {
      return '网络连接失败';
    }
    return '网络错误，请稍后重试';
  }

  /**
   * 显示确认对话框
   * @param {Object} options - 配置选项
   * @param {string} options.title - 标题
   * @param {string} options.content - 内容
   * @param {string} options.confirmText - 确认按钮文字
   * @param {string} options.cancelText - 取消按钮文字
   * @returns {Promise<boolean>}
   */
  showConfirm(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '提示',
        content: options.content,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }
}

module.exports = new ErrorHandler();

