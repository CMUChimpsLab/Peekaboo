/**
 *  Connects to an MQTT server and publishes audio data
 *  as collected by the MAX4466 microphone
 * 
 *  ESP32 code takes advantage of dual cores for realtime streaming
 */

#include <WiFiConfig.h>

#ifdef ESP8266

    #define ANALOG_PIN A0
    #define AMPLIFY_SHIFT 6
    #define BUF_LEN 8192

#elif defined(ESP32)

    #define ANALOG_PIN 36
    #define AMPLIFY_SHIFT 4
    #define BUF_LEN 32768

    TaskHandle_t readTask;
    TaskHandle_t sendTask;
    byte tmp[BUF_LEN];

#endif

byte buf[BUF_LEN];
int buf_index;

WiFiConfig* wifiConfig;

void sendData(void* parameters) {
    wifiConfig->check_connection();
    #ifdef ESP32
      bool success = wifiConfig->client.publish(
          wifiConfig->mqtt_config->mqtt_topic, tmp, BUF_LEN);
    #else
      bool success = wifiConfig->client.publish(
          wifiConfig->mqtt_config->mqtt_topic, buf, BUF_LEN);
    #endif
    Serial.print("Published message: ");
    Serial.println(success ? "success" : "failed");
    wifiConfig->client.loop();
    vTaskDelete(sendTask);
}

void readData(void* parameters) {
    while (true) {
        int raw = analogRead(ANALOG_PIN) << AMPLIFY_SHIFT;
        buf[buf_index++] = byte(raw & 0xff);
        buf[buf_index++] = byte(raw >> 8);

        if (buf_index == BUF_LEN) {
            #ifdef ESP32
              memcpy(tmp, buf, sizeof(byte) * BUF_LEN);
              xTaskCreatePinnedToCore(&sendData, "Send Data", 10000, NULL, 1,
                                      &sendTask, 0);
            #else
              sendData(NULL);
            #endif
            buf_index = 0;
        }

        delayMicroseconds(125);  // 8khz
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("Starting WiFi Mic Program");
    wifiConfig = new WiFiConfig();
    wifiConfig->client.setBufferSize(BUF_LEN + 71);  // add space for MQTT headers
    buf_index = 0;

    #ifdef ESP32
      xTaskCreatePinnedToCore(&readData, "Read Data", 10000, NULL, 1, &readTask,
                              1);
      delay(500);
    #endif
}

void loop() {
  #ifdef ESP8266
    readData(NULL);
  #endif
}
