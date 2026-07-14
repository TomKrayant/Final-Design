const USER_LOGIN_STORAGE_KEY = 'petHealthLoginUser';

// pages/login/login.js
Page({
  data: {
    //---------------登录用户信息---------------
    loginUser: null,
    //---------------登录状态---------------
    loading: false
  },

  //---------------页面显示时检查登录状态---------------
  onShow() {
    this.checkLoginStatus();
  },

  //---------------读取本地登录状态---------------
  checkLoginStatus() {
    const loginUser = wx.getStorageSync(USER_LOGIN_STORAGE_KEY);

    if (loginUser && loginUser.isLogin) {
      wx.switchTab({
        url: '/pages/home/home'
      });
    }
  },

  //---------------微信授权登录---------------
  handleWechatLogin() {
    if (this.data.loading) {
      return;
    }

    this.setData({
      loading: true
    });

    wx.getUserProfile({
      desc: '用于完善登录用户信息',
      success: profileRes => {
        wx.login({
          success: loginRes => {
            const loginUser = {
              isLogin: true,
              nickName: profileRes.userInfo.nickName,
              avatarUrl: profileRes.userInfo.avatarUrl,
              gender: profileRes.userInfo.gender,
              province: profileRes.userInfo.province,
              city: profileRes.userInfo.city,
              loginCode: loginRes.code,
              loginTime: Date.now()
            };

            wx.setStorageSync(USER_LOGIN_STORAGE_KEY, loginUser);
            this.setData({
              loginUser,
              loading: false
            });

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });

            setTimeout(() => {
              wx.switchTab({
                url: '/pages/home/home'
              });
            }, 500);
          },
          fail: () => {
            this.setData({
              loading: false
            });

            wx.showToast({
              title: '微信登录失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        this.setData({
          loading: false
        });

        wx.showToast({
          title: '你已取消授权登录',
          icon: 'none'
        });
      }
    });
  }
});
