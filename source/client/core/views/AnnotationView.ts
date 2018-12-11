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

import Annotation from "../app/Annotation";
import AnnotationsView, { IObject3DRenderContext } from "../components/AnnotationsView";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export { IObject3DRenderContext };

/**
 * Base class for the visual representation of an annotation.
 * Annotations can have parts of them visualized in 3D (using Three.js components)
 * and parts in 2D (using DOM elements).
 */
export default class AnnotationView
{
    readonly annotation: Annotation;

    protected container3D: THREE.Object3D = null;
    protected containerHTML: HTMLElement = null;
    protected component: AnnotationsView;


    constructor(annotation: Annotation, component: AnnotationsView)
    {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        this.annotation = annotation;
        this.component = component;

        if (this.create3D) {
            this.container3D = new THREE.Object3D();
            this.container3D.matrixAutoUpdate = false;

            this.create3D(this.container3D);
        }
    }

    update()
    {
        if (this.container3D) {
            this.update3D();
        }
        if (this.updateHTML && this.containerHTML) {
            this.updateHTML();
        }
    }

    render(context: IObject3DRenderContext)
    {
        if (this.render3D) {
            this.render3D(context);
        }
        if (this.createHTML && !this.containerHTML) {
            this.containerHTML = document.createElement("div");
            this.containerHTML.classList.add("sv-annotation");
            this.containerHTML.addEventListener("pointerdown", this.onPointerDown);
            this.containerHTML.addEventListener("pointerup", this.onPointerUp);

            this.createHTML(this.containerHTML);
            this.updateHTML();
            context.overlay.appendChild(this.containerHTML);
        }
        if (this.renderHTML) {
            this.renderHTML(context);
        }
    }

    dispose()
    {
        if (this.dispose3D) {
            this.dispose3D();
        }
        if (this.disposeHTML) {
            this.disposeHTML();
        }
    }

    protected onPointerDown(event: PointerEvent)
    {
    }

    protected onPointerUp(event: PointerEvent)
    {
    }

    protected update3D()
    {
        _vec3.fromArray(this.annotation.direction);
        this.container3D.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, _vec3);
        this.container3D.position.fromArray(this.annotation.position);
        this.container3D.updateMatrix();
    }

    protected create3D?(parent: THREE.Object3D);
    protected render3D?(context: IObject3DRenderContext);
    protected dispose3D?();

    protected updateHTML?();
    protected createHTML?(parent: HTMLElement);
    protected renderHTML?(context: IObject3DRenderContext);
    protected disposeHTML?();
}