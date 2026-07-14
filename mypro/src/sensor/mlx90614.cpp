#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include "../network/mqtt.h"

static Adafruit_MLX90614 mlx90614 = Adafruit_MLX90614();
static uint32_t mlxTimer = 0;
static bool mlxReady = false;

// 初始化 MLX90614 红外测温传感器。
void MLX_Init()
{
    mlxReady = mlx90614.begin();

    if (mlxReady)
        Serial.println("MLX90614 OK");
    else
        Serial.println("MLX90614 init failed");
}

// 周期性读取体温并在数据有效时上报到 OneNET。
void MLX_Task()
{
    if (!mlxReady)
        return;

    if (millis() - mlxTimer < 2000)
        return;

    mlxTimer = millis();

    float bodyTemp = mlx90614.readObjectTempC();

    if (isnan(bodyTemp) || bodyTemp < 20.0f || bodyTemp > 50.0f)
    {
        Serial.printf("[MLX90614] Body temperature read invalid: %.1f C\n", bodyTemp);
        return;
    }

    Serial.printf("[MLX90614] Body temperature: %.1f C\n", bodyTemp);
    MQTT_PostTemperature(bodyTemp);
}
