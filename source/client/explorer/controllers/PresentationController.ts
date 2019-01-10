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

import * as template from "../templates/presentation.json";

import { EDerivativeQuality } from "../../core/models/Derivative";
import Model from "../../core/components/Model";

import ExplorerSystem from "../ExplorerSystem";

import Presentation, { ReferenceCallback } from "../nodes/Presentation";
import ItemNode from "../nodes/ItemNode";


////////////////////////////////////////////////////////////////////////////////

const _splitUrl = function(url: string): { path: string, name: string }
{
    const path = resolvePathname(".", url);
    const name = path === "/" && url[0] !== "/" ? url : url.substr(path.length);

    return { path, name };
};

export interface IPresentationChangeEvent extends ITypedEvent<"presentation-change">
{
    previous: Presentation;
    next: Presentation;
}

type PresentationActions = Actions<PresentationController>;

export default class PresentationController extends Controller<PresentationController>
{
    readonly system: ExplorerSystem;

    protected presentations: Presentation[];
    private _activePresentation: Presentation;

    constructor(system: ExplorerSystem, commander: Commander)
    {
        super(commander);
        this.addEvent("presentation-change");

        this.system = system;

        this.presentations = [];
        this._activePresentation = null;
    }

    set activePresentation(presentation: Presentation) {
        const previous = this._activePresentation;
        this._activePresentation = presentation;
        presentation.activate();

        this.emit<IPresentationChangeEvent>({
            type: "presentation-change", previous, next: presentation
        });
    }

    get activePresentation() {
        return this._activePresentation;
    }

    createActions(commander: Commander)
    {
        return {
        };
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        console.log("PresentationController.loadItem - URL: %s", itemUrl);

        return this.system.loadingManager.loadJSON(itemUrl).then(json => {
            const assetPath = resolvePathname(".", itemUrl);
            this.openItem(json, itemUrl, assetPath, templateUrl);
        });
    }

    openItem(json: any, url: string, assetPath: string, templateUrl?: string): Promise<void>
    {
        // get last part from template url
        const templateFileName = templateUrl ? templateUrl.substr(resolvePathname(".", templateUrl).length) : "";

        return this.system.loadingManager.validateItem(json).then(itemData => {

            const itemCallback = (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createNode(ItemNode);
                    node.createComponents();
                    node.setUrl(url, assetPath);
                    node.fromItemData(itemData);
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
            console.log(`PresentationController.loadModel - Creating new 3D item with a web derivative, quality: ${EDerivativeQuality[q]}`,
                `\nmodel url: ${modelUrl}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation(modelPath, (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createNode(ItemNode);
                    node.createComponents();
                    node.setUrl(itemUrl || `${modelPath}item.json`, modelPath);
                    const model = node.components.get(Model);
                    model.addWebModelDerivative(modelName, q);
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
            console.log(`PresentationController.loadGeometryAndTexture - Creating a new 3D item with a web derivative of quality: ${EDerivativeQuality[quality]}`,
                `\ngeometry url: ${geometryUrl}`, `\ntexture url: ${texName ? geoPath + texName : "(none)"}`, `\nitem url: ${itemUrl}`);

            return this.openDefaultPresentation(geoPath, (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createNode(ItemNode);
                    node.createComponents();
                    node.setUrl(itemUrl || `${assetPath}item.json`, geoPath);
                    const model = node.components.get(Model);
                    model.addGeometryAndTextureDerivative(geoName, texName, q);
                    return node;
                }

                return null;
            });
        });
    }

    loadPresentation(presentationUrl: string, callback?: ReferenceCallback)
    {
        console.log("PresentationController.loadPresentation - URL: %s", presentationUrl);

        return this.system.loadingManager.loadJSON(presentationUrl).then(json => {
            const assetPath = resolvePathname(".", presentationUrl);
            this.openPresentation(json, presentationUrl, assetPath, callback);
        });
    }

    openDefaultPresentation(assetPath: string, callback: ReferenceCallback): Promise<void>
    {
        console.log("PresentationController.openDefaultPresentation - Opening presentation from default template");
        const url = assetPath + "template.json";
        return this.openPresentation(template, url, assetPath, callback);
    }

    openPresentation(json: any, url: string, assetPath: string, callback?: ReferenceCallback): Promise<void>
    {
        // currently opening multiple presentations is not supported
        this.closeAll();

        return this.system.loadingManager.validatePresentation(json).then(presentationData => {

            const node = this.system.graph.createNode(Presentation);
            node.createComponents();
            node.setUrl(url);
            node.fromData(presentationData, url, null, callback);

            this.presentations.push(node);
            this.activePresentation = node;
        });
    }

    closeAll()
    {
        this.presentations.forEach(presentation => presentation.dispose());
    }
}