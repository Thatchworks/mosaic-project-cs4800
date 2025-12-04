#!/bin/bash

git fetch origin

if [ $? -eq 0 ]; then
    echo "Git fetch successful."
else
    echo "Git fetch failed. Check the error messages above."
    exit 1 # Exit with an error code
fi


sudo docker compose -f docker-compose.yml stop
if [ $? -ne 0 ]; then
    echo "Docker compose stop failed. Check the error messages above."
    exit 1
fi

sudo docker compose -f docker-compose.yml build
if [ $? -ne 0 ]; then
    echo "Docker compose build failed. Check the error messages above."
    exit 1
fi

sudo docker compose -f docker-compose.yml up -d
if [ $? -ne 0 ]; then
    echo "Docker compose up failed. Check the error messages above."
    exit 1
fi

echo "Docker containers updated successfully."