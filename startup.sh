#!/bin/bash
# start services and follow logs

docker-compose up -d
docker-compose logs -f
