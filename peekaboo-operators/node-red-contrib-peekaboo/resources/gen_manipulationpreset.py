from collections import defaultdict
import json


noisify_preset_dict = {
    "video": defaultdict(dict),
    "image": defaultdict(dict),
    "audio": defaultdict(dict),
    "tabular": defaultdict(dict),
    "scalar": defaultdict(dict),
    "radio": defaultdict(dict),
}


noisify_preset_dict["image"]["custom"] = {"radius": 0}
noisify_preset_dict["image"]["blur face"] = {"radius": 50}
noisify_preset_dict["audio"]["custom"] = {"pitchfactor": 1, "tempofactor": 1}
noisify_preset_dict["scalar"]["custom"] = {"noise%": 0}
noisify_preset_dict["scalar"]["noisify temperature"] = {"scalefactor": 0.03}


with open('noisify_presets.json', 'w') as outfile:
    json.dump(noisify_preset_dict, outfile)