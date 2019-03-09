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
 * Manages available tools and keeps track of the currently active tool.
 */
export default class CVToolManager extends Component
{
    static readonly typeName: string = "CVToolManager";
    static readonly isSystemSingleton = true;

    protected static readonly ins = {
        visible: types.Boolean("Tools.Visible"),
        activeTool: types.Option("Tools.ActiveTool", []),
    };

    protected static readonly outs = {
        activeTool: types.Object("Tools.ActiveTool", CVTool),
        changedTools: types.Event("Tools.Changed"),
    };

    ins = this.addInputs(CVToolManager.ins);
    outs = this.addOutputs(CVToolManager.outs);

    get tools() {
        return this.getComponents(CVTool);
    }
    get activeTool() {
        return this.outs.activeTool.value;
    }
    set activeTool(tool: CVTool) {
        if (tool !== this.activeTool) {
            const index = this.tools.indexOf(tool);
            this.ins.activeTool.setValue(index + 1);
        }
    }

    create()
    {
        this.components.on(CVTool, this.updateTools, this);
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.activeTool.changed) {
            const index = ins.activeTool.getValidatedValue() - 1;
            const nextTool = index >= 0 ? this.tools[index] : null;
            const activeTool = this.activeTool;

            if (nextTool !== activeTool) {
                if (activeTool) {
                    activeTool.deactivateTool();
                }
                if (nextTool) {
                    nextTool.activateTool();
                }

                this.outs.activeTool.setValue(nextTool);
            }
        }

        return true;
    }

    dispose()
    {
        this.components.off(CVTool, this.updateTools, this);
        super.dispose();
    }

    protected updateTools()
    {
        const tools = this.tools;
        const names = tools.map(tool => tool.displayName);
        names.unshift("(none)");
        this.ins.activeTool.setOptions(names);

        let activeTool = this.activeTool;

        const index = activeTool ?
            tools.indexOf(activeTool) :
            Math.min(1, tools.length);

        if (index !== this.ins.activeTool.getValidatedValue()) {
            this.ins.activeTool.setValue(index);
        }

        this.outs.changedTools.set();
    }
}