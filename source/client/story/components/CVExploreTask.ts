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

import { IActiveItemEvent } from "../../explorer/components/CVPresentationController";

import ExploreTaskView from "../ui/ExploreTaskView";
import CVTask from "./CVTask";

////////////////////////////////////////////////////////////////////////////////

export default class CVExploreTask extends CVTask
{
    static readonly typeName: string = "CVExploreTask";

    static readonly text: string = "Explore";
    static readonly icon: string = "eye";

    private _bracketsVisible = false;

    createView()
    {
        return new ExploreTaskView(this);
    }

    activate()
    {
        super.activate();

        // disable selection brackets
        const prop = this.selectionController.ins.viewportBrackets;
        this._bracketsVisible = prop.value;
        prop.setValue(false);
    }

    deactivate()
    {
        // restore selection brackets visibility
        this.selectionController.ins.viewportBrackets.setValue(this._bracketsVisible);

        super.deactivate();
    }

    protected onActiveItem(event: IActiveItemEvent)
    {
        if (event.next) {
            this.selectionController.selectNode(event.next);
        }
    }
}