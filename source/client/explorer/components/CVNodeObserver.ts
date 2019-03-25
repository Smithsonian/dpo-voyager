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

import NVNode from "../nodes/NVNode";
import CVNodeProvider, { IActiveNodeEvent } from "./CVNodeProvider";

import CVDocumentObserver from "./CVDocumentObserver";

////////////////////////////////////////////////////////////////////////////////

export default class CVNodeObserver extends CVDocumentObserver
{
    static readonly tagName: string = "CVNodeObserver";

    protected activeNode: NVNode = null;

    protected get nodeProvider() {
        return this.getGraphComponent(CVNodeProvider);
    }

    protected startObserving()
    {
        super.startObserving();

        const provider = this.nodeProvider;
        provider.on<IActiveNodeEvent>("active-node", this.onActiveNodeEvent, this);

        if (provider.activeNode) {
            this.activeNode = provider.activeNode;
            this.onActiveNode(null, provider.activeNode);
        }
    }

    protected stopObserving()
    {
        const provider = this.nodeProvider;
        provider.off<IActiveNodeEvent>("active-node", this.onActiveNodeEvent, this);

        if (provider.activeNode) {
            this.activeNode = null;
            this.onActiveNode(provider.activeNode, null);
        }

        super.stopObserving();
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
    }

    protected onActiveNodeEvent(event: IActiveNodeEvent)
    {
        this.activeNode = event.next;
        this.onActiveNode(event.previous, event.next);
    }
}