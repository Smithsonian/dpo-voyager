---
title: "How To: Launch the app"
summary: Embed and use Voyager Story in your own production pipeline.
weight: 110
---

If you would like to host your own version of Voyager Story, check out the instructions below. **If you just want to use it to create a Voyage scene, try our 
publically accessible deployment of [Voyager Story Standalone](https://3d.si.edu/voyager-story-standalone).**

## Web Application

The Voyager 3D Story tool is designed to be used as a single page client-side application.
Sample HTML documents are provided as part of the distributable package.

The application can be launched via custom HTML element that can be customized using the following properties.
Properties can be provided as URL variables or as attributes of the custom HTML element.

**Note:** If you are having trouble deploying Voyager Story or are not able to supply a file server for it, try "Standalone" mode described below.

### Properties

| Property     | Type/Values       | Description                                                                                               |
|--------------|-------------------|-----------------------------------------------------------------------------------------------------------|
| root         | String/URL        | Path to the root folder (base folder for all assets)                                                                |
| document     | String/URL        | Path to the JSON document to load (relative to the root folder).                                                    |
| model        | String/URL        | URL of a model (supported formats: gltf, glb) to load and display at startup (relative to the root folder).         |
| geometry     | String/URL        | URL of a geometry (supported formats: obj, ply) to load and display at startup (relative to the root folder).       |
| texture      | String/URL        | If a geometry URL is given, optional URL of a color texture to use with the geometry (relative to the root folder). |
| quality      | "Thumb", "Low", "Medium", "High", "Highest" | For a model/geometry/texture: The quality level of the generated derivative.                              |
| referrer     | String/URL        | The page URL to navigate to when the user exits the story tool. |
| mode         | "QC", "Edit", "Expert", "Standalone" | Launch in: "qc" mode to edit/QC an item, "edit" mode to author items and presentations, "expert" mode to get access to all tasks/for debugging, "standalone" mode for scene creation without backend storage. |

### Example 1: launching the Story tool via custom HTML element
{{<highlight html>}}
<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Voyager Story</title>
	
    <link rel="shortcut icon" type="image/png" href="favicon.png" />
    <link href="/fonts/fonts.css" rel="stylesheet">
	
    <script defer="defer" src="js/voyager-story.min.js"></script>
    <link href="css/voyager-story.min.css" rel="stylesheet">
</head>

<body>
    <voyager-story></voyager-story>
</body>

</html>
{{</highlight>}}

Then provide the root path to your scene folder as well as the document name as url params. 

An example url using the default Voyager distribution package, WebDAV server,
and [demo assets](../../introduction/demo-assets/) would look something like this:

```
http://localhost:8000/voyager-story-dev.html?mode=qc&root=models/tusk/&document=tusk.svx.json
```

<!--
### Example 2: launching the Story tool via application class
{{<highlight html>}}
<!DOCTYPE html>
<html>
    <head>
        ...same as above...
    </head>
    <body>
        <script type="text/javascript" src="js/voyager-story.dev.js"></script>
        <script>
           new VoyagerStory(document.body, {
               presentation: "my_presentation.json"
           }); 
        </script>
    </body>
</html>
{{</highlight>}}
-->
