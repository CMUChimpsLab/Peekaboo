# Peekaboo


Peekaboo, a new privacy-sensitive
architecture for developers to build smart home apps. Peekaboo has three key ideas: manifest, operators, and runtime (hub).

- First, app developers must declare all intended data collection behaviors in a text-based ***manifest***, including under what conditions data will be sent outside of the home to cloud services, where that data is being sent to, and the granularity of the data itself. 
- Second, to specify these behaviors, developers choose from a small and fixed set
of ***operators*** with well-defined semantics, authoring a streamoriented pipeline similar to Unix pipes. This pipeline preprocesses raw data from IoT devices in the home (e.g. sensor data or usage history) into the granularity needed by the cloud service. 
- Third, an ***in-home trusted Peekaboo hub*** mediates between all devices in the home and the outside Internet. This hub enforces the declared behaviors in the manifests, and also locally runs all of the operators specified in these manifests to transform raw data before it is relayed to any cloud services.

<img src="doc/architecture-overview.jpeg"/>

Combined, these ideas make it so that developers can reduce data collection by running pre-processing tasks on the in-home trusted hub, and users and third-party auditors can inspect data behaviors by analyzing these manifests as well as any actual data flows. 

Our approach also facilitates a number of privacy features that can be supported by the hub itself, such as adding additional conditions or transformations before data flows out, or transforming parts of the manifest into natural language statements to make it easier for lay people to understand what data will be sent out, when, and to where.

For details, see our IEEE S&amp;P 2022 paper: [Peekaboo: A Hub-Based Approach to Enable Transparency in Data Processing within Smart Homes](http://haojianj.in/resource/pdf/peekaboo-oakland22.pdf)


## System Requirements

To run Peekaboo, we suggest you use a dedicated RaspberryPi. You can also test the system on a laptop, but a few machine learning libraries will not work since they are compiled on ARM architecture. 

Suggest setup: 

1. Rapsberry Pi 4B with 8GB memory.
2. [Google Coral USB Accelerator](https://coral.ai/products/accelerator/)


## Installation



