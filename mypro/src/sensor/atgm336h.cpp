#include <Arduino.h>
#include <TinyGPSPlus.h>
#include "../config/config.h"
#include "../network/mqtt.h"

static TinyGPSPlus gps;
static HardwareSerial gpsSerial(1);
static uint32_t gpsReportTimer = 0;
static bool gpsReady = false;
static uint32_t gpsByteCount = 0;
static uint32_t gpsLastDataTime = 0;
static int gpsLastReportedSatellites = -1;

// 初始化 ATGM336H GPS 模块串口。
void GPS_Init()
{
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
    gpsReady = true;

    Serial.printf("ATGM336H OK (RX:%d TX:%d Baud:%d)\n", GPS_RX_PIN, GPS_TX_PIN, GPS_BAUD);
}

// 读取并解析 GPS 数据，在可定位时上报经纬度和卫星数。
void GPS_Task()
{
    if (!gpsReady)
        return;

    while (gpsSerial.available() > 0)
    {
        gps.encode(gpsSerial.read());
        gpsByteCount++;
        gpsLastDataTime = millis();
    }

    if (!gps.location.isValid())
    {
        if (millis() - gpsReportTimer >= 3000)
        {
            gpsReportTimer = millis();
            int satellites = gps.satellites.isValid() ? gps.satellites.value() : 0;

            Serial.printf("[ATGM336H] Waiting for valid GPS fix... bytes:%lu satellites:%lu hdop:%s lastData:%lums\n",
                          gpsByteCount,
                          satellites,
                          gps.hdop.isValid() ? String(gps.hdop.hdop(), 1).c_str() : "--",
                          gpsLastDataTime == 0 ? 0 : millis() - gpsLastDataTime);

            if (satellites != gpsLastReportedSatellites)
            {
                gpsLastReportedSatellites = satellites;
                MQTT_PostGpsSatellites(satellites);
            }
        }
        return;
    }

    if (millis() - gpsReportTimer < 3000)
        return;

    gpsReportTimer = millis();

    double latitude = gps.location.lat();
    double longitude = gps.location.lng();
    int satellites = gps.satellites.isValid() ? gps.satellites.value() : 0;

    Serial.printf("[ATGM336H] Latitude: %.6f, Longitude: %.6f, satellites:%lu hdop:%s\n",
                  latitude,
                  longitude,
                  satellites,
                  gps.hdop.isValid() ? String(gps.hdop.hdop(), 1).c_str() : "--");

    if (satellites != gpsLastReportedSatellites)
    {
        gpsLastReportedSatellites = satellites;
        MQTT_PostGpsSatellites(satellites);
    }

    MQTT_PostLocation(latitude, longitude);
}
