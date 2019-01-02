# Voyager Story

## Getting Started

The Voyager 3D Story tool is designed to be used as a single page client-side application.
Sample HTML documents are provided as part of the distributable package.

The application can be launched via custom HTML element, or by creating an instance of the application class and
attaching it to a DOM element.

Both the custom HTML element and the application class can be customized using the following properties.
Properties can be provided as URL variables, as attributes of the custom HTML element, or by providing a
properties object as an argument to the application constructor.

### Properties

| Property     | Type/Values                      | Description                                                                                               |
|--------------|----------------------------------|-----------------------------------------------------------------------------------------------------------|
| presentation | String/URL                       | URL of the presentation to load and display at startup.                                                   |
| template     | String/URL                       | If an item, model or geometry URL is given, optional URL of a presentation template to use with the item. |
| item         | String/URL                       | URL of the item to load and display at startup.                                                           |
| model        | String/URL                       | URL of a model (supported formats: gltf, glb) to load and display at startup.                             |
| geometry     | String/URL                       | URL of a geometry (supported formats: obj, ply) to load and display at startup.                           |
| texture      | String/URL                       | If a geometry URL is given, optional URL of a color texture to use with the geometry.                     |
| quality      | "thumb", "low", "medium", "high" | When loading a model or geometry, the quality level to set for the asset.                                 |
| name         | String/URL                       | When loading a model or geometry, the name of the created item. It will later be used when writing the item back to the server. |
| referrer     | String/URL                       | The page URL to navigate to when the user exits the story tool. |
| mode         | "prep", "author"                 | Launch in "prep" mode to edit/QC an item. Launch in "author" mode to author items and presentations. |
| expert       | boolean                          | In expert mode, additional developer tools are available. |

### Example 1: launching the Explorer via custom HTML element
```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Voyager Explorer</title>

        <link rel="shortcut icon" type="image/png" href="favicon.png"/>

        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/fontawesome.min.css">
        <link rel="stylesheet" href="css/fontawesome-solid.min.css">
        <link rel="stylesheet" href="css/voyager-explorer.dev.css">
        
        <script src="https://code.jquery.com/pep/0.4.3/pep.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/99/three.js"></script>
    </head>
    <body>
        <voyager-explorer presentation="my_presentation.json"></voyager-explorer>
        <script type="text/javascript" src="js/voyager-explorer.dev.js"></script>
    </body>
</html>
```

### Example 2: launching the Explorer via application class
```html
<!DOCTYPE html>
<html>
    <head>
        ...see above...
    </head>
    <body>
        <script>
           new VoyagerExplorer(document.body, {
               presentation: "my_presentation.json"
           }); 
        </script>
        <script type="text/javascript" src="js/voyager-explorer.dev.js"></script>
    </body>
</html>
```