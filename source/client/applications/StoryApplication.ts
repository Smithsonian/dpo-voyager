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

import parseUrlParameter from "@ff/browser/parseUrlParameter";
import Commander from "@ff/core/Commander";
import System from "@ff/graph/System";

import CPickSelection from "@ff/scene/components/CPickSelection";

import * as documentTemplate from "common/templates/document.json";

import ExplorerApplication, { IExplorerApplicationProps } from "./ExplorerApplication";

import storyTypes from "./storyTypes";

import CVStoryApplication from "../components/CVStoryApplication";

import CVAssetReader from "../components/CVAssetReader";
import CVAssetWriter from "../components/CVAssetWriter";
import CAssetManager from "@ff/scene/components/CAssetManager";

import CVDocumentProvider from "../components/CVDocumentProvider";
import CVDocument from "../components/CVDocument";

import NVTasks from "../nodes/NVTasks";
import NVoyagerStory from "../nodes/NVoyagerStory";

import MainView from "../ui/story/MainView";
import CVTaskProvider from "../components/CVTaskProvider";
import { ETaskMode } from "./taskSets";

////////////////////////////////////////////////////////////////////////////////

/**
 * Initial properties of the Voyager Story main [[StoryApplication]].
 */
export interface IStoryApplicationProps extends IExplorerApplicationProps
{
    /** The page URL to navigate to when the user exits the story tool. */
    referrer?: string;
    /** The task set the application should display. Valid options: "prep" and "author". */
    mode?: string;
    /** When set to true, application displays additional expert level tools. */
    expert?: boolean;
}

/**
 * Voyager Story main application.
 */
export default class StoryApplication
{
    readonly props: IStoryApplicationProps;
    readonly explorer: ExplorerApplication;
    readonly system: System;
    readonly commander: Commander;

    protected get assetReader() {
        return this.system.getMainComponent(CVAssetReader);
    }
    protected get assetWriter() {
        return this.system.getMainComponent(CVAssetWriter);
    }
    protected get assetManager() {
        return this.system.getMainComponent(CAssetManager);
    }

    protected get documentProvider() {
        return this.system.getMainComponent(CVDocumentProvider);
    }

    constructor(parent: HTMLElement, props?: IStoryApplicationProps)
    {
        // create the embedded explorer application, parse properties, start loading/presenting
        this.explorer = new ExplorerApplication(null, props, /* embedded */ true);
        this.props = props || {};

        this.system = this.explorer.system;
        this.commander = this.explorer.commander;

        // register additional story tool components
        const registry = this.system.registry;
        registry.add(storyTypes);

        //this.logController = new LogController(this.system, this.commander);

        // add story components
        this.system.graph.createCustomNode(NVoyagerStory, "Story");
        this.system.graph.createCustomNode(NVTasks, "Tasks");

        // enable viewport brackets
        this.system.getMainComponent(CPickSelection).ins.viewportBrackets.setValue(true);

        if (parent) {
            // create a view and attach to parent
            new MainView(this).appendTo(parent);
        }

        // initialize default document
        this.documentProvider.createDocument(documentTemplate as any);
        this.evaluateProps();
    }

    setRootUrl(url: string)
    {
        this.assetReader.rootUrl = url;
        this.assetManager.rootUrl = url;
    }

    loadDocument(documentPath: string, merge?: boolean): Promise<CVDocument>
    {
        return this.assetReader.getJSON(documentPath)
        .then(data => this.documentProvider.amendDocument(data, documentPath, merge))
        .catch(error => {
            console.warn(`error while loading document: ${error.message}`);
            throw error;
        });
    }

    loadModel(modelPath: string, quality: string)
    {
        return this.documentProvider.appendModel(modelPath, quality);
    }

    loadGeometry(geoPath: string, colorMapPath?: string,
                 occlusionMapPath?: string, normalMapPath?: string, quality?: string)
    {
        return this.documentProvider.appendGeometry(
            geoPath, colorMapPath, occlusionMapPath, normalMapPath, quality);
    }

    protected evaluateProps()
    {
        const props = this.props;

        this.explorer.evaluateProps();

        const url = props.root || props.document || props.model || props.geometry;
        this.setRootUrl(new URL(url || ".", window.location as any).href);

        props.referrer = props.referrer || parseUrlParameter("referrer");
        props.mode = props.mode || parseUrlParameter("mode") || "prep";
        props.expert = props.expert !== undefined ? props.expert : parseUrlParameter("expert") !== "false";

        const app = this.system.getMainComponent(CVStoryApplication);
        app.referrer = props.referrer;

        const lcMode = props.mode[0].toLowerCase();
        const mode = lcMode === "a" ? ETaskMode.Authoring : (lcMode === "e" ? ETaskMode.Expert : ETaskMode.QC);
        const tasks = this.system.getMainComponent(CVTaskProvider);
        tasks.ins.mode.setValue(mode);
    }
}

window["VoyagerStory"] = StoryApplication;