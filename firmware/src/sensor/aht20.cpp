#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include "../network/mqtt.h"

static Adafruit_AHTX0 aht20;
static uint32_t ahtTimer = 0;
static bool ahtReady = false;

// 初始化 AHT20 温湿度传感器。
void AHT_Init()
{
    ahtReady = aht20.begin(&Wire);

    if (ahtReady)
        Serial.println("AHT20 OK");
    else
        Serial.println("AHT20 init failed");
}

// 周期性读取环境温湿度并上报到 OneNET。
void AHT_Task()
{
    if (!ahtReady)
        return;

    if (millis() - ahtTimer < 3000)
        return;

    ahtTimer = millis();

    sensors_event_t humidity;
    sensors_event_t temperature;

    aht20.getEvent(&humidity, &temperature);

    float envTemperature = temperature.temperature;
    float envHumidity = humidity.relative_humidity;

    if (isnan(envTemperature) || isnan(envHumidity))
    {
        Serial.println("[AHT20] Read invalid data");
        return;
    }

    Serial.printf("[AHT20] Temperature: %.1f C, Humidity: %.1f %%\n", envTemperature, envHumidity);
    MQTT_PostEnv(envTemperature, envHumidity);
}
