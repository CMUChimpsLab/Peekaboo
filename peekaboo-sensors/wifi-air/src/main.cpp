/**
 *  Connects to an MQTT server and publishes air temperature and pressure data
 *  as collected by the BMP180
 */

#include <SPI.h>
#include <Adafruit_BMP085.h>
#include <WiFiConfig.h>

WiFiConfig* wifiConfig;
Adafruit_BMP085 bmp;  // temperature and air pressure sensor

void setup() {
    Serial.begin(115200);
    Serial.println("Starting WiFi Temperature Program");
    wifiConfig = new WiFiConfig();
    if (bmp.begin()) {
        Serial.println("BMP180 initialized");
    } else {
        Serial.println("BMP180 failed to load.");
        while (1)
            ;
    }
}

void loop() {
    wifiConfig->check_connection();

    double temp = bmp.readTemperature();
    double pressure = bmp.readPressure();
    Serial.print("Temperature: ");
    Serial.print(temp, 2);
    Serial.println("deg C");

    Serial.print("Pressure: ");
    Serial.print(pressure, 2);
    Serial.println(" Pa");

    String tempStr = String(temp, 2);
    String pressureStr = String(pressure, 2);
    String json = "{\"temperature\":" + tempStr + ",";
    json += "\"pressure\":" + pressureStr + "}";

    wifiConfig->client.publish(wifiConfig->mqtt_config->mqtt_topic,
                                json.c_str());
    wifiConfig->client.loop();
    delay(500);
}
