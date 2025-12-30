/**
 * 认证服务
 * 统一管理用户登录和认证相关逻辑
 */
const API = require('../services/api');

class AuthService {
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
   * 获取 host
   * @returns {string}
   */
  getHost() {
    const app = this.getApp();
    return app?.host || '';
  }
  /**
   * 检查登录状态
   * @returns {Promise<Object|null>} 用户信息或 null
   */
  async checkLogin() {
    try {
      const res = await wx.getStorage({ key: 'openId', encrypt: true });
      if (res.data) {
        return await this.getUserInfo(res.data);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 微信登录
   * @returns {Promise<Object>} 用户信息
   */
  async wxLogin() {
    try {
      // 1. 获取 code
      const loginRes = await wx.login();
      if (!loginRes.code) {
        throw new Error('获取登录 code 失败');
      }
      
      // 2. 获取 OpenID
      const openIdRes = await API.user.getOpenId(loginRes.code);
      if (!openIdRes.success) {
        throw new Error(openIdRes.message || '获取 OpenID 失败');
      }
      
      const openId = openIdRes.data;
      
      // 保存 OpenID
      await wx.setStorage({
        key: 'openId',
        data: openId,
        encrypt: true
      });

      // 3. 获取用户信息
      const userRes = await API.user.getUserInfo(openId);
      if (userRes.success && userRes.data && userRes.data.length > 0) {
        const userInfo = userRes.data[0];
        // 处理头像路径
        if (userInfo.headimg) {
          const host = this.getHost();
          userInfo.avatarUrl = `${host}/${userInfo.headimg}`;
        }
        return userInfo;
      }

      // 4. 创建新用户
      // 注意：getUserProfile 需要用户主动触发，这里先返回 null
      // 实际使用时需要在用户点击按钮时调用
      return null;
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      });
      throw error;
    }
  }

  /**
   * 创建新用户
   * @param {string} openId - 用户 OpenID
   * @param {string} userName - 用户名
   * @returns {Promise<Object>} 用户信息
   */
  async createUser(openId, userName) {
    try {
      const addRes = await API.user.addUser({
        userName,
        userId: openId
      });
      
      if (addRes.success) {
        const userRes = await API.user.getUserInfo(openId);
        if (userRes.success && userRes.data && userRes.data.length > 0) {
          const userInfo = userRes.data[0];
          if (userInfo.headimg) {
            const host = this.getHost();
            userInfo.avatarUrl = `${host}/${userInfo.headimg}`;
          }
          return userInfo;
        }
      }
      
      throw new Error(addRes.message || '创建用户失败');
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户 ID
   * @returns {Promise<Object|null>} 用户信息或 null
   */
  async getUserInfo(userId) {
    try {
      const res = await API.user.getUserInfo(userId);
      if (res.success && res.data && res.data.length > 0) {
        const userInfo = res.data[0];
        if (userInfo.headimg) {
          const host = this.getHost();
          userInfo.avatarUrl = `${host}/${userInfo.headimg}`;
        }
        return userInfo;
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<Object>}
   */
  async updateUserInfo(userInfo) {
    try {
      const res = await API.user.updateUserInfo(userInfo);
      if (res.success) {
        // 更新本地用户信息
        const app = this.getApp();
        if (app && app.globalData) {
          app.globalData.userInfo = { ...app.globalData.userInfo, ...userInfo };
        }
      }
      return res;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 退出登录
   */
  async logout() {
    try {
      await wx.removeStorage({ key: 'openId' });
      const app = this.getApp();
      if (app && app.globalData) {
        app.globalData.userInfo = null;
      }
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  }
}

module.exports = new AuthService();

