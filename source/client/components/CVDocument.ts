/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import Component, { IComponentEvent, Node, types } from "@ff/graph/Component";

import CRenderGraph from "@ff/scene/components/CRenderGraph";
import { Dictionary } from "@ff/core/types";

import { IDocument } from "client/schema/document";
import { EDerivativeQuality } from "client/schema/model";

import DocumentValidator from "../io/DocumentValidator";

import NVNode, { INodeComponents } from "../nodes/NVNode";
import NVScene from "../nodes/NVScene";

import CVMeta from "./CVMeta";
import CVSetup from "./CVSetup";
import CVAssetManager from "./CVAssetManager";
import CVAnalytics from "client/components/CVAnalytics";
import { ELanguageType } from "client/schema/common";


////////////////////////////////////////////////////////////////////////////////

export { IDocument, INodeComponents };


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

    protected titles: Dictionary<string> = {};

    protected static readonly ins = {
        dumpJson: types.Event("Document.DumpJSON"),
        dumpTree: types.Event("Document.DumpTree"),
        download: types.Event("Document.Download"),
        title: types.String("Document.Title"),
    };

    protected static readonly outs = {
        assetPath: types.AssetPath("Asset.Path", { preset: "document.svx.json" }),
        title: types.String("Document.Title"),
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
        const index = name.indexOf(".svx.json");
        if (index >= 0) {
            name = name.substr(0, index);
        }
        return name;
    }

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }

    create()
    {
        super.create();
        this.innerGraph.components.on(CVMeta, this.onMetaComponent, this);
        this.setup.language.outs.language.on("value", this.updateTitle, this);
    }

    dispose()
    {
        this.setup.language.outs.language.off("value", this.updateTitle, this);
        this.innerGraph.components.off(CVMeta, this.onMetaComponent, this);
        super.dispose();
    }

    update(context)
    {
        super.update(context);

        const { ins, outs } = this;

        if (ins.dumpJson.changed) {
            const json = this.deflateDocument();
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            console.log(JSON.stringify(json, (key, value) =>
                typeof value === "number" ? parseFloat(value.toFixed(5)) : value, 2));
        }
        if (ins.dumpTree.changed) {
            console.log("-------------------- VOYAGER DOCUMENT --------------------");
            this.dump();
        }

        if (ins.download.changed) {
            const fileName = outs.assetPath.value.split("/").pop() || "voyager-document.json";
            download.json(this.deflateDocument(), fileName);
        }

        if(ins.title.changed && this.titles) {
            const language = this.setup.language;
            ins.title.setValue(ins.title.value, true);
            this.titles[ELanguageType[language.outs.language.value]] = ins.title.value;
            outs.title.setValue(ins.title.value);
        }

        return true;
    }

    clearNodeTree()
    {
        const children = this.root.transform.children.slice();
        children.forEach(child => child.node.dispose());
    }

    /**
     * Loads the document from the given document data. The data is validated first.
     * If a parent node/scene is given, the data is attached to the given parent.
     * @param documentData The document data to be loaded.
     * @param assetPath The path to the document asset to be loaded.
     * @param mergeParent If true or a scene or node, appends to the root or the given scene/node.
     */
    openDocument(documentData: IDocument, assetPath?: string, mergeParent?: boolean | NVNode | NVScene)
    {
        if (ENV_DEVELOPMENT) {
            console.log("CVDocument.openDocument - assetPath: %s, mergeParent: %s", assetPath, mergeParent);
        }

        if (!CVDocument.validator.validate(documentData)) {
            throw new Error("document schema validation failed");
        }

        if (!mergeParent) {
            this.clearNodeTree();
        }

        // listen to load events on scene meta component
        this.onMetaComponent({ type: "CVMeta", object: this.root.meta, add: true, remove: false });

        let parent = (typeof mergeParent === "object" ? mergeParent : this.root);
        if (parent.graph !== this.innerGraph) {
            throw new Error("invalid parent node");
        }

        const pathMap = new Map<string, Component>();

        if (parent instanceof NVScene) {
            parent.fromDocument(documentData, documentData.scene, pathMap);
        }
        else {
            // if we append to a node, skip the document's root scene and append the scene's child nodes
            const rootIndices = documentData.scenes[documentData.scene].nodes;
            rootIndices.forEach(rootIndex => {
                const rootNode = this.innerGraph.createCustomNode(NVNode);
                parent.transform.addChild(rootNode.transform);
                rootNode.fromDocument(documentData, rootIndex, pathMap);
            });
        }

        //pathMap.forEach((comp, path) => console.log("CVDocument - pathMap: %s - '%s'", path, comp.displayName));

        if (assetPath) {
            this.outs.assetPath.setValue(assetPath);
            this.name = this.getMainComponent(CVAssetManager).getAssetName(assetPath);
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

        const pathMap = new Map<Component, string>();
        document.scene = this.root.toDocument(document, pathMap, components);

        //pathMap.forEach((path, comp) => console.log("CVDocument - pathMap: %s - '%s'", path, comp.displayName));

        return document;
    }

    protected onMetaComponent(event: IComponentEvent<CVMeta>)
    {
        const meta = event.object;
        const propTitle = this.ins.title;
        const language = this.setup.language;

        if (event.add && !propTitle.value) {
            meta.once("load", () => {
                this.titles = meta.collection.get("titles") || {};

                // TODO: Temporary - remove when single string properties are phased out
                if(Object.keys(this.titles).length === 0) {
                    this.titles[ELanguageType[language.outs.language.value]] = meta.collection.get("title") || "";
                    meta.collection.dictionary["titles"] = this.titles;
                }

                const title = this.titles[ELanguageType[language.outs.language.value]];
                propTitle.setValue(title);
                this.analytics.setTitle(title);
            });
        }
    }

    protected updateTitle() {
        const language = this.setup.language;

        const newTitle = this.titles[ELanguageType[language.outs.language.value]];
        this.ins.title.setValue(newTitle ? newTitle : "Missing Title");
    }
}