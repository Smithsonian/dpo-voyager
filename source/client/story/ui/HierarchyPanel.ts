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

import CSelection from "@ff/graph/components/CSelection";
import HierarchyTree from "@ff/ui/graph/HierarchyTree";

import RenderSystem from "@ff/scene/RenderSystem";
import SystemElement, { customElement } from "./SystemElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-hierarchy-panel")
export default class HierarchyPanel extends SystemElement
{
    constructor(system?: RenderSystem)
    {
        super(system);

        this.onClick = this.onClick.bind(this);
        this.addEventListener("click", this.onClick);
    }


    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-hierarchy-panel");
        this.appendChild(new HierarchyTree(this.system));
    }
    protected onClick()
    {
        const selection = this.system.components.safeGet(CSelection);
        selection.clearSelection();
    }
}