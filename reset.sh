#!/bin/bash
# stop server and remove container
docker-compose stop server
docker-compose rm -f server

# remove npm packages
sudo rm -rf node_modules

# remove build files
sudo rm -rf services/server/bin
sudo rm -rf services/server/static/app

# restart server and follow all logs
docker-compose up -d server
docker-compose logs -f