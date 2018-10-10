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

import Controller, { Actions } from "@ff/core/Controller";
import Commander from "@ff/core/Commander";

import RenderSystem from "../system/RenderSystem";
import { Dictionary } from "@ff/core/types";

////////////////////////////////////////////////////////////////////////////////

export type HierarchyActions = Actions<HierarchyController>;

export default class HierarchyController extends Controller<HierarchyController>
{
    public readonly system: RenderSystem;
    public selected: Dictionary<boolean>;
    public expanded: Dictionary<boolean>;

    constructor(commander: Commander, system: RenderSystem)
    {
        super(commander);
        this.addEvent("change");

        this.system = system;
        this.system.on("component", this.onSystemChange, this);
        this.system.on("entity", this.onSystemChange, this);

        this.selected = {};
        this.expanded = {};
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

    setExpanded(id: string, expanded: boolean)
    {
        this.expanded[id] = expanded;
        this.emit("change");
    }

    toggleExpanded(id: string)
    {
        this.expanded[id] = !this.expanded[id];
        this.emit("change");
    }

    setSelected(id: string, selected: boolean)
    {
        this.selected = {};
        this.selected[id] = selected;

        this.emit("change");
    }

    toggleSelected(id: string)
    {
        this.selected[id] = !this.selected[id];
        this.emit("change");
    }

    protected onSystemChange()
    {
        this.emit("change");
    }
}