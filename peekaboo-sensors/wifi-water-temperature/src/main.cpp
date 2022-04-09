/**
 *  Connects to an MQTT server and publishes temperature data
 *  as collected by the DSB1820 Water Temperature sensor
 */

#include <WiFiConfig.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 4

WiFiConfig* wifiConfig;

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature temp(&oneWire);

void setup() {
    Serial.begin(115200);
    Serial.println("Starting WiFi Water Temperature Program");
    wifiConfig = new WiFiConfig();
    temp.begin();
}

void loop() {
    wifiConfig->check_connection();

    temp.requestTemperatures();
    float tempC = temp.getTempCByIndex(0);
    float tempF = temp.getTempFByIndex(0);

    String tempCStr = String(tempC, 2);
    String tempFStr = String(tempF, 2);

    String json = "{\"celsius\":" + tempCStr;
    json += ", \"fahrenheit\":" + tempFStr + "}";

    wifiConfig->client.publish(wifiConfig->mqtt_config->mqtt_topic,
                               json.c_str());
    wifiConfig->client.loop();
    delay(1000);
}