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

import CController, { Commander, Actions } from "@ff/graph/components/CController";
import CSelection, { IComponentEvent, INodeEvent } from "@ff/graph/components/CSelection";
import CRenderer from "@ff/scene/components/CRenderer";

import * as template from "../templates/presentation.json";

import { EDerivativeQuality } from "../../core/models/Derivative";
import CLoadingManager from "../../core/components/CLoadingManager";

import CPresentation from "./CPresentation";
import { ReferenceCallback } from "../nodes/NPresentationScene";
import NItem from "../nodes/NItem";
import { ITypedEvent } from "@ff/core/Publisher";

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
    presentation: CPresentation;
}

export interface IActivePresentationEvent extends ITypedEvent<"active-presentation">
{
    previous: CPresentation;
    next: CPresentation;
}

export interface IItemEvent extends ITypedEvent<"item">
{
    add: boolean;
    remove: boolean;
    item: NItem;
}

export interface IActiveItemEvent extends ITypedEvent<"active-item">
{
    previous: NItem;
    next: NItem;
}

export type ExplorerActions = Actions<CPresentationController>;

/**
 * Voyager Explorer controller component. Manages presentations.
 */
export default class CPresentationController extends CController<CPresentationController>
{
    static readonly type: string = "CPresentationController";
    static readonly isSystemSingleton = true;

    private _activePresentation: CPresentation = null;
    private _activeItem: NItem = null;

    constructor(id: string)
    {
        super(id);
        this.addEvent("presentation");
    }

    get activePresentation() {
        return this._activePresentation;
    }

    set activePresentation(presentation: CPresentation) {
        if (presentation !== this._activePresentation) {

            const previous = this._activePresentation;
            this._activePresentation = presentation;
            this.activeItem = null;

            if (previous) {
                previous.innerGraph.nodes.off(NItem, this.onItem, this);
            }
            if (presentation) {
                presentation.innerGraph.nodes.on(NItem, this.onItem, this);
            }

            // make the presentation's scene the currently displayed scene
            this.renderer.activeSceneComponent = presentation ? presentation.scene : null;

            this.emit<IActivePresentationEvent>({
                type: "active-presentation", previous, next: presentation
            });
        }
    }

    get presentations() {
        return this.node.components.getArray(CPresentation);
    }

    get activeItem() {
        return this._activeItem;
    }

