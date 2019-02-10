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

import { customElement, html } from "@ff/ui/CustomElement";
import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

export default class PinSprite extends AnnotationSprite
{
    constructor(annotation: Annotation)
    {
        super(annotation);

        const pin = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(0.3, 0.02, 4),
            new THREE.MeshPhongMaterial({ color: "red" })
        );
        pin.geometry.translate(0, 2, 0);
        this.add(pin);
    }

    update()
    {
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera)
    {
        return super.renderHTMLElement(container, camera);
    }

    createHTMLElement(): PinAnnotation
    {
        return new PinAnnotation(this);
    }
}

@customElement("sv-pin-annotation")
class PinAnnotation extends AnnotationElement
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-pin-annotation");
    }

    protected render()
    {
        const annotation = this.sprite.annotation;
        return html`<div>${annotation.title}</div>`;
    }
}