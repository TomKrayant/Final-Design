#include <Wire.h>
#include <Arduino.h>
#include <math.h>
#include "../network/mqtt.h"

#define MPU_ADDR 0x68
#define PWR_MGMT_1 0x6B
#define ACCEL_XOUT 0x3B
#define PET_POSTURE_LYING 0
#define PET_POSTURE_WALKING 1
#define PET_POSTURE_RUNNING 2

static uint32_t mpuTimer = 0;
static uint32_t mpuPostureTimer = 0;
static uint32_t mpuPrintTimer = 0;
static float gravityMag = 9.81f;
static int petPosture = PET_POSTURE_LYING;
static int postureCandidate = PET_POSTURE_LYING;
static uint8_t postureStableCount = 0;

// 计算三轴向量的模长。
static float VectorNorm(float x, float y, float z)
{
    return sqrtf(x * x + y * y + z * z);
}

// 根据加速度变化、角速度强度和安装朝向估算宠物姿态。
static int DetectPetPosture(float ax, float ay, float az, float gx, float gy, float gz)
{
    float accelMag = VectorNorm(ax, ay, az);
    gravityMag = gravityMag * 0.90f + accelMag * 0.10f;

    float dynamicAccel = fabsf(accelMag - gravityMag);
    float gyroMag = VectorNorm(gx, gy, gz);
    float zRatio = fabsf(az) / (accelMag + 0.01f);

    if (dynamicAccel < 0.45f && gyroMag < 18.0f && zRatio > 0.82f)
        return PET_POSTURE_LYING;

    if (dynamicAccel > 2.20f || gyroMag > 120.0f)
        return PET_POSTURE_RUNNING;

    return PET_POSTURE_WALKING;
}

// 使用连续多次一致判定更新稳定姿态，减少跳变。
static int UpdatePostureState(int detectedPosture)
{
    if (detectedPosture == postureCandidate)
    {
        if (postureStableCount < 3)
            postureStableCount++;
    }
    else
    {
        postureCandidate = detectedPosture;
        postureStableCount = 1;
    }

    if (postureStableCount >= 3)
        petPosture = postureCandidate;

    return petPosture;
}

// 初始化 MPU6050 并唤醒芯片。
void MPU_Init()
{
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(PWR_MGMT_1);
    Wire.write(0);
    Wire.endTransmission();

    Serial.println("MPU6050 OK");
}

// 读取 MPU6050 数据并判断宠物姿态后周期性上传。
void MPU_Task()
{
    if (millis() - mpuTimer < 100)
        return;

    mpuTimer = millis();

    int16_t accel[3];
    int16_t gyro[3];
    int16_t tempRaw;

    Wire.beginTransmission(MPU_ADDR);
    Wire.write(ACCEL_XOUT);
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 14);

    if (Wire.available() < 14)
        return;

    accel[0] = (Wire.read() << 8) | Wire.read();
    accel[1] = (Wire.read() << 8) | Wire.read();
    accel[2] = (Wire.read() << 8) | Wire.read();

    tempRaw = (Wire.read() << 8) | Wire.read();

    gyro[0] = (Wire.read() << 8) | Wire.read();
    gyro[1] = (Wire.read() << 8) | Wire.read();
    gyro[2] = (Wire.read() << 8) | Wire.read();

    float ax = accel[0] / 8192.0f * 9.81f;
    float ay = accel[1] / 8192.0f * 9.81f;
    float az = accel[2] / 8192.0f * 9.81f;

    float gx = gyro[0] / 65.5f;
    float gy = gyro[1] / 65.5f;
    float gz = gyro[2] / 65.5f;

    float tempC = tempRaw / 340.0f + 36.53f;
    int detectedPosture = DetectPetPosture(ax, ay, az, gx, gy, gz);
    int currentPosture = UpdatePostureState(detectedPosture);

    if (millis() - mpuPrintTimer >= 1000)
    {
        mpuPrintTimer = millis();
        Serial.printf("[MPU] Posture:%d Temp:%.1fC\n", currentPosture, tempC);
    }

    if (millis() - mpuPostureTimer < 2000)
        return;

    mpuPostureTimer = millis();
    MQTT_PostPetPosture(currentPosture);
}
