---
title: "API Overview"
summary: A description of the attributes and methods that help you to externally configure and control Voyager Explorer.
weight: 140
---

The Voyager Explorer component has attributes and methods that help you to externally configure and control it. This makes it easier to integrate into your own custom application.


### Loading Attributes
These attributes configure the initial object load of the component.

| Name         | Options           | Description                                                                                                         |
|--------------|-------------------|---------------------------------------------------------------------------------------------------------------------|
| root         | Valid URL		   | Path to the root folder (base folder for all assets)                                                                |
| document     | Valid URL         | Path to the [SVX scene descriptor JSON document](https://smithsonian.github.io/dpo-voyager/document/) to load (relative to the root folder).                                                    |
| model        | Valid URL         | URL of a model (supported formats: gltf, glb) to load and display at startup (relative to the root folder). **Note:** Uncommon - Used when loading a model with no SVX 'document' specified.    |
| geometry     | Valid URL         | URL of a geometry (supported formats: obj, ply) to load and display at startup (relative to the root folder). **Note:** Uncommon - Used when loading a model with no SVX 'document' specified.       |
| texture      | Valid URL         | If a geometry URL is given, optional URL of a color texture to use with the geometry (relative to the root folder). |
| dracoRoot	   | Valid URL		   | Path to the Draco compression libraries used for glTF models. Defaults to Google CDN.								 |
| resourceRoot	   | Valid URL	   | Path to root folder where the Voyager assets are stored (fonts,images,language). Defaults to jsDelivr CDN.			 |
| bgColor	   | Valid CSS colors  | Sets the color of the component background. Optional second color for gradient styles. Ex: "red" or "red rgb(0,255,0)" |
| bgStyle	   | Solid, LinearGradient, RadialGradient | Sets the style of the component background. |
| controls	   | True, False	   | Enables/Disables user-driven camera controls. Defaults to 'True'. Useful if driving navigation from external code.  |
| prompt	   | True, False	   | Enables/Disables user interaction prompt. Defaults to 'True'. Always false if 'controls' is false. |
| reader	   | True, False	   | Enables/Disables visibility of reader UI. Defaults to 'True'. Overrides activation triggers like toggleReader()  |
| lang 		   | valid [ISO 639-1](https://www.loc.gov/standards/iso639-2/php/code_list.php) code | Sets the active language of the component (where available) |
| dragdrop	   | | If present, enables dragging and dropping files into Story. Enabled by default in Standalone mode. **Note:** Voyager does *not* handle access control. Enabling this feature increases the importance of securing your server-side I/O. 

### UI Attributes

| Name     	| Options       | Description                                                                                                         |
|-----------|-------------------|---------------------------------------------------------------------------------------------------------------------|
| uiMode    | Any combination of [EUIElements](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/components/CVInterface.ts) . Use "\|" to concatenate multiple options. E.g. "none\|title" to show just the scene title.    | Configures what UI elements should be visible on initial component render. By default all elements are shown.                                                               |

### UI Methods

| Name     				 			   			| Parameters       							   | Description                                                                                         |
|-----------------------------------------------|----------------------------------------------|---------------------------------------------|
| setBackgroundStyle( style )    				    | style: Solid, LinearGradient, RadialGradient | Sets the style of the component background.  |
| setBackgroundColor( color0, color1[optional] )  | color0, color1: any valid css color    	   | Sets the color of the component background. Optional second color for gradient styles.  |


### Feature Methods
These methods engage Voyager functionality without the native UI.

| Name     				 | Parameters       | Description                                                                                         |
|------------------------|------------------|----------------------------------------------------------------------------------------------------|
| toggleAnnotations()    | None    			| On/off toggle for visibility of model annotations (if available)  |
| toggleReader()    	 | None    			| On/off toggle for the article reader.  |
| toggleTours()    		 | None    			| On/off toggle for the tour functionality UI.  |
| toggleTools()    		 | None    			| On/off toggle for the extended tools panel at the bottom of the UI  |
| toggleMeasurement()	 | None				| On/off toggle for visibility of the object measurement tool.  |
| enableAR()		     | None    			| Requests an AR session (if available, outcome depends on platform) **\*Due to browser security precautions, this will not work if the component is served in a cross-domain iframe**  |
| setActiveAnnotation( id )| id: unique id string | Activates the annotation with the provided id. Opens annotation content where style permits.   |
| setActiveArticle( id )| id: unique id string | Activates the article with the provided id. Bad/missing id opens article list.   |
| setTourStep( tourIdx, stepIdx, interpolate[optional] ) | tourIdx, stepIdx: valid integer - interpolate: boolean | Activates the scene state found at the provided tour and step index. Optional 'interpolate' parameter to control if transition is animated. Defaults to true. |
| setLanguage( id )		 | id: valid [ISO 639-1](https://www.loc.gov/standards/iso639-2/php/code_list.php) code string | Changes the active Voyager language to the supplied id if available in the current scene.  |

### Navigation Methods
Methods for external control over camera properties and navigation.

| Name     				 		| Parameters       							   | Description                                                                                         |
|-------------------------------|----------------------------------------------|----------------------------------------------|
| setCameraOrbit( yaw, pitch )    | yaw, pitch: angle in degrees 			| Sets yaw and pitch of orbit navigation.      |
| getCameraOrbit( type[optional] )| type: min, max, active (default)				| Returns an array [yaw, pitch] in radians.    |
| setCameraOffset( x, y, z )    	| x, y, z: coordinate in scene units 		| Sets offset of orbit navigation.      |
| getCameraOffset( type[optional] )| type: min, max, active (default)				| Returns an array [x, y, z] in scene units. |

### Misc Methods

| Name     				 		| Parameters       	   | Description                                                                                         |
|-------------------------------|----------------------|--------------------------------------------------|
| getArticles()				    | None 			   	   | Returns an array of [Article data objects](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/models/Article.ts) with properties of each article associated with the current scene.      |
| getAnnotations()				| None				   | Returns an array of [Annotation data objects](https://github.com/Smithsonian/dpo-voyager/blob/d3d63fedeb595ac7b664a2b2e081b691bbdc3084/source/client/schema/model.ts#L63) for the current scene.			|

### Events

| Name     				 		| Description                                                                                         |
|-------------------------------|------------------------------------------------------------------------|
| annotation-active		| This event is fired when the active state of an annotation changes. event.detail will contain the ID of the activated annotation, or will be empty if no annotation is active.|
| model-load			| This event fires every time a model finishes loading. event.detail will contain the quality [(EDerivativeQuality)](https://github.com/Smithsonian/dpo-voyager/blob/master/source/client/schema/model.ts) of the loaded model. This will likely fire multiple times depending on the number of derivatives loaded and unloaded.|