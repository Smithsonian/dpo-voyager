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

import resolvePathname from "resolve-pathname";

import { ITypedEvent } from "@ff/core/Publisher";
import CController, { Commander, Actions } from "@ff/graph/components/CController";
import CSelection, { IComponentEvent, INodeEvent } from "@ff/graph/components/CSelection";
import CRenderer from "@ff/scene/components/CRenderer";

import * as template from "common/templates/presentation.json";

import { EDerivativeQuality } from "../../core/models/Derivative";
import CVLoaders from "../../core/components/CVLoaders";

import { ReferenceCallback } from "../nodes/NVPresentationScene";
import NVItem from "../nodes/NVItem";
import CVPresentation from "./CVPresentation";

////////////////////////////////////////////////////////////////////////////////

/** Splits a URL into path and file/page name. */
const _splitUrl = function(url: string): { path: string, name: string }
{
    const path = resolvePathname(".", url);
    const name = path === "/" && url[0] !== "/" ? url : url.substr(path.length);

    return { path, name };
};

export interface IPresentationEvent extends ITypedEvent<"presentation">
{
    add: boolean;
    remove: boolean;
    presentation: CVPresentation;
}

export interface IActivePresentationEvent extends ITypedEvent<"active-presentation">
{
    previous: CVPresentation;
    next: CVPresentation;
}

export interface IItemEvent extends ITypedEvent<"item">
{
    add: boolean;
    remove: boolean;
    item: NVItem;
}

export interface IActiveItemEvent extends ITypedEvent<"active-item">
{
    previous: NVItem;
    next: NVItem;
}

export type ExplorerActions = Actions<CVPresentationController>;

/**
 * Voyager Explorer controller component. Manages presentations.
 */
export default class CVPresentationController extends CController<CVPresentationController>
{
    static readonly type: string = "CVPresentationController";
    static readonly isSystemSingleton = true;

    private _activePresentation: CVPresentation = null;
    private _activeItem: NVItem = null;

    constructor(id: string)
    {
        super(id);
        this.addEvent("presentation");
    }

    get activePresentation() {
        return this._activePresentation;
    }

    set activePresentation(presentation: CVPresentation) {
        if (presentation !== this._activePresentation) {

            const previous = this._activePresentation;
            this._activePresentation = presentation;
            this.activeItem = null;

            if (previous) {
                previous.innerGraph.nodes.off(NVItem, this.onItem, this);
            }
            if (presentation) {
                presentation.innerGraph.nodes.on(NVItem, this.onItem, this);
            }

            // make the presentation's scene the currently displayed scene
            this.renderer.activeSceneComponent = presentation ? presentation.scene : null;

            this.emit<IActivePresentationEvent>({
                type: "active-presentation", previous, next: presentation
            });
        }
    }

    get presentations() {
        return this.node.components.getArray(CVPresentation);
    }
    get presentationCount() {
        return this.node.components.getArray(CVPresentation).length;
    }

    get activeItem() {
        return this._activeItem;
    }

    set activeItem(item: NVItem) {
        if (item !== this._activeItem) {

            if (item && item.graph.parent !== this._activePresentation) {
                this.activePresentation = item.graph.parent as CVPresentation;
            }
        }

        const previous = this._activeItem;
        this._activeItem = item;

        this.emit<IActiveItemEvent>({
            type: "active-item", previous, next: this._activeItem
        });
    }

    get items() {
        if (!this._activePresentation) {
            return [];
        }

        return this._activePresentation.innerGraph.nodes.getArray(NVItem);
    }

    protected get selection() {
        return this.system.components.safeGet(CSelection);
    }
    protected get renderer() {
        return this.system.components.safeGet(CRenderer);
    }
    protected get loaders() {
        return this.system.components.safeGet(CVLoaders);
    }

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        super.create();

