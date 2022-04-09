from constants import DB_PATH
from deepface import DeepFace
from models import Profile
import os


def recognize(files):
    if (len(os.listdir('db')) > 0):
        df = DeepFace.find(img_path=files, db_path="db",
                           distance_metric='euclidean_l2')
        if (type(df) is list):
            return list(map(lambda x: x.to_numpy(), df))
        else:
            return df.to_numpy()
    else:
        return None


def rebuildRepresentations():
    """
    Removes the existing representation file (if it exists) and reconstructs
    the file from the new images.
    """
    if os.path.isfile(f"{DB_PATH}/representations_vgg_face.pkl"):
        os.remove(f"{DB_PATH}/representations_vgg_face.pkl")
    recognize([])


def queryPrediction(prediction):
    """
    Retrieves the first match in the DB that contains the given file.
    """
    return Profile.objects(images=prediction).first().name
