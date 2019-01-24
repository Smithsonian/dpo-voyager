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

import System from "@ff/graph/System";
import CSelection from "@ff/graph/components/CSelection";

import { customElement, property, PropertyValues } from "@ff/ui/CustomElement";
import List from "@ff/ui/List";

import CPresentation from "../../explorer/components/CPresentation";

import CPresentationManager, {
    IPresentationEvent,
    IActivePresentationEvent
} from "../../explorer/components/CPresentationManager";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-presentation-list")
class PresentationList extends List<CPresentation>
{
    @property({ attribute: false })
    system: System = null;

    protected manager: CPresentationManager = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-presentation-list");

        this.manager = this.system.components.safeGet(CPresentationManager);
        this.selection = this.system.components.safeGet(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.manager.on<IPresentationEvent>("presentation", this.onPresentation, this);
        this.manager.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
    }

    protected disconnected()
    {
        this.manager.off<IPresentationEvent>("presentation", this.onPresentation, this);
        this.manager.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.system.components.getArray(CPresentation);
        super.update(props);
    }

    protected renderItem(component: CPresentation)
    {
        return component.displayName;
    }

    protected isItemSelected(component: CPresentation)
    {
        return component === this.manager.activePresentation;
    }

    protected onClickItem(event: MouseEvent, component: CPresentation)
    {
        this.manager.activePresentation = component;
        this.selection.selectComponent(component);
    }

    protected onClickEmpty()
    {
        this.manager.activePresentation = null;
    }

    protected onPresentation(event: IPresentationEvent)
    {
        this.requestUpdate();
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
        if (event.previous) {
            this.setSelected(event.previous, false);
        }
        if (event.next) {
            this.setSelected(event.next, true);
        }
    }
}