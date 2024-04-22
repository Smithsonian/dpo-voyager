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

import { Node, types } from "@ff/graph/Component";

import CComponentProvider, {
    EComponentScope,
    IActiveComponentEvent
} from "@ff/graph/components/CComponentProvider";

import CVTool from "./CVTool";
import CVAnalytics from "./CVAnalytics";

////////////////////////////////////////////////////////////////////////////////

export type IActiveToolEvent = IActiveComponentEvent<CVTool>;

export default class CVToolProvider extends CComponentProvider<CVTool>
{
    static readonly typeName: string = "CVToolProvider";
    static readonly isSystemSingleton = true;
    static readonly componentType = CVTool;

    protected static readonly ins = {
        visible: types.Boolean("Tools.Visible"),
        closed: types.Event("Tools.Closed")
    };

    ins = this.addInputs(CVToolProvider.ins);

    protected get analytics() {
        return this.getMainComponent(CVAnalytics);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);
        this.scope = EComponentScope.Node;
    }

    update(context)
    {
        const ins = this.ins;

        if (ins.visible.changed) {
            /*if (ins.visible.value && !this.activeComponent) {
                this.activeComponent = this.scopedComponents[0];
            }*/
        }

        return true;
    }

    protected activateComponent(tool: CVTool)
    {
        tool.activateTool();

        this.analytics.sendProperty("Tools_ActiveTool", tool.text);
    }

    protected deactivateComponent(tool: CVTool)
    {
        tool.deactivateTool();
    }

    protected onActiveComponent(previous: CVTool, next: CVTool)
    {
    }
}