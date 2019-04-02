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

import DocumentValidator from "../io/DocumentValidator";

import NVNode, { INodeComponents } from "../nodes/NVNode";
import CVSetup from "./CVSetup";
import CVAssetReader from "./CVAssetReader";
import NVScene from "../nodes/NVScene";

////////////////////////////////////////////////////////////////////////////////

export { IDocument };


/**
 * A Voyager document is a special kind of graph. Its inner graph has a standard structure, and it can
 * be serialized to and from an IDocument structure which is compatible with a glTF document.
 */
export default class CVDocument extends CRenderGraph
{
    static readonly typeName: string = "CVDocument";

    static readonly mimeType = "application/si-dpo-3d.document+json";
    static readonly version = "1.0";

    protected static readonly validator = new DocumentValidator();

    protected static readonly ins = {
        dumpJson: types.Event("Document.DumpJSON"),
        dumpTree: types.Event("Document.DumpTree"),
        download: types.Event("Document.Download"),
    };

    protected static readonly outs = {
        assetPath: types.AssetPath("Asset.Path"),
    };

    ins = this.addInputs<CRenderGraph, typeof CVDocument.ins>(CVDocument.ins);
    outs = this.addOutputs<CRenderGraph, typeof CVDocument.outs>(CVDocument.outs);

    constructor(node: Node, id: string)
    {
        super(node, id);

        // create root scene node with features component
        this.innerGraph.createCustomNode(NVScene);

        // document is inactive and hidden, unless it becomes the active document
        this.ins.active.setValue(false);
        this.ins.visible.setValue(false);
    }

    get root() {
        return this.innerNodes.get(NVScene);
    }
    get setup() {
        return this.innerComponents.get(CVSetup);
    }
    get assetPath() {
        return this.outs.assetPath.value;
    }
    get assetBaseName() {
        let name = this.assetPath;
        const index = name.indexOf("document.json");
        if (index >= 0) {
            name = name.substr(0, index);
        }
        return name;
    }

    update(context)
    {
        super.update(context);

        const { ins, outs } = this;

        if (ins.dumpJson.changed) {
            const json = this.deflateDocument();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, null, 2));
        }
        if (ins.dumpTree.changed) {
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            this.dump();
        }

        if (ins.download.changed) {
            const fileName = outs.assetPath.value.split("/").pop() || "document.json";
            download.json(this.deflateDocument(), fileName);
        }

        return true;
    }

    clearNodeTree()
    {
        const children = this.root.transform.children.slice();
        children.forEach(child => child.dispose());
    }

    openDocument(documentData: IDocument, assetPath?: string, mergeParent?: boolean | NVNode | NVScene)
    {
        console.log("CVDocument.openDocument - assetPath: %s, mergeParent: %s", assetPath, mergeParent);

        if (!CVDocument.validator.validate(documentData)) {
            throw new Error("document schema validation failed");
        }

        if (assetPath) {
            this.outs.assetPath.setValue(assetPath);
            this.name = this.getMainComponent(CVAssetReader).getAssetFileName(assetPath);
        }

        if (!mergeParent) {
            this.clearNodeTree();
        }

        let parent = (typeof mergeParent === "object" ? mergeParent : this.root);
        if (parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }

        if (parent instanceof NVScene) {
            parent.fromDocument(documentData, documentData.scene);
        }
        else {
            // if we append to a node, skip the document's root scene and append the scene's child nodes
            const rootIndices = documentData.scenes[documentData.scene].nodes;
            rootIndices.forEach(rootIndex => {
                const rootNode = this.innerGraph.createCustomNode(NVNode);
                parent.transform.addChild(rootNode.transform);
                rootNode.fromDocument(documentData, rootIndex);
            });
        }
    }

    appendModel(assetPath: string, quality?: EDerivativeQuality | string, parent?: NVNode | NVScene)
    {
        if (parent && parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }
        if (this.isEmpty()) {
            throw new Error("empty document, can't append model");
        }

        parent = parent || this.root;
        const modelNode = this.innerGraph.createCustomNode(NVNode);
        parent.transform.addChild(modelNode.transform);
        modelNode.createModel();

        const model = modelNode.model;
        model.derivatives.createModelAsset(assetPath, quality);
    }

    appendGeometry(geoPath: string, colorMapPath?: string, occlusionMapPath?: string, normalMapPath?: string, quality?: EDerivativeQuality | string, parent?: NVNode | NVScene)
    {
        if (parent && parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }
        if (this.isEmpty()) {
            throw new Error("empty document, can't append geometry");
        }

        parent = parent || this.root;
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

        const document: IDocument = {
            asset: {
                type: CVDocument.mimeType,
                version: CVDocument.version,
                generator: "Voyager",
                copyright: "(c) Smithsonian Institution. All rights reserved."
            },
            scene: 0,
            scenes: [],
        };

        document.scene = this.root.toDocument(document, components);
        return document;
    }
}