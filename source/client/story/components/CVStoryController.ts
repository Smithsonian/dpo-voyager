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

import { types } from "@ff/graph/propertyTypes";
import CSelection from "@ff/graph/components/CSelection";

import Notification from "@ff/ui/Notification";

import taskSets, { EStoryMode } from "../taskSets";

import NVNode from "../../explorer/nodes/NVNode";
import CVNodeProvider from "../../explorer/components/CVNodeProvider";
import CVDocument from "../../explorer/components/CVDocument";
import CVDocumentProvider from "../../explorer/components/CVDocumentProvider";

import CVNodeObserver from "../../explorer/components/CVNodeObserver";

////////////////////////////////////////////////////////////////////////////////

export { EStoryMode };


const _inputs = {
    save: types.Event("Save"),
    download: types.Event("Download"),
    exit: types.Event("Exit"),
    mode: types.Enum("Mode", EStoryMode),
    expertMode: types.Boolean("ExpertMode"),
    referrer: types.String("Referrer")
};

export default class CVStoryController extends CVNodeObserver
{
    static readonly typeName: string = "CVStoryController";
    static readonly isSystemSingleton = true;

    ins = this.addInputs(_inputs);


    constructor(id: string)
    {
        super(id);
        this.beforeUnload = this.beforeUnload.bind(this);
    }

    protected get activeSelectedNode() {

        const node = this.nodeProvider.activeNode;
        if (node && (this.selection.selectedNodes.contains(node) || this.selection.nodeContainsSelectedComponent(node))) {
            return node;
        }

        return null;
    }
    protected get activeSelectedDocument() {

        const document = this.documentProvider.activeComponent;
        if (document && this.selection.selectedComponents.contains(document)) {
            return document;
        }

        return null;
    }

    protected get selection() {
        return this.getMainComponent(CSelection);
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

            const node = this.activeSelectedNode;
            const document = this.activeSelectedDocument;

            if (node) {
                //url = node.url;
                //file = new File([JSON.stringify(node.toData())], node.urlName, { type: "text/json" });
            }
            else if (document) {
                url = document.url;
                file = new File([JSON.stringify(document.toDocument())], document.urlName, { type: "text/json" });
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

            const node = this.activeSelectedNode;
            const document = this.activeSelectedDocument;

            if (node) {
                //download.json(node.toData(), node.urlName);
            }
            else if (document) {
                download.json(document.toDocument(), document.urlName);
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