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

import fetch from "@ff/browser/fetch";
import download from "@ff/browser/download";

import CController, { Commander, Actions, types } from "@ff/graph/components/CController";
import CSelection from "@ff/graph/components/CSelection";
import CDocumentManager from "@ff/graph/components/CDocumentManager";

import Notification from "@ff/ui/Notification";

import taskSets, { EStoryMode } from "../taskSets";
import CVItemManager from "../../explorer/components/CVItemManager";
import CVDocument from "../../explorer/components/CVDocument";

////////////////////////////////////////////////////////////////////////////////

export { EStoryMode };

export type StoryActions = Actions<CVStoryController>;


const _inputs = {
    save: types.Event("Save"),
    download: types.Event("Download"),
    exit: types.Event("Exit"),
    mode: types.Enum("Mode", EStoryMode),
    expertMode: types.Boolean("ExpertMode"),
    referrer: types.String("Referrer")
};

export default class CVStoryController extends CController<CVStoryController>
{
    static readonly typeName: string = "CVStoryController";
    static readonly isSystemSingleton = true;

    ins = this.addInputs(_inputs);


    constructor(id: string)
    {
        super(id);
        this.beforeUnload = this.beforeUnload.bind(this);
    }

    protected get activeSelectedItem() {

        const item = this.itemManager.activeItem;
        if (item && (this.selection.selectedNodes.contains(item) || this.selection.nodeContainsSelectedComponent(item))) {
            return item;
        }

        return null;
    }
    protected get activeSelectedDocument() {

        const document = this.documentManager.activeDocument;
        if (document && this.selection.selectedComponents.contains(document)) {
            return document;
        }

        return null;
    }

    protected get selection() {
        return this.getMainComponent(CSelection);
    }
    protected get documentManager() {
        return this.getMainComponent(CDocumentManager);
    }
    protected get itemManager() {
        return this.getMainComponent(CVItemManager);
    }

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        window.addEventListener("beforeunload", this.beforeUnload);
    }

    dispose()
    {
        window.removeEventListener("beforeunload", this.beforeUnload);
        super.dispose();
    }

    update()
    {
        const ins = this.ins;

        if (ins.mode.changed) {
            //const taskTypes = taskSets[EStoryMode[ins.mode.getValidatedValue()]];
            //if (taskTypes) {
            //    this.taskManager.setTaskTypes(taskTypes);
            //}
        }

        // save active item/document
        if (ins.save.changed) {

            let url, file;

            const item = this.activeSelectedItem;
            const document = this.activeSelectedDocument as CVDocument;

            if (item) {
                url = item.url;
                file = new File([JSON.stringify(item.toData())], item.urlName, { type: "text/json" });
            }
            else if (document) {
                url = document.url;
                file = new File([JSON.stringify(document.toPresentation())], document.urlName, { type: "text/json" });
            }

            if (url && file) {
                console.log(`uploading file to '${url}'`);

                fetch.file(url, "PUT", file)
                .then(() => {
                    new Notification(`Successfully uploaded file to '${url}'`, "info", 4000);
                })
                .catch(e => {
                    new Notification(`Failed to upload file to '${url}'`, "error", 8000);
                });
            }
        }

        // download active item/document
        if (ins.download.changed) {

            const item = this.activeSelectedItem;
            const document = this.activeSelectedDocument as CVDocument;

            if (item) {
                download.json(item.toData(), item.urlName);
            }
            else if (document) {
                download.json(document.toPresentation(), document.urlName);
            }
        }

        if (ins.exit.changed) {
            this.exit();
        }

        return false;
    }

    protected exit()
    {
        const referrer = this.ins.referrer.value;
        if (referrer) {
            location.assign(referrer);
        }
    }

    protected beforeUnload(event)
    {
        event.returnValue = "x";
        //return "x";
    }
}