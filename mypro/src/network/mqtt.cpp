#include <PubSubClient.h>
#include <WiFi.h>
#include <Arduino.h>
#include "../config/config.h"

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// 初始化并连接 MQTT 服务器。
void MQTT_Connect()
{
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);

    while (!mqttClient.connected())
    {
        Serial.print("MQTT Connecting...");

        if (mqttClient.connect(DEVICE_ID, PRODUCT_ID, MQTT_PASS))
        {
            Serial.println("success");
        }
        else
        {
            Serial.print("fail:");
            Serial.println(mqttClient.state());
            delay(3000);
        }
    }
}

// 维持 MQTT 连接并处理轮询。
void MQTT_Loop()
{
    if (!mqttClient.connected())
        MQTT_Connect();

    mqttClient.loop();
}

// 上报心率和血氧数据到 OneNET。
void MQTT_Post(int heart, int spo2)
{
    char json[128];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"Heart_rate\":{\"value\":%d},\"Blood_oxygen\":{\"value\":%d}}}",
             heart, spo2);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}

// 上报体温数据到 OneNET。
void MQTT_PostTemperature(float bodyTemperature)
{
    char json[128];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"Body_temperature\":{\"value\":%.1f}}}",
             bodyTemperature);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}

// 上报经纬度数据到 OneNET。
void MQTT_PostLocation(double latitude, double longitude)
{
    char json[160];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"latitude\":{\"value\":%.6f},\"longitude\":{\"value\":%.6f}}}",
             latitude, longitude);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}

// 上报 GPS 卫星数量到 OneNET。
void MQTT_PostGpsSatellites(int satellites)
{
    char json[128];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"gps_satellites\":{\"value\":%d}}}",
             satellites);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}

// 上报环境温湿度到 OneNET。
void MQTT_PostEnv(float envTemperature, float envHumidity)
{
    char json[160];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"env_temperature\":{\"value\":%.1f},\"env_humidity\":{\"value\":%.1f}}}",
             envTemperature, envHumidity);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}

// 上报宠物姿态状态到 OneNET，0=躺平，1=走动，2=跑动。
void MQTT_PostPetPosture(int petPosture)
{
    char json[128];

    snprintf(json,
             sizeof(json),
             "{\"id\":\"123\",\"params\":{\"pet_posture\":{\"value\":%d}}}",
             petPosture);

    mqttClient.publish(MQTT_TOPIC, json);

    Serial.println(json);
}



