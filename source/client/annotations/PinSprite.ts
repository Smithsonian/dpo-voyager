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

import * as THREE from "three";

import math from "@ff/core/math";
import { customElement, html } from "@ff/ui/CustomElement";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import AnnotationFactory from "./AnnotationFactory";

////////////////////////////////////////////////////////////////////////////////

const _offset = new THREE.Vector3(0, 1.5, 0);

export default class PinSprite extends AnnotationSprite
{
    static readonly typeName: string = "Pin";

    protected pin: THREE.Mesh;

    constructor(annotation: Annotation)
    {
        super(annotation);

        this.pin = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(0.25, 0.02, 1, 16, 1),
            new THREE.MeshPhongMaterial({ color: "white" })
        );
        this.pin.geometry.translate(0, 0.5, 0);
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

        const c = annotation.color;
        (this.pin.material as THREE.MeshPhongMaterial).color.setRGB(c[0], c[1], c[2]);

        super.update();
    }

    renderHTMLElement(element: PinAnnotation, container: HTMLElement, camera: THREE.Camera)
    {
        super.renderHTMLElement(element, container, camera, this.pin, _offset);

        const angleOpacity = math.scaleLimit(this.viewAngle * math.RAD2DEG, 90, 100, 1, 0);
        const opacity = this.annotation.data.visible ? angleOpacity : 0;

        (this.pin.material as THREE.MeshPhongMaterial).opacity = opacity;
        element.setOpacity(opacity);
    }

    protected createHTMLElement(): PinAnnotation
    {
        return new PinAnnotation(this);
    }
}

AnnotationFactory.registerType(PinSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pin-annotation")
class PinAnnotation extends AnnotationElement
{
    setOpacity(opacity: number)
    {
        this.style.opacity = opacity.toString();
        this.style.visibility = opacity ? "visible" : "hidden";
    }

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