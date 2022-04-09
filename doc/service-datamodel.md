
1. Query
    1. Raw data:  {“datatype”: “image”, “contenttype”: “raw”, “data”: “”},
    2. Optional task parameters: 
        1. Specified in the service address {detect|classify|extract},
        2. Target content type: [face, floor]. 


2. A detect service: returns:
    1. return bounding boxes with confidence scores.
    2. For audio data, the bounding boxes are timestamp windows.
    3. For image, the bounding boxes are rects/or polygons. 
3. A classify service:
    1. return categories with confidence scores
4. An extract service 
    1. return extracted data. 