---
title: "API Overview"
weight: 130
---

The Voyager Explorer component has attributes and methods that help you to externally configure and control it. This makes it easier to integrate into your own custom application.


### Loading Attributes
These attributes configure the initial object load of the component.

| Name         | Options           | Description                                                                                                         |
|--------------|-------------------|---------------------------------------------------------------------------------------------------------------------|
| root         | Valid URL		   | Path to the root folder (base folder for all assets)                                                                |
| document     | Valid URL         | Path to the [SVX scene descriptor JSON document](https://smithsonian.github.io/dpo-voyager/document/) to load (relative to the root folder).                                                    |
| model        | Valid URL         | URL of a model (supported formats: gltf, glb) to load and display at startup (relative to the root folder).         |
| geometry     | Valid URL         | URL of a geometry (supported formats: obj, ply) to load and display at startup (relative to the root folder).       |
| texture      | Valid URL         | If a geometry URL is given, optional URL of a color texture to use with the geometry (relative to the root folder). |
| dracoRoot	   | Valid URL		   | Absolute path to the Draco compression libraries used for glTF models.

### UI Attributes

| Name     	| Options       | Description                                                                                                         |
|-----------|-------------------|---------------------------------------------------------------------------------------------------------------------|
| uiMode    | Any combination of [EUIElements](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/components/CVInterface.ts) . Use "\|" to concatenate multiple options. E.g. "none\|title" to show just the scene title.    | Configures what UI elements should be visible on initial component render. By default all elements are shown.                                                               |

### UI Methods

| Name     				 			   			| Parameters       							   | Description                                                                                         |
|-----------------------------------------------|----------------------------------------------|---------------------------------------------|
| setBackgroundStyle(style)    				    | style: Solid, LinearGradient, RadialGradient | Sets the style of the component background.  |
| setBackgroundColor(color0, color1[optional])  | color0, color1: any valid css color    	   | Sets the color of the component background. Optional second color for gradient styles.  |


### Feature Methods
These methods engage Voyager functionality without the native UI.

| Name     				 | Parameters       | Description                                                                                         |
|------------------------|------------------|----------------------------------------------------------------------------------------------------|
| toggleAnnotations()    | None    			| On/off toggle for visibility of model annotations (if available)  |
| toggleReader()    	 | None    			| On/off toggle for the article reader.  |
| toggleTours()    		 | None    			| On/off toggle for the tour functionality UI.  |
| toggleTools()    		 | None    			| On/off toggle for the extended tools panel at the bottom of the UI  |
| enableAR()		     | None    			| Requests an AR session (if available, outcome depends on platform) **\*Due to browser security precautions, this will not work if the component is served in a cross-domain iframe**  |

### Navigation Methods
Methods for external control over camera properties and navigation.

| Name     				 		| Parameters       							   | Description                                                                                         |
|-------------------------------|----------------------------------------------|----------------------------------------------|
| setCameraOrbit(yaw, pitch)    | yaw, pitch: angle in degrees 			   	   | Sets yaw and pitch of orbit navigation.      |
| getCameraOrbit()  			| None								    	   | Returns an array [yaw, pitch] in radians.    |

### Misc Methods

| Name     				 		| Parameters       	   | Description                                                                                         |
|-------------------------------|----------------------|--------------------------------------------------|
| getArticles()				    | None 			   	   | Returns an array of [Article data objects](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/models/Article.ts) with properties of each article associated with the current scene.      |