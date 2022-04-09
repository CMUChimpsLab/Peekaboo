import threading
import io
import time
import numpy as np
from detector import MotionDetector
from queue import Queue
from PIL import Image
from aiy.board import Board, Led
import cv2
import base64


MOTION_THRESHOLD = 1000000
MOTION_TIME_INTERVAL = 2
NUM_DETECTORS = 1


def opencv2jpgbase64(frame_bgr):
    # Convert captured image to JPG
    retval, buffer = cv2.imencode('.jpg', frame_bgr)
    # Convert to base64 encoding and show start of data
    jpg_as_text = base64.b64encode(buffer)
    return jpg_as_text


class ImageProcessor(threading.Thread):
    def __init__(self, owner, queue, detector):
        super(ImageProcessor, self).__init__()
        self.stream = io.BytesIO()
        self.event = threading.Event()
        self.terminated = False
        self.owner = owner

        # bgr frame is the common data structure in peekaboo for images,
        # since opencv is faster than numpy.
        self.latest_bgr_frame = None
        self.last_pushedtime = -1
        self.push_connections = set()
        self.push_data_queue = queue
        # all the data that needs to be pushed will store in a queue.
        self.push_detector = detector

        self.start()

    def run(self):
        # This method runs in a separate thread
        while not self.terminated:
            # Wait for an image to be written to the stream
            if self.event.wait(1):
                try:
                    self.stream.seek(0)
                    image = np.array(Image.open(self.stream))
                    self.process_frame(image)
                finally:
                    # Reset the stream and event
                    self.stream.seek(0)
                    self.stream.truncate()
                    self.event.clear()
                    # Return ourselves to the available pool
                    with self.owner.lock:
                        self.owner.pool.append(self)

    def process_frame(self, frame):
        # store the latest frame in the memory.
        # this would be used to respond the pull requests.

        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        self.latest_bgr_frame = frame_bgr

        movement_matrix = self.push_detector.detect(frame_bgr)
        scene_change_score = np.sum(movement_matrix)
        if (scene_change_score > MOTION_THRESHOLD):
            curtime_sec = time.time()
            if (curtime_sec - self.last_pushedtime) > MOTION_TIME_INTERVAL:
                print("a new frame to push", scene_change_score)
                self.last_pushedtime = curtime_sec
                cv2.imwrite('pushed.jpg', frame_bgr)
                # push to all the outputaddrs
                if (self.push_data_queue.full()):
                    # drop a frame if the buffer is full.
                    self.push_data_queue.get()
                self.push_data_queue.put(opencv2jpgbase64(frame_bgr))


class ProcessOutput(object):
    def __init__(self, websocket):
        self.done = False
        # Construct a pool of 4 image processors along with a lock
        # to control access between threads
        self.lock = threading.Lock()
        self.push_data_queue = Queue(100)
        self.detector = MotionDetector(bg_history=20,
                                       brightness_discard_level=25,
                                       bg_subs_scale_percent=0.1,
                                       group_boxes=True,
                                       expansion_step=5)
        self.pool = [ImageProcessor(self, self.push_data_queue, self.detector)
                     for i in range(NUM_DETECTORS)]
        self.processor = None
        self.push = threading.Thread(target=self.publish, args=(websocket,))
        self.push.start()

    def write(self, buf):
        if buf.startswith(b'\xff\xd8'):
            # New frame; set the current processor going and grab
            # a spare one
            if self.processor:
                self.processor.event.set()
            with self.lock:
                if self.pool:
                    self.processor = self.pool.pop()
                else:
                    # No processor's available, we'll have to skip
                    # this frame; you may want to print a warning
                    # here to see whether you hit this case
                    self.processor = None
        if self.processor:
            self.processor.stream.write(buf)

    def flush(self):
        # When told to flush (this indicates end of recording), shut
        # down in an orderly fashion. First, add the current processor
        # back to the pool
        if self.processor:
            with self.lock:
                self.pool.append(self.processor)
                self.processor = None
        # Now, empty the pool, joining each thread as we go
        while True:
            with self.lock:
                try:
                    proc = self.pool.pop()
                except IndexError:
                    pass  # pool is empty
            proc.terminated = True
            proc.join()

    def publish(self, websocket):
        while True:
            if not self.push_data_queue.empty():
                image = self.push_data_queue.get()
                with Board() as board:
                    board.led.state = Led.ON
                    websocket.send(image)
                    board.led.state = Led.OFF
                    print("Send Successful!")
