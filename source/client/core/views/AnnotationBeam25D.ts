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

import AnnotationView, { IObject3DRenderContext } from "./AnnotationView";
import math from "@ff/core/math";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _vec3d = new THREE.Vector3();
const _vec2a = new THREE.Vector2();
const _vec2b = new THREE.Vector2();

const _quadClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];


export default class AnnotationBeam25D extends AnnotationView
{
    protected line: THREE.Line;
    protected textElement: HTMLDivElement = null;
    protected descElement: HTMLDivElement = null;

    protected quadrant = -1;
    protected currentOpacity = 0;
    protected targetOpacity = 0;

    protected create3D(parent: THREE.Object3D)
    {
        const geo = new THREE.Geometry();
        geo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
        const mat = new THREE.LineBasicMaterial({ color: "#009cde" });
        mat.transparent = true;
        this.line = new THREE.Line(geo, mat);
        //this.line.matrixAutoUpdate = false;
        this.line.frustumCulled = false;
        parent.add(this.line);
    }

    protected update3D()
    {
        const box = this.component.getModelBoundingBox();
        box.getSize(_vec3a);
        const size = Math.max(_vec3a.x, _vec3a.y, _vec3a.z);
        const stemSize = size > 0 ? size * 0.08 : 5;
        this.line.scale.setScalar(stemSize);
    }

    protected createHTML(parent: HTMLElement)
    {
        this.textElement = document.createElement("div");
        this.textElement.className = "sv-content sv-text";

        this.descElement = document.createElement("div");
        this.descElement.className = "sv-content sv-description";

        const wrapperElement = document.createElement("div");
        wrapperElement.appendChild(this.descElement);

        parent.appendChild(this.textElement);
        parent.appendChild(wrapperElement);
    }

    protected updateHTML()
    {
        this.textElement.textContent = this.annotation.title;
        this.descElement.textContent = this.annotation.description;
        this.targetOpacity = this.annotation.visible ? 1 : 0;
    }

    protected renderHTML(context: IObject3DRenderContext)
    {
        const containerElement = this.containerHTML;

        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(this.line.modelViewMatrix);

        _vec3b.set(0, 1, 0);
        _vec3b.applyMatrix4(this.line.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);
        const angleOpacity = math.scaleLimit(_vec3c.angleTo(_vec3d) * math.RAD2DEG, 90, 100, 1, 0);

        if (this.currentOpacity > this.targetOpacity) {
            this.currentOpacity = Math.max(this.currentOpacity - 0.05, 0);
        }
        else if (this.currentOpacity < this.targetOpacity) {
            this.currentOpacity = Math.min(this.currentOpacity + 0.05, 1);
        }

        const opacity = angleOpacity * this.currentOpacity;
        containerElement.style.opacity = opacity.toString();
        this.line.material["opacity"] = opacity;

        containerElement.style.visibility = opacity ? "visible" : "hidden";
        //this.line.visible = !!opacity;

        _vec3a.applyMatrix4(context.camera.projectionMatrix);
        _vec3b.applyMatrix4(context.camera.projectionMatrix);

        context.viewport.getScreenCoords(_vec3b, _vec2b);
        containerElement.style.left = _vec2b.x.toString() + "px";
        containerElement.style.top = _vec2b.y.toString() + "px";

        _vec2b.set(_vec3b.x, _vec3b.y);
        _vec2a.set(_vec3a.x, _vec3a.y);
        _vec2b.sub(_vec2a);

        const quadrant = Math.floor(_vec2b.angle() / math.HALF_PI);
        if (quadrant !== this.quadrant) {
            this.quadrant = quadrant;
            containerElement.classList.remove(..._quadClasses);
            containerElement.classList.add(_quadClasses[quadrant]);
        }
    }
}