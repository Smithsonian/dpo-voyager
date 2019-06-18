/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import { customElement, property, html, PropertyValues, TemplateResult } from "@ff/ui/CustomElement";

import CVNodeProvider, { IActiveNodeEvent } from "../../components/CVNodeProvider";
import NVNode from "../../nodes/NVNode";

import DocumentView from "./DocumentView";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export default class NodeView extends DocumentView
{
    protected activeNode: NVNode = null;

    protected get nodeProvider() {
        return this.system.getMainComponent(CVNodeProvider);
    }

    protected connected()
    {
        super.connected();

        const provider = this.nodeProvider;
        provider.on<IActiveNodeEvent>("active-node", this.onActiveNodeEvent, this);

        if (provider.activeNode) {
            this.activeNode = provider.activeNode;
            this.onActiveNode(null, provider.activeNode);
        }
    }

    protected disconnected()
    {
        const provider = this.nodeProvider;
        provider.off<IActiveNodeEvent>("active-node", this.onActiveNodeEvent, this);

        if (provider.activeNode) {
            this.activeNode = null;
            this.onActiveNode(provider.activeNode, null);
        }

        super.disconnected();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        this.requestUpdate();
    }

    private onActiveNodeEvent(event: IActiveNodeEvent)
    {
        this.activeNode = event.next;
        this.onActiveNode(event.previous, event.next);
    }
}