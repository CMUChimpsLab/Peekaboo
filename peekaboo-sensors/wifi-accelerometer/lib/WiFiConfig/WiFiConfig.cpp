/**
 * WiFiConfig.cpp
 *
 * Handles MQTT configuration saving and loading to/from EEPROM
 * Configuration input handled through WiFiManager
 * 
 * @author gramliu
 * @version 1.0.0
 *
 */
#include "WiFiConfig.h"

// Utility function for printing config
void WiFiConfig::print_config() {
    Serial.print("Identifier: ");
    Serial.println(mqtt_config->identifier);
    Serial.print("Config: ");
    Serial.print(mqtt_config->mqtt_server);
    Serial.print(":");
    Serial.println(mqtt_config->mqtt_port);
    Serial.print("Topic: ");
    Serial.println(mqtt_config->mqtt_topic);
}

// Load config from EEPROM
void WiFiConfig::load_config() {
    uint addr = 0;
    EEPROM.get(addr, *mqtt_config);
    if (strncmp(mqtt_config->identifier, WiFiConfigIdentifier,
                Identifier_Size) != 0) {
        Serial.println("Invalid config loaded. Resetting.");
        reset_config();
    }
    Serial.println("Loaded config");
    WiFiConfig::print_config();
}

// Write config to EEPROM
void WiFiConfig::save_config() {
    // Load portal config into mqtt_config
    strncpy(mqtt_config->mqtt_server, param_mqtt_server->getValue(),
            MQTT_Server_Size);
    strncpy(mqtt_config->mqtt_port, param_mqtt_port->getValue(),
            MQTT_Port_Size);
    strncpy(mqtt_config->mqtt_topic, param_mqtt_topic->getValue(),
            MQTT_Topic_Size);

    uint addr = 0;
    EEPROM.put(addr, *mqtt_config);
    EEPROM.commit();
    Serial.println("Saved config");
    WiFiConfig::print_config();
}

// Reset mqtt_config
void WiFiConfig::reset_config() {
    strncpy(mqtt_config->identifier, WiFiConfigIdentifier, Identifier_Size);
    memset(mqtt_config->mqtt_server, 0, MQTT_Server_Size * sizeof(char));
    memset(mqtt_config->mqtt_port, 0, MQTT_Port_Size * sizeof(char));
    memset(mqtt_config->mqtt_topic, 0, MQTT_Topic_Size * sizeof(char));
}

// Listen for messages published on '<mqtt_topic>_cfg' to wipe config
void WiFiConfig::on_msg_received(const char* topic, byte* payload,
                                 unsigned int length) {
    Serial.println("Resetting config");
    WiFiConfig::do_reset_config = true;
    WiFiConfig::do_save_config = true;
}

// Setup wifi connection and auto connection portal
void WiFiConfig::setup_wifi() {
    Serial.println("Setting up wifi");
    wifiManager.setSaveParamsCallback([]() {
        WiFiConfig::do_save_config = true;
        Serial.println("Save params called!");
    });
    wifiManager.addParameter(param_mqtt_server);
    wifiManager.addParameter(param_mqtt_port);
    wifiManager.addParameter(param_mqtt_topic);
    wifiManager.setBreakAfterConfig(true);
    wifiManager.autoConnect();
    Serial.println("Autoconnect done");

    if (WiFiConfig::do_save_config) {
        save_config();
        WiFiConfig::do_save_config = false;
    }

    Serial.print("WiFi connected! IP Address: ");
    Serial.println(WiFi.localIP());
}

// Setup MQTT connection based on input from portal
void WiFiConfig::setup_mqtt() {
    Serial.println("Connecting to MQTT Server.");
    if (WiFiConfig::do_save_config) {
        save_config();
        WiFiConfig::do_save_config = false;
    }
    WiFiConfig::print_config();

    int port = atoi(mqtt_config->mqtt_port);
    client.setServer(mqtt_config->mqtt_server, port);
    client.setCallback(WiFiConfig::on_msg_received);

    // Try to connect to MQTT server for 5s
    long startTime = millis();
    Serial.print("Client Id: ");
    Serial.println(clientId.c_str());
    while (!client.connected() && (millis() - startTime < 5000)) {
        // Generate random clientId to avoid collisions
        if (client.connect(clientId.c_str())) {
            Serial.println("Connected");
        } else {
            delay(1000);
        }
    }

    // If still not connected, open config portal and try again
    if (!client.connected()) {
        Serial.println("Could not connect to MQTT Server: ");
        WiFiConfig::print_config();
        wifiManager.startConfigPortal();
        Serial.println("Started config portal");
        WiFiConfig::setup_mqtt();
    }
}

// Subscribe to '<mqtt_topic>_cfg' to listen for config wipes
void WiFiConfig::setup_config() {
    String cfg_topic = mqtt_config->mqtt_topic;
    cfg_topic += "_cfg";
    Serial.print("Config topic: ");
    Serial.println(cfg_topic.c_str());
    client.subscribe(cfg_topic.c_str(), 0);
}

// Check if reset config and/or save config necessary
// Check if MQTT connection is healthy and if not, attempt reconnection
void WiFiConfig::check_connection() {
    if (WiFiConfig::do_reset_config) {
        reset_config();
        WiFiConfig::do_reset_config = false;
    }
    if (WiFiConfig::do_save_config) {
        save_config();
        WiFiConfig::do_save_config = false;
    }
    if (!client.connected()) {
        setup_mqtt();
        setup_config();
    }
}

boolean WiFiConfig::do_save_config = false;
boolean WiFiConfig::do_reset_config = false;

WiFiConfig::WiFiConfig() {
    EEPROM.begin(512);
    mqtt_config = new MQTTData();
    reset_config();

    WiFiConfig::param_mqtt_server = new WiFiManagerParameter(
        "server", "MQTT server", mqtt_config->mqtt_server, 40);
    WiFiConfig::param_mqtt_port = new WiFiManagerParameter(
        "port", "MQTT port", mqtt_config->mqtt_port, 6);
    WiFiConfig::param_mqtt_topic = new WiFiManagerParameter(
        "topic", "MQTT topic", mqtt_config->mqtt_topic, 64);

    WiFiConfig::clientId = "ESP";
    WiFiConfig::clientId += WIFI_getChipId();

    client.setClient(espClient);

    WiFiConfig::load_config();
    WiFiConfig::setup_wifi();
    WiFiConfig::setup_mqtt();
    WiFiConfig::setup_config();
}