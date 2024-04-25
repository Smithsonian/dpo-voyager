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

import CNodeProvider, {
    ENodeScope,
    IActiveNodeEvent as _IActiveNodeEvent,
    IScopedNodesEvent,
} from "@ff/graph/components/CNodeProvider";

import NVNode from "../nodes/NVNode";
import CVDocumentProvider, { IActiveDocumentEvent } from "./CVDocumentProvider";

////////////////////////////////////////////////////////////////////////////////

export type IActiveNodeEvent = _IActiveNodeEvent<NVNode>;
export type INodesEvent = IScopedNodesEvent;

export default class CVNodeProvider extends CNodeProvider<NVNode>
{
    static readonly typeName: string = "CVNodeProvider";

    static readonly nodeType = NVNode;
    static readonly followComponentSelection = true;

    protected static readonly outs = {
        activeNode: types.Object("Nodes.Active", NVNode),
        changedNodes: types.Event("Nodes.Changed"),
    };

    outs = this.addOutputs(CVNodeProvider.outs);

    constructor(node: Node, id: string)
    {
        super(node, id);

        this.scope = ENodeScope.Graph;
    }

    protected get documentProvider() {
        return this.getComponent(CVDocumentProvider);
    }

    create()
    {
        super.create();
        this.documentProvider.on<IActiveDocumentEvent>("active-component", this.onActiveDocument, this);
    }

    dispose()
    {
        this.documentProvider.off<IActiveDocumentEvent>("active-component", this.onActiveDocument, this);
        super.dispose();
    }

    protected onActiveDocument(event: IActiveDocumentEvent)
    {
        this.scopedGraph = event.next;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.outs.activeNode.setValue(next);

        const selection = this.selection;

        if (next) {
            if (!selection.nodeContainsSelectedComponent(next)) {
                selection.selectNode(next);
            }
        }
        else if (previous) {
            selection.clearSelection();
        }
    }

    protected onScopedNodes()
    {
        this.outs.changedNodes.set();
    }
}