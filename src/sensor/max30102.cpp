#include <Arduino.h>
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "../network/mqtt.h"

#define MAX_BUF 100

MAX30105 max30102;

uint32_t irBuffer[MAX_BUF];
uint32_t redBuffer[MAX_BUF];

int32_t spo2;
int32_t heartRate;
int8_t validSPO2;
int8_t validHeartRate;

uint8_t maxCount = 0;

// 初始化 MAX30102 传感器并配置采样参数。
void MAX_Init()
{
    if (max30102.begin(Wire))
    {
        max30102.setup(60, 4, 2, 100, 411, 4096);
        Serial.println("MAX30102 OK");
    }
}

// 读取 MAX30102 数据并在结果有效时上报心率和血氧。
void MAX_Task()
{
    max30102.check();

    if (!max30102.available())
        return;

    redBuffer[maxCount] = max30102.getFIFORed();
    irBuffer[maxCount] = max30102.getFIFOIR();

    max30102.nextSample();

    maxCount++;

    if (maxCount < MAX_BUF)
        return;

    maxim_heart_rate_and_oxygen_saturation(
        irBuffer,
        MAX_BUF,
        redBuffer,
        &spo2,
        &validSPO2,
        &heartRate,
        &validHeartRate
    );

    Serial.printf(
        "[MAX30102] Heart:%s bpm  SpO2:%s %%\n",
        validHeartRate ? String(heartRate).c_str() : "--",
        validSPO2 ? String((int)spo2).c_str() : "--"
    );

    if (validHeartRate && validSPO2)
        MQTT_Post(heartRate, spo2);

    maxCount = 0;
}
