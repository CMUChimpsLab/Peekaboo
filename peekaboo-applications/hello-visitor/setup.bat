@echo off

mkdir unrecognized
mkdir db
mkdir new

echo DB_PATH = 'db' > ".\constants.py"
echo UNRECOGNIZED_PATH = 'unrecognized' >> ".\constants.py"
echo RECOGNIZED_PATH = 'new' >> ".\constants.py"
echo MONGODB_URI = '' >> ".\constants.py"