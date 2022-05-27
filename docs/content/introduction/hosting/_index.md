---
title: "How To: Host a prebuilt Voyager release"
summary: Hosting a release package
weight: 106
---

## Installation

Every Voyager release comes with a pre-built distribution package with everything you need to host Voyager yourself.

**If you are just interested in using Voyager on your site and have no need to host or customize it, please take a look at [How To: Embed a model on your site]().**

Download the distribution package for the [latest Voyager release](https://github.com/Smithsonian/dpo-voyager/releases/latest). Unzip it and copy all of the files to a directory on your web server.

**Note:** The prebuilt Voyager package requires WebDAV enabled file server access to any content for the Story component to save changes directly to disk. If this is not available to you, 
try [installing from source](../../introduction/installation/) which includes a simple server, or ['Standalone' mode](../../story/overview/) when using Story.

## Use

The Voyager distributions package comes with a number of HTML example pages. You can modify these pages to meet your needs or access them as-is via your server to use the respective tool.

```
voyager-explorer.html      # HTML page displaying Voyager Explorer, production build
voyager-explorer-dev.html  # HTML page displaying Voyager Explorer, development build
voyager-mini.html          # HTML page displaying Voyager Explorer Mini, production build
voyager-mini-dev.html      # HTML page displaying Voyager Explorer Mini, development build
voyager-story.html         # HTML page displaying Voyager Story authoring tool, production build
voyager-story-dev.html     # HTML page displaying Voyager Story authoring tool, development build
```

Each page also comes with a 'dev' version that prints debug information to the console.

For instructions on how to setup and use each tool, please see that [Voyager Explorer](../../explorer/) and [Voyager Story](../../story/) documentation sections.

**Note:** Voyager Explorer is configured by default to access certain resource online. If you run the component through the provided page (or any other method) offline, you may receive errors or missing content.
Please see [How To: Use the component offline](../../explorer/offline/) for steps to configure Explorer for offline use.