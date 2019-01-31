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

import Notification from "@ff/ui/Notification";

import CVPresentationController from "../../explorer/components/CVPresentationController";
import CVTaskController from "./CVTaskController";

import taskSets, { EStoryMode } from "../taskSets";

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
    static readonly isSystemSingleton = true;

    ins = this.addInputs(_inputs);

    protected selection: CSelection = null;
    protected presentations: CVPresentationController = null;
    protected tasks: CVTaskController = null;

    createActions(commander: Commander)
    {
        return {};
    }

    create()
    {
        this.selection = this.getMainComponent(CSelection);
        this.presentations = this.getMainComponent(CVPresentationController);
        this.tasks = this.getMainComponent(CVTaskController);
    }

    update()
    {
        const ins = this.ins;

        if (ins.mode.changed) {
            const taskTypes = taskSets[EStoryMode[ins.mode.getValidatedValue()]];
            if (taskTypes) {
                this.tasks.setTaskTypes(taskTypes);
            }
        }
        if (ins.save.changed) {
            let url, file;

            const itemNode = this.getSelectedActiveItem();
            const presentation = this.getSelectedActivePresentation();

            if (itemNode) {
                url = itemNode.item.url;
                const name = itemNode.item.urlName;
                file = new File([JSON.stringify(itemNode.item.toData())], name, { type: "text/json" });
            }
            else if (presentation) {
                url = presentation.presentation.url;
                const name = url.substr(resolvePathname(".", url).length);
                file = new File([JSON.stringify(presentation.toData())], name, { type: "text/json" });
            }

            if (url) {
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
            const itemNode = this.getSelectedActiveItem();
            const presentation = this.getSelectedActivePresentation();

            if (itemNode) {
                download.json(itemNode.item.toData(), itemNode.item.urlName);
            }
            else if (presentation) {
                const url = presentation.presentation.url;
                const name = url.substr(resolvePathname(".", url).length);
                download.json(presentation.toData(), name);
            }
        }

        if (ins.exit.changed) {
            this.exit();
        }

        return false;
    }

    protected getSelectedActivePresentation()
    {
        const activePresentation = this.presentations.activePresentation;
        return this.selection.selectedComponents.contains(activePresentation) ? activePresentation : null;
    }

    protected getSelectedActiveItem()
    {
        const activeItem = this.presentations.activeItem;
        return this.selection.nodeContainsSelectedComponent(activeItem) ? activeItem : null;
    }

    protected exit()
    {
        const referrer = this.ins.referrer.value;
        if (referrer) {
            location.assign(referrer);
        }
    }
}