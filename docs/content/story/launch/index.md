---
title: "How To: Launch the app"
summary: Embed and use Voyager Story in your own production pipeline.
weight: 110
---

**Currently, the only options for launching Voyager Story require hosting the application yourself in one of the ways described below.
If you are an end user with no access to this option, please contact us. We are working to host a publically accessible version of Story that end users can use without the need for any installation or setup.**


## Web Application

The Voyager 3D Story tool is designed to be used as a single page client-side application.
Sample HTML documents are provided as part of the distributable package.

The application can be launched via custom HTML element that can be customized using the following properties.
Properties can be provided as URL variables, as attributes of the custom HTML element, or by providing a
properties object as an argument to the application constructor.

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
| mode         | "QC", "Author", "Expert" | Launch in "qc" mode to edit/QC an item. Launch in "author" mode to author items and presentations. Launch in "expert" mode to get access to all tasks/for debugging |

### Example 1: launching the Story tool via custom HTML element
{{<highlight html>}}
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Voyager Story</title>

        <link rel="shortcut icon" type="image/png" href="favicon.png"/>
        <link href="/fonts/fonts.css" rel="stylesheet">
        
        <link href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js"></script>

        <link rel="stylesheet" href="css/voyager-story.min.css">
    </head>
    <body>
        <voyager-story presentation="my_presentation.json"></voyager-story>
        <script defer="defer" type="text/javascript" src="js/voyager-story.min.js"></script>
    </body>
</html>
{{</highlight>}}

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
