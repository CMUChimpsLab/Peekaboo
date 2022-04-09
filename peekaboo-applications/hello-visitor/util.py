from base64 import encodebytes
from constants import DB_PATH
from PIL import Image
from shutil import move
import io
import time
import os


def gatherFiles(uploads: list, references: list) -> list:
    """
    From a list of uploads and references, save and gather all locations
    and filenames.
    """
    files = []

    if uploads and type(uploads) == list:
        for file in uploads:
            filename = f'{time.time()}.jpg'
            location = f'{DB_PATH}/{filename}'
            file.save(location)
            files.append(location)

    if references and type(references) == list:
        for file in references:
            if os.path.isfile(file):
                if file.startswith(f"{DB_PATH}/"):
                    continue
                filename = f'{time.time()}.jpg'
                location = f'{DB_PATH}/{filename}'
                move(file, location)
                files.append(location)

    return files


def encodeImage(image):
    """
    Takes image paths, loads the image at the location, and converts them to
    ascii-encoded base64 binary data.
    """
    img = Image.open(image, mode='r')
    bytearr = io.BytesIO()
    img.save(bytearr, format="JPEG")
    return encodebytes(bytearr.getvalue()).decode('ascii')
