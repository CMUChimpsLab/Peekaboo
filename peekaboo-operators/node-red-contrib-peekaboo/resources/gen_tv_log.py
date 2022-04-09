import json
import uuid
import datetime


res = []
for x in range(100): 
    tv_log_entry = {
        "date": datetime.datetime.now(),
        "content_id": str(uuid.uuid4()),
        "content_category": "sports",
        "duration": 3623,
        "login_user": "haojian",
        "options": "random text to emulate the various configurations here. woekfopwkefopwekfpowekfopwkefopwekfopwekfopwekfopwkfeopwekfopwekfopfowekfwpokefopwekfopwkfwpoekfowekfopwekfpwoefkpowkfpoweokfwpeokfopekdosekdos;ekdopsekdopsekdopsekdfopsekfopsekfopsekfopsekfopsekfopsekfposekfopsekfopsekfopsekfspeofkspoefkopsekfpsoekfposekfopsekfopsekfopsekpsoekfposekposekfposepokspokfopeskdlsdl"
    }
    res.append(tv_log_entry)
    
with open('tvlog.js', 'w') as outfile:
    json.dump(res, outfile, default=str)