#!/bin/bash
# DOCKER IMAGE STARTUP SCRIPT
# NODE SERVER ENTRYPOINT

# make sure path for node, npm and module binaries is registered
source /root/.nvm/nvm.sh

# install/update node module dependencies
cd /app
npm install

# build client and server code
npm run build

# start server in debug mode, watching source code changes
npm run watch

