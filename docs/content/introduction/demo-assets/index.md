---
title: Demo Assets
summary: Installation of the provided Voyager demo assets
weight: 110
---

## Demo Assets

For getting you started easily, Voyager comes with a set of demo assets.
Please have a look at the enclosed readme, the disclaimer and the terms of use before using the assets.

The following installation guide assumes you've already installed and started the Voyager development server.

#### Installation

In your Voyager project folder, create a new folder named `files` and navigate into it.

```bash
cd <my_project_dir>
mkdir files
cd files
```

Now fetch the demo assets from GitHub and unzip them:

```bash
curl -L -o assets.zip https://github.com/Smithsonian/dpo-voyager/releases/download/v0.7.0/voyager-demo-assets.zip
unzip assets.zip
```

Your `files` folder should now contain the following:

```
assets.zip
DISCLAIMER.txt
models           <- this folder contains the demo models
README.txt
TERMS_OF_USE.txt
```

Next, open your web browser (Chrome preferred) and navigate to one of the following URLs. Note that the host and port
may be different depending on where you installed the Voyager development server.

###### Voyager Explorer (the viewer)
```
http://localhost:8000/voyager-explorer-dev.html?root=models/tusk/&document=tusk.svx.json
http://localhost:8000/voyager-explorer-dev.html?root=models/vase/&document=vase.svx.json
http://localhost:8000/voyager-explorer-dev.html?root=models/chair/&document=chair.svx.json
http://localhost:8000/voyager-explorer-dev.html?root=models/ewer/&document=ewer.svx.json
```

###### Voyager Story (the authoring tool), quality inspection mode
```
http://localhost:8000/voyager-story-dev.html?mode=qc&root=models/tusk/&document=tusk.svx.json
http://localhost:8000/voyager-story-dev.html?mode=qc&root=models/vase/&document=vase.svx.json
http://localhost:8000/voyager-story-dev.html?mode=qc&root=models/chair/&document=chair.svx.json
http://localhost:8000/voyager-story-dev.html?mode=qc&root=models/ewer/&document=ewer.svx.json
```

###### Voyager Story (the authoring tool), authoring mode
```
http://localhost:8000/voyager-story-dev.html?mode=author&root=models/tusk/&document=tusk.svx.json
http://localhost:8000/voyager-story-dev.html?mode=author&root=models/vase/&document=vase.svx.json
http://localhost:8000/voyager-story-dev.html?mode=author&root=models/chair/&document=chair.svx.json
http://localhost:8000/voyager-story-dev.html?mode=author&root=models/ewer/&document=ewer.svx.json
```
