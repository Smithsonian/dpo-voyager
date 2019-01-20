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
import Node from "@ff/graph/Node";
import CController, { Commander, Actions } from "@ff/graph/components/CController";

import * as template from "../templates/presentation.json";

import { EDerivativeQuality } from "../../core/models/Derivative";
import CLoadingManager from "../../core/components/CLoadingManager";
import CModel from "../../core/components/CModel";

import NPresentation, { ReferenceCallback } from "../nodes/NPresentation";
import NItemNode from "../nodes/NItemNode";

////////////////////////////////////////////////////////////////////////////////

const _splitUrl = function(url: string): { path: string, name: string }
{
    const path = resolvePathname(".", url);
    const name = path === "/" && url[0] !== "/" ? url : url.substr(path.length);

    return { path, name };
};

export interface IPresentationChangeEvent extends ITypedEvent<"presentation-change">
{
    previous: NPresentation;
    next: NPresentation;
}

type PresentationActions = Actions<CPresentations>;

export default class CPresentations extends CController<CPresentations>
{
    static readonly type: string = "CPresentations";

    private _presentations: NPresentation[] = [];
    private _activePresentation: NPresentation = null;
    private _loadingManager: CLoadingManager = null;


    constructor(id?: string)
    {
        super(id);
        this.addEvent("presentation-change");
    }

    set activePresentation(presentation: NPresentation) {
        const previous = this._activePresentation;
        previous && previous.deactivate();

        const next = this._activePresentation = presentation;
        next && next.activate();

        this.emit<IPresentationChangeEvent>({ type: "presentation-change", previous, next });
    }

    get activePresentation() {
        return this._activePresentation;
    }

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        this._loadingManager = this.system.components.safeGet(CLoadingManager);
    }

    loadItem(itemUrl: string, templateUrl?: string)
    {
        console.log("PresentationController.loadItem - URL: %s", itemUrl);

        return this._loadingManager.loadJSON(itemUrl).then(json => {
            const assetPath = resolvePathname(".", itemUrl);
            this.openItem(json, itemUrl, assetPath, templateUrl);
        });
    }

    openItem(json: any, url: string, assetPath: string, templateUrl?: string): Promise<void>
    {
        // get last part from template url
        const templateFileName = templateUrl ? templateUrl.substr(resolvePathname(".", templateUrl).length) : "";

        return this._loadingManager.validateItem(json).then(itemData => {

            const itemCallback = (index, graph, assetPath) => {
                if (index === 0) {
                    const node = graph.createNode(NItemNode);
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
                    const node = graph.createNode(NItemNode);
                    node.createComponents();
                    node.setUrl(itemUrl || `${modelPath}item.json`, modelPath);
                    const model = node.components.get(CModel);
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
                    const node = graph.createNode(NItemNode);
                    node.createComponents();
                    node.setUrl(itemUrl || `${assetPath}item.json`, geoPath);
                    const model = node.components.get(CModel);
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

        return this._loadingManager.loadJSON(presentationUrl).then(json => {
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

        return this._loadingManager.validatePresentation(json).then(presentationData => {

            const node = this.system.graph.createNode(NPresentation);
            node.createComponents();
            node.setUrl(url);
            node.fromData(presentationData, url, null, callback);

            this._presentations.push(node);
            this.activePresentation = node;
        });
    }

    closeAll()
    {
        this._presentations.forEach(presentation => presentation.dispose());
    }
}