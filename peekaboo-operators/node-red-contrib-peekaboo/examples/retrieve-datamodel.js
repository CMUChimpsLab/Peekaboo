[
    {
      "id": "8d8993ce.9ea2",
      "type": "provider-retrieve",
      "z": "a8303507.fb26b8",
      "name": "retrieve faces",
      "datatype": "image",
      "target": "faces",
      "x": 420,
      "y": 580,
      "wires": [
        [
          "528a38e4.bc3308",
          "26c54ffa.b4245"
        ]
      ]
    },
    {
      "id": "528a38e4.bc3308",
      "type": "debug",
      "z": "a8303507.fb26b8",
      "name": "retrieved payload",
      "active": true,
      "tosidebar": true,
      "console": false,
      "tostatus": false,
      "complete": "payload",
      "targetType": "msg",
      "statusVal": "",
      "statusType": "auto",
      "x": 670,
      "y": 520,
      "wires": []
    },
    {
      "id": "fb5cd775.8e9838",
      "type": "inject",
      "z": "a8303507.fb26b8",
      "name": "Test inference data",
      "props": [
        {
          "p": "payload"
        },
        {
          "p": "inference",
          "v": "{\"faces\":{\"datatype\":\"tabular\",\"contenttype\":\"derived\",\"data\":{\"boundingbox\":[[10,10,0,0]]}}}",
          "vt": "json"
        }
      ],
      "repeat": "",
      "crontab": "",
      "once": false,
      "onceDelay": 0.1,
      "topic": "",
      "payload": "{\"datatype\":\"image\",\"contenttype\":\"raw\",\"data\":\"\"}",
      "payloadType": "json",
      "x": 120,
      "y": 460,
      "wires": [
        [
          "ed4fc49a.e5bc18",
          "14a27d68.cde943",
          "8d8993ce.9ea2"
        ]
      ]
    },
    {
      "id": "ed4fc49a.e5bc18",
      "type": "debug",
      "z": "a8303507.fb26b8",
      "name": "raw payload",
      "active": true,
      "tosidebar": true,
      "console": false,
      "tostatus": false,
      "complete": "payload",
      "targetType": "msg",
      "statusVal": "",
      "statusType": "auto",
      "x": 410,
      "y": 360,
      "wires": []
    },
    {
      "id": "14a27d68.cde943",
      "type": "debug",
      "z": "a8303507.fb26b8",
      "name": "raw inference",
      "active": true,
      "tosidebar": true,
      "console": false,
      "tostatus": false,
      "complete": "inference",
      "targetType": "msg",
      "statusVal": "",
      "statusType": "auto",
      "x": 420,
      "y": 460,
      "wires": []
    },
    {
      "id": "26c54ffa.b4245",
      "type": "debug",
      "z": "a8303507.fb26b8",
      "name": "retrieved inference",
      "active": true,
      "tosidebar": true,
      "console": false,
      "tostatus": false,
      "complete": "inference",
      "targetType": "msg",
      "statusVal": "",
      "statusType": "auto",
      "x": 670,
      "y": 600,
      "wires": []
    }
  ]