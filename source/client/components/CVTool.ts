/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { types } from "@ff/graph/Component";

import CVNodeObserver from "./CVNodeObserver";
import CVAnalytics from "./CVAnalytics";

import NodeView, { customElement, property, html } from "../ui/explorer/NodeView";

////////////////////////////////////////////////////////////////////////////////

export { types, customElement, property, html };

export default class CVTool extends CVNodeObserver
{
    static readonly typeName: string = "CVTool";

    protected static readonly toolIns = {
    };

    protected static readonly toolOuts = {
    };

    ins = this.addInputs(CVTool.toolIns);
    outs = this.addOutputs(CVTool.toolOuts);

    protected get isActiveTool() {
        return this._isActiveTool;
    }

    private _isActiveTool = false;

    dispose()
    {
        if (this._isActiveTool) {
            this.deactivateTool();
        }

        super.dispose();
    }

    createView(): ToolView
    {
        throw new Error("must override");
    }

    /**
     * Called when the tool is activated.
     */
    activateTool()
    {
        this._isActiveTool = true;
        this.startObserving();
    }

    /**
     * Called when the tool is deactivated.
     */
    deactivateTool()
    {
        this.stopObserving();
        this._isActiveTool = false;
    }
}

////////////////////////////////////////////////////////////////////////////////

export class ToolView<T extends CVTool = CVTool> extends NodeView
{
    @property({ attribute: false })
    tool: T = null;

    protected needsFocus: boolean = false;

    protected get analytics() {
        return this.system.getMainComponent(CVAnalytics);
    }

    constructor(tool?: T)
    {
        super(tool.system);
        this.tool = tool;
    }

    protected firstConnected()
    {
        this.classList.add("sv-group", "sv-tool-view");
        this.needsFocus = true;
    }

    protected connected()
    {
        super.connected();
        this.tool.on("update", this.onUpdate, this);
    }

    protected disconnected()
    {
        this.tool.off("update", this.onUpdate, this);
        super.disconnected();
    }

    protected updated(changedProperties) {
        super.updated(changedProperties);

        if(this.needsFocus) {
            this.setFocus();
            this.needsFocus = false;
        }
    }

    /** Can be implemented to set focus on specific 
        tool widget when tool is activated */
    protected setFocus() {}
}