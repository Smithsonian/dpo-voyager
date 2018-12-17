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

import SelectionController from "@ff/graph/SelectionController";

import PropertyTree from "@ff/ui/graph/PropertyTree";
import CustomElement, { customElement, property } from "@ff/ui/CustomElement";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-inspector-view")
export default class InspectorView extends CustomElement
{
    @property({ attribute: false })
    controller: SelectionController;

    constructor(controller?: SelectionController)
    {
        super();
        this.controller = controller;
    }

    firstConnected()
    {
        this.setStyle({
            position: "absolute",
            top: "0", left: "0", bottom: "0", right: "0",
            overflowY: "auto"
        });

        this.classList.add("sv-inspector-view");

        this.appendChild(new PropertyTree(this.controller));
    }
}