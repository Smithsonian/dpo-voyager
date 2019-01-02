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

import Selection from "@ff/graph/Selection";
import HierarchyTree from "@ff/ui/graph/HierarchyTree";
import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-hierarchy-panel")
export default class HierarchyPanel extends CustomElement
{
    @property({ attribute: false })
    selection: Selection;

    constructor(selection?: Selection)
    {
        super();
        this.selection = selection;

        this.onClick = this.onClick.bind(this);
        this.addEventListener("click", this.onClick);
    }


    protected firstConnected()
    {
        this.classList.add("sv-scrollable", "sv-panel", "sv-hierarchy-panel");
        this.appendChild(new HierarchyTree(this.selection));
    }
    protected onClick()
    {
        this.selection.clearSelection();
    }
}