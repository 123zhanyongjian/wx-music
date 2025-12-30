// pages/myinfo/myinfo.js
const app = getApp();
const API = require('../../services/api');
const authService = require('../../utils/auth');
const errorHandler = require('../../utils/errorHandler');
const CONSTANTS = require('../../utils/constants');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    pageSize: CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE,
    addSongListFlag: false,
    userInfo: {
      username: "xxx",
      avatarUrl: "",
      gender: "男"
    },
    playlist: [],
    loading: false
  },
  //
  bindgetuserinfo(e){
    const userInfo  =e.detail.userInfo
    this.setData({
      ["userInfo.avatarUrl"]:userInfo.avatarUrl
    })
    // console.log(userInfo.avatarUrl)
  },
  newListBtn(){
  this.setData({
   addSongListFlag:true
  })

  },
  /**
   * 创建新歌单
   */
  async newSongList(e) {
    const datas = e.detail;
    if (!datas.title || !datas.title.trim()) {
      wx.showToast({
        title: '请输入歌单名称',
        icon: 'none'
      });
      return;
    }

    try {
      // 1. 上传封面图片
      const uploadRes = await API.upload.uploadFile(datas.image);
      if (!uploadRes.success) {
        return;
      }

      // 2. 创建歌单
      const res = await API.playlist.createPlaylist({
        userid: this.data.userInfo.userId,
        img: uploadRes.data,
        name: datas.title.trim()
      });

      if (res.success) {
        wx.showToast({
          title: res.message || '创建成功',
          icon: 'success'
        });
        this.setData({
          addSongListFlag: false
        });
        // 刷新列表
        await this.getList(1, this.data.pageSize);
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    }
  },
  close(){
    // console.log("???")
    this.setData({
      addSongListFlag:false
     })
  },
  /**
   * 选择头像
   */
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    
    // 先更新本地显示
    this.setData({
      ["userInfo.avatarUrl"]: avatarUrl
    });

    try {
      // 1. 上传头像
      const uploadRes = await API.upload.uploadFile(avatarUrl);
      if (!uploadRes.success) {
        // 恢复原头像
        this.setData({
          ["userInfo.avatarUrl"]: this.data.userInfo.avatarUrl
        });
        return;
      }

      // 2. 更新用户信息
      const res = await API.user.updateUserInfo({
        headimg: uploadRes.data,
        userId: this.data.userInfo.userId
      });

      if (res.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        // 更新全局用户信息
        if (app.globalData) {
          app.globalData.userInfo = { ...app.globalData.userInfo, headimg: uploadRes.data };
        }
      }
    } catch (error) {
      errorHandler.handleApiError(error);
      // 恢复原头像
      this.setData({
        ["userInfo.avatarUrl"]: this.data.userInfo.avatarUrl
      });
    }
  },
  change(e){
    const id = e.currentTarget?.dataset?.id
    wx.navigateTo({
      url: `../playlistInfo/playlistInfo?id=${id}`,
    })
  },
  /**
   * 修改昵称
   */
  async changeName(e) {
    const value = e.detail.value.trim();
    
    if (!value) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    const confirmed = await errorHandler.showConfirm({
      title: '昵称修改',
      content: '确认修改昵称吗？'
    });

    if (!confirmed) {
      // 取消，恢复原值
      this.setData({
        ['userInfo.userName']: app.globalData?.userInfo?.userName || this.data.userInfo.userName
      });
      return;
    }

    try {
      const res = await API.user.updateUserInfo({
        userName: value,
        userId: this.data.userInfo.userId
      });

      if (res.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        // 更新全局用户信息
        if (app.globalData) {
          app.globalData.userInfo = { ...app.globalData.userInfo, userName: value };
        }
      }
    } catch (error) {
      errorHandler.handleApiError(error);
      // 恢复原值
      this.setData({
        ['userInfo.userName']: app.globalData?.userInfo?.userName || this.data.userInfo.userName
      });
    }
  },
  /**
   * 获取歌单列表
   */
  async getList(page, pageSize) {
    if (page === 1) {
      this.setData({ playlist: [] });
    }

    this.setData({ loading: true });

    try {
      const res = await API.playlist.getPlaylistList(this.data.userInfo.userId);
      
      if (res.success) {
        const playlists = res.data.data.map(item => ({
          ...item,
          img: item.img ? `${app.host}/${item.img}` : ''
        }));

        this.setData({
          playlist: page === 1 ? playlists : this.data.playlist.concat(playlists),
          page: page,
          hasMore: playlists.length >= pageSize
        });
      }
    } catch (error) {
      errorHandler.handleApiError(error);
    } finally {
      this.setData({ loading: false });
    }
  },
  getdatas(){
    wx.getUserProfile({
      desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
      // console.log(res,5555555555555555555)
      },
      fail:err=>{

        // console.log(err)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 初始化用户信息
    const userInfo = app.globalData?.userInfo || app.data?.userInfo;
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        page: 1,
        pageSize: CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    // 检查并更新用户信息
    const userInfo = app.globalData?.userInfo || app.data?.userInfo;
    
    if (!userInfo || this.data.userInfo?.username === 'xxx') {
      // 尝试获取用户信息
      const openId = app.globalData?.openId || app.data?.openId;
      if (openId) {
        try {
          const res = await API.user.getUserInfo(openId);
          if (res.success && res.data && res.data.length > 0) {
            const userInfo = res.data[0];
            if (userInfo.headimg) {
              userInfo.avatarUrl = `${app.host}/${userInfo.headimg}`;
            }
            
            // 更新全局和本地用户信息
            if (app.globalData) {
              app.globalData.userInfo = userInfo;
            }
            app.data.userInfo = userInfo;
            
            this.setData({ userInfo });
            await this.getList(1, this.data.pageSize);
            return;
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      }
    }
    
    // 加载歌单列表
    if (this.data.userInfo?.userId) {
      await this.getList(1, this.data.pageSize);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    await this.getList(1, this.data.pageSize);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      await this.getList(this.data.page + 1, this.data.pageSize);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})