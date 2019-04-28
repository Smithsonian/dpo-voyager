# Voyager
### Next Generation 3D editing and viewing tool suite

Suite of browser-based 3D tools, consisting of

 * Voyager Story - quality control, authoring of presentations, annotations, articles, tours
 * Voyager Explorer - feature-rich 3D viewer component
 * Voyager Mini - bare-bone 3D viewer component, optimized for size and loading speed

### Installation

#### Prerequisites

Important: currently we only support building the tool suite on **Linux** environments.

Before cloning the Github project, please install the following tools
 * [Node.js](https://nodejs.org/en/) - required
 * [Docker](https://www.docker.com/) - optional
 * [Docker Compose](https://docs.docker.com/compose/install/) - optional

```$bash
git clone --recurse-submodules https://github.com/smithsonian/dpo-voyager
```

For development, if you have Docker and Docker Compose installed, you can run the development server in a container.
To build the Docker image and start the container with the development server, run
```$bash
npm run up
```
This also watches all source folders for changes and triggers the Typescript compilation and Webpack build whenever
source code changes are detected.

### Distribution Build

The following command creates a `dist` folder with all required assets, scripts and sample HTML documents that show
how to embed the explorer in a custom page.

To create a production build, with minified scripts and CSS:
```$bash
npm run build-prod
```

To create a development build, with source code comments and source maps:
```$bash
npm run build-dev
```

#### Structure of the `dist` folder with both development and production build output
```$bash
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

### Usage

 * Getting started with [Voyager Explorer](/doc/manual/explorer-start.md)
 * Getting started with [Voyager Story](/doc/manual/story-start.md)

### Pre-Release Software
This software is pre-release and provided "as is". Breaking changes can and will happen during development.

### License Information
Copyright 2019 Smithsonian Institution.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use the content of this repository except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

#### 3rd Party Components

[License overview](./3RD_PARTY_LICENSES.txt) of included 3rd party libraries.

##### Font Awesome

This project embeds both free and pro icons from the [Font Awesome](https://fontawesome.com) icon collection.  
Applicable license: https://fontawesome.com/license.

