// pages/statis/statis.js
import * as echarts from '../../ec-canvas/echarts';

const DAILY_HEALTH_TREND_STORAGE_KEY = 'dailyHealthTrendRecords';
const FIVE_MINUTE_BUCKET_LABEL = '5分钟汇总';

const metricMetaMap = {
  heartRate: {
    title: '心率趋势',
    metric: '心率',
    unit: 'BPM',
    color: '#f26d6d',
    normalRangeText: '正常参考：80-130 BPM',
    normalMin: 80,
    normalMax: 130,
    anomalyText: '心率超出正常区间，建议结合活动状态继续观察。'
  },
  bloodOxygen: {
    title: '血氧趋势',
    metric: '血氧',
    unit: '%',
    color: '#4f9cf7',
    normalRangeText: '正常参考：95%-100%',
    normalMin: 95,
    normalMax: 100,
    anomalyText: '血氧低于正常参考值，建议关注呼吸与供氧状态。'
  },
  bodyTemperature: {
    title: '体温趋势',
    metric: '体温',
    unit: '°C',
    color: '#45b38a',
    normalRangeText: '正常参考：37.5°C-39.2°C',
    normalMin: 37.5,
    normalMax: 39.2,
    anomalyText: '体温超出正常区间，建议关注环境变化或发热情况。'
  }
};

const emptyDailyTrend = {
  date: '',
  trend: {
    heartRate: [],
    bloodOxygen: [],
    bodyTemperature: []
  },
  anomalies: []
};

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayLabel() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${month}月${day}日`;
}

//---------------获取默认图表点位---------------
function getDefaultChartPoint(metricKey) {
  if (metricKey === 'heartRate') {
    return { time: '暂无', value: 98, isAnomaly: false, detail: '等待主页采集今日心率数据。' };
  }

  if (metricKey === 'bloodOxygen') {
    return { time: '暂无', value: 97, isAnomaly: false, detail: '等待主页采集今日血氧数据。' };
  }

  return { time: '暂无', value: 38.3, isAnomaly: false, detail: '等待主页采集今日体温数据。' };
}

function getDefaultDailyTrend() {
  const todayKey = getTodayKey();

  return {
    ...emptyDailyTrend,
    date: todayKey
  };
}

//---------------读取当天统计缓存---------------
function getSavedDailyTrend() {
  const todayKey = getTodayKey();
  const savedData = wx.getStorageSync(DAILY_HEALTH_TREND_STORAGE_KEY);

  if (!savedData || savedData.date !== todayKey) {
    const nextData = getDefaultDailyTrend();
    wx.setStorageSync(DAILY_HEALTH_TREND_STORAGE_KEY, nextData);
    return nextData;
  }

  return {
    ...getDefaultDailyTrend(),
    ...savedData,
    trend: {
      ...emptyDailyTrend.trend,
      ...(savedData.trend || {})
    }
  };
}

//---------------判断点位是否异常---------------
function isPointAnomaly(point) {
  return !!(point && (point.isAnomaly || point.isAbnormal));
}

//---------------生成折线图序列数据---------------
function buildSeriesData(metricKey, trendItems) {
  const meta = metricMetaMap[metricKey];

  return trendItems.map(item => ({
    value: item.value,
    detail: item.detail || `${item.time} ${meta.metric}处于正常范围。`,
    isAnomaly: isPointAnomaly(item),
    symbol: isPointAnomaly(item) ? 'diamond' : 'circle',
    itemStyle: isPointAnomaly(item)
      ? {
          color: '#ff8a5b',
          borderColor: '#ffffff',
          borderWidth: 4,
          shadowColor: 'rgba(255, 138, 91, 0.45)',
          shadowBlur: 10
        }
      : {
          color: meta.color
        },
    symbolSize: isPointAnomaly(item) ? 16 : 8,
    z: isPointAnomaly(item) ? 6 : 3
  }));
}

//---------------生成图表配置项---------------
function buildChartOption(metricKey, trendItems) {
  const meta = metricMetaMap[metricKey];
  const safeItems = trendItems.length ? trendItems : [getDefaultChartPoint(metricKey)];

  return {
    color: [meta.color],
    grid: {
      left: 20,
      right: 20,
      top: 30,
      bottom: 20,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(24, 47, 44, 0.9)',
      borderWidth: 0,
      textStyle: {
        color: '#ffffff',
        fontSize: 12
      },
      formatter(params) {
        const point = params[0];
        const pointData = point.data || {};
        const statusText = pointData.isAnomaly ? '异常点' : '正常';
        return `${point.axisValue}<br/>${meta.title}: ${point.value}${meta.unit}<br/>状态：${statusText}`;
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: safeItems.map(item => item.time),
      axisLine: {
        lineStyle: {
          color: '#b8c8c5'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#6f817d',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#e8efed',
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#6f817d',
        fontSize: 11
      }
    },
    series: [
      {
        name: meta.title,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        showSymbol: true,
        lineStyle: {
          width: 3,
          color: meta.color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${meta.color}55` },
              { offset: 1, color: `${meta.color}08` }
            ]
          }
        },
        data: buildSeriesData(metricKey, safeItems),
        markPoint: {
          symbol: 'pin',
          symbolSize: 34,
          label: {
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold'
          },
          itemStyle: {
            color: '#ff8a5b'
          },
          data: safeItems
            .filter(item => isPointAnomaly(item))
            .map(item => ({
              coord: [item.time, item.value],
              value: '异常'
            }))
        }
      }
    ]
  };
}

