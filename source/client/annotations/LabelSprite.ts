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

import { customElement, html } from "@ff/ui/CustomElement";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import AnnotationFactory from "./AnnotationFactory";

////////////////////////////////////////////////////////////////////////////////

export default class LabelSprite extends AnnotationSprite
{
    static readonly typeName: string = "Label";

    protected cone: THREE.Mesh;

    constructor(annotation: Annotation)
    {
        super(annotation);

        this.cone = new THREE.Mesh(
            new THREE.CylinderBufferGeometry(0.3, 0.02, 4),
            new THREE.MeshPhongMaterial({ color: "green" })
        );

        this.cone.geometry.translate(0, 2, 0);
        this.add(this.cone);
    }

    update()
    {
        super.update();
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera)
    {
        return super.renderHTMLElement(container, camera, this.cone);
    }

    createHTMLElement(): LabelAnnotation
    {
        return new LabelAnnotation(this);
    }
}

AnnotationFactory.registerType(LabelSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-label-annotation")
class LabelAnnotation extends AnnotationElement
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-label-annotation");
    }

    protected render()
    {
        const annotation = this.sprite.annotation.data;
        return html`<div>${annotation.title}</div>`;
    }
}