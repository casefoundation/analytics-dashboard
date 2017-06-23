#!/bin/bash

cd client

npm install

npm run build

cd ..

rm -rf server/build

mv client/build server/build

docker build -t analytics-dashboard .
