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

import fetch from "@ff/browser/fetch";

import { types } from "@ff/graph/propertyTypes";
import Component from "@ff/graph/Component";

import NItemNode from "../../explorer/nodes/NItemNode";
import NPresentation from "../../explorer/nodes/NPresentation";

////////////////////////////////////////////////////////////////////////////////

export enum ETaskSet { Prep, Author }

export default class CStory extends Component
{
    static readonly type: string = "CStory";

    ins = this.ins.append({
        save: types.Event("Save"),
        exit: types.Event("Exit"),
        taskSet: types.Enum("TaskSet", ETaskSet),
        expertMode: types.Boolean("ExpertMode"),
        referrer: types.String("Referrer")
    });

    update()
    {
        const ins = this.ins;

        if (ins.save.changed) {
            this.save();
        }

        if (ins.exit.changed) {
            this.exit();
        }

        return false;
    }

    protected save()
    {
        const system = this.system;
        const ins = this.ins;

        if (ins.taskSet.value === ETaskSet.Prep) {
            const item = system.nodes.get(NItemNode);
            if (item) {
                const data = item.toItemData();
                const url = item.url;

                console.log("StoryController.save - Item URL: %s", url);
                console.log(data);
                fetch.json(url, "PUT", data).then(response => {
                    console.log(response);
                }).catch(error => {
                    console.error(error);
                });
            }
        }
        else {
            const presentation = system.nodes.get(NPresentation);
            if (presentation) {
                console.log("StoryController.save - Presentation");
                console.log(presentation.toData());
            }
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