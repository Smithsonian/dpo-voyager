# DOCKER IMAGE SETUP SCRIPT
# INSTALL UBUNTU WITH NODE.JS

FROM ubuntu:20.04

# Set environment variables
ENV USER voyager
ENV NVM_DIR "/home/$USER/.nvm"
ENV NVM_VERSION 0.35.1
ENV NODE_VERSION 16.20.2
ENV NPM_VERSION 7.5.6

# Copy script files to container
COPY *.sh /var/scripts/
WORKDIR /var/scripts

# Install necessary packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        vim \
        wget \
        dos2unix \
        curl \
        bzip2 \
        git \
        build-essential \
        ca-certificates \
        libssl-dev \
        python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Change line endings to Unix format
RUN dos2unix ./*.sh

# Create user and directory for application
RUN useradd -m "$USER" && \
    mkdir /app && \
    chown -R "$USER":"$USER" /app

# Switch to non-root user
USER $USER

RUN git config --global --add safe.directory /app

# Install Node.js using NVM
RUN curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v$NVM_VERSION/install.sh" | bash && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" && \
    nvm install "$NODE_VERSION" && \
    nvm use "$NODE_VERSION" && \
    nvm alias default "$NODE_VERSION" && \
    npm install -g "npm@$NPM_VERSION"

ENV PATH="/home/$USER/.nvm/versions/node/v$NODE_VERSION/bin:$PATH"

# Verify Node.js and npm installation
RUN node --version && \
    npm --version

# Add helpful bash aliases
RUN echo "alias ll='ls -la'" >> "/home/$USER/.bashrc" && \
    echo "alias ..='cd ..'" >> "/home/$USER/.bashrc"

# Set working directory
WORKDIR /app

# Define entrypoint
CMD ["/bin/bash", "/var/scripts/start.sh"]
