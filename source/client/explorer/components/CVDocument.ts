/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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
 * See the License for the specific language governing permissions andr
 * limitations under the License.
 */

import resolvePathname from "resolve-pathname";
import download from "@ff/browser/download";

import { types } from "@ff/graph/Component";

import CRenderGraph from "@ff/scene/components/CRenderGraph";
import CLight from "@ff/scene/components/CLight";
import CCamera from "@ff/scene/components/CCamera";

import { IDocument } from "common/types/document";
import { EDerivativeQuality } from "common/types/model";

import NVNode from "../nodes/NVNode";
import CVScene from "./CVScene";

////////////////////////////////////////////////////////////////////////////////

/**
 * A Voyager document is a special kind of graph. Its inner graph has a standard structure, and it can
 * be serialized to and from an IDocument structure which is compatible with a glTF document.
 */
export default class CVDocument extends CRenderGraph
{
    static readonly typeName: string = "CVDocument";
    static readonly mimeType = "application/si-dpo-3d.document+json";

    protected static readonly ins = {
        dump: types.Event("Document.Dump"),
        download: types.Event("Document.Download"),
    };

    ins = this.addInputs<CRenderGraph, typeof CVDocument.ins>(CVDocument.ins);


    private _url: string = "";
    private _assetBaseName = "";

    set url(url: string) {
        this._url = url;

        const urlName = this.urlName;
        if (urlName.endsWith("item.json")) {
            this._assetBaseName = urlName.substr(0, urlName.length - 9);
        }
        else {
            const parts = urlName.split(".");
            parts.pop();
            this._assetBaseName = parts.join(".");
        }

        this.name = urlName;
        //this.getInnerComponent(CAssetManager).assetBaseUrl = url;

        console.log("CVDocument.url");
        console.log("   url:           %s", this.url);
        console.log("   urlPath:       %s", this.urlPath);
        console.log("   urlName:       %s", this.urlName);
    }
    get url() {
        return this._url;
    }
    get urlPath() {
        return resolvePathname(".", this.url);
    }
    get urlName() {
        const path = this.urlPath;
        const nameIndex = this.url.startsWith(path) ? path.length : 0;
        return this.url.substr(nameIndex);
    }
    get assetBaseName() {
        return this._assetBaseName;
    }

    getAssetUrl(fileName: string) {
        return resolvePathname(fileName, this.url);
    }

    get documentScene() {
        return this.innerComponents.get(CVScene);
    }

    create()
    {
        super.create();

        // create root scene node
        const sceneNode = this.innerGraph.createCustomNode(NVNode);
        sceneNode.createScene();

        // create camera node
        const cameraNode = this.innerGraph.createCustomNode(NVNode);
        cameraNode.createCamera();

        // document is inactive and hidden, unless it becomes the active document
        this.ins.active.setValue(false);
        this.ins.visible.setValue(false);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.dump.changed) {
            const json = this.toDocument();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        if (ins.download.changed) {
            download.json(this.toDocument(), this.urlName || "document.json");
        }

        return true;
    }

    openDocument(documentData: IDocument, url?: string)
    {
        this.clearInnerGraph();

        this.url = url || this.url;

        const rootNodeData = documentData.nodes[documentData.root];
        const docRootNode = this.innerGraph.createCustomNode(NVNode);

        // if document root is not a scene, create a scene and add document root as scene child
        if (!isFinite(rootNodeData.scene)) {
            const sceneNode = this.innerGraph.createCustomNode(NVNode);
            sceneNode.createScene();
            sceneNode.transform.addChild(docRootNode.transform);
        }

        // inflate scene tree starting from document root node
        docRootNode.fromDocument(documentData, documentData.root);
    }

    mergeDocument(documentData: IDocument, url?: string, parent?: NVNode)
    {
        if (parent && parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }
        if (this.innerRoots.length === 0) {
            return this.openDocument(documentData);
        }

        this.url = url || this.url;

        // if merge document has lights, remove all existing lights
        if (documentData.lights.length > 0) {
            this.getInnerComponents(CLight).slice().forEach(light => {
                if (light.transform.children.length > 0) {
                    light.dispose();
                }
                else {
                    light.node.dispose()
                }
            });
        }
        // if merge document has cameras, remove all existing cameras
        if (documentData.cameras.length > 0) {
            this.getInnerComponents(CCamera).slice().forEach(camera => {
                if (camera.transform.children.length > 0) {
                    camera.dispose();
                }
                else {
                    camera.node.dispose()
                }
            });
        }

        parent = parent || this.innerRoots[0].node as NVNode;
        const docRootNode = this.innerGraph.createCustomNode(NVNode);
        parent.transform.addChild(docRootNode.transform);
    }

    appendModel(modelUrl: string, quality?: EDerivativeQuality, parent?: NVNode)
    {
        if (parent && parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }
        if (this.isEmpty()) {
            throw new Error("empty document, can't append model");
        }

        parent = parent || this.innerRoots[0].node as NVNode;
        const modelNode = this.innerGraph.createCustomNode(NVNode);
        parent.transform.addChild(modelNode.transform);
        const model = modelNode.createModel();

        //model.addDerivative();
    }

    appendGeometry(geoUrl: string, colorMapUrl?: string, occlusionMapUrl?: string, normalMapUrl?: string, quality?: EDerivativeQuality, parent?: NVNode)
    {
        if (parent && parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }
        if (this.isEmpty()) {
            throw new Error("empty document, can't append geometry");
        }

        parent = parent || this.innerRoots[0].node as NVNode;
        const modelNode = this.innerGraph.createCustomNode(NVNode);
        parent.transform.addChild(modelNode.transform);
        const model = modelNode.createModel();

        //model.addDerivative();
    }

    toDocument(root?: NVNode): IDocument
    {
        if (this.isEmpty()) {
            throw new Error("empty document, nothing to serialize");
        }

        root = root || this.innerRoots[0].node as NVNode;

        const document: IDocument = {
            asset: {
                type: CVDocument.mimeType,
                version: "1.0",
                generator: "Voyager",
                copyright: "(c) Smithsonian Institution. All rights reserved."
            },
            root: 0,
            nodes: []
        };

        document.root = root.toDocument(document);
        return document;
    }
}