# Peekaboo Sensors

This directory contains various programs for interfacing sensors with Peekaboo
through ESP8266 and ESP32 IoT Development Boards

## Uploading

To upload the program on to the ESP8266 board, install
[PlatformIO](https://platformio.org/) into your IDE. Copy the project files
into PlatformIO and ensure the ports are configured properly. Upload the files
by running PlatformIO: Upload from the VSCode Command Palette.

## Configuration

For programs on ESP boards, some initial configuration is necessary. After
uploading your program into your boards, if there is no prior configuration,
it will create a Wireless Access Point (AP). This will typically be of the form
"ESPxxxxxxxx" where "ESP" is followed by an ID that is unique to your
board.

After connecting to this network, you will be redirected to the gateway page
(default: 192.168.4.1). On this page, select the "Configure WiFi" button.
![Gateway page](wifi_1.jpg =250x)

On the following page, select the network you want your board to connect to. 
Populate the remaining fields: password, MQTT address, MQTT port, and MQTT topic. 
![Configuration page](wifi_2.jpg =250x)

If you need to modify the MQTT configuration later on, publish any message to 
the `<mqtt_topic>_cfg` topic on your MQTT server. This will reset the 
configuration and you can repeat the steps for configuring your board.
