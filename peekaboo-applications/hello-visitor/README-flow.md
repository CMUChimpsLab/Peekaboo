# HelloVisitor Complete Node-RED Flow

## Node-RED Setup

*Note: It will be easier to set up Node-RED on a Linux machine*

Install Node.js (`lts/*`: Node 14 is fine) and install Node-RED globally:

```
npm i -g node-red@1.2.9
```

Install all Peekaboo operator nodes (`data-centered-privacy/programmingmodel`):
```
.\reinstall_allnodes.sh
```

Set up a basic flow:

push -> detect -> select -> post -> mqtt out

Node Configurations:

1. push

    > Set to Websocket Listener and set the websocket to `/ws/camera`

2. detect

    > First, set up the [Face Detection service](#set-up-face-detection). Then, set the data type to `image`, target to `face`, and model to `MobileNet SSD v2 - Faces`. Finally, register the face detection service at `[IP | localhost]:5001`.

3. select

    > Set the data type to `image`, and target to `face`.

4. post

    > First, set up the face recognition service as defined in `README.md`. Set the data type to `image` and the server address to `[Recognition IP]:5000/upload/string`.

5. mqtt out

    > First, set up an MQTT Broker like Mosquitto. Then set the MQTT service to `[localhost | IP]:1883` with the topic `/python/mqtt/speaker`.

## Set Up AIY Camera

This section uses the code found in `data-centered-privacy/peekaboo-applications/hello-visitor-camera`.


First, make sure all python dependencies are installed. 

```
conda create -n camera
conda activate camera
```
```
conda install python
```
```
pip install opencv-python PIL pyttsx3 paho websocket 
```

Edit the `WEBSOCKET_URI` variable in `app.py` and the `broker` and `topic` variables in `speaker.py`.

At this point, you should also set up some audio output device through bluetooth using `bluetoothctl` on the AIY Raspberry Pi.

Run the two scripts separately:
```
python3 app.py
```
```
python3 speaker.py
```

## Set Up Face Detection

The face detection service is found in: `data-centered-privacy/runtime/_microservices/Face-Detector-Mobilenet`

Build the Docker image (make sure Docker is installed):
```
sudo docker docker build -t peekaboo-face-detector .
```

Run the Docker container
```
sudo docker run -d --privileged  -p 23:22 -p 5001:5000 --restart unless-stopped -v /dev/bus/usb:/dev/bus/usb peekaboo-face-detector
```

## Debugging the Flow

You can install the package node-red-contrib-image-output on the Node-RED instance and connect the image viewer to different parts of the flow to inspect the images being passed through Node-RED.

To configure this debugging setup, first create a chain: `function -> image viewer`

The function body:
```javascript
msg.payload = msg.payload[0].data;
return msg;
```

The function input would be attached to the output of any node that passes an image.