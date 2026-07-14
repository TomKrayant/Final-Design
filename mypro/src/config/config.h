#pragma once

/* I2C */

#define I2C_SDA 8
#define I2C_SCL 9

/* GPS */

#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define GPS_BAUD 9600

/* WIFI */

#define WIFI_SSID "TomKrayant"
#define WIFI_PASS "2244466666"

/* MQTT */

#define MQTT_SERVER "mqtts.heclouds.com"
#define MQTT_PORT 1883

#define PRODUCT_ID "echjmLE9d5"
#define DEVICE_ID "my32"

#define MQTT_PASS "version=2018-10-31&res=products%2FechjmLE9d5%2Fdevices%2Fmy32&et=2057918578&method=md5&sign=DZoyKFuyYXzHpbWqwwLnbQ%3D%3D"

#define MQTT_TOPIC "$sys/echjmLE9d5/my32/thing/property/post"
