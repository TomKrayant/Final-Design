// pages/home/home.js
Page({
  data: {
    //---------------宠物信息---------------
    petProfile: {
      name: 'Milo',
      type: '柯基犬',
      avatar: '/img/pet.png',
      status: '状态稳定'
    },
    //---------------卡片渲染数组------------
    metrics: [  
      {
        key: 'heartRate',
        label: '心率',
        value: '98',
        unit: 'BPM',
        icon: 'HR',
        desc: '当前心率平稳，可继续观察',
        ima: '/img/heart.png'
      },
      {
        key: 'bloodOxygen',
        label: '血氧',
        value: '97',
        unit: '%',
        icon: 'O2',
        desc: '血氧数据正常，状态良好',
        ima: '/img/o2.png'
      }
    ],
    //---------------概览---------------
    highlights: [
      {
        title: '宠物状态',
        value: '正常',
        tag: '实时',
        detail: '活力、呼吸与睡眠趋势暂无异常'
      },
      {
        title: '今日提醒',
        value: '2项',
        tag: '待处理',
        detail: '饮水记录与晚间散步可在这里继续扩展'
      }
    ],
    modules: [
      {
        title: '监测记录',
        detail: '后续可接入折线图、历史记录和异常预警'
      },
      {
        title: '设备连接',
        detail: '后续可接入蓝牙状态、电量和同步时间'
      }
    ]
  },
  //---------------获取onenet平台信息---------------
  getInfo(){
    //---------------微信发起http请求---------------
    wx.request({  
      url:"https://iot-api.heclouds.com/thingmodel/query-device-property?product_id=echjmLE9d5&device_name=my32",
      //用户鉴权信息（token）
      header:{  
        "authorization": "version=2018-10-31&res=products%2FechjmLE9d5%2Fdevices%2Fmy32&et=2057918578&method=md5&sign=DZoyKFuyYXzHpbWqwwLnbQ%3D%3D"
      },
      method: "GET",
      success: res =>{
         console.log("获取成功",res);
         this.setData({
          'metrics[0].value': res.data.data[4].value,
          'metrics[1].value': res.data.data[2].value
         });
      },
      fail: err => {
        console.error("请求失败", err);
      }

    })
  },
//---------------界面加载函数---------------
  onLoad(){
    this.getInfo();
    setInterval(() => {
      this.getInfo();
    }, 5000);
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
})
