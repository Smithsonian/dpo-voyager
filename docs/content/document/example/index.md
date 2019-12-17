---
title: Example
summary: SVX Document Example
weight: 200
---

In the following you find a annotated example of a `document.svx.json` scene file for Voyager. For the sake of clarity,
parts of the file have been omitted.

```javascript
{
    // The asset section contains meta data about the document
    "asset": {
        "type": "application/si-dpo-3d.document+json",
        "version": "1.0",
        "generator": "Voyager",
        "copyright": "(c) Smithsonian Institution. All rights reserved."
    },
    // A document may contain one or multiple scenes. Index of the scene to be
    // displayed first.
    "scene": 0,
    // Array of scenes. Each scene contains a number of root nodes, and optionally
    // a meta and a setup component.
    "scenes": [
        {
            "units": "cm",
            "name": "Scene",
            "nodes": [
                0,
                1,
                6
            ],
            "meta": 0,
            "setup": 0
        }
    ],
    // Array of nodes. Each node contains transformation data (translation,
    // rotation, scale) and optionally a camera, light, model, or meta component.
    "nodes": [
        {
            // Node holding a camera component
            "translation": [
                -41.1679185,
                0.7796405,
                9.2386305
            ],
            "rotation": [
                -0.0258802,
                -0.6326073,
                -0.0211593,
                0.7737509
            ],
            "name": "Camera",
            "camera": 0
        },
        {
            // Group node containing four nodes with light components
            "rotation": [
                0,
                -0.6329611,
                0,
                0.7741836
            ],
            "name": "Lights",
            "children": [
                2,
                3,
                4,
                5
            ]
        },
        {
            // Node holding a light component
            "translation": [
                0,
                15.9709045,
                2
            ],
            "rotation": [
                0.4829741,
                -0.1070728,
                0.1880998,
                0.8484633
            ],
            "scale": [
                1,
                1,
                1
            ],
            "name": "Key",
            "light": 0
        },
        {
            // Node holding a light component
            "translation": [
                0,
                15.8836365,
                0
            ],
            "rotation": [
                0.3546969,
                0.163893,
                -0.3861077,
                0.8356136
            ],
            "name": "Fill #1",
            "light": 1
        },
        {
            // Node holding a light component
            "translation": [
                0,
                16.232724,
                1
            ],
            "rotation": [
                0.9374013,
                -0.3018693,
                0.0532277,
                0.1652891
            ],
            "name": "Fill #2",
            "light": 2
        },
        {
            // Node holding a light component
            "translation": [
                1,
                16.2327271,
                -1
            ],
            "rotation": [
                0.373256,
                0.6426073,
                -0.5786063,
                0.3360813
            ],
            "scale": [
                1,
                1,
                1
            ],
            "name": "Rim",
            "light": 3
        },
        {
            // Group node containing two child nodes with models
            "name": "ewer",
            "children": [
                7,
                8
            ]
        },
        {
            // Node containing a model component
            "name": "ewer-base",
            "model": 0
        },
        {
            // Node containing a model component
            "name": "ewer-lid",
            "model": 1
        }
    ],
    // Array of camera components
    "cameras": [
        {
            "type": "perspective",
            "perspective": {
                "yfov": 52,
                "znear": 0.1,
                "zfar": 100000
            }
        }
    ],
    // Array of light components
    "lights": [
        {
            "color": [
                1,
                0.95,
                0.9
            ],
            "intensity": 1,
            "type": "directional",
            "shadowEnabled": true
        },
        {
            "color": [
                0.9,
                0.95,
                1
            ],
            "intensity": 0.7,
            "type": "directional",
            "shadowEnabled": true
        },
        {
            "color": [
                0.8,
                0.85,
                1
            ],
            "intensity": 0.5,
            "type": "directional"
        },
        {
            "color": [
                0.85,
                0.9078313,
                1
            ],
            "intensity": 0.6,
            "type": "directional"
        }
    ],
    // Array of model components
    "models": [
        {
            // Units of the model
            "units": "m",
            // Initial pose of the model
            "translation": [
                -0.0029456,
                -0.1816199,
                -0.0046746
            ],
            "rotation": [
                -0.696751,
                -0.0032781,
                0.0510751,
                0.7154849
            ],
            // The model's bounding box
            "boundingBox": {
                "min": [
                    -0.1290653,
                    -0.071289,
                    -0.0052949
                ],
                "max": [
                    0.1576508,
                    0.0574502,
                    0.2148822
                ]
            },
            // List of the model's derivatives
            "derivatives": [
                {
                    // A "Web3D" derivative holding one GLB model asset
                    "usage": "Web3D",
                    "quality": "Thumb",
                    "assets": [
                        {
                            "uri": "ewer-base-20k-512-thumb.glb",
                            "type": "Model",
                            "byteSize": 206412,
                            "numFaces": 20000,
                            "imageSize": 512
                        }
                    ]
                },
                {
                    // A "Web3D" derivative holding one GLB model asset
                    "usage": "Web3D",
                    "quality": "High",
                    "assets": [
                        {
                            "uri": "ewer-base-150k-4096-high.glb",
                            "type": "Model",
                            "byteSize": 7781600,
                            "numFaces": 150000,
                            "imageSize": 4096
                        }
                    ]
                },
                {
                    // A "Web3D" derivative holding one GLB model asset
                    "usage": "Web3D",
                    "quality": "Medium",
                    "assets": [
                        {
                            "uri": "ewer-base-150k-2048-medium.glb",
                            "type": "Model",
                            "byteSize": 3082580,
                            "numFaces": 150000,
                            "imageSize": 2048
                        }
                    ]
                },
                {
                    // A "Web3D" derivative holding one GLB model asset
                    "usage": "Web3D",
                    "quality": "Low",
                    "assets": [
                        {
                            "uri": "ewer-base-150k-1024-low.glb",
                            "type": "Model",
                            "byteSize": 1258580,
                            "numFaces": 150000,
                            "imageSize": 1024
                        }
                    ]
                },
                {
                    // A "Web3D" derivative holding one GLB model asset
                    "usage": "Web3D",
                    "quality": "Highest",
                    "assets": [
                        {
                            "uri": "ewer-base-500k-8192-highest.glb",
                            "type": "Model",
                            "byteSize": 22509912,
                            "numFaces": 500000,
                            "imageSize": 8192
                        }
                    ]
                }
            ]
        },
        {
            // ...more model components
        }
    ],
    // Array with meta data components
    "metas": [
        {
            "images": [
                {
                    "uri": "ewer-image-thumb.jpg",
                    "quality": "Thumb",
                    "byteSize": 10437,
                    "width": 320,
                    "height": 320
                },
                {
                    "uri": "ewer-image-low.jpg",
                    "quality": "Low",
                    "byteSize": 34284,
                    "width": 640,
                    "height": 640
                },
                {
                    "uri": "ewer-image-medium.jpg",
                    "quality": "Medium",
                    "byteSize": 118422,
                    "width": 1280,
                    "height": 1280
                },
                {
                    "uri": "ewer-image-high.jpg",
                    "quality": "High",
                    "byteSize": 417825,
                    "width": 2560,
                    "height": 2560
                }
            ]
        }
    ],
    // Array with setup components. Usually there is only one setup
    // which is attached to the scene. The setup holds information about
    // viewer configuration such as the interface, reader, navigation, etc.
    // Tours are also stored as part of the setup.
    "setups": [
        {
            "interface": {
                "visible": true,
                "logo": true,
                "menu": false,
                "tools": true
            },
            "reader": {
                "enabled": false,
                "position": "Overlay"
            },
            "viewer": {
                "shader": "Default",
                "exposure": 1,
                "gamma": 2
            },
            "navigation": {
                "enabled": true,
                "autoZoom": true,
                "autoRotation": false,
                "lightsFollowCamera": true,
                "type": "Orbit",
                "orbit": {
                    "orbit": [
                        -3.8313962,
                        -78.5378496,
                        0
                    ],
                    "offset": [
                        0.8734655,
                        -2.0407828,
                        42.1405969
                    ],
                    "minOrbit": [
                        -90,
                        null,
                        null
                    ],
                    "maxOrbit": [
                        90,
                        null,
                        null
                    ],
                    "minOffset": [
                        null,
                        null,
                        0.1
                    ],
                    "maxOffset": [
                        null,
                        null,
                        10000
                    ]
                }
            },
            "background": {
                "style": "RadialGradient",
                "color0": [
                    0.8615554,
                    0.8243145,
                    0.7863651
                ],
                "color1": [
                    0.3833515,
                    0.3625706,
                    0.3268508
                ]
            },
            "floor": {
                "visible": true,
                "position": [
                    0,
                    -18.0530914,
                    0
                ],
                "size": 100,
                "color": [
                    0.5123762,
                    0.4719485,
                    0.416655
                ],
                "opacity": 0.5,
                "receiveShadow": false
            },
            "grid": {
                "visible": false,
                "color": [
                    0.8,
                    0.6394364,
                    0.5
                ]
            },
            "tape": {
                "enabled": false,
                "startPosition": [
                    0,
                    0,
                    0
                ],
                "startDirection": [
                    0,
                    0,
                    0
                ],
                "endPosition": [
                    0,
                    0,
                    0
                ],
                "endDirection": [
                    0,
                    0,
                    0
                ]
            },
            "slicer": {
                "enabled": false,
                "axis": "X",
                "position": 0.5,
                "inverted": false
            }
        }
    ]
}
```