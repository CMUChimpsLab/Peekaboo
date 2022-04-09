/**
 * WiFiConfig.h
 *
 * Handles MQTT configuration saving and loading to/from EEPROM
 * Configuration input handled through WiFiManager
 * 
 * @author gramliu
 * @version 1.0.0
 *
 */
#ifndef WiFiConfig_h
#define WiFiConfig_h

#include <EEPROM.h>
#include <PubSubClient.h>
#include <WiFiManager.h>

#ifdef ESP8266

#include <ESP8266WiFi.h>
#define WIFI_getChipId() ESP.getChipId()

#elif defined(ESP32)

#include <WiFi.h>
#include <esp_wifi.h>
#define WIFI_getChipId() (uint32_t) ESP.getEfuseMac()

#endif

#define WiFiConfigIdentifier "WiFiConfig"
#define Identifier_Size 11
#define MQTT_Server_Size 40
#define MQTT_Port_Size 6
#define MQTT_Topic_Size 64

struct MQTTData {
    char identifier[Identifier_Size];
    char mqtt_server[MQTT_Server_Size];
    char mqtt_port[MQTT_Port_Size];
    char mqtt_topic[MQTT_Topic_Size];
};

class WiFiConfig {
   public:
    WiFiConfig();
    void check_connection();
    void print_config();
    void load_config();
    void save_config();
    void reset_config();
    
    PubSubClient client;

    // MQTT Config data
    MQTTData* mqtt_config;
    WiFiManagerParameter* param_mqtt_server;
    WiFiManagerParameter* param_mqtt_port;
    WiFiManagerParameter* param_mqtt_topic;

   private:
    void setup_wifi();
    void setup_mqtt();
    void setup_config();
    static void on_msg_received(const char* topic, byte* payload,
                                unsigned int length);
    static boolean do_save_config;
    static boolean do_reset_config;

    WiFiManager wifiManager;
    WiFiClient espClient;
    String clientId;
};

#endif