#!/bin/bash
# DOCKER IMAGE PROVISIONING SCRIPT
# INSTALL UBUNTU WITH NODE.JS

# Create application directory
mkdir /app

# Install utilities
apt-get install -y vim wget curl bzip2 git

# Install build essentials (required for NPM package compilation)
apt-get install -y build-essential libssl-dev python

# Install Ruby / Jekyll (required for local documentation compilation)
apt-get install -y ruby-full zlib1g-dev
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
gem install jekyll bundler

# Install NVM (node version manager)
cd ~
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install-nvm.sh
bash install-nvm.sh

# load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# install node.js
nvm install 10.15.3
nvm use 10.15.3
nvm alias default 10.15.3

# update npm
npm i -g npm

# Check node versions
node --version
npm --version

# some helpful bash aliases
cat <<EOF >> ~/.bash_aliases
alias ll='ls -la'
alias ..='cd ..'
EOF