//---------------生成点位详情数据---------------
function createDetail(metricTitle, time, value, unit, isAnomaly, detail) {
  return {
    metricTitle,
    time,
    value: `${value} ${unit}`,
    status: isAnomaly ? '异常' : '正常',
    statusClass: isAnomaly ? 'detail-tag-warning' : 'detail-tag-normal',
    detail
  };
}

//---------------根据点位生成默认详情---------------
function createDetailFromPoint(metricKey, point) {
  const meta = metricMetaMap[metricKey];
  const targetPoint = point || getDefaultChartPoint(metricKey);
  return createDetail(
    meta.title,
    targetPoint.time,
    targetPoint.value,
    meta.unit,
    isPointAnomaly(targetPoint),
    targetPoint.detail
  );
}

Page({
  data: {
    //---------------图表组件配置---------------
    heartRateEc: {
      onInit: null
    },
    bloodOxygenEc: {
      onInit: null
    },
    bodyTemperatureEc: {
      onInit: null
    },
    //---------------顶部统计卡片---------------
    statCards: [
      { title: '异常记录', value: '0次', desc: '当天监测异常将自动汇总到下方列表' },
      { title: '汇总粒度', value: FIVE_MINUTE_BUCKET_LABEL, desc: '主页实时采集，统计页按5分钟汇总展示' },
      { title: '统计范围', value: '仅当天', desc: '次日自动清空并重新统计' }
    ],
    //---------------图表说明卡片---------------
    chartCards: [
      {
        title: '心率趋势',
        desc: '展示当天心率按5分钟汇总后的趋势变化',
        range: metricMetaMap.heartRate.normalRangeText
      },
      {
        title: '血氧趋势',
        desc: '展示当天血氧按5分钟汇总后的趋势变化',
        range: metricMetaMap.bloodOxygen.normalRangeText
      },
      {
        title: '体温趋势',
        desc: '展示当天体温按5分钟汇总后的趋势变化',
        range: metricMetaMap.bodyTemperature.normalRangeText
      }
    ],
    recordDateLabel: getTodayLabel(),
    //---------------图表点位详情---------------
    heartRateDetail: createDetailFromPoint('heartRate'),
    bloodOxygenDetail: createDetailFromPoint('bloodOxygen'),
    bodyTemperatureDetail: createDetailFromPoint('bodyTemperature'),
    //---------------当日异常记录---------------
    anomalyRecords: []
  },

  //---------------页面初始加载---------------
  onLoad() {
    this.setData({
      heartRateEc: {
        onInit: this.createChartInit('heartRate', 'heartRateDetail', 'heartRateChart')
      },
      bloodOxygenEc: {
        onInit: this.createChartInit('bloodOxygen', 'bloodOxygenDetail', 'bloodOxygenChart')
      },
      bodyTemperatureEc: {
        onInit: this.createChartInit('bodyTemperature', 'bodyTemperatureDetail', 'bodyTemperatureChart')
      }
    });

    this.syncDailyTrendData();
  },

  //---------------页面显示时刷新数据---------------
  onShow() {
    this.syncDailyTrendData();
    this.refreshCharts();
  },

  //---------------同步当天统计与异常记录---------------
  syncDailyTrendData() {
    const savedDailyTrend = getSavedDailyTrend();
    this.dailyTrendData = savedDailyTrend;

    const heartRateTrend = savedDailyTrend.trend.heartRate || [];
    const bloodOxygenTrend = savedDailyTrend.trend.bloodOxygen || [];
    const bodyTemperatureTrend = savedDailyTrend.trend.bodyTemperature || [];
    const anomalyRecords = savedDailyTrend.anomalies || [];
    const totalPoints = Math.max(
      heartRateTrend.length,
      bloodOxygenTrend.length,
      bodyTemperatureTrend.length
    );

    this.setData({
      recordDateLabel: getTodayLabel(),
      anomalyRecords,
      statCards: [
        {
          title: '异常记录',
          value: `${anomalyRecords.length}次`,
          desc: anomalyRecords.length ? '已记录当天全部异常点位信息' : '当前还没有检测到异常点位'
        },
        {
          title: '汇总粒度',
          value: FIVE_MINUTE_BUCKET_LABEL,
          desc: totalPoints ? `当前已生成 ${totalPoints} 个时间点` : '等待主页写入实时监测数据'
        },
        {
          title: '统计范围',
          value: '仅当天',
          desc: '次日自动清空并重新统计'
        }
      ],
      heartRateDetail: createDetailFromPoint('heartRate', heartRateTrend[heartRateTrend.length - 1]),
      bloodOxygenDetail: createDetailFromPoint('bloodOxygen', bloodOxygenTrend[bloodOxygenTrend.length - 1]),
      bodyTemperatureDetail: createDetailFromPoint('bodyTemperature', bodyTemperatureTrend[bodyTemperatureTrend.length - 1])
    });
  },

  //---------------刷新三张趋势图---------------
  refreshCharts() {
    if (!this.dailyTrendData) {
      return;
    }

    if (this.heartRateChart) {
      this.heartRateChart.setOption(
        buildChartOption('heartRate', this.dailyTrendData.trend.heartRate || []),
        true
      );
    }

    if (this.bloodOxygenChart) {
      this.bloodOxygenChart.setOption(
        buildChartOption('bloodOxygen', this.dailyTrendData.trend.bloodOxygen || []),
        true
      );
    }

    if (this.bodyTemperatureChart) {
      this.bodyTemperatureChart.setOption(
        buildChartOption('bodyTemperature', this.dailyTrendData.trend.bodyTemperature || []),
        true
      );
    }
  },

  //---------------创建图表初始化函数---------------
  createChartInit(metricKey, detailKey, chartField) {
    return (canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width,
        height,
        devicePixelRatio: dpr
      });

      canvas.setChart(chart);
      this[chartField] = chart;

      const currentTrend = (this.dailyTrendData && this.dailyTrendData.trend[metricKey]) || [];
      chart.setOption(buildChartOption(metricKey, currentTrend));

      chart.off('click');
      chart.on('click', params => {
        const meta = metricMetaMap[metricKey];
        const latestTrend = (this.dailyTrendData && this.dailyTrendData.trend[metricKey]) || [];
        let sourcePoint = latestTrend[params.dataIndex] || null;

        if (!sourcePoint && params.componentType === 'markPoint' && params.data && params.data.coord) {
          const pointTime = params.data.coord[0];
          sourcePoint = latestTrend.find(item => item.time === pointTime) || null;
        }

        if (!sourcePoint && params.name) {
          sourcePoint = latestTrend.find(item => item.time === params.name) || null;
        }

        if (!sourcePoint) {
          sourcePoint = getDefaultChartPoint(metricKey);
        }

        const detailData = createDetail(
          meta.title,
          sourcePoint.time,
          sourcePoint.value,
          meta.unit,
          isPointAnomaly(sourcePoint),
          sourcePoint.detail
        );

        this.setData({
          [detailKey]: detailData
        });

        wx.showToast({
          title: '已更新当前图表详情',
          icon: 'none'
        });
      });

      return chart;
    };
  }
});
