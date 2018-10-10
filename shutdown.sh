#!/bin/bash
# stop services and remove containers

docker-compose stop
docker-compose rm -f -v
