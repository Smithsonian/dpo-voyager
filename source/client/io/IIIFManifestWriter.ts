/**
 * 3D Foundation Project
 * Copyright 2026 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import math from "@ff/three/math";
import NVNode from "client/nodes/NVNode";
import CVSpotLight from "client/components/lights/CVSpotLight";
import { EProjection } from "@ff/three/UniversalCamera";
import { Matrix4, Vector3, Euler, Color, Quaternion, Mesh } from "three";
import { ELanguageType } from "client/schema/common";
import CVAnnotationView from "client/components/CVAnnotationView";
import CVDocument from "client/components/CVDocument";
import CVBackground from "client/components/CVBackground";
import { EAssetType } from "client/schema/model";
import CVAssetManager from "client/components/CVAssetManager";
import CVStandaloneFileManager from "client/components/CVStandaloneFileManager";
import documentTemplate from "client/templates/default.svx.json";
import CVStoryApplication from "client/components/CVStoryApplication";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _euler = new Euler();
const _color = new Color();
const _quat = new Quaternion();
const _mat4 = new Matrix4();

export default class IIIFManifestWriter {
    application: CVStoryApplication = null;

    static readonly iiifUnhandledLights = ["CVEnvironmentLight", "CVRectLight", "CVHemisphereLight"];

    constructor(application: CVStoryApplication) {
      this.application = application;
    }

    protected get assetManager() {
        return this.application.system.getMainComponent(CVAssetManager);
    }
    protected get standaloneFileManager() {
        return this.application.system.getComponent(CVStandaloneFileManager, true);
    }

    constructIIIFManifest(cvDocument: CVDocument) : string {
        const background = cvDocument.getInnerComponents(CVBackground)[0];

        _color.setRGB(background.ins.color0.value[0],background.ins.color0.value[1],background.ins.color0.value[2]);

        const jsonObj = {};
        jsonObj["@context"] = "http://iiif.io/api/presentation/4/context.json";
        jsonObj["id"] = "https://example.org/iiif/3d/model_origin.json";
        jsonObj["type"] = "Manifest";
        jsonObj["label"] = {};
        // add summary if available
        const summary = cvDocument.meta.collection.get("IIIFManifestSummary");
        if(summary !== undefined) {
            jsonObj["summary"] = { "en": [summary] };
        }
        jsonObj["items"] = [{}];

        // add multilingual title
        cvDocument.setup.language.sceneLanguages.forEach(language => {
            jsonObj["label"][ELanguageType[language.id].toLowerCase()] = [cvDocument.titleIn(language.id)];
        }); 

        const iiifScene = jsonObj["items"][0];
        iiifScene["id"] = "https://example.org/iiif/scene1/page/p1/1";
        iiifScene["type"] = "Scene";
        iiifScene["label"] = { "en": [cvDocument.root.name || "3D Scene"] };
        iiifScene["backgroundColor"] = "#"+_color.getHexString("srgb-linear");
        iiifScene["items"] = [{}];
        iiifScene["annotations"] = [{}];

        const annotationPage = iiifScene["items"][0];
        annotationPage["id"] = "https://example.org/iiif/scene1/page/p1/1";
        annotationPage["type"] = "AnnotationPage";
        annotationPage["items"] = [];

        const commentPage = iiifScene["annotations"][0];
        commentPage["id"] = "https://example.org/iiif/scene1/page/p2/1";
        commentPage["type"] = "AnnotationPage";
        commentPage["items"] = [];

        // serialize node tree
        this.parseChildNodes(cvDocument, cvDocument.root.transform.children, annotationPage, commentPage);

        // look for IIIF canvases to export
        // TODO: Get rid of userData hack when we can support canvases as scenegraph nodes
        cvDocument.root.scene.object3D.traverse(node => {
            if (node.type === "Mesh" && node.userData["IIIFCanvas"]) {
                const canvasObj = node.userData["IIIFCanvas"];
                jsonObj["items"].push(canvasObj);

                let selector = "POLYGONZ((";
                (node as Mesh).geometry.attributes.position.array.forEach((point, idx) => {
                    selector += this.roundNumber(point, 6).toString();
                    selector += idx % 3 === 2 && idx != 11 ? ", " : " ";
                });
                selector = selector.trim() + "))";

                const canvasAnno = {
                    id: "https://example.org/iiif/3d/anno"+(annotationPage["items"].length+1),
                    type: "Annotation",
                    motivation: ["painting"],
                    body: { 
                        id: canvasObj.id,
                        type: "Canvas"
                    },
                    target: {
                        type: "SpecificResource",
                        source: [{
                            id: iiifScene.id,
                            type: "Scene"
                        }],
                        selector: [
                            {
                                type: "PolygonZSelector",
                                value: selector
                            }
                        ]
                    }                            
                };

                annotationPage["items"].push(canvasAnno);
            }
        });

        // remove comment page element if items are empty
        if(commentPage["items"].length == 0) {
            delete iiifScene["annotations"];
        }

        return JSON.stringify(jsonObj, null, 2);
    }

    protected parseChildNodes(cvDocument, nodes, annotationPage, commentPage) {
        const children = nodes.map(child => child.node).filter(node => node.is(NVNode)) as NVNode[];
        const setup = cvDocument.setup;
        //const sceneDefaultLang = ELanguageType[setup.language.ins.primarySceneLanguage.value];

        children.forEach(child => {
            const annotation = {
                id: "https://example.org/iiif/3d/anno"+(annotationPage["items"].length+1),
                type: "Annotation",
                motivation: ["painting"],
                body: { type: "SpecificResource"},
                target: {
                    type: "SpecificResource",
                    source: [{
                        id: annotationPage.id,
                        type: "Scene"
                    }]
                }                            
            };

            if (child.model) {
                const asset = child.model.activeDerivative.findAsset(EAssetType.Model)
                const url = this.assetManager.getAssetUrl(asset.data.uri);

                // add source
                const source = {
                    id: this.standaloneFileManager ? this.standaloneFileManager.blobUrlToFileUrl(url) || url : url,
                    type: "Model",
                    label: {"en": [child.model.ins.name.value]},
                    format: asset.data.mimeType
                }
                annotation.body["source"] = source;

                // add transform
                this.setTransform(annotation, child.model.object3D.matrix);

                // process annotations
                const annotations = child.model.getComponent(CVAnnotationView);
                annotations.getAnnotations().forEach(anno => {
                    //const title = (anno.title.length > 0 ? anno.title : "Untitled") + (anno.lead.length > 0 ? "\n"+anno.lead : "");
                    _vec3a.fromArray(anno.data.position).multiplyScalar(child.model.outs.unitScale.value);  // _vec3b = scale from setTransform

                    const comment = {
                        "id": "https://example.org/iiif/3d/anno2",
                        "type": "Annotation",
                        "motivation": ["commenting"],
                        "body": [],
                        "target": {
                            "type": "SpecificResource",
                            "source": [
                                {
                                    "id": annotationPage["id"],
                                    "type": "Scene"
                                }
                            ],
                            "selector": [
                                {
                                    "type": "PointSelector",
                                    "x": this.roundNumber(_vec3a.x, 6),
                                    "y": this.roundNumber(_vec3a.y, 6),
                                    "z": this.roundNumber(_vec3a.z, 6),
                                }
                            ]
                        }
                    }

                    // add anno view to content state if needed
                    if(anno.data.viewId) {
                        const contentAnno = {
                            "id": "https://example.org/iiif/3d/anno2/scope1",
                            "type": "Annotation",
                            "motivation": ["contentState"],
                            "target": {
                                "id": "https://example.org/iiif/scene1/page/p1/1",
                                "type": "Scene",
                                "items": [
                                    {
                                        "id": "https://example.org/iiif/scene1/page/p3/1",
                                        "type": "AnnotationPage",
                                        "items": []
                                    }
                                ]
                            }
                        }
                        const items = contentAnno["target"]["items"][0]["items"];
                        const viewAnno = {
                            id: "https://example.org/iiif/3d/anno"+(annotationPage["items"].length+1),
                            type: "Annotation",
                            motivation: ["painting"],
                            body: { type: "SpecificResource"},
                            target: {
                                type: "SpecificResource",
                                source: [{
                                    id: annotationPage.id,
                                    type: "Scene"
                                }]
                            }                            
                        };

                        // add camera
                        const source = {
                            id: "https://example.org/iiif/3d/cameras/1",
                            type: "PerspectiveCamera"
                        }
                        viewAnno.body["source"] = source;
                        // add transform
                        const machine = setup.snapshots;
                        const props = machine.getTargetProperties();
                        const orbitIdx = props.findIndex((elem) => {return elem.name == "Orbit"});
                        const offsetIdx = props.findIndex((elem) => {return elem.name == "Offset"});
                        const state = machine.getState(anno.data.viewId);
                        _vec3a.fromArray(state.values[orbitIdx]).multiplyScalar(math.DEG2RAD);
                        _vec3b.fromArray(state.values[offsetIdx]);
                        math.composeOrbitMatrix(_vec3a, _vec3b, _mat4);
                        this.setTransform(viewAnno, _mat4);

                        items.push(viewAnno);
                        comment["target"]["scope"] = contentAnno;
                    }

                    // add annotation text content
                    const textChoice = { "type": "Choice", "items": [] };
                    setup.language.sceneLanguages.forEach(language => {
                        let content = (anno.titleIn(language.id)?.length > 0 ? anno.titleIn(language.id) : "Untitled");

                        // add image if needed
                        if(anno.data.imageUri) {
                            const uri = this.assetManager.getAssetUrl(anno.data.imageUri);
                            const mappedUri = uri.startsWith("blob") ? this.standaloneFileManager.blobUrlToFileUrl(uri) : uri;
                            content += "\n<img style=\"max-height: 120px; max-width: 100%\" alt=\"" + anno.imageAltText + "\" src=\"" + mappedUri +"\">";
                            /*if(anno.imageCredit) {
                                content += "<div>" + anno.imageCredit + "</div>";
                            }*/
                        }

                        content += (anno.leadIn(language.id)?.length > 0 ? "\n" + anno.leadIn(language.id) : "");

                        const hasTags = /<\/?[a-z][\s\S]*>/i.test(content);
                        if(hasTags && content[0] !== "<") {
                            // Spec requires opening and closing tags for any html content
                            content = "<p>" + content + "</p>";
                        }

                        const textBody = {
                            "type": "TextualBody",
                            "value": content,
                            "language": ELanguageType[language.id].toLowerCase(),
                            "format": hasTags ? "text/html" : "text/plain"
                        }
                        textChoice["items"].push(textBody);
                    });
                    comment["body"].push(textChoice);

                    // add annotation audio content
                    if(anno.data.audioId) {
                        const audioChoice = { "type": "Choice", "items": [] };
                        const capChoice = { "type": "Choice", "items": [] };
                        const audioManager = setup.audio;
                        const clip = audioManager.getAudioClip(anno.data.audioId);

                        if(clip !== undefined) {
                            setup.language.sceneLanguages.forEach(language => {
                                const id = clip.uris[ELanguageType[language.id]];
                                const capId = clip.captionUris[ELanguageType[language.id]];

                                if(id) {
                                    const audioBody = {
                                        "id": id,
                                        "type": "Sound",
                                        "language": ELanguageType[language.id].toLowerCase(),
                                        "format": "audio/mp3",
                                        "duration": clip.durations[ELanguageType[language.id]]
                                    }
                                    audioChoice["items"].push(audioBody);
                                }

                                if(capId) {
                                    const capBody = {
                                        "id": capId,
                                        "type": "Text",
                                        "language": ELanguageType[language.id].toLowerCase(),
                                        "format": "text/vtt",
                                        "duration": clip.durations[ELanguageType[language.id]]
                                    }
                                    capChoice["items"].push(capBody);
                                }
                            });
                            comment["body"].push(audioChoice);
                            capChoice["items"].length > 0 ? comment["body"].push(capChoice) : null;
                        }
                    }

                    commentPage["items"].push(comment);
                });
            }

            if (child.camera) {
                // early out if no default camera has been saved
                if(JSON.stringify(setup.setupCache.navigation.orbit) === JSON.stringify(documentTemplate.setups[0].navigation.orbit)) {
                    return;
                }

                // add source
                const source = {
                    id: "https://example.org/iiif/3d/cameras/1",
                    type: child.camera.ins.projection.getValidatedValue() === EProjection.Perspective ? "PerspectiveCamera" : "OrthographicCamera"
                }
                annotation.body["source"] = source;

                // add transform
                _vec3a.fromArray(setup.setupCache.navigation.orbit.orbit).multiplyScalar(math.DEG2RAD);
                _vec3b.fromArray(setup.setupCache.navigation.orbit.offset);
                math.composeOrbitMatrix(_vec3a, _vec3b, _mat4);
                this.setTransform(annotation, _mat4);
            }

            if (child.light) {
                const light = child.light;

                // check unhandled light types
                if(IIIFManifestWriter.iiifUnhandledLights.includes(light.typeName) || !light.ins.enabled.value) {
                    return;
                }

                // add source
                _color.setRGB(light.ins.color.value[0],light.ins.color.value[1],light.ins.color.value[2]);
                const source = {
                    id: "https://example.org/iiif/3d/lights/1",
                    type: light.typeName.substring(2),
                    label: {"en": [light.node.name]},
                    color: "#"+_color.getHexString("srgb-linear"),
                    intensity: {"type": "Value", "value": light.ins.intensity.value, "unit": "relative"}
                };
                light.typeName == "CVSpotLight" ? source["angle"] = (light as CVSpotLight).ins.angle.value : null;
                annotation.body["source"] = source;

                // add transform
                this.setTransform(annotation, child.transform.object3D.matrix);
            }

            if (child.model || child.light || child.camera) { 
                annotationPage["items"].push(annotation);
            }

            if (child.transform.children) {
                this.parseChildNodes(cvDocument, child.transform.children, annotationPage, commentPage);
            }
        });
    }

    protected setTransform(annotation, matrix) {
        const transformMatrix = matrix;
        transformMatrix.decompose(_vec3a, _quat, _vec3b);
        _euler.setFromQuaternion(_quat);

        const transform = annotation.body["transform"] = [];
        if(_vec3b.x != 1 || _vec3b.y != 1 || _vec3b.z != 1) {
            transform.push({
                "type": "ScaleTransform",
                "x": this.roundNumber(_vec3b.x, 6),
                "y": this.roundNumber(_vec3b.y, 6),
                "z": this.roundNumber(_vec3b.z, 6)
            });
        }
        if(_euler.x != 0 || _euler.y != 0 || _euler.z != 0) {
            transform.push({
                "type": "RotateTransform",
                "x": this.roundNumber(_euler.x*math.RAD2DEG, 6),
                "y": this.roundNumber(_euler.y*math.RAD2DEG, 6),
                "z": this.roundNumber(_euler.z*math.RAD2DEG, 6)
            });
        }
        if(_vec3a.length() != 0) {
            transform.push({
                "type": "TranslateTransform",
                "x": this.roundNumber(_vec3a.x, 6),
                "y": this.roundNumber(_vec3a.y, 6),
                "z": this.roundNumber(_vec3a.z, 6)
            });
        }

        // remove transform element if empty
        if(transform.length == 0) {
            delete annotation.body["transform"];
        }
    }

    protected roundNumber(num: number, digits: number) {
        return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
    }
}