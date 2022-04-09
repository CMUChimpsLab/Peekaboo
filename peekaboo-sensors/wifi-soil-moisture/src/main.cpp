/**
 *  Connects to an MQTT server and publishes soil moisture data
 *  as collected by the capacitive soil moisture sensor
 */

#include <WiFiConfig.h>

// Value in air
#define AIR_VALUE 870
// Value in pure water
#define WATER_VALUE 460

WiFiConfig* wifiConfig;

void setup() {
    Serial.begin(115200);
    Serial.println("Starting WiFi Soil Moisture Program");
    wifiConfig = new WiFiConfig();
}

void loop() {
    wifiConfig->check_connection();

    int raw = analogRead(A0);
    int soilMoisture = map(raw, AIR_VALUE, WATER_VALUE, 0, 100);

    String rawStr = String(raw);
    String moistureStr = String(soilMoisture);
    String json = "{\"raw\":";
    json += rawStr;
    json += ", \"moisture\":" + moistureStr + "}";

    wifiConfig->client.publish(wifiConfig->mqtt_config->mqtt_topic,
                               json.c_str());
    wifiConfig->client.loop();
    delay(1000);
}