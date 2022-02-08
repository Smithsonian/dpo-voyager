---
title: "How To: Use the component offline"
summary: Using the Voyager Explorer component offline
weight: 130
---

You may want to use Voyager Explorer in a gallery setting where no internet connection is available or want to run the component offline for testing and debugging purposes.
The default configuration of the component relies on a few online resources so there are a few steps to take to use it in this way.

### Configuring the Explorer component for offline use

**1. Make sure all of the resources are installed locally**

You can do this by downloading a pre-built package ([How To: Host a prebuilt Voyager release](../../introduction/hosting/))
or installing and building from scratch ([How To: Install and Build Voyager](../../introduction/installation/)) which will also provide a local web server if needed.

**2. Point to local include files**

The documentation and html launch pages included with the distribution package point to online locations for the files that need to be included in a webpage 
that contains the Voyager Explorer component. 

These files are also present in the distribution package and will need to be referenced locally. See below for an example of these includes
with relative paths that assumes the default folder structure of a release package.

{{<highlight html>}}
<link rel="shortcut icon" type="image/png" href="./favicon.png"/>
<link href="fonts/fonts.css" rel="stylesheet">
<script src="js/voyager-explorer.dev.js"></script>
{{</highlight>}}

**3. Set tag attributes to local paths**

Several attributes will also need to be configured with local paths.

The 'dracoRoot' and 'resourceRoot' attributes point to the locations of the Draco libraries and component resources, respectively. The 'root' attribute will also need to point at 
a local copy of your scene file. The example below assumes default distro folder structure.

{{<highlight html>}}
<voyager-explorer dracoRoot="js/draco/" resourceRoot="./" root="models/chair/"></voyager-explorer>
{{</highlight>}}