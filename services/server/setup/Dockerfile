# DOCKER IMAGE SETUP SCRIPT
# INSTALL UBUNTU WITH NODE.JS
FROM ubuntu:20.04

RUN \
  apt-get update && \
  apt-get upgrade -y && \
  apt-get autoremove -y && \
  apt-get install -y \
     apt-utils \
     build-essential \
     bzip2 \
     curl \
     dos2unix \
     git \
     libssl-dev \
     python \
     vim \
     wget && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Install NVM
# NVM_DIR is a global variable used during NVM's install
ENV NVM_DIR=/opt/nvm
ENV _NVM_VERSION=0.35.1
ENV _NVM_SHA256SUM=3da9cbca0e07b8075ed6477fdb1b6ca88d4504556b349a4f809063b49bda8715
RUN \
  mkdir "${NVM_DIR}" && \
  cd /tmp && \
  curl -O "https://raw.githubusercontent.com/nvm-sh/nvm/v${_NVM_VERSION}/install.sh" && \
  echo "${_NVM_SHA256SUM} install.sh" | \
    sha256sum --check && \
  . ./install.sh && \
  rm ./install.sh && \
  echo "source ${NVM_DIR}" >> /etc/profile.d/99-nvm.sh

# Install Node
ENV _NODE_VERSION=16.20.2
RUN \
  . "${NVM_DIR}/nvm.sh" && \
  nvm install "${_NODE_VERSION}" && \
  nvm use "${_NODE_VERSION}" && \
  nvm alias default "${_NODE_VERSION}"

# Prevent Git from complaining about mismatched UIDs in /app
RUN git config --global --add safe.directory /app

COPY ./docker-entrypoint.sh /

WORKDIR /app
CMD ["/docker-entrypoint.sh"]
