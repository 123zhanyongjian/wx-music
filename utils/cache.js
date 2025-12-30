/**
 * 缓存工具
 * 提供简单的缓存功能，支持过期时间
 */
class Cache {
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<*>}
   */
  async get(key) {
    try {
      const res = await wx.getStorage({ key: `cache_${key}` });
      const data = res.data;
      
      // 检查是否过期
      if (data.expire && data.expire < Date.now()) {
        // 已过期，删除缓存
        await wx.removeStorage({ key: `cache_${key}` });
        return null;
      }
      
      return data.value;
    } catch {
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} expire - 过期时间（毫秒），默认 1 小时
   * @returns {Promise<boolean>}
   */
  async set(key, value, expire = 3600000) {
    try {
      await wx.setStorage({
        key: `cache_${key}`,
        data: {
          value,
          expire: Date.now() + expire,
          createTime: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async remove(key) {
    try {
      await wx.removeStorage({ key: `cache_${key}` });
      return true;
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      // 获取所有存储的 key
      const info = await wx.getStorageInfo();
      const cacheKeys = info.keys.filter(key => key.startsWith('cache_'));
      
      // 删除所有缓存
      for (const key of cacheKeys) {
        await wx.removeStorage({ key });
      }
      
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>}
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * 获取缓存信息
   * @param {string} key - 缓存键
   * @returns {Promise<Object|null>}
   */
  async getInfo(key) {
    try {
      const res = await wx.getStorage({ key: `cache_${key}` });
      const data = res.data;
      
      return {
        key,
        value: data.value,
        expire: data.expire,
        createTime: data.createTime,
        isExpired: data.expire ? data.expire < Date.now() : false
      };
    } catch {
      return null;
    }
  }
}

module.exports = new Cache();

