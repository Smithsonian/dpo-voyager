# DOCKER IMAGE SETUP SCRIPT
# INSTALL UBUNTU WITH NODE.JS

FROM ubuntu:latest

# Install provisioning and startup scripts
COPY *.sh /var/scripts/
WORKDIR /var/scripts

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get install -y apt-utils \
 && apt-get install -y dos2unix \
 && dos2unix *

# Run provisioning scripts
RUN bash -C './provision.sh'

# Set startup directory
WORKDIR /app

# Cleanup
RUN apt-get -y autoremove \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Entrypoint
CMD bash -C '/var/scripts/start.sh'