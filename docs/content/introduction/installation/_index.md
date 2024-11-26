---
title: "How To: Install and Build Voyager"
summary: Installation and configuration
weight: 105
---

## Installation

This document describes how to install a local development server, and build the source code for development and production.

**If you are just interested in using Voyager on your site and have no need to host or customize it, please take a look at [How To: Embed a model on your site](../../explorer/usage/).**

The Voyager development environment can be run either directly in a suitable Linux environment (tested on Ubuntu Server 20.04),
or in a Docker container. If you already have Docker and Docker Compose installed, we highly recommend installing in a container.

#### Prerequisites

Operating system for direct installation: **Linux only** (tested on Ubuntu server 20.04).

Before cloning the Github project, please install the following tools

 * [Node.js](https://nodejs.org/en/) - required
 * [Docker](https://www.docker.com/) - required for installation in a Docker container
 * [Docker Compose](https://docs.docker.com/compose/install/) - V2 required for installation in a Docker container

Now create a project folder and clone the project from Github. Make sure not to forget the `--recurse-submodules` option,
this also clones the required submodules.

**Tip:** Make sure your project files are not owned by root/Administrator to avoid permissions issues down the line!

```
mkdir <my_project_dir>
cd <my_project_dir>
git clone --recurse-submodules https://github.com/smithsonian/dpo-voyager .
```

Copy and rename the `.env.template` file:

```
cp .env.template .env
```

Now edit the environment variables in `.env` in your editor of choice to reflect your local configuration. To edit using
vim enter:

```
vim .env
```

Make sure you change the server port if necessary.


#### Dockerized environment

For development, if you have Docker and Docker Compose installed, you can run the development server in a container.
To build the Docker image and start the container with the development server, run
```
npm run up
```
This also watches all source folders for changes and triggers the Typescript compilation and Webpack build whenever
source code changes are detected.

Once you are done, shut down the development server.
```
npm run down
```

To open a shell on the running server container, enter
```
npm run bash
```

##### Manual builds for development and production

First start the development server with `npm run up`, then connect to the container with `npm run bash`. On the
container shell, enter
``` 
npm run build-dev       # triggers a development build
npm run build-prod      # triggers a production build
```
- The development build preserves source code comments and comes with source code maps
- The production build generates minified scripts and CSS

Note that you must run the build commands from within the docker container.  
Build output can be found in the project's `dist` folder, see below.

#### Installation on Linux, without Docker

_Note: Due to the variety of  operating systems, we strongly recommend to run the dockerized environment.
This guarantees a standardized development environment._

Without Docker, you need to install the NPM package dependencies manually. 

```
npm install
```

Now you are ready to build the project. The following command builds the development server.

```
npm run build-server
```

If you want to specifically create a development or production build, use the following commands.

```
npm run build-dev
npm run build-prod
```

#### Location of build output

Build output can be found in the project's `dist` folder. It's content after both `prod` and `dev` builds have been run:

```
css/                       # style sheets
fonts/                     # web fonts
images/                    # images and logos
js/                        # client-side Javascript for all applications
favicon.png
voyager-explorer.html      # HTML page displaying Voyager Explorer, production build
voyager-explorer-dev.html  # HTML page displaying Voyager Explorer, development build
voyager-mini.html          # HTML page displaying Voyager Explorer Mini, production build
voyager-mini-dev.html      # HTML page displaying Voyager Explorer Mini, development build
voyager-story.html         # HTML page displaying Voyager Story authoring tool, production build
voyager-story-dev.html     # HTML page displaying Voyager Story authoring tool, development build
```