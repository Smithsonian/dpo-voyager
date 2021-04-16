---
title: Usage
summary: Embed the Voyager Explorer in your own website.
weight: 110
---

## Web Component

The Voyager 3D Explorer can be used as a standalone application, or it can be embedded alongside other elements in an HTML page. Sample HTML documents are provided as part of the distributable package.

The application can be launched via the custom web component `<voyager-explorer>`, or by creating an instance of the application class and
attaching it to a DOM element.

Both the custom HTML element and the application class can be customized using the following properties. Properties can be provided as URL variables, as attributes of the custom HTML element, or by providing a properties object as an argument to the application constructor.

### Properties
See the [API documentation](../api/) for the full list of configurable attributes.


### Example 1: launching the Explorer via custom element
{{<highlight html>}}
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <title>Voyager Explorer</title>

        <link rel="shortcut icon" type="image/png" href="favicon.png"/>
        
        <script src="https://code.jquery.com/pep/0.4.3/pep.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/104/three.min.js"></script>

        <link rel="stylesheet" href="css/voyager-explorer.min.css">
    </head>
    <body>
        <voyager-explorer root="/data/" document="my_document.json"></voyager-explorer>
        <script type="text/javascript" src="js/voyager-explorer.dev.js"></script>
    </body>
</html>
{{</highlight>}}


### Example 2: launching the Explorer via application class
{{<highlight html>}}
<!DOCTYPE html>
<html>
    <head>
        ...same as above...
    </head>
    <body>
        <script type="text/javascript" src="js/voyager-explorer.min.js"></script>
        <script>
           new VoyagerExplorer(document.body, {
               root: "/data/",
               document: "my_document.json"
           }); 
        </script>
    </body>
</html>
{{</highlight>}}