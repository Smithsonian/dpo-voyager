/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import download from "@ff/browser/download";
import { downloadZip } from "client-zip";

import Component, { Node, types } from "@ff/graph/Component";

import Notification from "@ff/ui/Notification";

import CVAssetManager from "./CVAssetManager";
import CVAssetWriter from "./CVAssetWriter";
import CVTaskProvider from "./CVTaskProvider";
import CVDocumentProvider from "./CVDocumentProvider";
import { INodeComponents } from "./CVDocument";

import { ETaskMode } from "../applications/taskSets";

import CVMediaManager from "./CVMediaManager";
import CVMeta from "./CVMeta";
import CVStandaloneFileManager from "./CVStandaloneFileManager";
import CVModel2 from "./CVModel2";
import { Vector3, Euler, Quaternion, Color } from "three";
import math from "@ff/core/math";
import CVBackground from "./CVBackground";
import NVNode from "client/nodes/NVNode";
import { EAssetType } from "client/schema/model";
import { EProjection } from "./CVOrbitNavigation";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat = new Quaternion();
const _euler = new Euler();
const _color = new Color();

export default class CVStoryApplication extends Component
{
    static readonly typeName: string = "CVStoryApplication";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        exit: types.Event("Application.Exit"),
        save: types.Event("Document.Save"),
        download: types.Event("Document.Download"),
    };

    ins = this.addInputs(CVStoryApplication.ins);

    referrer: string = "";
    dragdrop: boolean = false;

    protected get taskProvider() {
        return this.getMainComponent(CVTaskProvider);
    }
    protected get documentProvider() {
        return this.getMainComponent(CVDocumentProvider);
    }
    protected get assetManager() {
        return this.getMainComponent(CVAssetManager);
    }
    protected get assetWriter() {
        return this.getMainComponent(CVAssetWriter);
    }
    protected get mediaManager() {
        return this.system.getMainComponent(CVMediaManager);
    }
    protected get meta() {
        return this.system.getComponent(CVMeta);
    }
    protected get standaloneFileManager() {
        return this.system.getComponent(CVStandaloneFileManager, true);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.beforeUnload = this.beforeUnload.bind(this);
    }

    create()
    {
        super.create();
        window.addEventListener("beforeunload", this.beforeUnload);
    }

    dispose()
    {
        window.removeEventListener("beforeunload", this.beforeUnload);
        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if (ins.exit.changed && this.referrer) {
            location.assign(this.referrer);
        }

        const cvDocument = this.documentProvider.activeComponent;

        if (cvDocument) {
            // in QC mode, only save the model, but no scene data, in all other modes, save everything
            const storyMode = this.taskProvider.ins.mode.getValidatedValue();
            const components: INodeComponents = storyMode === ETaskMode.QC ? { model: true } : null;

            if (ins.save.changed) {
                const data = cvDocument.deflateDocument(components);
                const json = JSON.stringify(data, (key, value) =>
                    typeof value === "number" ? parseFloat(value.toFixed(7)) : value);

                if(storyMode !== ETaskMode.Standalone) {
                    this.assetWriter.putJSON(json, cvDocument.assetPath)
                    .then(() => new Notification(`Successfully uploaded file to '${cvDocument.assetPath}'`, "info", 4000))
                    .catch(e => new Notification(`Failed to upload file to '${cvDocument.assetPath}'`, "error", 8000));
                }
                else {
                    // Standalone save
                    const fileManager : CVStandaloneFileManager = this.standaloneFileManager;
                    const saveFiles = [];

                    const fileName = this.assetManager.getAssetName(cvDocument.assetPath);
                    saveFiles.push({ name: fileName, lastModified: new Date(), input: json });

                    const files = fileManager.getFiles().filter(file => file != null && !file.name.endsWith(".json"));
                    files.forEach(file => {
                        saveFiles.push({ name: fileManager.getFilePath(file.name)+file.name, lastModified: new Date(), input: file });
                    });
               
                    downloadZip(saveFiles).blob().then(blob => { // await for async
                        const bloburl = URL.createObjectURL(blob);
                        download.url(bloburl, "voyager-scene.zip");
                    });
                }
            }

            if (ins.download.changed) {
                const models = cvDocument.getInnerComponents(CVModel2);
                const background = cvDocument.getInnerComponents(CVBackground)[0];
                _color.setRGB(background.ins.color0.value[0],background.ins.color0.value[1],background.ins.color0.value[2]);

                /*const jsonObj = JSON.parse(cvDocument.object3D.userData["IIIFManifest"].manifestJson);

                jsonObj.items[0].backgroundColor = "#"+_color.getHexString();
                
                jsonObj.items[0].items[0].items.forEach(item => {
                    const type = item.body.type === "SpecificResource" ? item.body.source[0].type : item.body.type;
                    if(type === "Model") {

                        if(item.body.type != "SpecificResource") {
                            item.body.source = [JSON.parse(JSON.stringify(item.body))];
                            item.body.type = "SpecificResource";
                            delete item.body.format;
                            delete item.body.id;
                        }

                        const model = models.find((model) => model.object3D.userData["IIIFid"] === item.id);
                        const transformMatrix = model.object3D.matrix;
                        transformMatrix.decompose(_vec3a, _quat, _vec3b);
                        _euler.setFromQuaternion(_quat);

                        const transform = item.body.transform = [];
                        transform.push({
                            "type": "ScaleTransform",
                            "x": _vec3b.x,
                            "y": _vec3b.y,
                            "z": _vec3b.z
                        });
                        transform.push({
                            "type": "RotateTransform",
                            "x": _euler.x*math.RAD2DEG,
                            "y": _euler.y*math.RAD2DEG,
                            "z": _euler.z*math.RAD2DEG
                        });
                        transform.push({
                            "type": "TranslateTransform",
                            "x": _vec3a.x,
                            "y": _vec3a.y,
                            "z": _vec3a.z
                        });

                        if(item.target && item.target.selector && item.target.selector[0].type === "PointSelector") {
                            item.target.selector = [{
                                "type": "PointSelector",
                                "x": 0.0,
                                "y": 0.0,
                                "z": 0.0
                            }];
                        }
                    }
                });
                */

                const jsonObj = {};
                jsonObj["@context"] = "http://iiif.io/api/presentation/4/context.json";
                jsonObj["id"] = "https://example.org/iiif/3d/model_origin.json";
                jsonObj["type"] = "Manifest";
                jsonObj["label"] = { "en": [cvDocument.ins.title.value] };
                //jsonObj["summary"] = { "en": ["Viewer should render the model at the scene origin, and then viewer should add default lighting and camera"] };
                jsonObj["items"] = [{}];

                const iiifScene = jsonObj["items"][0];
                iiifScene["id"] = "https://example.org/iiif/scene1/page/p1/1";
                iiifScene["type"] = "Scene";
                iiifScene["label"] = { "en": [cvDocument.ins.title.value] };
                iiifScene["items"] = [{}];

                const annotationPage = iiifScene["items"][0];
                annotationPage["id"] = "https://example.org/iiif/scene1/page/p1/1";
                annotationPage["type"] = "Scene";
                annotationPage["items"] = [];

                // serialize node tree
                this.parseChildNodes(cvDocument.root.transform.children, annotationPage);
                

                const json = JSON.stringify(jsonObj, null, 2);console.log(json);
                const fileName = "voyager_iiif.json";//this.assetManager.getAssetName(cvDocument.assetPath);
                download.json(json, fileName);
            }
        }


        return false;
    }

    protected parseChildNodes(nodes, annotationPage) {
        const children = nodes.map(child => child.node).filter(node => node.is(NVNode)) as NVNode[];

        children.forEach(child => {console.log(child);
            const annotation = {
                id: "https://example.org/iiif/3d/anno"+(annotationPage["items"].length+1),
                type: "Annotation",
                motivation: ["painting"],
                body: { type: "SpecificResource"},
                target: {
                    type: "SpecificResource",
                    source: [{
                        id: annotationPage.id,
                        type: annotationPage.type
                    }]
                }                            
            };

            if (child.model) {
                const asset = child.model.activeDerivative.findAsset(EAssetType.Model)

                // add source
                const source = {
                    id: this.assetManager.getAssetUrl(asset.data.uri),
                    type: "Model",
                    format: asset.data.mimeType
                }
                annotation.body["source"] = source;

                // add transform
                this.setTransform(annotation, child.model.object3D.matrix);
            }

            if (child.camera) {
                // add source
                const source = {
                    id: "https://example.org/iiif/3d/cameras/1",
                    type: child.camera.ins.projection.getValidatedValue() === EProjection.Perspective ? "PerspectiveCamera" : "OrthographicCamera"
                }
                annotation.body["source"] = source;

                // add transform
                this.setTransform(annotation, child.transform.object3D.matrix);
            }

            if (child.light) {
                // add source
                const source = {
                    id: "https://example.org/iiif/3d/lights/1",
                    type: child.light.typeName.substring(2)
                }
                annotation.body["source"] = source;

                // add transform
                this.setTransform(annotation, child.transform.object3D.matrix);
            }

            if (child.model || child.light || child.camera) { 
                annotationPage["items"].push(annotation);
            }

            if (child.transform.children) {
                this.parseChildNodes(child.transform.children, annotationPage);
            }
        });
    }

    protected setTransform(annotation, matrix) {
        const transformMatrix = matrix;
        transformMatrix.decompose(_vec3a, _quat, _vec3b);
        _euler.setFromQuaternion(_quat);

        const transform = annotation.body["transform"] = [];
        transform.push({
            "type": "ScaleTransform",
            "x": _vec3b.x,
            "y": _vec3b.y,
            "z": _vec3b.z
        });
        transform.push({
            "type": "RotateTransform",
            "x": _euler.x*math.RAD2DEG,
            "y": _euler.y*math.RAD2DEG,
            "z": _euler.z*math.RAD2DEG
        });
        transform.push({
            "type": "TranslateTransform",
            "x": _vec3a.x,
            "y": _vec3a.y,
            "z": _vec3a.z
        });
    }

    /**
     * Provoke a user prompt before unloading the page
     * @param event
     */
    protected beforeUnload(event)
    {
        event.returnValue = "x";
        //return "x";
    }
}