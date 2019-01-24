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

import CController, { Commander, Actions, types } from "@ff/graph/components/CController";

import NItem from "../../explorer/nodes/NItem";
import CPresentation from "../../explorer/components/CPresentation";

////////////////////////////////////////////////////////////////////////////////

export enum ETaskSet { Prep, Author }

export type StoryActions = Actions<CStory>;

const ins = {
    save: types.Event("Save"),
    exit: types.Event("Exit"),
    taskSet: types.Enum("TaskSet", ETaskSet),
    expertMode: types.Boolean("ExpertMode"),
    referrer: types.String("Referrer")
};

export default class CStory extends CController<CStory>
{
    static readonly type: string = "CStory";

    ins = this.addInputs(ins);

    createActions(commander: Commander)
    {
        return {};
    }

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

    selectPresentation(presentation: CPresentation)
    {

    }

    selectItem(item: NItem)
    {

    }

    saveItem()
    {

    }

    savePresentation()
    {

    }


    protected save()
    {
        const system = this.system;
        const ins = this.ins;
    }

    protected exit()
    {
        const referrer = this.ins.referrer.value;
        if (referrer) {
            location.assign(referrer);
        }
    }
}