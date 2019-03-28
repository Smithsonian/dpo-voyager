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
    protected pin: THREE.Mesh;

    constructor(annotation: Annotation)
    {
        super(annotation);

        this.pin = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(0.5, 0.02, 3, 16, 1),
            new THREE.MeshPhongMaterial({ color: "#f21818" })
        );
        this.pin.geometry.translate(0, 1.5, 0);
        this.pin.frustumCulled = false;
        this.pin.matrixAutoUpdate = false;
        this.add(this.pin);

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;

        this.pin.scale.setScalar(annotation.scale);
        this.pin.position.y = annotation.offset;
        this.pin.updateMatrix();

        super.update();
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera)
    {
        return null; //super.renderHTMLElement(container, camera, this.pin);
    }

    updateHTMLElement(element: PinAnnotation)
    {
        //element.performUpdate();
    }

    protected createHTMLElement(): PinAnnotation
    {
        return null; //new PinAnnotation(this);
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
        const annotation = this.sprite.annotation.data;
        return html`<div>${annotation.title}</div>`;
    }
}