const PET_PROFILE_STORAGE_KEY = 'petProfileDraft';
const DAILY_HEALTH_TREND_STORAGE_KEY = 'dailyHealthTrendRecords';
const TREND_BUCKET_MINUTES = 5;

const defaultPetProfile = {
  name: 'Milo',
  type: '柯基犬',
  gender: '公',
  age: '3岁',
  weight: '11.5kg',
  avatar: '/img/pet.png',
  status: '状态稳定'
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBucketTimeLabel(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = Math.floor(date.getMinutes() / TREND_BUCKET_MINUTES) * TREND_BUCKET_MINUTES;
  return `${hours}:${`${minutes}`.padStart(2, '0')}`;
}

function createEmptyDailyTrend() {
  return {
    date: getTodayKey(),
    trend: {
      heartRate: [],
      bloodOxygen: [],
      bodyTemperature: []
    },
    anomalies: []
  };
}

function isMetricAbnormal(metricKey, value) {
  if (metricKey === 'heartRate') {
    return value < 80 || value > 130;
  }

  if (metricKey === 'bloodOxygen') {
    return value < 95 || value > 100;
  }

  return value < 37.5 || value > 39.2;
}

function getMetricRecordMeta(metricKey) {
  if (metricKey === 'heartRate') {
    return {
      metric: '心率',
      unit: 'BPM',
      detail: '心率超出正常区间，建议结合活动状态继续观察。'
    };
  }

  if (metricKey === 'bloodOxygen') {
    return {
      metric: '血氧',
      unit: '%',
      detail: '血氧低于正常参考值，建议关注呼吸与供氧状态。'
    };
  }

  return {
    metric: '体温',
    unit: '°C',
    detail: '体温超出正常区间，建议关注环境变化或发热情况。'
  };
}

function getPropertyValue(dataList, identifiers = []) {
  const targetItem = (dataList || []).find(item => identifiers.includes(item.identifier));
  return targetItem ? targetItem.value : '';
}

function getPostureCards(activeValue) {
  return [
    {
      key: '0',
      label: '躺平',
      desc: '当前处于静止休息状态',
      icon: '/img/sit.png',
      active: activeValue === '0'
    },
    {
      key: '1',
      label: '走动',
      desc: '当前处于日常活动状态',
      icon: '/img/walk.png',
      active: activeValue === '1'
    },
    {
      key: '2',
      label: '跑动',
      desc: '当前处于快速运动状态',
      icon: '/img/run.png',
      active: activeValue === '2'
    }
  ];
}

// pages/home/home.js
Page({
  data: {
    //---------------宠物信息---------------
    petProfile: {
      ...defaultPetProfile
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
      },
      {
        key: 'bodyTemperature',
        label: '体温',
        value: '37.1',
        unit: '°C',
        icon: 'BT',
        desc: '体温数据正常，状态良好',
        ima: '/img/bt.png'
      },
      {
        key: 'environment',
        label: '环境温湿度',
        icon: 'EN',
        desc: '同步显示当前环境温度与湿度信息',
        ima: '/img/th.png',
        isDual: true,
        primaryLabel: '温度',
        primaryValue: '26.5',
        primaryUnit: '°C',
        secondaryLabel: '湿度',
        secondaryValue: '58',
        secondaryUnit: '%'
      }
    ],
    //---------------宠物姿态---------------
    postureInfo: {
      title: '当前姿态',
      value: '走动',
      tag: '实时',
      detail: '宠物正在进行日常活动，可结合心率与位置信息继续观察。',
      cards: getPostureCards('1')
    },
    //---------------位置信息---------------
    locationInfo: {
      detail: '当前为地图测试框架，后续接入 ATGM336H 输出的经纬度数据。',
      latitude: 23.1291,
      longitude: 113.2644,
      scale: 14,
      markers: [
        {
          id: 1,
          latitude: 23.1291,
          longitude: 113.2644,
          width: 28,
          height: 36
        }
      ]
    }
  },
  //---------------读取本地宠物资料---------------
  syncPetProfile() {
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
  //---------------根据实时数值生成卡片描述---------------
  getMetricDesc(metricKey, valueObject) {
    if (metricKey === 'heartRate') {
      const heartRate = Number(valueObject.value);

      if (Number.isNaN(heartRate)) {
        return '等待心率数据同步，稍后可查看最新状态';
      }

      if (heartRate < 80) {
        return '当前心率偏低，建议观察宠物精神状态与活动表现';
      }

      if (heartRate > 130) {
        return '当前心率偏高，可能与活动量增加或情绪波动有关';
      }

      return '当前心率平稳，可继续观察';
    }

    if (metricKey === 'bloodOxygen') {
      const bloodOxygen = Number(valueObject.value);

      if (Number.isNaN(bloodOxygen)) {
        return '等待血氧数据同步，稍后可查看最新状态';
      }

      if (bloodOxygen < 95) {
        return '血氧偏低，建议结合呼吸状态继续关注变化';
      }

      return '血氧数据正常，状态良好';
    }

    if (metricKey === 'bodyTemperature') {
      const bodyTemperature = Number(valueObject.value);

      if (Number.isNaN(bodyTemperature)) {
        return '等待体温数据同步，稍后可查看最新状态';
      }

      if (bodyTemperature < 37.5) {
        return '体温略低，建议关注环境温度与宠物保暖情况';
      }

      if (bodyTemperature > 39.2) {
        return '体温偏高，建议继续观察是否存在发热或剧烈运动';
      }

      return '体温数据正常，状态良好';
    }

    if (metricKey === 'environment') {
      const temperature = Number(valueObject.primaryValue);
      const humidity = Number(valueObject.secondaryValue);

      if (Number.isNaN(temperature) || Number.isNaN(humidity)) {
        return '等待环境温湿度数据同步，稍后可查看最新状态';
      }

      if (temperature > 30 || humidity > 75) {
        return '当前环境偏闷热，建议注意通风并补充饮水';
      }

      if (temperature < 18 || humidity < 30) {
        return '当前环境偏冷或偏干，建议关注宠物保暖与舒适度';
      }

      return '当前环境温湿度平稳，适合持续监测';
    }

    return '当前数据已同步，可继续观察变化';
  },
  //---------------根据姿态值生成展示信息---------------
  getPostureInfo(postureValue) {
    const posture = `${postureValue}`;

    if (posture === '0') {
      return {
        title: '当前姿态',
        value: '躺平',
        tag: '休息中',
        detail: '宠物当前处于躺平休息状态，可继续观察生命体征是否平稳。',
        cards: getPostureCards('0')
      };
    }

    if (posture === '2') {
      return {
        title: '当前姿态',
        value: '跑动',
        tag: '活跃中',
        detail: '宠物当前处于快速运动状态，建议结合心率变化综合判断活动强度。',
        cards: getPostureCards('2')
      };
    }

    return {
      title: '当前姿态',
      value: '走动',
      tag: '实时',
      detail: '宠物当前处于日常走动状态，可结合定位信息继续观察活动范围。',
      cards: getPostureCards('1')
    };
  },
  //---------------同步当天统计数据---------------
  syncDailyTrend(heartRate, bloodOxygen, bodyTemperature) {
    const todayKey = getTodayKey();
    const bucketTime = getBucketTimeLabel();
    const savedTrend = wx.getStorageSync(DAILY_HEALTH_TREND_STORAGE_KEY);
    const dailyTrend = !savedTrend || savedTrend.date !== todayKey
      ? createEmptyDailyTrend()
      : savedTrend;

    const metricValues = {
      heartRate,
      bloodOxygen,
      bodyTemperature
    };

    Object.keys(metricValues).forEach(metricKey => {
      const numericValue = Number(metricValues[metricKey]);

      if (Number.isNaN(numericValue)) {
        return;
      }

      const metricTrend = dailyTrend.trend[metricKey] || [];
      const bucketIndex = metricTrend.findIndex(item => item.time === bucketTime);
      const abnormal = isMetricAbnormal(metricKey, numericValue);
      const metricMeta = getMetricRecordMeta(metricKey);

      if (bucketIndex > -1) {
        const currentBucket = metricTrend[bucketIndex];
        const currentCount = currentBucket.sampleCount || 1;
        const sampleCount = currentCount + 1;
        const averageValue = Number(
          ((currentBucket.value * currentCount + numericValue) / sampleCount).toFixed(1)
        );

        metricTrend[bucketIndex] = {
          ...currentBucket,
          value: averageValue,
          sampleCount,
          isAbnormal: currentBucket.isAbnormal || abnormal,
          detail: abnormal
            ? `${bucketTime} ${metricMeta.detail}`
            : `${bucketTime} ${metricMeta.metric}处于正常范围。`
        };
      } else {
        metricTrend.push({
          time: bucketTime,
          value: Number(numericValue.toFixed(1)),
          sampleCount: 1,
          isAbnormal: abnormal,
          detail: abnormal
            ? `${bucketTime} ${metricMeta.detail}`
            : `${bucketTime} ${metricMeta.metric}处于正常范围。`
        });
      }

      dailyTrend.trend[metricKey] = metricTrend.slice(-24);

      if (abnormal) {
        const anomalyId = `${todayKey}-${metricKey}-${bucketTime}`;
        const exists = dailyTrend.anomalies.some(item => item.id === anomalyId);

        if (!exists) {
          dailyTrend.anomalies.unshift({
            id: anomalyId,
            metric: metricMeta.metric,
            time: `今天 ${bucketTime}`,
            value: `${numericValue} ${metricMeta.unit}`,
            level: '异常',
            detail: metricMeta.detail
          });
        }
      }
    });

    dailyTrend.anomalies = dailyTrend.anomalies.slice(0, 30);
    wx.setStorageSync(DAILY_HEALTH_TREND_STORAGE_KEY, dailyTrend);
  },
  //---------------获取onenet平台信息---------------
  getInfo() {
    //---------------微信发起http请求---------------
    wx.request({
      url: 'https://iot-api.heclouds.com/thingmodel/query-device-property?product_id=echjmLE9d5&device_name=my32',
      //用户鉴权信息（token）
      header: {
        authorization: 'version=2018-10-31&res=products%2FechjmLE9d5%2Fdevices%2Fmy32&et=2057918578&method=md5&sign=DZoyKFuyYXzHpbWqwwLnbQ%3D%3D'
      },
      method: 'GET',
      success: res => {
        console.log('获取成功', res);
        const dataList = res.data.data || [];
        const heartRateValue = Number(res.data.data[3].value);
        const bloodOxygenValue = Number(res.data.data[1].value);
        const bodyTemperatureValue = Number(res.data.data[2].value);
        const ambientTemperatureValue = getPropertyValue(dataList, [
          'env_temperature',
          'Ambient_temperature',
          'Environment_temperature',
          'Temperature',
          'temperature'
        ]);
        const ambientHumidityValue = getPropertyValue(dataList, [
          'env_humidity',
          'Ambient_humidity',
          'Environment_humidity',
          'Humidity',
          'humidity'
        ]);
        const petPostureValue = getPropertyValue(dataList, ['pet_posture']);
        const postureInfo = this.getPostureInfo(petPostureValue || '1');
        const heartRateDesc = this.getMetricDesc('heartRate', {
          value: res.data.data[3].value
        });
        const bloodOxygenDesc = this.getMetricDesc('bloodOxygen', {
          value: res.data.data[1].value
        });
        const bodyTemperatureDesc = this.getMetricDesc('bodyTemperature', {
          value: res.data.data[2].value
        });
        const environmentDesc = this.getMetricDesc('environment', {
          primaryValue: ambientTemperatureValue || this.data.metrics[3].primaryValue,
          secondaryValue: ambientHumidityValue || this.data.metrics[3].secondaryValue
        });

        this.setData({
          'metrics[0].value': res.data.data[3].value,
          'metrics[0].desc': heartRateDesc,
          'metrics[1].value': res.data.data[1].value,
          'metrics[1].desc': bloodOxygenDesc,
          'metrics[2].value': res.data.data[2].value,
          'metrics[2].desc': bodyTemperatureDesc,
          'metrics[3].primaryValue': ambientTemperatureValue || this.data.metrics[3].primaryValue,
          'metrics[3].secondaryValue': ambientHumidityValue || this.data.metrics[3].secondaryValue,
          'metrics[3].desc': environmentDesc,
          postureInfo,
          'locationInfo.latitude': Number(res.data.data[9].value),
          'locationInfo.longitude': Number(res.data.data[10].value),
          'locationInfo.markers': [
            {
              id: 1,
              latitude: Number(res.data.data[9].value),
              longitude: Number(res.data.data[10].value),
              width: 28,
              height: 36
            }
          ],
          'locationInfo.detail': `最新定位：${res.data.data[9].value}, ${res.data.data[10].value}  卫星数：${res.data.data[8].value}`
        });

        this.syncDailyTrend(heartRateValue, bloodOxygenValue, bodyTemperatureValue);
      },
      fail: err => {
        console.error('请求失败', err);
      }
    });
  },
  //---------------界面加载函数---------------
  onLoad() {
    this.syncPetProfile();
    this.getInfo();
    this.timer = setInterval(() => {
      this.getInfo();
    }, 5000);
  },

  onShow() {
    this.syncPetProfile();
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
});