    set activeItem(item: NItem) {
        if (item !== this._activeItem) {

            if (item && item.graph.parent !== this._activePresentation) {
                this.activePresentation = item.graph.parent as CPresentation;
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

        return this._activePresentation.innerGraph.nodes.getArray(NItem);
    }

    protected get selection() {
        return this.system.components.safeGet(CSelection);
    }
    protected get renderer() {
        return this.system.components.safeGet(CRenderer);
    }
    protected get loadingManager() {
        return this.system.components.safeGet(CLoadingManager);
    }

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        super.create();

        this.node.components.on(CPresentation, this.onPresentation, this);
        this.selection.selectedComponents.on(CPresentation, this.onSelectPresentation, this);
    }

    dispose()
    {
        this.node.components.off(CPresentation, this.onPresentation, this);
        this.selection.selectedComponents.off(CPresentation, this.onSelectPresentation, this);

        super.dispose();
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        console.log("CExplorer.loadItem - URL: %s", itemUrl);

        return this.loadingManager.loadJSON(itemUrl).then(json => {
            const assetPath = resolvePathname(".", itemUrl);
            this.openItem(json, itemUrl, assetPath, templateUrl);
        });
    }

    openItem(json: any, url: string, assetPath: string, templateUrl?: string): Promise<void>
    {
        // get last part from template url
        const templateFileName = templateUrl ? templateUrl.substr(resolvePathname(".", templateUrl).length) : "";

        return this.loadingManager.validateItem(json).then(itemData => {

            const itemCallback = (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NItem);
                    node.setUrl(url, assetPath);
                    node.fromData(itemData);
                    return node;
                }

                return null;
            };

            const templateUri = itemData.meta.presentationTemplateUri;
            if (templateUri) {
                templateUrl =  resolvePathname(templateFileName, templateUri, templateUrl || assetPath);
                console.log(`Loading presentation template: ${templateUrl}`);

                return this.loadPresentation(templateUrl, itemCallback);
            }

            return this.openDefaultPresentation(assetPath, itemCallback);
        });
    }

    loadModel(modelUrl: string, quality?: string, itemUrl?: string, templateUrl?: string): Promise<void>
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        const { path: modelPath, name: modelName } = _splitUrl(modelUrl);

        if (itemUrl) {
            itemUrl = resolvePathname(itemUrl, modelPath);
        }

        return Promise.resolve().then(() => {
            console.log(`CExplorer.loadModel - Creating new 3D item with a web derivative, quality: ${EDerivativeQuality[q]}`,
                `\nmodel url: ${modelUrl}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation(modelPath, (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NItem);
                    node.setUrl(itemUrl || `${modelPath}item.json`, modelPath);
                    node.model.createWebModelDerivative(modelName, q);
                    return node;
                }

                return null;
            });
        });
    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string, quality?: string, itemUrl?: string, templateUrl?: string)
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        const { path: geoPath, name: geoName } = _splitUrl(geometryUrl);

        const texName = textureUrl ? _splitUrl(textureUrl).name : "";

        if (itemUrl) {
            itemUrl = resolvePathname(itemUrl, geoPath);
        }

        return Promise.resolve().then(() => {
            console.log(`CExplorer.loadGeometryAndTexture - Creating a new 3D item with a web derivative of quality: ${EDerivativeQuality[quality]}`,
                `\ngeometry url: ${geometryUrl}`, `\ntexture url: ${texName ? geoPath + texName : "(none)"}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation(geoPath, (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createCustomNode(NItem);
                    node.setUrl(itemUrl || `${assetPath}item.json`, geoPath);
                    node.model.addGeometryAndTextureDerivative(geoName, texName, q);
                    return node;
                }

                return null;
            });
        });
    }

    loadPresentation(presentationUrl: string, callback?: ReferenceCallback)
    {
        console.log("CExplorer.loadPresentation - URL: %s", presentationUrl);

        return this.loadingManager.loadJSON(presentationUrl).then(json => {
            const assetPath = resolvePathname(".", presentationUrl);
            this.openPresentation(json, presentationUrl, assetPath, callback);
        });
    }

    openDefaultPresentation(assetPath: string, callback: ReferenceCallback): Promise<void>
    {
        console.log("CExplorer.openDefaultPresentation - Opening presentation from default template");
        const url = assetPath + "template.json";
        return this.openPresentation(template, url, assetPath, callback);
    }

    openPresentation(json: any, url: string, assetPath: string, callback?: ReferenceCallback): Promise<void>
    {
        // currently opening multiple presentations is not supported
        this.closeAll();

        return this.loadingManager.validatePresentation(json).then(presentationData => {

            const presentation = this.node.createComponent(CPresentation);
            presentation.setUrl(url, assetPath);
            presentation.fromData(presentationData, callback);
        });
    }

    closeAll()
    {
        const presentations = this.node.components.cloneArray(CPresentation);
        presentations.forEach(presentation => presentation.dispose());
    }

    protected onPresentation(event: IComponentEvent<CPresentation>)
    {
        this.emit<IPresentationEvent>({
            type: "presentation", add: event.add, remove: event.remove, presentation: event.component
        });

        if (event.add) {
            this.activePresentation = event.component;
        }
    }

    protected onSelectPresentation(event: IComponentEvent<CPresentation>)
    {
        if (event.add) {
            this.activePresentation = event.component;
        }
    }

    protected onItem(event: INodeEvent<NItem>)
    {
        this.emit<IItemEvent>({
            type: "item", add: event.add, remove: event.remove, item: event.node
        });

        if (event.add) {
            this.activeItem = event.node;
        }
    }
}
