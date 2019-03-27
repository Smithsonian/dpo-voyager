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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import download from "@ff/browser/download";

import { Node, types } from "@ff/graph/Component";

import CRenderGraph from "@ff/scene/components/CRenderGraph";

import { IDocument } from "common/types/document";
import { EDerivativeQuality } from "common/types/model";

import NVNode, { INodeComponents } from "../nodes/NVNode";
import CVScene from "./CVScene";
import CVAssetReader from "./CVAssetReader";
import CTransform from "@ff/scene/components/CTransform";

////////////////////////////////////////////////////////////////////////////////

/**
 * A Voyager document is a special kind of graph. Its inner graph has a standard structure, and it can
 * be serialized to and from an IDocument structure which is compatible with a glTF document.
 */
export default class CVDocument extends CRenderGraph
{
    static readonly typeName: string = "CVDocument";

    static readonly mimeType = "application/si-dpo-3d.document+json";
    static readonly version = "1.0";

    protected static readonly ins = {
        assetPath: types.AssetPath("Asset.Path"),
        dump: types.Event("Document.Dump"),
        download: types.Event("Document.Download"),
    };

    ins = this.addInputs<CRenderGraph, typeof CVDocument.ins>(CVDocument.ins);

    constructor(node: Node, id: string)
    {
        super(node, id);

        // document is inactive and hidden, unless it becomes the active document
        this.ins.active.setValue(false);
        this.ins.visible.setValue(false);
    }

    get documentScene() {
        return this.innerComponents.get(CVScene, true);
    }

    update(context)
    {
        super.update(context);

        const ins = this.ins;

        if (ins.assetPath.changed) {
            const path = ins.assetPath.value;
            if (path) {
                const reader = this.getMainComponent(CVAssetReader);
                reader.getDocument(ins.assetPath.value)
                .then(data => this.openDocument(data))
                .catch(error => {
                    console.warn("failed to load document");
                });
            }
            else {
                this.initDocument();
            }
        }

        if (ins.dump.changed) {
            const json = this.deflateDocument();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }

        if (ins.download.changed) {
            const fileName = ins.assetPath.value.split("/").pop() || "document.json";
            download.json(this.deflateDocument(), fileName);
        }

        return true;
    }

    initDocument()
    {
        this.clearInnerGraph();
        const rootNode = this.innerGraph.createCustomNode(NVNode);
        rootNode.createComponent(CVScene);
    }

    openDocument(documentData: IDocument, assetPath?: string, mergeParent?: boolean | NVNode)
    {
        if (assetPath) {
            this.ins.assetPath.setValue(assetPath, true);
            this.ins.assetPath.changed = false;
        }

        if (!mergeParent) {
            this.initDocument();
        }

        let parent = typeof mergeParent === "object" ? mergeParent as NVNode : null;
        if (parent && (parent.graph !== this.innerGraph || parent.transform.parent)) {
            throw new Error("invalid parent node");
        }

        if (!parent) {
            const root = this.innerRoots[0];
            parent = root && root.node.is(NVNode) ? root.node as NVNode : this.innerGraph.createCustomNode(NVNode);
            if (!parent.scene) {
                parent.createScene();
            }
        }

        const rootIndices = documentData.roots;

        if (parent.scene && rootIndices.length === 1 && isFinite(documentData.nodes[rootIndices[0]].scene)) {
            parent.fromDocument(documentData, rootIndices[0]);
        }
        else {
            parent.createScene();
            rootIndices.forEach(rootIndex => {
                const rootNode = this.innerGraph.createCustomNode(NVNode);
                parent.transform.addChild(rootNode.transform);
                rootNode.fromDocument(documentData, rootIndex);
            });
        }
    }

    appendModel(assetPath: string, quality?: EDerivativeQuality | string, parent?: NVNode)
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
        modelNode.createModel();

        const model = modelNode.model;
        model.derivatives.createModelAsset(assetPath, quality);
    }

    appendGeometry(geoPath: string, colorMapPath?: string, occlusionMapPath?: string, normalMapPath?: string, quality?: EDerivativeQuality | string, parent?: NVNode)
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
        modelNode.createModel();

        const model = modelNode.model;
        model.derivatives.createMeshAsset(geoPath, colorMapPath, occlusionMapPath, normalMapPath, quality);
    }

    deflateDocument(components?: INodeComponents): IDocument
    {
        if (this.isEmpty()) {
            throw new Error("empty document, can't serialize");
        }

        const root = this.innerRoots[0] as CTransform;

        if (!root || !root.hasComponent(CVScene)) {
            throw new Error("malformed document, root not a scene node, can't serialize");
        }

        const roots = components && components.scenes ? [ root.node ] :
            root.children.map(child => child.node).filter(node => node.is(NVNode));

        const document: IDocument = {
            asset: {
                type: CVDocument.mimeType,
                version: CVDocument.version,
                generator: "Voyager",
                copyright: "(c) Smithsonian Institution. All rights reserved."
            },
            roots: [],
            nodes: []
        };

        roots.forEach((root: NVNode) => {
            if (root.hasNodeComponents(components)) {
                document.roots.push(root.toDocument(document, components));
            }
        });

        return document;
    }
}