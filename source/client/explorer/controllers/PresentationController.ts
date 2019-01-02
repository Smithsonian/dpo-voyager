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

import Controller, { Actions, ITypedEvent } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";
import RenderSystem from "@ff/scene/RenderSystem";

import * as template from "../templates/presentation.json";

import { EDerivativeQuality } from "../models/Derivative";
import LoadingManager from "../loaders/LoadingManager";
import Explorer from "../nodes/Explorer";
import Presentation from "../nodes/Presentation";
import Item from "../nodes/Item";

////////////////////////////////////////////////////////////////////////////////

const _splitUrl = function(url: string): { path: string, name: string }
{
    const path = resolvePathname(".", url);
    const name = url.substr(path.length);

    return { path, name };
}

export interface IActivePresentationEvent extends ITypedEvent<"active-presentation">
{
    previous: Presentation;
    next: Presentation;
}

type PresentationActions = Actions<PresentationController>;

export default class PresentationController extends Controller<PresentationController>
{
    readonly system: RenderSystem;

    protected _loadingManager: LoadingManager;
    protected _explorer: Explorer;
    protected _presentations: Presentation[];
    protected _activePresentation: Presentation;

    constructor(system: RenderSystem, commander: Commander)
    {
        super(commander);
        this.addEvent("active-presentation");

        this.system = system;

        this._loadingManager = new LoadingManager();
        this._explorer = null
        this._presentations = [];
        this._activePresentation = null;
    }

    get activePresentation() {
        return this._activePresentation;
    }

    protected get explorerNode(): Explorer {
        return this.system.nodes.get(Explorer);
    }

    createActions(commander: Commander)
    {
        return {

        };
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        console.log("PresentationController.loadItem - URL: %s", itemUrl);

        return this._loadingManager.loadJSON(itemUrl).then(json => {
            const { path, name } = _splitUrl(itemUrl);
            this.openItem(json, name, path, templateUrl)
        });
    }

    openItem(json: any, itemName: string, assetPath: string, templateUrl?: string): Promise<void>
    {
        // get last part from template url
        const templateFileName = templateUrl ? templateUrl.substr(resolvePathname(".", templateUrl).length) : "";

        return this._loadingManager.validateItem(json).then(itemData => {
            const item = this.explorerNode.graph.createNode(Item, itemName || "item");
            item.setLoadingManager(this._loadingManager);
            item.setAssetPath(assetPath);
            item.fromData(itemData);

            if (item.presentationTemplateUri) {
                templateUrl =  resolvePathname(templateFileName, item.presentationTemplateUri, templateUrl || assetPath);
                console.log(`Loading presentation template: ${templateUrl}`);
                return this.loadPresentation(templateUrl, [ item ]);
            }

            return this.openDefaultPresentation(assetPath, [ item ]);
        });
    }

    loadModel(modelUrl: string, quality?: string, itemName?: string, templateUrl?: string): Promise<void>
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        return Promise.resolve().then(() => {
            console.log(`PresentationController.loadModel - Creating new 3D item with a web derivative, quality: ${EDerivativeQuality[q]}\n`,
                `model url: ${modelUrl}`);

            const { path, name } = _splitUrl(modelUrl);
            const item = this.explorerNode.graph.createNode(Item, itemName || "item");
            item.setLoadingManager(this._loadingManager);
            item.setAssetPath(path);
            item.addWebModelDerivative(modelUrl, q);

            return this.openDefaultPresentation(path, [ item ]);
        });
    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string, quality?: string, itemName?: string, templateUrl?: string)
    {
        const q = EDerivativeQuality[quality] || EDerivativeQuality.Medium;

        return Promise.resolve().then(() => {
            console.log(`PresentationController.loadGeometryAndTexture - Creating a new 3D item with a web derivative of quality: ${EDerivativeQuality[quality]}\n`,
                `geometry url: ${geometryUrl}, texture url: ${textureUrl}`);

            const { path, name } = _splitUrl(geometryUrl);
            const item = this.explorerNode.graph.createNode(Item, itemName || "item");
            item.setLoadingManager(this._loadingManager);
            item.setAssetPath(path);
            item.addGeometryAndTextureDerivative(geometryUrl, textureUrl, q);

            return this.openDefaultPresentation(path, [ item ]);
        });
    }

    loadPresentation(presentationUrl: string, items?: Item[])
    {
        console.log("PresentationController.loadPresentation - URL: %s", presentationUrl);

        return this._loadingManager.loadJSON(presentationUrl).then(json => {
            const { path } = _splitUrl(presentationUrl);
            this.openPresentation(json, path, items);
        });
    }

    openDefaultPresentation(assetPath: string, items?: Item[]): Promise<void>
    {
        console.log("PresentationController.openDefaultPresentation - Opening presentation from default template");
        return this.openPresentation(template, assetPath, items);
    }

    openPresentation(json: any, assetPath: string, items?: Item[]): Promise<void>
    {
        // currently opening multiple presentations is not supported
        this.closeAll();

        return this._loadingManager.validatePresentation(json).then(presentationData => {
            const presentation = this.explorerNode.graph.createNode(Presentation, "Presentation");
            presentation.setLoadingManager(this._loadingManager);
            presentation.setAssetPath(assetPath);
            presentation.fromData(presentationData, items);

            this._presentations.push(presentation);
            this.setActivePresentation(presentation);
        });
    }

    closeAll()
    {
        this._presentations.forEach(presentation => presentation.dispose());
    }

    protected setActivePresentation(presentation: Presentation)
    {
        const previous = this._activePresentation;
        const next = this._activePresentation = presentation;

        const explorer = this.explorerNode;

        if (previous) {
            explorer.scene.removeChild(previous.transform);
        }
        if (next) {
            explorer.scene.addChild(next.transform);
        }

        this.onPresentationChange(previous, next);
        this.emit<IActivePresentationEvent>({ type: "active-presentation", previous, next });
    }

    protected onPresentationChange(current: Presentation, next: Presentation)
    {
    }
}