---
title: Overview
summary: Voyager Story - authoring tool for 3D experiences
weight: 100
---

_Voyager Story_ is the creation and authoring application of the Voyager tool suite. The application can be used to create and author _Voyager SVX Documents_. Documents are files in JSON format containing the description of a Voyager scene or experience.
 
 _Voyager Story_ can be operated in two different modes. Each mode offers a number of tasks.

## QC Mode

This mode is aimed at 3D technicians. After a model has been digitized and processed into derivative assets ready for web consumption, QC gives you the following tasks and tools:

- Pose task: center the model and put it into upright position
- Capture task: take a 2D snapshot of the model
- Derivative inspection task: inspect the quality of the meshes and textures at various levels of detail
- Settings task: adjust parameters such as material settings  

```
QC mode is enabled by supplying the mode=qc URL parameter.
```

## Authoring Mode

The authoring tools can be used by curators to stage the model(s) using lights, cameras and props, and to add content (annotations, articles, and tours) to the experience. The following tasks are available in authoring mode:

- Annotations task: add annotations to specific 3D locations on a model
- Articles task: write and edit articles (documents with text and media), and connect them with annotations and models
- Tours task: create guided tours which guide through the experience in multiple steps
- Settings task: adjust parameters such as material settings

```
Authoring mode is enabled by supplying the mode=author URL parameter.
```

## Expert Mode

_Voyager Story_ actually offers a third mode, called expert mode, which shows all available tasks at once. It also provides a detailed view of all document elements and settings. The expert mode is aimed at - well - experts and developers.

```
Expert mode is enabled by supplying the mode=expert URL parameter.
``` 