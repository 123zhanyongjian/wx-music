/**
 * 统一请求工具类
 * 封装 wx.request，提供统一的请求接口和错误处理
 */
const apiConfig = require('../pages/api/index');

class Request {
  constructor() {
    this.baseURL = apiConfig.host;
    this.timeout = 10000;
    this.loadingCount = 0;
  }

  /**
   * 获取 app 实例
   * @returns {Object}
   */
  getApp() {
    try {
      return getApp();
    } catch (e) {
      return null;
    }
  }

  /**
   * 显示加载提示
   * @param {string} title - 加载提示文字
   */
  showLoading(title = '加载中') {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      wx.showLoading({ title, mask: true });
    }
  }

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      wx.hideLoading();
    }
  }

  /**
   * 获取 OpenID
   * @returns {Promise<string|null>}
   */
  async getOpenId() {
    try {
      const res = await wx.getStorage({ key: 'openId', encrypt: true });
      return res.data;
    } catch {
      return null;
    }
  }

  /**
   * 获取 host（从 app 实例或配置）
   * @returns {string}
   */
  getHost() {
    const app = this.getApp();
    return app?.host || this.baseURL;
  }

  /**
   * 统一请求方法
   * @param {Object} options - 请求配置
   * @param {string} options.url - 请求地址
   * @param {string} options.method - 请求方法 GET|POST|PUT|DELETE
   * @param {Object} options.data - 请求数据
   * @param {Object} options.header - 请求头
   * @param {boolean} options.showLoading - 是否显示加载提示
   * @param {boolean} options.showError - 是否显示错误提示
   * @returns {Promise<Object>}
   */
  async request(options) {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      showLoading = true,
      showError = true
    } = options;

    // 显示加载
    if (showLoading) {
      this.showLoading();
    }

    try {
      // 获取用户 OpenID（如果有）
      const openId = await this.getOpenId();
      if (openId) {
        data.userId = data.userId || openId;
      }

      // 发起请求
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
          method,
          data,
          header: {
            'Content-Type': 'application/json',
            ...header
          },
          timeout: this.timeout,
          success: resolve,
          fail: reject
        });
      });

      // 隐藏加载
      if (showLoading) {
        this.hideLoading();
      }

      // 统一处理响应
      if (res.statusCode === 200) {
        const responseData = res.data;
        
        // 兼容不同的响应格式
        if (responseData.code === 200 || responseData.code === 0) {
          return {
            success: true,
            data: responseData.data,
            message: responseData.message || 'success',
            code: responseData.code
          };
        } else {
          // 业务错误
          const errorMsg = responseData.message || '请求失败';
          if (showError) {
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            });
          }
          return {
            success: false,
            message: errorMsg,
            code: responseData.code
          };
        }
      } else {
        throw new Error(`HTTP ${res.statusCode}`);
      }
    } catch (error) {
      // 隐藏加载
      if (showLoading) {
        this.hideLoading();
      }

      // 错误处理
      const errorMsg = this.getErrorMessage(error);
      if (showError) {
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
      return {
        success: false,
        message: errorMsg,
        error
      };
    }
  }

  /**
   * 错误信息处理
   * @param {Error} error - 错误对象
   * @returns {string}
   */
  getErrorMessage(error) {
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        return '请求超时，请检查网络';
      }
      if (error.errMsg.includes('fail')) {
        return '网络连接失败，请检查网络设置';
      }
    }
    return error.message || '请求失败，请稍后重试';
  }

  /**
   * GET 请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求参数
   * @param {Object} options - 其他配置
   * @returns {Promise<Object>}
   */
  get(url, data = {}, options = {}) {
    return this.request({ ...options, url, method: 'GET', data });
  }

  /**
   * POST 请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他配置
   * @returns {Promise<Object>}
   */
  post(url, data = {}, options = {}) {
    return this.request({ ...options, url, method: 'POST', data });
  }

  /**
   * PUT 请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他配置
   * @returns {Promise<Object>}
   */
  put(url, data = {}, options = {}) {
    return this.request({ ...options, url, method: 'PUT', data });
  }

  /**
   * DELETE 请求
   * @param {string} url - 请求地址
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他配置
   * @returns {Promise<Object>}
   */
  delete(url, data = {}, options = {}) {
    return this.request({ ...options, url, method: 'DELETE', data });
  }

  /**
   * 文件上传
   * @param {Object} options - 上传配置
   * @param {string} options.url - 上传地址
   * @param {string} options.filePath - 文件路径
   * @param {string} options.name - 文件对应的 key
   * @param {Object} options.formData - 额外的 form data
   * @param {boolean} options.showLoading - 是否显示加载提示
   * @param {boolean} options.showError - 是否显示错误提示
   * @returns {Promise<Object>}
   */
  async upload(options) {
    const {
      url,
      filePath,
      name = 'file',
      formData = {},
      showLoading = true,
      showError = true
    } = options;

    if (showLoading) {
      this.showLoading('上传中');
    }

    try {
      const openId = await this.getOpenId();
      if (openId) {
        formData.userId = openId;
      }

      const res = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
          filePath,
          name,
          formData,
          success: resolve,
          fail: reject
        });
      });

      if (showLoading) {
        this.hideLoading();
      }

      const data = JSON.parse(res.data);
      if (data.code === 200 || data.code === 0) {
        return {
          success: true,
          data: data.data,
          message: data.message || '上传成功'
        };
      } else {
        const errorMsg = data.message || '上传失败';
        if (showError) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
        return {
          success: false,
          message: errorMsg
        };
      }
    } catch (error) {
      if (showLoading) {
        this.hideLoading();
      }
      const errorMsg = this.getErrorMessage(error);
      if (showError) {
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
      return {
        success: false,
        message: errorMsg
      };
    }
  }
}

// 导出单例
const request = new Request();
module.exports = request;

