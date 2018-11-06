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

import math from "@ff/core/math";

import RenderContext from "../app/RenderContext";
import AnnotationsView from "../components/AnnotationsView";

import AnnotationObject, { IAnnotation } from "./AnnotationObject";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _vec3d = new THREE.Vector3();
const _vec2a = new THREE.Vector2();
const _vec2b = new THREE.Vector2();

const _quadClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];

export default class AnnotationHTML extends AnnotationObject
{
    protected line: THREE.Line;

    protected quadrant = -1;
    protected isSelected = true;
    protected handler = 0;

    protected container: HTMLDivElement;
    protected text: HTMLDivElement;
    protected description: HTMLDivElement;
    protected wrapper: HTMLDivElement;

    constructor(views: AnnotationsView, annotation: IAnnotation)
    {
        super(views, annotation);

        this.onClick = this.onClick.bind(this);

        const geo = new THREE.Geometry();
        geo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0));
        const mat = new THREE.LineBasicMaterial({ color: "#009cde" });
        mat.transparent = true;
        this.line = new THREE.Line(geo, mat);
        this.line.matrixAutoUpdate = false;
        this.line.frustumCulled = false;
        this.add(this.line);

        this.createHTML();
        this.update();
        this.setSelected(false);
    }

    update()
    {
        super.update();
        this.updateHTML();
    }

    render(context: RenderContext)
    {
        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(this.line.modelViewMatrix);

        _vec3b.set(0, 5, 0);
        _vec3b.applyMatrix4(this.line.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);
        const opacity = math.scaleLimit(_vec3c.angleTo(_vec3d) * math.RAD2DEG, 90, 100, 1, 0);

        this.container.style.opacity = opacity;
        this.line.material["opacity"] = opacity;

        _vec3a.applyMatrix4(context.camera.projectionMatrix);
        _vec3b.applyMatrix4(context.camera.projectionMatrix);

        context.viewport.getScreenCoords(_vec3b, _vec2b);
        this.container.style.left = _vec2b.x.toString() + "px";
        this.container.style.top = _vec2b.y.toString() + "px";

        _vec2b.set(_vec3b.x, _vec3b.y);
        _vec2a.set(_vec3a.x, _vec3a.y);
        _vec2b.sub(_vec2a);

        const quadrant = Math.floor(_vec2b.angle() / math.HALF_PI);
        if (quadrant !== this.quadrant) {
            this.quadrant = quadrant;
            this.container.classList.remove(..._quadClasses);
            this.container.classList.add(_quadClasses[quadrant]);
        }
    }

    dispose()
    {
        const canvas = document.getElementById("sv-annotations");
        canvas.removeChild(this.container);
    }

    setSelected(selected: boolean)
    {
        if (selected !== this.isSelected) {
            this.isSelected = selected;
            window.clearTimeout(this.handler);

            if (selected) {
                this.container.classList.add("sv-selected");
                this.description.style.display = "inherit";
                this.description.style.height = this.description.scrollHeight + "px";
            }
            else {
                this.container.classList.remove("sv-selected");
                this.description.style.height = "0";
                this.handler = window.setTimeout(() => this.description.style.display = "none", 300);
            }
        }
    }

    protected createHTML()
    {
        this.text = document.createElement("div");
        this.text.className = "sv-content sv-text";

        this.description = document.createElement("div");
        this.description.className = "sv-content sv-description";

        this.wrapper = document.createElement("div");
        this.wrapper.appendChild(this.description);

        this.container = document.createElement("div");
        this.container.className = "sv-annotation";
        this.container.appendChild(this.text);
        this.container.appendChild(this.wrapper);
        this.container.addEventListener("click", this.onClick);

        const canvas = document.getElementById("sv-annotations");
        canvas.appendChild(this.container);

        this.updateHTML();
    }

    protected updateHTML()
    {
        this.text.textContent = this.annotation.title;
        this.description.textContent = this.annotation.description;
    }

    protected onClick()
    {
        this.views.onClick(this);
    }
}

