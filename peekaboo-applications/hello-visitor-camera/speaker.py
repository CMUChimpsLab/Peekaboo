import pyttsx3
import paho.mqtt.client as mqtt_client
import random
import json
import time

MIN_TIME_INTERVAL = 10

broker = '192.168.0.144'
port = 1883
topic = "/python/mqtt/speaker"
client_id = f'python-mqtt-speaker-{random.randint(0, 1000)}'
last_message = 0


def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker")
        else:
            print("Failed to connect, return code %d\n", rc)

    client = mqtt_client.Client(client_id)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client


def subscribe(client: mqtt_client):
    def on_message(client, userdata, msg):
        global last_message
        print(f"Received `{msg.payload.decode()}` from `{msg.topic}` topic")
        payload = json.loads(msg.payload.decode())
        curtime = time.time()
        # Check if the last message sent to speaker was within interval
        if curtime - last_message > MIN_TIME_INTERVAL:
            engine = pyttsx3.init()
            if payload["prediction"] is not None:
                # Person in the database
                engine.say("Welcome back, " + payload["prediction"] + "!")
            else:
                # Person not recognized
                engine.say("Hello there!")
            engine.runAndWait()
            engine.stop()
        last_message = curtime

    client.subscribe(topic)
    client.on_message = on_message


def run():
    client = connect_mqtt()
    subscribe(client)
    client.loop_forever()


if __name__ == '__main__':
    run()
