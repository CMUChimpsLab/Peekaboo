'''Example streaming ffmpeg numpy processing.
Demonstrates using ffmpeg to decode video input, process the frames in
python, and then encode video output using ffmpeg.
This example uses two ffmpeg processes - one to decode the input video
and one to encode an output video - while the raw frame processing is
done in python with numpy.
At a high level, the signal graph looks like this:
  (input video) -> [ffmpeg process 1] -> [python] -> [ffmpeg process 2] -> (output video)
This example reads/writes video files on the local filesystem, but the
same pattern can be used for other kinds of input/output (e.g. webcam,
rtmp, etc.).
The simplest processing example simply darkens each frame by
multiplying the frame's numpy array by a constant value; see
``process_frame_simple``.
A more sophisticated example processes each frame with tensorflow using
the "deep dream" tensorflow tutorial; activate this mode by calling
the script with the optional `--dream` argument.  (Make sure tensorflow
is installed before running)
'''

# Modified version based on the code in https://github.com/kkroening/ffmpeg-python/blob/master/examples/tensorflow_stream.py

from __future__ import print_function
import argparse
import ffmpeg
import logging
import numpy as np
import os
import subprocess
import zipfile
from PIL import Image

parser = argparse.ArgumentParser(description='Example streaming ffmpeg numpy processing')
parser.add_argument('in_filename', help='Input filename', default='rtsp://chimps:chimps@192.168.1.82/live')
parser.add_argument('out_filename', help='Output filename', default="test.png")
parser.add_argument(
    '--dream', action='store_true', help='Use DeepDream frame processing (requires tensorflow)')

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def get_video_size(filename):
    logger.info('Getting video size for {!r}'.format(filename))
    probe = ffmpeg.probe(filename)
    video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
    width = int(video_info['width'])
    height = int(video_info['height'])
    return width, height


def start_ffmpeg_process1(in_filename):
    logger.info('Starting ffmpeg process1')
    args = (
        ffmpeg
        .input(in_filename)
        .output('pipe:', format='rawvideo', pix_fmt='rgb24')
        .compile()
    )
    return subprocess.Popen(args, stdout=subprocess.PIPE)


# def start_ffmpeg_process2(out_filename, width, height):
#     logger.info('Starting ffmpeg process2')
#     args = (
#         ffmpeg
#         .input('pipe:', format='rawvideo', pix_fmt='rgb24', s='{}x{}'.format(width, height))
#         # .output(out_filename, pix_fmt='yuv420p')
#         .output(out_filename, vframes=1, format='image2', vcodec='mjpeg')
#         .overwrite_output()
#         .compile()
#     )
#     return subprocess.Popen(args, stdin=subprocess.PIPE)


def read_frame(process1, width, height):
    logger.debug('Reading frame')

    # Note: RGB24 == 3 bytes per pixel.
    frame_size = width * height * 3
    in_bytes = process1.stdout.read(frame_size)
    if len(in_bytes) == 0:
        frame = None
    else:
        assert len(in_bytes) == frame_size
        frame = (
            np
            .frombuffer(in_bytes, np.uint8)
            .reshape([height, width, 3])
        )
    return frame


def process_frame_simple(frame):
    '''Simple processing example: darken frame.'''
    return frame * 0.3


def write_frame(process2, frame):
    logger.debug('Writing frame')
    process2.stdin.write(
        frame
        .astype(np.uint8)
        .tobytes()
    )


def retrieve_process_frame(in_filename, out_filename, process_frame_func):
    width, height = get_video_size(in_filename)
    process1 = start_ffmpeg_process1(in_filename)
    i = 0
    while True:
        in_frame = read_frame(process1, width, height)
        if in_frame is None:
            logger.info('End of input stream')
            break
        logger.debug('Processing frame')
        process_frame_func(in_frame)

    logger.info('Waiting for ffmpeg process1')
    process1.wait()