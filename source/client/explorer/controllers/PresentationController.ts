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

import Controller, { Actions, IPublisherEvent } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";
import RenderSystem from "@ff/scene/RenderSystem";

import * as template from "../templates/presentation.json";

import LoadingManager from "../loaders/LoadingManager";
import Explorer from "../nodes/Explorer";
import Presentation from "../nodes/Presentation";
import Item from "../nodes/Item";

////////////////////////////////////////////////////////////////////////////////

export interface IPresentationChangeEvent extends IPublisherEvent<PresentationController>
{
    current: Presentation;
    next: Presentation;
}

type PresentationActions = Actions<PresentationController>;

export default class PresentationController extends Controller<PresentationController>
{
    static readonly presentationEvent = "presentation";

    readonly system: RenderSystem;
    readonly loadingManager: LoadingManager;

    protected _explorer: Explorer;
    protected _presentations: Presentation[];
    protected _activePresentation: Presentation;

    constructor(system: RenderSystem, commander: Commander)
    {
        super(commander);
        this.addEvent(PresentationController.presentationEvent);

        this.system = system;
        this.loadingManager = new LoadingManager();

        this._explorer = null
        this._presentations = [];
        this._activePresentation = null;
    }

    get activePresentation() {
        return this._activePresentation;
    }

    protected get explorerNode(): Explorer {
        if (!this._explorer) {
            this._explorer = this.system.nodes.findByName("Explorer") as Explorer;
        }

        return this._explorer;
    }

    createActions(commander: Commander)
    {
        return {

        };
    }

    loadItem(url: string, templatePath?: string)
    {
        return this.loadingManager.loadJSON(url).then(json =>
            this.openItem(json, url, templatePath)
        );
    }

    openItem(json: any, url?: string, templatePathOrUrl?: string): Promise<void>
    {
        const templateName = templatePathOrUrl
            ? templatePathOrUrl.substr(resolvePathname(".", templatePathOrUrl).length)
            : "";

        return this.loadingManager.validateItem(json).then(itemData => {
            const explorer = this.explorerNode;
            const item = explorer.graph.createCustomNode(Item, "Item");
            item.setLoadingManager(this.loadingManager, url);
            item.fromData(itemData);

            if (item.presentationTemplateUri) {
                const templateUrl =  resolvePathname(templateName, item.presentationTemplateUri, templatePathOrUrl || url);
                console.log(`Loading presentation template: ${templateUrl}`);
                return this.loadPresentation(templateUrl, [ item ]);
            }

            return this.openDefaultPresentation(url, [ item ]);
        });
    }

    loadModel(url: string)
    {

    }

    loadGeometryAndTexture(geometryUrl: string, textureUrl?: string)
    {

    }

    loadPresentation(url: string, items?: Item[])
    {
        return this.loadingManager.loadJSON(url).then(json =>
            this.openPresentation(json, url, items)
        );
    }

    openDefaultPresentation(url?: string, items?: Item[]): Promise<void>
    {
        console.log("opening presentation from default template");
        return this.openPresentation(template, url, items);
    }

    openPresentation(json: any, url?: string, items?: Item[]): Promise<void>
    {
        // currently opening multiple presentations is not supported
        this.closeAll();

        return this.loadingManager.validatePresentation(json).then(presentationData => {
            const explorer = this.explorerNode; // TODO: retrieve nodes by type
            const presentation = explorer.graph.createCustomNode(Presentation, "Presentation");
            presentation.setLoadingManager(this.loadingManager, url);
            presentation.fromData(presentationData, items);

            this._presentations.push(presentation);
            this.setActivePresentation(this._presentations.length - 1);
        });
    }

    closeAll()
    {

    }

    protected setActivePresentation(index: number)
    {
        const current = this._activePresentation;
        const next = this._activePresentation = this._presentations[index];

        const explorer = this.explorerNode;
        if (current) {
            explorer.scene.removeChild(current.transform);
        }
        if (next) {
            explorer.scene.addChild(next.transform);
        }

        this.onPresentationChange(current, next);
        this.emit<IPresentationChangeEvent>(PresentationController.presentationEvent, { current, next });
    }

    protected onPresentationChange(current: Presentation, next: Presentation)
    {
    }
}