#!/bin/bash
# restart server and follow all logs

docker-compose stop server
docker-compose rm -f server
docker-compose up -d server
docker-compose logs -f