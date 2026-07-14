#include <WiFi.h>
#include <Arduino.h>
#include "../config/config.h"

// 连接到配置好的 WiFi 网络。
void MYWIFI_Connect()
{
    Serial.printf("Connecting WiFi: %s\n", WIFI_SSID);

    WiFi.begin(WIFI_SSID, WIFI_PASS);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    Serial.println("\nWiFi Connected");
    Serial.println(WiFi.localIP());
}
