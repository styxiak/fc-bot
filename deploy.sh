#!/bin/bash

ssh chuchmala.pl "cd dockers/fc-bot && docker-compose stop && rm -Rf build"
rsync -avP --exclude=node_modules --exclude=.node-persist -e ssh build/ chuchmala.pl:dockers/fc-bot/build/
ssh chuchmala.pl "cd dockers/fc-bot/build/ && npm install && cd .. && docker-compose start"


