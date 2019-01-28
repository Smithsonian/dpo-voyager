# Voyager Explorer

## Getting Started

The Voyager 3D Explorer can be used as a standalone application, or it can be embedded alongside other elements
in an HTML page. Sample HTML documents are provided as part of the distributable package.

The application can be launched via custom HTML element, or by creating an instance of the application class and
attaching it to a DOM element.

Both the custom HTML element and the application class can be customized using the following properties.
Properties can be provided as URL variables, as attributes of the custom HTML element, or by providing a
properties object as an argument to the application constructor.

### Properties

| Property     | Type/Values       | Description                                                                                               |
|--------------|-------------------|-----------------------------------------------------------------------------------------------------------|
| presentation | String/URL        | URL of the presentation to load and display at startup.                                                   |
| item         | String/URL        | URL of the item to load and display at startup.                                                           |
| model        | String/URL        | URL of a model (supported formats: gltf, glb) to load and display at startup.                             |
| geometry     | String/URL        | URL of a geometry (supported formats: obj, ply) to load and display at startup.                           |
| texture      | String/URL        | If a geometry URL is given, optional URL of a color texture to use with the geometry.                     |
| quality      | "Thumb", "Low", "Medium", "High", "Highest" | For a model/geometry/texture: The quality level of the generated derivative.                              |
| template     | String/URL        | If an item, model or geometry URL is given, optional URL of a presentation template to use with the item. |
| base         | String            | Base name to use when generating new items or assets.                                                     |

### Example 1: launching the Explorer via custom HTML element
```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Voyager Explorer</title>

        <link rel="shortcut icon" type="image/png" href="favicon.png"/>
        
        <script src="https://code.jquery.com/pep/0.4.3/pep.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/100/three.js"></script>

        <link rel="stylesheet" href="css/voyager-explorer.dev.css">
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
        <script type="text/javascript" src="js/voyager-explorer.dev.js"></script>
        <script>
           new VoyagerExplorer(document.body, {
               presentation: "my_presentation.json"
           }); 
        </script>
    </body>
</html>
```