/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Vector3, Line, BufferGeometry, LineBasicMaterial, Color, Camera } from "three";

import math from "@ff/core/math";
import FFColor from "@ff/core/Color";

import { customElement, PropertyValues } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import AnnotationFactory from "./AnnotationFactory";

////////////////////////////////////////////////////////////////////////////////

const _quadrantClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];
const _color = new FFColor();
const _offset = new Vector3(0, 1, 0);

export default class StandardSprite extends AnnotationSprite
{
    static readonly typeName: string = "Standard";

    protected stemLine: Line;
    protected quadrant = -1;
    protected adaptive = true;

    constructor(annotation: Annotation)
    {
        super(annotation);

        const points = [];
        points.push(new Vector3(0, 0, 0));
        points.push(new Vector3(0, 1, 0));

        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({ color: "#009cde", transparent: true });
        material.toneMapped = false;

        this.stemLine = new Line(geometry, material);
        this.stemLine.frustumCulled = false;
        this.stemLine.matrixAutoUpdate = false;
        this.add(this.stemLine);

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;

        this.stemLine.scale.setScalar(annotation.scale);
        this.stemLine.position.y = annotation.offset;
        this.stemLine.updateMatrix();

        const material = this.stemLine.material as LineBasicMaterial;
        (material.color as Color).fromArray(annotation.color);

        super.update();
    }

    renderHTMLElement(element: StandardAnnotation, container: HTMLElement, camera: Camera)
    {
        super.renderHTMLElement(element, container, camera, this.stemLine, _offset);

        const angleOpacity = math.scaleLimit(this.viewAngle * math.RAD2DEG, 90, 100, 1, 0);
        const opacity = this.annotation.data.visible ? angleOpacity : 0;

        this.stemLine.material["opacity"] = opacity;
        element.setOpacity(opacity);
        element.setVisible(this.annotation.data.visible);

        // update quadrant/orientation
        if (this.orientationQuadrant !== this.quadrant) {
            element.classList.remove(_quadrantClasses[this.quadrant]);
            element.classList.add(_quadrantClasses[this.orientationQuadrant]);
            this.quadrant = this.orientationQuadrant;
        }

        // update adaptive width
        if(this.adaptive !== this.isAdaptive) {
            if(this.isAdaptive) {
                element.classList.remove("sv-static-width");
            }
            else {
                element.classList.add("sv-static-width");
            }
            this.adaptive = this.isAdaptive;
        }

        // don't show if behind the camera
        this.setVisible(!this.isBehindCamera(this.stemLine, camera));
    }

    protected createHTMLElement(): StandardAnnotation
    {
        return new StandardAnnotation(this);
    }
}

AnnotationFactory.registerDefaultType(StandardSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-standard-annotation")
class StandardAnnotation extends AnnotationElement
{
    protected titleElement: HTMLDivElement;

    constructor(sprite: AnnotationSprite)
    {
        super(sprite);
        this.onClickTitle = this.onClickTitle.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        this.titleElement = this.appendElement("div");
        this.titleElement.classList.add("sv-title");
        this.titleElement.addEventListener("click", this.onClickTitle);
        this.titleElement.addEventListener("keydown", this.onKeyDown);
        this.titleElement.setAttribute("tabindex", "0");
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-standard-annotation");
    }

    protected update(changedProperties: PropertyValues): void
    {
        super.update(changedProperties);

        const annotation = this.sprite.annotation.data;

        annotation.viewId.length ? this.classList.add("sv-enable-events") : this.classList.remove("sv-enable-events");

        this.titleElement.innerText = this.sprite.annotation.title;

        _color.fromArray(annotation.color);
        this.style.borderColor = _color.toString();
    }

    protected onClickTitle(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitClickEvent();
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        if (event.code === "Space" || event.code === "Enter") {
            event.stopPropagation();
            this.sprite.emitClickEvent();
        }
    }
}