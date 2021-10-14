#!/bin/bash

echo "Validating server screen"
screen -ls | grep server
result=$?
if [ $result -eq 0 ]; then
echo "Server screen successfully running"
screen -ls
else
echo "Screen was not running because: $result"
screen -ls
echo "Trying to run again..."
cd ~/sonar-server/dist
echo "Starting server screen..."
screen -S server -d -m node main.js
echo "started..."
screen -ls
fi
echo "Exiting..."
exit
