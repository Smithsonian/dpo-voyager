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

import * as FileSaver from "file-saver";

import { IPublisherEvent } from "@ff/core/Publisher";

import Item from "../../core/components/Item";

import PresentationController, { IPresentationChangeEvent } from "../../core/components/PresentationController";
import SelectionController from "./SelectionController";

import Controller, { Actions, Commander } from "../../core/components/Controller";

////////////////////////////////////////////////////////////////////////////////

export enum EPrepMode { Settings, Annotations, Tours, Pose }

type IPrepControllerEvent = IPublisherEvent<StoryAppController>;

export interface IPrepModeChangeEvent extends IPrepControllerEvent { mode: EPrepMode }

export type PrepActions = Actions<StoryAppController>;


export default class StoryAppController extends Controller<StoryAppController>
{
    static readonly type: string = "PrepController";
    static readonly isSystemSingleton: boolean = true;

    actions: PrepActions = null;

    protected presentationController: PresentationController = null;
    protected selectionController: SelectionController = null;

    protected prepMode: EPrepMode = EPrepMode.Settings;

    create()
    {
        super.create();
        this.addEvent("mode");

        this.presentationController = this.getComponent(PresentationController);
        this.presentationController.on("presentation", this.onPresentationChange, this);

        this.selectionController = this.getComponent(SelectionController);
    }

    createActions(commander: Commander)
    {
        const actions = {
            downloadItem: commander.register({
                name: "Download Item", do: this.downloadItem, target: this
            }),
            downloadPresentation: commander.register({
                name: "Download Presentation", do: this.downloadPresentation, target: this
            })
        };

        this.actions = actions;
        return actions;
    }

    dispose()
    {
        this.presentationController.off("presentation", this.onPresentationChange, this);

        super.dispose();
    }

    get mode()
    {
        return this.prepMode;
    }

    set mode(mode: EPrepMode)
    {
        this.prepMode = mode;
        this.emit<IPrepModeChangeEvent>("mode", { mode });
    }

    protected downloadItem()
    {
        const item = this.findFirstSelectedItem();
        if (item) {
            const json = JSON.stringify(item.deflate());
            console.log(json);

            this.copyToClipboard(json);
            const blob = new Blob([json], { type: "text/json;charset=utf-8"});
            FileSaver.saveAs(blob, "item.json");
        }
    }

    protected downloadPresentation()
    {
        const presentation = this.presentationController.activePresentation;
        if (presentation) {
            const json = JSON.stringify(presentation.deflate());
            console.log(json);

            this.copyToClipboard(json);
            const blob = new Blob([json], { type: "text/json;charset=utf-8"});
            FileSaver.saveAs(blob, "presentation.json");
        }
    }

    protected findFirstSelectedItem(): Item | null
    {
        const components = this.selectionController.getSelectedComponents();
        for (let i = 0, n = components.length; i < n; ++i) {
            const item = components[i].getComponent(Item);
            if (item) {
                return item;
            }
        }

        const entities = this.selectionController.getSelectedEntities();
        for (let i = 0, n = entities.length; i < n; ++i) {
            const item = components[i].getComponent(Item);
            if (item) {
                return item;
            }
        }

        return null;
    }

    protected copyToClipboard(text: string)
    {
        const element = document.createElement("textarea");
        document.body.appendChild(element);
        element.value = text;
        element.select();
        document.execCommand("copy");
        document.body.removeChild(element);
    }

    protected onPresentationChange(event: IPresentationChangeEvent)
    {

        if (event.current) {
            //transformManip.setScene(null);
        }

        if (event.next) {
            //transformManip.setScene(event.next.scene);

            // TODO: Serialization test
            //console.log("Presentation changed\n", event.next.url, "\n", event.next.path);

            //const data = this.explorerController.writePresentation();
            //console.log(JSON.stringify(data));
        }
    }
}