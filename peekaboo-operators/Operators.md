# OPERATORS README

### 


This readme contains some input output guidelines for the node interface.

### Design principles

- We design Peekaboo as a functional programming language, so each node should be an action. When we are considering a new node, we prefer to name it using a "verb" statement. Meanwhile, designers also need to consider the input and the output of the node explicitly. The connections between the nodes are referring to the data. 

- We classify all the nodes into 5 categories, based on the impact to the data.
    - Provider: encapsulate the raw sensor data. (e.g., retrieve video/image/audio/values)
    - Inference: analyze and annotate the data type of a stream. (e.g., detect face/fall/events/speech, recognize persons/objects, etc.)
    - Filter: operate on the data, mostly reduce the richness of the original data for privacy. (e.g., blur face/body/background, crop face/body, remove speech, etc.) 
    - Network: the only nodes with network access that can send data to the cloud (e.g., http(s) post, publish/subscribe, stream video through RTSP, etc).
    - Util: utility functions.

-  The interface panel should contain the following basic information:
    - the expected input data
    - the expected output data
    - a short description of the node action. 
    - (optional) configurable parameters
    
- A mega node v.s. a set of small single responsibility nodes
    - There is no definite guideline. 
    - The main considerations are performance and aggregability. 
        - Performance. For example, an RNN model can recognize many different types of objects in a photo in one pass, so it's better to aggregate different types of object recognitions in one node. 
        - Aggregatability. However, person recognition is often independent with the object recognition RNN model. So it's better to separate the person recognition node from the object recognition node. 


- The programming model contains three steps:
    - Specify the nodes and Connect the nodes.
    - Set the node properties and overall purpose.
    - Implement the callback functions.


- An ideal IoT application should only be associated with one purpose.
    - For example, a video doorbell developer wants to query some video data for two purposes: HelloVisitor and Package Notification. Although the two cloud programs are hosted on the same server, the developer should develop two programs. The Peekaboo runtime will aggregate them into one network request automatically. 

### Data flow

- The format of the data flow between nodes.

msg:

<code>{<br>
    msg.payload: "dict|the sensor data (raw & processed)",  <br>
    msg.performance: "dict|the performance of the current node",   <br>
    msg.inference: "dict|the results from the inference nodes"  <br>
}</code>



msg.payload: 

<code>{<br>
    "datatype": "image|audio|generic|video|scalar",  <br>
    "processes": "an array of filter statement; e.g., a filter face node blurs the faces in the scene",  <br>
    "data": "jimp for image data | ",
    "meta": "a dictionary of meta information, e.g., frequency for audio, device model for the sensor, etc." <br>
}</code>



msg.inference: 

<code>{<br>
    "face|person|object": "width,height,x,y"  <br>
    "audio event": "start timestamp, end timestamp"   <br>
}</code>



