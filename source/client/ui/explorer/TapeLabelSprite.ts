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

import * as THREE from "three";

import CustomElement, { customElement } from "@ff/ui/CustomElement";
import HTMLSprite from "@ff/three/HTMLSprite";

////////////////////////////////////////////////////////////////////////////////

export default class TapeLabelSprite extends HTMLSprite
{
    constructor()
    {
        super();
        this.matrixAutoUpdate = false;
    }


}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-tape-label-element")
export class TapeLabelElement extends CustomElement
{
    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            position: "absolute",
            pointerEvents: "auto"
        });

        this.setAttribute("pointer-events", "auto");

        this.classList.add("sv-tape-label-element");
    }

    protected render()
    {

    }
}