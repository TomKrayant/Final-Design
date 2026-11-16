#include <Arduino.h>
#include <Wire.h>
#include "config/config.h"
#include "network/mqtt.h"
#include "sensor/mpu6050.h"
#include "sensor/max30102.h"
#include "sensor/mlx90614.h"
#include "sensor/atgm336h.h"
#include "sensor/aht20.h"
#include "network/mywifi.h"

// 初始化串口、I2C、网络和全部传感器。
void setup()
{
    Serial.begin(115200);
    Wire.begin(I2C_SDA, I2C_SCL);

    MYWIFI_Connect();
    MQTT_Connect();

    MPU_Init();
    MAX_Init();
    MLX_Init();
    GPS_Init();
    AHT_Init();
}

// 轮询网络与各个传感器任务。
void loop()
{
    MQTT_Loop();

    MPU_Task();
    MAX_Task();
    MLX_Task();
    GPS_Task();
    AHT_Task();
}
