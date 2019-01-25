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

import CController, { Commander, Actions, types } from "@ff/graph/components/CController";
import CSelection from "@ff/graph/components/CSelection";

import NItem from "../../explorer/nodes/NItem";
import CPresentation from "../../explorer/components/CPresentation";
import CPresentationController from "../../explorer/components/CPresentationController";
import Notification from "@ff/ui/Notification";

////////////////////////////////////////////////////////////////////////////////

export enum ETaskSet { Prep, Author }

export type StoryActions = Actions<CStoryController>;

const ins = {
    upload: types.Event("Upload"),
    download: types.Event("Download"),
    exit: types.Event("Exit"),
    taskSet: types.Enum("TaskSet", ETaskSet),
    expertMode: types.Boolean("ExpertMode"),
    referrer: types.String("Referrer")
};

export default class CStoryController extends CController<CStoryController>
{
    static readonly type: string = "CStoryController";
    static readonly isSystemSingleton = true;

    ins = this.addInputs(ins);

    protected selection: CSelection = null;
    protected presentations: CPresentationController = null;


    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        this.selection = this.graph.components.get(CSelection);
        this.presentations = this.graph.components.get(CPresentationController);
    }

    update()
    {
        const ins = this.ins;

        if (ins.upload.changed) {
            const obj = this.getActiveObject();
            if (obj) {
                const url = obj.url;
                const name = url.substr(resolvePathname(".", url).length);
                const data = JSON.stringify(obj.toData());
                const file = new File([data], name, { type: "text/json" });

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

        if (ins.download.changed) {
            const obj = this.getActiveObject();
            if (obj) {
                const url = obj.url;
                const name = url.substr(resolvePathname(".", url).length);
                const data = JSON.stringify(obj.toData());

                const link = document.createElement("a");
                link.download = name;
                link.href = window.URL.createObjectURL(new Blob([data], { type: "text/json" }));
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        if (ins.exit.changed) {
            this.exit();
        }

        return false;
    }

    protected getActiveObject()
    {
        const activePresentation = this.presentations.activePresentation;
        const isPresentationSelected = activePresentation && this.selection.selectedComponents.contains(activePresentation);

        const activeItem = this.presentations.activeItem;
        const isItemSelected = activeItem && this.selection.nodeContainsSelectedComponent(activeItem);

        if (isItemSelected) {
            return activeItem;
        }
        else if (isPresentationSelected) {
            return activePresentation;
        }
    }

    protected exit()
    {
        const referrer = this.ins.referrer.value;
        if (referrer) {
            location.assign(referrer);
        }
    }
}