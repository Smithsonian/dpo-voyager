#!/bin/bash
set -e

readonly APP_HOME=/app

# NVM_DIR is set when building the Docker image
# shellcheck disable=SC1091,SC2154
source "${NVM_DIR}/nvm.sh"
echo "source '${NVM_DIR}/nvm.sh'" >> ~/.bashrc

cd "${APP_HOME}"
npm install

# build server code in services/server/bin/
if [[ ! -d "${APP_HOME}/services/server/bin" ]]; then
  npm run build-server
fi

# build development client code in dist/
if [[ ! -d "${APP_HOME}/dist" ]]; then
  npm run build-dev
fi

# start server in debug mode
npm run server
