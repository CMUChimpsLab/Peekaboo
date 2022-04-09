#!/usr/bin/env python3

from camera import ProcessOutput
from picamera import PiCamera
import asyncio
import websocket


WEBSOCKET_URI = "ws://192.168.0.203:1880/ws/camera"


def client():
    with PiCamera() as camera:
        ws = websocket.WebSocket()
        ws.connect(WEBSOCKET_URI)
        print("Connection Successful")
        camera.resolution = (1296, 730)
        camera.framerate = 10
        output = ProcessOutput(ws)
        camera.start_recording(output, format="mjpeg")
        while not output.done:
            camera.wait_recording(1)
        camera.stop_recording()
        ws.close()


def main():
    client()


if __name__ == "__main__":
    main()
