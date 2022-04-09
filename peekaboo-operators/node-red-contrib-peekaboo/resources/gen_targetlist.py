from collections import defaultdict
import json

detected_content_obj = {
    "video": defaultdict(list),
    "image": defaultdict(list),
    "audio": defaultdict(list),
}

classified_content_obj = {
    "video": defaultdict(list),
    "image": defaultdict(list),
    "audio": defaultdict(list),
}

extracted_content_obj = {
    "video": defaultdict(list),
    "image": defaultdict(list),
    "audio": defaultdict(list),
}


#####################
# Image 

# MobileNet SSD v2 (Faces)
# Detects the location of human faces
# Dataset: Open Images v4
# Input size: 320x320
# (Does not require a labels file)
detected_content_obj["image"]["face"].append("MobileNet - Faces")

with open("image_detection_coco_labels.txt", "r") as f:
    lines = f.readlines()
    for line in lines:
        fields = line.split("  ")
        target_content = fields[1].strip()
        print(target_content)
        detected_content_obj["image"][target_content].append("MobileNet - COCO")


with open("pascal_voc_segmentation_labels.txt", "r") as f:
    lines = f.readlines()
    for line in lines:
        line = line.strip()
        if line.startswith("#") or len(line) == 0:
            continue
        target_content = line
        print(target_content)
        detected_content_obj["image"][target_content].append("MobileNet - PASCAL VOC")



#####################
# Audio 

# https://github.com/IBM/MAX-Audio-Classifier

with open('ontology.json', 'r') as json_file:
    ontology = json.load(json_file)
    for item in ontology:
        classified_content_obj["audio"][item["name"]].append("Google AudioSet")


extracted_content_obj["video"]["heartrate"].append("Heart rate from face videos")
extracted_content_obj["image"]["pose"].append("Google Posenet")
extracted_content_obj["audio"]["freqspectrum"].append("FFT Transform")
extracted_content_obj["audio"]["speech"].append("IBM Waston Recognition")


with open('detectedObjs.json', 'w') as outfile:
    json.dump(detected_content_obj, outfile)

with open('classifiedObjs.json', 'w') as outfile:
    json.dump(classified_content_obj, outfile)

with open('extractedObjs.json', 'w') as outfile:
    json.dump(extracted_content_obj, outfile)