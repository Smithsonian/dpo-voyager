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

import { Dictionary } from "@ff/core/types";
import Commander from "@ff/core/Commander";
import { ISystemEntityEvent, ISystemComponentEvent } from "@ff/core/ecs/System";

import Controller, { Actions } from "./Controller";
import { IComponentChangeEvent } from "@ff/core/ecs/Component";

////////////////////////////////////////////////////////////////////////////////

export type HierarchyActions = Actions<HierarchyController>;

export default class HierarchyController extends Controller<HierarchyController>
{
    static readonly type: string = "HierarchyController";

    public selected: Dictionary<boolean> = {};
    public expanded: Dictionary<boolean> = {};


    create()
    {
        super.create();

        this.system.on("component", this.onComponent, this);
        this.system.on("entity", this.onEntity, this);
    }

    update()
    {
        this.emit<IComponentChangeEvent>("change", { what: "hierarchy" });
    }

    dispose()
    {
        this.system.off("component", this.onComponent, this);
        this.system.off("entity", this.onEntity, this);

        super.dispose();
    }

    createActions(commander: Commander)
    {
        return {
            toggleExpanded: commander.register({
                name: "Toggle Expanded", do: this.toggleExpanded, target: this
            }),
            setSelected: commander.register({
                name: "Set Selected", do: this.setSelected, target: this
            }),
        }
    }

    toggleExpanded(id: string)
    {
        this.expanded[id] = !this.expanded[id];
        this.emit<IComponentChangeEvent>("change", { what: "view" });
    }

    setSelected(id: string, selected: boolean)
    {
        this.selected = {};
        this.selected[id] = selected;

        this.emit<IComponentChangeEvent>("change", { what: "selection" });
    }

    protected onEntity(event: ISystemEntityEvent)
    {
        if (event.add) {
            this.expanded[event.entity.id] = true;
        }

        this.changed = true;
    }

    protected onComponent(event: ISystemComponentEvent)
    {
        if (event.add) {
            this.expanded[event.component.id] = true;
        }

        this.changed = true;
    }
}