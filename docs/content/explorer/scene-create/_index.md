---
title: "How To: Create a scene file"
summary: Creating a scene for use with Voyager Explorer
weight: 120
---

The Voyager Explorer component uses a custom file format to describe the scene that your 3D assets are displayed in called SVX. It is JSON formatted and typically ends in .svx.json.

This file is key to an Explorer experience as it describes the lighting, camera view, scale, annotations, tours, articles, and many other things.

Once you have a working scene file, see [How To: Use the app](../../story/usage/) for instructions on how to customize your scene.

### How do I create an SVX scene file for my asset?

**Option 1: Modify an example**

The quickest way to get a functional SVX file is to take an example file and modify it to your needs.
You can use a [fully-featured example]() as your base, or start with the minimal example below.

{{<highlight json>}}
{
    "asset": {
        "type": "application/si-dpo-3d.document+json",
        "version": "1.0",
        "generator": "Cook",
        "copyright": "(c) Smithsonian Institution. All rights reserved."
    },
    "scene": 0,
    "scenes": [
        {
            "name": "Scene",
            "units": "mm",
            "nodes": [
                0
            ]
        }
    ],
    "nodes": [
        {
            "name": "Coral_USNM_344",
            "model": 0
        }
    ],
    "models": [
        {
            "units": "mm",
            "derivatives": [
                {
                    "usage": "Web3D",
                    "quality": "Thumb",
                    "assets": [
                        {
                            "uri": "usnm_344-combined-20m-150k-repos-20k-thumb.glb",
                            "type": "Model",
                            "byteSize": 129948,
                            "numFaces": 20000,
                            "imageSize": 512
                        }
                    ]
                },
                {
                    "usage": "Web3D",
                    "quality": "High",
                    "assets": [
                        {
                            "uri": "usnm_344-combined-20m-150k-repos-150k-4096-high.glb",
                            "type": "Model",
                            "byteSize": 1592100,
                            "numFaces": 150000,
                            "imageSize": 4096
                        }
                    ]
                },
                {
                    "usage": "Web3D",
                    "quality": "Medium",
                    "assets": [
                        {
                            "uri": "usnm_344-combined-20m-150k-repos-150k-2048-medium.glb",
                            "type": "Model",
                            "byteSize": 929156,
                            "numFaces": 150000,
                            "imageSize": 2048
                        }
                    ]
                },
                {
                    "usage": "Web3D",
                    "quality": "Low",
                    "assets": [
                        {
                            "uri": "usnm_344-combined-20m-150k-repos-150k-1024-low.glb",
                            "type": "Model",
                            "byteSize": 648036,
                            "numFaces": 150000,
                            "imageSize": 1024
                        }
                    ]
                },
                {
                    "usage": "Web3D",
                    "quality": "AR",
                    "assets": [
                        {
                            "uri": "usnm_344-combined-20m-150k-repos-100k-ar.glb",
                            "type": "Model",
                            "byteSize": 1080912,
                            "numFaces": 100000,
                            "imageSize": 2048
                        }
                    ]
                }
            ]
        }
    ]
}
{{</highlight>}}

In the above example, the only required changes would be to change the "uri" attributes of each derivative to the appropriate uri of the associated model, relative to the location of the scene document.
For instance, if I had a "High" quality .glb called "NewModel.glb" that was in a subfolder called "models", the "uri" attribute of the model block with "quality": "High"
would change to "uri": "./models/NewModel.glb". Ideally you would also change the metadata like byteSize, numFaces, imageSize, and units to match the info for your model. This metadata is currently 
just for informational purposes and is not used by the system.

If you do not have model derivatives available at all of the quality levels listed above, just delete the unused derivative blocks.

**Note:** If using the fully-featured example linked above as your starting point, please keep in mind that this file also includes transformations. Remove these or set default values until you know what transform your model needs for a good starting position/orientation. Voyager will not automatically center the model for you. 

**Option 2: The Cook - Our automated processing framework**

If you are comfortable with installing and configuring software built from source, you can automatically generate an SVX scene file by setting up and running our [Cook automation tool](https://github.com/Smithsonian/dpo-cook) along with our [MeshSmith application](https://github.com/Smithsonian/dpo-meshsmith).

Cook can also automate generation of additional asset derivatives. Use the "si-voyager-scene", "si-voyager-asset", or "generate-web-gltf" Cook recipes, depending on your needs.

**Option 3: Public instance**

You can you use our publically accessible Voyager Story "Standalone" instance to create your scene. You'll find it at: https://3d.si.edu/voyager-story-standalone 
Just drag-and-drop your assets into the browser and configure your scene as described in the Voyager Story section of these docs. 

The main difference between this
version and the traditional deployment is that "Standalone" saves all of your work in browser memory and requires you to download the scene package for permanent storage
instead of writing changes directly to disk.