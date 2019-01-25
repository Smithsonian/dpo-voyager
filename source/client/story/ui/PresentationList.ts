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
import CSelection, { IComponentEvent } from "@ff/graph/components/CSelection";

import { customElement, html, property, PropertyValues } from "@ff/ui/CustomElement";
import Icon from "@ff/ui/Icon";
import List from "@ff/ui/List";

import CPresentation from "../../explorer/components/CPresentation";

import CPresentationController, {
    IPresentationEvent,
    IActivePresentationEvent
} from "../../explorer/components/CPresentationController";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-presentation-list")
class PresentationList extends List<CPresentation>
{
    @property({ attribute: false })
    system: System = null;

    protected presentations: CPresentationController = null;
    protected selection: CSelection = null;

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-presentation-list");

        this.presentations = this.system.components.safeGet(CPresentationController);
        this.selection = this.system.components.safeGet(CSelection);
    }

    protected connected()
    {
        super.connected();

        this.selection.selectedComponents.on(CPresentation, this.onSelectPresentation, this);
        this.presentations.on<IPresentationEvent>("presentation", this.onPresentation, this);
        this.presentations.on<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);
    }

    protected disconnected()
    {
        this.selection.selectedComponents.off(CPresentation, this.onSelectPresentation, this);
        this.presentations.off<IPresentationEvent>("presentation", this.onPresentation, this);
        this.presentations.off<IActivePresentationEvent>("active-presentation", this.onActivePresentation, this);

        super.disconnected();
    }

    protected update(props: PropertyValues)
    {
        this.data = this.system.components.getArray(CPresentation);
        super.update(props);
    }

    protected renderItem(component: CPresentation)
    {
        const isActive = component === this.presentations.activePresentation;
        return html`<div class="ff-flex-row"><ff-icon name=${isActive ? "check" : "empty"}></ff-icon>
            <ff-text class="ff-ellipsis">${component.displayName}</ff-text></div>`;
    }

    protected isItemSelected(component: CPresentation)
    {
        return this.selection.selectedComponents.contains(component);
    }

    protected onClickItem(event: MouseEvent, component: CPresentation)
    {
        this.presentations.activePresentation = component;
        this.selection.selectComponent(component);
    }

    protected onClickEmpty()
    {
    }

    protected onPresentation(event: IPresentationEvent)
    {
        this.requestUpdate();
    }

    protected onSelectPresentation(event: IComponentEvent<CPresentation>)
    {
        this.requestUpdate();
    }

    protected onActivePresentation(event: IActivePresentationEvent)
    {
        this.requestUpdate();
    }
}