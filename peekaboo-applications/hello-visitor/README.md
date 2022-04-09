# Peekaboo HelloVisitor Deepface Service

This server provides access to the deepface library on Python. It adds endpoints that associates faces with people through a profile system.

## Set Up the Installation

See the section on [Setting Up the Anaconda Environment](#setting-up-the-anaconda-environment)

**Setup the local variables and directories:**

Linux:
```bash
$ ./setup.sh
```
Windows
```
> .\setup.bat
```

To set up the service, the `constants.py` must have the following variables prepopulated:

1. `DB_PATH`: The **directory** path that will contain the images of the selected people to remember.
2. `UNRECOGNIZED_PATH`: The **directory** path that will contain the images of unrecognized individuals.
3. `RECOGNIZED_PATH`: The **directory** path that will contain the images of recognized individuals.
4. `MONGODB_URI`: The MongoDB connection string to the database for HelloVisitor.

The **directories** listed above must also be created.

Open `constants.py` and paste the MongoDB connection string.

## Starting the Server

Linux:
```bash
$ ./run.sh
```

Windows:
```
> .\run.bat
```


## Setting Up the Anaconda Environment

**Install Anaconda and create a new environment:**

```
conda create -n hellovisitor
conda activate hellovisitor
```

First, follow instructions on TF website to install GPU support. Then install Python 3.8 on the Anaconda environment. Use pip to install tensorflow 2.4.0 (compatible with CUDA 11.0, cuDNN 8.0.4)

```
conda install python==3.8.10
```

```
pip install tensorflow==2.4.0
```

**Install the remaining Anaconda dependencies:**

Linux:
```
conda install flask flask-cors dnspython gunicorn
```

Windows:
```
conda install flask flask-cors dnspython waitress
```

**Add Deepface and Mongoengine:**

```
pip install deepface mongoengine
```