#!/bin/sh
set -e
DIR="$( cd "$( dirname "$0" )" && pwd )"
DOCKER="docker -H ssh://sebastien@marx.holusion.net:22"

$DOCKER build . -t ethesaurus
$DOCKER stop ethesaurus || echo "ethesaurus not running"
$DOCKER rm ethesaurus || echo "ethesaurus container does not exist"
$DOCKER run -d \
  --net dashboard_default -p 8000:8000 \
  --volume ethesaurus:/app/files \
  -e PUBLIC=false -e SMART_HOST=marx.holusion.net \
  --name ethesaurus ethesaurus
