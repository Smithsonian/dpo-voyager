---
title: Overview
summary: Voyager Story - authoring tool for 3D experiences
weight: 100
---

_Voyager Story_ is the creation and authoring application of the Voyager tool suite. The application can be used to create and author _Voyager SVX Documents_. Documents are files in JSON format containing the description of a Voyager scene or experience.

'Articles' are Voyager objects that present long-form text and imaged about an object to the viewer. Article assets created by _Voyager Story_ are stored in a './articles' folder relative to the loaded SVX scene file.

'Annotations' are small snippets of text that describe a specific point on the surface of a 3D object. _Voyager Story_ offers several different annotation styles to choose from.
 
 _Voyager Story_ can be operated in several different modes. Each mode offers a number of tasks.
 
 **Note:** If you are having trouble deploying _Voyager Story_ or are not able to supply a file server for it, try Standalone mode described below.

## QC Mode

This mode is aimed at 3D technicians. After a model has been digitized and processed into derivative assets ready for web consumption, QC gives you the following tasks and tools:

- Pose task: center the model and put it into upright position
- Capture task: take a 2D snapshot of the model
- Derivative inspection task: inspect the quality of the meshes and textures at various levels of detail
- Settings task: adjust parameters such as material settings  

```
QC mode is enabled by supplying the mode=qc URL parameter.
```

## Edit Mode

Along with the QC tasks, edit mode allow authoring tools to be used to stage the model(s) using lights, cameras and props, and to add content (annotations, articles, and tours) to the experience. The following tasks are available in edit mode:

- Annotations task: add annotations to specific 3D locations on a model
- Articles task: write and edit articles (documents with text and media), and connect them with annotations and models
- Tours task: create guided tours which guide through the experience in multiple steps

```
Edit mode is enabled by supplying the mode=edit URL parameter.
```

## Expert Mode

_Voyager Story_ actually offers a third mode, called expert mode, which shows all available tasks at once. It also provides a detailed view of all document elements and settings. The expert mode is aimed at - well - experts and developers.

```
Expert mode is enabled by supplying the mode=expert URL parameter.
``` 

## Standalone Mode

By default, _Voyager Story_ requires a WebDAV file server backend to facilitate saving Voyager files directly to your permanent storage location. If you spin up Voyager from the source ([instructions here](../../introduction/installation/))
 a simple server is included. Otherwise, you are responsible for appropriately accessible file storage. 
 
Standalone mode removes the file server requirement by saving Voyager scenes in browser memory and gives you the
 option to download the complete package directly to your machine. You can try out our deployment of it here: [Voyager Standalone](https://3d.si.edu/voyager-story-standalone)
 
```
Standalone mode is enabled by supplying the mode=standalone URL parameter.
```