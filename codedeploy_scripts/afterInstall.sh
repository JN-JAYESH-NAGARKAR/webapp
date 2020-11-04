#!/bin/bash

cd /home/ubuntu
pwd 
sudo chown ubuntu: webapp/webapp
sudo cp .env /home/ubuntu/webapp/webapp
pwd
cd /home/ubuntu/webapp/webapp
npm install