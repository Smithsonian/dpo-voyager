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

import Component, { ITypedEvent, types } from "@ff/graph/Component";

import CVTool from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

/**
 * Emitted after the active tool has changed.
 * @event
 */
export interface IActiveToolEvent extends ITypedEvent<"active-tool">
{
    previous: CVTool;
    next: CVTool;
}

/**
 * Emitted after a tool has been added or removed.
 * @event
 */
export interface IToolEvent extends ITypedEvent<"tool">
{
}

export default class CVTools extends Component
{
    static readonly typeName: string = "CVTools";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        visible: types.Boolean("Tools.Visible"),
        activeTool: types.Option("Tools.Active", []),
    };

    ins = this.addInputs(CVTools.ins);

    private _activeTool: CVTool = null;

    get tools() {
        return this.getComponents(CVTool);
    }

    get activeTool() {
        return this._activeTool;
    }
    set activeTool(tool: CVTool) {
        if (tool !== this._activeTool) {
            const previous = this._activeTool;

            if (previous) {
                // deactivate
            }

            this._activeTool = tool;

            if (tool) {
                // activate
            }

            this.emit<IActiveToolEvent>({
                type: "active-tool",
                previous,
                next: tool
            });
        }

        const index = this.tools.indexOf(tool);
        this.ins.activeTool.setValue(index + 1, true);
    }

    create()
    {
        this.components.on(CVTool, this.updateToolSet, this);
        this.updateToolSet();
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.activeTool.changed) {
            const index = ins.activeTool.getValidatedValue() - 1;
            this.activeTool = index >= 0 ? this.tools[index] : null;
        }

        return true;
    }

    dispose()
    {
        this.components.off(CVTool, this.updateToolSet, this);
    }

    protected updateToolSet()
    {
        const tools = this.tools;
        const names = tools.map(tool => tool.displayName);
        names.unshift("(none)");
        this.ins.activeTool.setOptions(names);

        let activeTool = this.activeTool;
        if (activeTool && tools.indexOf(activeTool) < 0) {
            this.activeTool = null;
        }

        this.emit<IToolEvent>({ type: "tool" });
    }
}