        this.node.components.on(CVPresentation, this.onPresentation, this);
        this.selection.selectedComponents.on(CVPresentation, this.onSelectPresentation, this);
    }

    dispose()
    {
        this.node.components.off(CVPresentation, this.onPresentation, this);
        this.selection.selectedComponents.off(CVPresentation, this.onSelectPresentation, this);

        super.dispose();
    }

    loadItem(itemUrl: string, templateUrl?: string, assetBaseName?: string): Promise<void>
    {
        console.log("CExplorer.loadItem - URL: %s", itemUrl);

        return this.loaders.loadJSON(itemUrl).then(json => {
            const assetPath = resolvePathname(".", itemUrl);
            return this.openItem(json, itemUrl, templateUrl, assetPath, assetBaseName);
        });
    }

    openItem(json: any, url: string, templateUrl?: string, assetPath?: string, assetBaseName?: string): Promise<void>
    {
        // get last part from template url
        const templateFileName = templateUrl ? templateUrl.substr(resolvePathname(".", templateUrl).length) : "";

        return this.loaders.validateItem(json).then(itemData => {

            const itemCallback = (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NVItem);
                    node.item.setUrl(url, assetPath, assetBaseName);
                    node.item.fromData(itemData);
                    return node;
                }

                return null;
            };

            const templateUri = itemData.meta.presentationTemplateUri;
            if (templateUri) {
                templateUrl =  resolvePathname(templateFileName, templateUri, templateUrl || assetPath);
                console.log(`Loading presentation template: ${templateUrl}`);

                return this.loadPresentation(templateUrl, itemCallback, assetBaseName);
            }

            return this.openDefaultPresentation(itemCallback, assetPath, assetBaseName);
        });
    }

    loadModel(modelUrl: string, quality?: string, templateUrl?: string, assetBaseName?: string): Promise<void>
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        const { path: modelPath, name: modelName } = _splitUrl(modelUrl);
        const itemUrl = resolvePathname(assetBaseName ? assetBaseName + "-item.json" : "item.json", modelPath);

        return Promise.resolve().then(() => {
            console.log(`CExplorer.loadModel - Creating new 3D item with a web derivative, quality: ${EDerivativeQuality[q]}`,
                `\nmodel url: ${modelUrl}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation((index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NVItem);
                    node.item.setUrl(itemUrl, modelPath, assetBaseName);
                    node.model.derivatives.createModelAsset(modelName, q);
                    return node;
                }

                return null;
            }, modelPath, assetBaseName);
        });
    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string, quality?: string, templateUrl?: string, assetBaseName?: string): Promise<void>
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        const { path: geoPath, name: geoName } = _splitUrl(geometryUrl);
        const texName = textureUrl ? _splitUrl(textureUrl).name : "";
        const itemUrl = resolvePathname(assetBaseName ? assetBaseName + "-item.json" : "item.json", geoPath);

        return Promise.resolve().then(() => {
            console.log(`CExplorer.loadGeometryAndTexture - Creating a new 3D item with a web derivative of quality: ${EDerivativeQuality[quality]}`,
                `\ngeometry url: ${geometryUrl}`, `\ntexture url: ${texName ? geoPath + texName : "(none)"}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation((index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NVItem);
                    node.item.setUrl(itemUrl, geoPath, assetBaseName);
                    node.model.derivatives.createMeshAsset(geoName, texName, q);
                    return node;
                }

                return null;
            }, geoPath, assetBaseName);
        });
    }

    loadPresentation(presentationUrl: string, callback?: ReferenceCallback, assetBaseName?: string): Promise<void>
    {
        console.log("CExplorer.loadPresentation - URL: %s", presentationUrl);

        const assetPath = resolvePathname(".", presentationUrl);

        return this.loaders.loadJSON(presentationUrl).then(json => {
            const assetPath = resolvePathname(".", presentationUrl);
            this.openPresentation(json, presentationUrl, callback, assetPath, assetBaseName);
        });
    }

    openDefaultPresentation(callback?: ReferenceCallback, assetPath?: string, assetBaseName?: string): Promise<void>
    {
        console.log("CExplorer.openDefaultPresentation - Opening presentation from default template");
        const url = assetPath + "template.json";
        return this.openPresentation(template, url, callback, assetPath, assetBaseName);
    }

    openPresentation(json: any, url: string, callback?: ReferenceCallback, assetPath?: string, assetBaseName?: string): Promise<void>
    {
        // currently opening multiple presentations is not supported
        this.closeAll();

        return this.loaders.validatePresentation(json).then(presentationData => {

            const presentation = this.node.createComponent(CVPresentation);
            presentation.setUrl(url, assetPath, assetBaseName);
            presentation.fromData(presentationData, callback);
        });
    }

    closeAll()
    {
        const presentations = this.node.components.cloneArray(CVPresentation);
        presentations.forEach(presentation => presentation.dispose());
    }

    protected onPresentation(event: IComponentEvent<CVPresentation>)
    {
        this.emit<IPresentationEvent>({
            type: "presentation", add: event.add, remove: event.remove, presentation: event.component
        });

        if (event.add) {
            this.activePresentation = event.component;
        }
    }

    protected onSelectPresentation(event: IComponentEvent<CVPresentation>)
    {
        if (event.add) {
            this.activePresentation = event.component;
        }
    }

    protected onItem(event: INodeEvent<NVItem>)
    {
        this.emit<IItemEvent>({
            type: "item", add: event.add, remove: event.remove, item: event.node
        });

        if (event.add) {
            this.activeItem = event.node;
        }
    }
}
