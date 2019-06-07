---
title: Getting started
summary: Installation and configuration
weight: 100
---


## Installation

#### Prerequisites

Important: currently we only support building the tool suite on **Linux**.

Before cloning the Github project, please install the following tools

 * [Node.js](https://nodejs.org/en/) - required
 * [Docker](https://www.docker.com/) - optional
 * [Docker Compose](https://docs.docker.com/compose/install/) - optional

Now clone the project from Github. Make sure not to forget the `--recurse-subomdules` option,
this also clones the dependent repositories.

```
git clone --recurse-submodules https://github.com/smithsonian/dpo-voyager
```

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


#### Installation without Docker

Without Docker, you need to install the NPM package dependencies manually.

```
npm install
```

## Distribution Build

Now you are ready to build the project.

The following commands create a `dist` folder with all required assets, scripts and sample HTML documents that show
how to embed the explorer in a custom page.

To create a production build, with minified scripts and CSS:
```
npm run build-prod
```

To create a development build, with source code comments and source maps:
```
npm run build-dev
```

Content of the `dist` folder after both `prod` and `dev` builds have been run
```
css/
fonts/
images/
js/
favicon.png
voyager-explorer.html
voyager-explorer-dev.html
voyager-mini.html
voyager-mini-dev.html
voyager-story.html
voyager-story-dev.html
```