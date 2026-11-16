const PET_PROFILE_STORAGE_KEY = 'petProfileDraft';
const USER_LOGIN_STORAGE_KEY = 'petHealthLoginUser';

const defaultPetProfile = {
  name: 'Milo',
  type: '柯基犬',
  gender: '男',
  age: '3岁',
  weight: '11.5kg',
  avatar: '/img/pet.png'
};

Page({
  data: {
    //---------------宠物信息---------------
    petProfile: { ...defaultPetProfile }
  },

  onLoad() {
    this.loadPetProfile();
  },

  onShow() {
    this.loadPetProfile();
  },

  //---------------读取本地宠物资料---------------
  loadPetProfile() {
    const savedProfile = wx.getStorageSync(PET_PROFILE_STORAGE_KEY);

    if (!savedProfile) {
      this.setData({
        petProfile: { ...defaultPetProfile }
      });
      return;
    }

    this.setData({
      petProfile: {
        ...defaultPetProfile,
        ...savedProfile
      }
    });
  },

  //---------------表单输入同步---------------
  handleInputChange(event) {
    const { field } = event.currentTarget.dataset;
    const { value } = event.detail;

    this.setData({
      [`petProfile.${field}`]: value
    });
  },

  //---------------更换头像---------------
  changeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const oldAvatar = this.data.petProfile.avatar;

        wx.saveFile({
          tempFilePath,
          success: saveRes => {
            const petProfile = {
              ...defaultPetProfile,
              ...this.data.petProfile,
              avatar: saveRes.savedFilePath
            };

            if (oldAvatar && oldAvatar !== defaultPetProfile.avatar && oldAvatar !== saveRes.savedFilePath) {
              wx.removeSavedFile({
                filePath: oldAvatar,
                fail: () => {}
              });
            }

            wx.setStorageSync(PET_PROFILE_STORAGE_KEY, petProfile);
            this.setData({ petProfile });

            wx.showToast({
              title: '头像已更新',
              icon: 'success'
            });
          },
          fail: () => {
            wx.showToast({
              title: '头像保存失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  //---------------保存宠物资料---------------
  savePetProfile() {
    const petProfile = {
      ...defaultPetProfile,
      ...this.data.petProfile
    };

    wx.setStorageSync(PET_PROFILE_STORAGE_KEY, petProfile);
    this.setData({ petProfile });

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  //---------------恢复默认资料---------------
  resetPetProfile() {
    const currentAvatar = this.data.petProfile.avatar;

    if (currentAvatar && currentAvatar !== defaultPetProfile.avatar) {
      wx.removeSavedFile({
        filePath: currentAvatar,
        fail: () => {}
      });
    }

    const petProfile = { ...defaultPetProfile };
    wx.setStorageSync(PET_PROFILE_STORAGE_KEY, petProfile);
    this.setData({ petProfile });

    wx.showToast({
      title: '已恢复默认',
      icon: 'success'
    });
  },

  //---------------退出登录---------------
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后将返回微信授权登录页面，是否继续？',
      confirmText: '退出',
      success: res => {
        if (!res.confirm) {
          return;
        }

        wx.removeStorageSync(USER_LOGIN_STORAGE_KEY);
        wx.reLaunch({
          url: '/pages/login/login'
        });
      }
    });
  }
})
