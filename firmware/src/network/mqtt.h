#pragma once

void MQTT_Connect();
void MQTT_Post(int heart, int spo2);
void MQTT_PostTemperature(float bodyTemperature);
void MQTT_PostLocation(double latitude, double longitude);
void MQTT_PostGpsSatellites(int satellites);
void MQTT_PostEnv(float envTemperature, float envHumidity);
void MQTT_PostPetPosture(int petPosture);
void MQTT_Loop();

