#!/bin/bash
# DOCKER IMAGE STARTUP SCRIPT
# NODE SERVER ENTRYPOINT

# make sure path for node, npm and module binaries is registered
source /root/.nvm/nvm.sh

# install/update node module dependencies
cd /app
npm install

# build server code in services/server/bin/
if [ ! -d "services/server/bin" ]; then
    npm run build-server
fi

# build development client code in dist/
if [ ! -d "dist" ]; then
    npm run build-dev
fi

# start server in debug mode
npm run server

