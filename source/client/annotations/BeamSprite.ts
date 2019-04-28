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

import { customElement, PropertyValues, html, render } from "@ff/ui/CustomElement";
import Button from "@ff/ui/Button";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

const _quadrantClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];


export default class BeamSprite extends AnnotationSprite
{
    protected beam: THREE.Line;
    protected quadrant = -1;

    constructor(annotation: Annotation)
    {
        super(annotation);

        const geo = new THREE.Geometry();
        geo.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
        const mat = new THREE.LineBasicMaterial({ color: "#009cde" });
        mat.transparent = true;

        this.beam = new THREE.Line(geo, mat);
        this.beam.frustumCulled = false;
        this.beam.matrixAutoUpdate = false;
        this.add(this.beam);

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;

        this.beam.scale.setScalar(5 * annotation.scale);
        this.beam.position.y = annotation.offset;
        this.beam.updateMatrix();

        super.update();
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera)
    {
        const element = super.renderHTMLElement(container, camera, this.beam) as BeamAnnotation;

        const angleOpacity = math.scaleLimit(this.viewAngle * math.RAD2DEG, 90, 100, 1, 0);
        const opacity = angleOpacity * element.getOpacity();

        element.style.opacity = opacity.toString();
        this.beam.material["opacity"] = opacity;

        element.style.visibility = opacity ? "visible" : "hidden";

        // update quadrant/orientation
        if (this.orientationQuadrant !== this.quadrant) {
            element.classList.remove(_quadrantClasses[this.quadrant]);
            element.classList.add(_quadrantClasses[this.orientationQuadrant]);
            this.quadrant = this.orientationQuadrant;
        }

        return element;
    }

    updateHTMLElement(element: BeamAnnotation)
    {
        element.performUpdate();
    }

    protected createHTMLElement(): BeamAnnotation
    {
        return new BeamAnnotation(this);
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-beam-annotation")
class BeamAnnotation extends AnnotationElement
{
    protected titleElement: HTMLDivElement;
    protected contentElement: HTMLDivElement;
    protected wrapperElement: HTMLDivElement;
    protected handler = 0;
    protected isExpanded = true;
    protected currentOpacity = 0;
    protected targetOpacity = 0;

    constructor(sprite: AnnotationSprite)
    {
        super(sprite);

        this.onClickArticle = this.onClickArticle.bind(this);

        this.titleElement = this.appendElement("div");
        this.titleElement.classList.add("sv-content", "sv-title");

        this.wrapperElement = this.appendElement("div");

        this.contentElement = this.createElement("div", null, this.wrapperElement);
        this.contentElement.classList.add("sv-content", "sv-description");
    }

    getOpacity()
    {
        // if (this.currentOpacity > this.targetOpacity) {
        //     this.currentOpacity = Math.max(this.currentOpacity - 0.05, 0);
        // }
        // else if (this.currentOpacity < this.targetOpacity) {
        //     this.currentOpacity = Math.min(this.currentOpacity + 0.05, 1);
        // }
        this.currentOpacity = this.targetOpacity;
        return this.currentOpacity;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-beam-annotation");
    }

    protected update(changedProperties: PropertyValues): void
    {
        super.update(changedProperties);

        const annotation = this.sprite.annotation.data;

        this.titleElement.innerText = annotation.title;

        const contentTemplate = html`<p>${annotation.lead}</p>
            ${annotation.articleId ? html`<ff-button inline text="Read more..." icon="document" @click=${this.onClickArticle}></ff-button>` : null}`;

        render(contentTemplate, this.contentElement);

        this.targetOpacity = annotation.visible ? 1 : 0;

        if (this.isExpanded !== annotation.expanded) {

            this.isExpanded = annotation.expanded;
            window.clearTimeout(this.handler);

            if (this.isExpanded) {
                this.classList.add("sv-expanded");
                this.contentElement.style.display = "inherit";
                this.contentElement.style.height = this.contentElement.scrollHeight + "px";

            }
            else {
                this.classList.remove("sv-expanded");
                this.contentElement.style.height = "0";
                this.handler = window.setTimeout(() => this.contentElement.style.display = "none", 300);

            }
        }
    }

    protected onClickArticle(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitLinkEvent(this.sprite.annotation.data.articleId);
    }
}