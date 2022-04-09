from picamera import PiCamera
from aiy.board import Board, Led
import websocket
import io
import base64

WEBSOCKET_URI = "ws://192.168.1.146:1880/ws/camera"

def client():
    with PiCamera() as camera:
        with Board() as board:
            ws = websocket.WebSocket()
            ws.connect(WEBSOCKET_URI)
            print("Connection Successful")

            while True:
                board.button.wait_for_press()
                board.led.state = Led.ON
                board.button.wait_for_release()
                stream = io.BytesIO()
                camera.resolution = (800, 600)
                camera.capture(stream, format='jpeg')
                stream.seek(0)
                ws.send(base64.b64encode(stream.getvalue()))
                print("Send Successful!")
                board.led.state = Led.OFF

if __name__ == "__main__":
    client()
