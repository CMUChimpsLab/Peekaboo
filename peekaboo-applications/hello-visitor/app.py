from base64 import b64decode
from constants import UNRECOGNIZED_PATH, RECOGNIZED_PATH, MONGODB_URI
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import Profile
from mongoengine import connect
from numpy import ndarray
from recognize import recognize, rebuildRepresentations, queryPrediction
from shutil import copyfile, move
from util import encodeImage, gatherFiles
import json
import os
import time


app = Flask(__name__)
CORS(app)
connect(host=MONGODB_URI)


@app.route('/')
def info():
    return 'Face recognition server'


@app.route('/images/unrecognized', methods=['GET'])
def imagesUnrecognized():
    """
    Returns an array of all unrecognized images
    """
    files = []
    for file in os.listdir(UNRECOGNIZED_PATH):
        location = f'{UNRECOGNIZED_PATH}/{file}'
        if os.path.isfile(location):
            files.append(location)

    encoded_images = []
    for image in files:
        encoded_images.append({
            "filename": image,
            "data": encodeImage(image)
        })
    return jsonify(encoded_images)


@app.route('/images/recognized', methods=['GET'])
def imagesRecognized():
    """
    Returns an array of all recognized images
    """
    files = []
    for file in os.listdir(RECOGNIZED_PATH):
        location = f'{RECOGNIZED_PATH}/{file}'
        if os.path.isfile(location):
            files.append(location)

    encoded_images = []
    for image in files:
        encoded_images.append({
            "filename": image,
            "data": encodeImage(image),
            "prediction": queryPrediction(recognize(image)[0][0])
        })
    return jsonify(encoded_images)


@app.route('/profile', methods=['GET'])
def listProfiles():
    """
    List all profiles in the database
    """
    profiles = []
    for profile in Profile.objects:
        images = []
        for image in profile.images:
            images.append({
                "filename": image,
                "data": encodeImage(image)
            })
        profiles.append({
            "_id": str(profile.pk),
            "name": profile.name,
            "images": images
        })
    return jsonify(profiles)


@app.route('/profile/create', methods=['POST'])
def createProfile():
    """
    Create a new profile given at least one attached or unrecognized photo.
    """
    uploads = request.files.getlist("uploads")
    references = request.form.getlist("references")
    name = request.form.get("name")

    # Produce a list of all profile images
    files = gatherFiles(uploads, references)
    print(files)

    # Generate new Profile document
    profile = Profile(name=name, images=files)
    profile.save()

    # Return the saved document contents as JSON
    return jsonify(profile.to_json())


@app.route('/profile/delete', methods=['POST'])
def deleteProfile():
    """
    Deletes a profile in the server based on the given _id.
    """
    objectID = request.form.get("_id")
    if objectID:
        profile = Profile.objects.get(id=objectID)

        # All previously associated images are now unrecognized
        for image in profile.images:
            if os.path.isfile(image):
                move(image, f'{UNRECOGNIZED_PATH}/{time.time()}.jpg')

        # Delete profile in DB
        profile.delete()
        return {"success": True}

    return {"success": False}


@app.route('/profile/update', methods=['POST'])
def updateProfile():
    """
    Updates a profile based on the given _id.
    """
    objectID = request.form.get("_id")
    name = request.form.get("name")
    uploads = request.form.getlist("uploads")
    references = request.form.getlist("references")
    if objectID:
        profile = Profile.objects.get(id=objectID)
        oldImages = profile.images

        # Produce a list of files
        files = []
        if uploads is not None:
            for file in uploads:
                filename = f'{time.time()}.jpg'
                location = os.path.abspath(f'{RECOGNIZED_PATH}/{filename}')
                file.save(location)
                files.append(location)

        if references is not None:
            for location in references:
                if os.path.isfile(location):
                    files.append(os.path.abspath(location))
                    oldImages.remove(location)

        # All previously associated images are now unrecognized
        for image in oldImages:
            if os.path.isfile(image):
                move(image, f'{UNRECOGNIZED_PATH}/{time.time()}.jpg')

        profile.name = name
        profile.images = files
        profile.save()
        return jsonify(profile.to_json())

    return jsonify(dict())


def run_predictions(files: list, f: list):
    """
    If no match is found, then transfer
    the image to a queue to be recognized or deleted manually. Otherwise,
    delete the photo and return the person's profile.
    """
    # Run recognition
    predictions = recognize(files)

    # Found prediction
    if (isinstance(predictions, ndarray) and predictions.size > 0):
        return {'prediction': queryPrediction(predictions[0][0]),
                'score': predictions[0][1]}

    # Multiple files case
    elif (isinstance(predictions, list) and len(predictions) > 0):
        result = []
        for i in range(len(f)):
            # Element is recognized
            if (predictions[i].size > 0):
                result.append(
                    {'prediction': queryPrediction(predictions[i][0][0]),
                     'score': predictions[i][0][1],
                     'file': f[i].filename})

            # Element is unrecognized
            else:
                copyfile(files[i], f'{UNRECOGNIZED_PATH}/{time.time()}.jpg')
                os.remove(files[i])
                result.append({'prediction': None, 'file': f[i].filename})

        return jsonify(result)

    # Single nrecognized case
    else:
        copyfile(files[0], f'{UNRECOGNIZED_PATH}/{time.time()}.jpg')
        os.remove(files[0])
        return {'prediction': None}


@app.route('/upload', methods=['POST'])
def upload():
    """
    Upload a new picture to be recognized.
    """

    # Retrieve uploaded files
    f = request.files.getlist("image")
    files = []

    # Save files to be recognized
    for file in f:
        filename = f'{time.time()}.jpg'
        location = os.path.abspath(f'{RECOGNIZED_PATH}/{filename}')
        file.save(location)
        files.append(location)

    return run_predictions(files, f)


@app.route('/upload/string', methods=['POST'])
def upload_string():
    """
    Upload a new picture in base64 string format.
    """
    filename = f'{time.time()}.jpg'
    location = os.path.abspath(f'{RECOGNIZED_PATH}/{filename}')
    with open(location, "wb") as f:
        data = json.loads(request.form["payload"])[0]["data"]
        f.write(b64decode(data))

    files = [location]
    return run_predictions(files, [])


@app.route('/rebuild', methods=['POST'])
def rebuild():
    rebuildRepresentations()
    return jsonify({
        "success": True
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
