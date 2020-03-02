#!/bin/bash

ssh fc-bot "cd bot-1 && docker-compose stop && rm -Rf build"
rsync -avP --exclude=node_modules --exclude=.node-persist -e ssh build/ fc-bot:bot-1/build/
ssh fc-bot "cd bot-1/build/ && npm install && cd .. && docker-compose start"


