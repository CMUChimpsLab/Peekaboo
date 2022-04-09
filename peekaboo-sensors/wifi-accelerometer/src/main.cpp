/**
 *  Connects to an MQTT server and publishes accelerometer data
 *  as collected by the ADXL335B (GY-61)
 */

#include <WiFiConfig.h>
#ifdef ESP32
#include "WiFi.h"
#include <driver/adc.h>
#endif

/* Accelerometer calibration constants */
// Analog value for zero g i.e. tilted on perpendicular axis
const float ZERO_G = 494;
// Analog value for -g e.g. sensor facing up
const float Z_NEG_G = 606;
// Scale value
const float Z_SCALE = Z_NEG_G - ZERO_G;

#ifdef ESP8266
#define AXIS "z"
#endif

#ifdef ESP32
#define PIN_X 34
#define PIN_Y 35
#define PIN_Z 32
#define ANALOG_DELAY 10
#endif

WiFiConfig* wifiConfig;

void setup() {
    Serial.begin(115200);
#ifdef ESP32
    WiFi.mode(WIFI_MODE_NULL);
    btStop();
    pinMode(PIN_X, INPUT);
    pinMode(PIN_Y, INPUT);
    pinMode(PIN_Z, INPUT);
    analogSetWidth(10);
    analogSetSamples(10);
    analogSetAttenuation(ADC_11db);
#endif
    Serial.println("Starting WiFi Accelerometer (ADXL335) Program");
    wifiConfig = new WiFiConfig();
}

#ifdef ESP8266
String readESP8266() {
    int raw;
    float acc;

    raw = analogRead(A0);
    acc = (((float)raw - ZERO_G) / Z_SCALE) * 9.8;  // convert to m/s^2
    Serial.print("Raw: ");
    Serial.print(raw);
    Serial.print(" Acc: ");
    Serial.println(acc);

    String rawStr = String(raw);
    String aStr = String(acc, 2);
    String json = "{\"raw\":";
    json += rawStr;
    json += ", \"";
    json += AXIS;
    json += "\":" + aStr + "}";
    return json;
}
#endif

#ifdef ESP32
String readESP32() {
    int x, y, z;
    float ax, ay, az;

    x = analogRead(PIN_X);
    delay(ANALOG_DELAY);
    y = analogRead(PIN_Y);
    delay(ANALOG_DELAY);
    z = analogRead(PIN_Z);
    delay(ANALOG_DELAY);

    ax = (((float)x - ZERO_G) / Z_SCALE) * 9.8;
    ay = (((float)y - ZERO_G) / Z_SCALE) * 9.8;
    az = (((float)z - ZERO_G) / Z_SCALE) * 9.8;

    Serial.print("Raw X: ");
    Serial.print(x);
    Serial.print(" Y: ");
    Serial.print(y);
    Serial.print(" Z: ");
    Serial.println(z);

    // Serial.print("Acc X: ");
    // Serial.print(ax);
    // Serial.print(" Y: ");
    // Serial.print(ay);
    // Serial.print(" Z: ");
    // Serial.println(az);

    String xStr = String(ax, 2);
    String yStr = String(ay, 2);
    String zStr = String(az, 2);

    String json = "{\"x\":" + xStr + ",";
    json += "\"y\":" + yStr + ",";
    json += "\"z\":" + zStr + "}";
    return json;
}
#endif

void loop() {
    wifiConfig->check_connection();

#ifdef ESP8266
    String json = readESP8266();
#elif defined(ESP32)
    String json = readESP32();
#endif

    wifiConfig->client.publish(wifiConfig->mqtt_config->mqtt_topic,
                               json.c_str());
    wifiConfig->client.loop();

    delayMicroseconds(50);
}
