#!/bin/bash

cd /home/ubuntu/
sudo rm -rf webapp node_modules package-lock.json
sudo npm install -g pm2
pm2 kill