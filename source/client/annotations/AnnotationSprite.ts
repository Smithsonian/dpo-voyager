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

import { ITypedEvent } from "@ff/core/Publisher";
import CustomElement, { html } from "@ff/ui/CustomElement";
import HTMLSprite from "@ff/three/HTMLSprite";

import Annotation from "../models/Annotation";

////////////////////////////////////////////////////////////////////////////////

const _vec3up = new THREE.Vector3(0, 1, 0);
const _vec3dir = new THREE.Vector3();

export { Annotation, html };

/**
 * Emitted by [[AnnotationSprite]] if the user clicks on the annotation.
 * @event
 */
export interface IAnnotationClickEvent extends ITypedEvent<"click">
{
    annotation: Annotation;
    sprite: AnnotationSprite;
}

/**
 * Emitted by [[AnnotationSprite]] if the user activates a link on the annotation.
 * @event
 */
export interface IAnnotationLinkEvent extends ITypedEvent<"link">
{
    annotation: Annotation;
    sprite: AnnotationSprite;
    link: string;
}

/**
 * Defines the visual appearance of an annotation.
 * An annotation consists of a 3D (WebGL) part and a 2D (HTML) part.
 *
 * ### Events
 * - *"click"* Emitted if the user clicks on the annotation.
 * - *"link"* Emitted if the user activates a link on the annotation.
 */
export default class AnnotationSprite extends HTMLSprite
{
    static readonly typeName: string = "Annotation";

    /**
     * Returns the type name of this annotation object.
     * @returns {string}
     */
    get typeName() {
        return (this.constructor as typeof AnnotationSprite).typeName;
    }

    readonly annotation: Annotation;

    constructor(annotation: Annotation)
    {
        super();

        this.annotation = annotation;
        this.matrixAutoUpdate = false;
    }

    update()
    {
        super.update();

        const annotation = this.annotation.data;
        this.position.fromArray(annotation.position);
        _vec3dir.fromArray(annotation.direction).normalize();
        this.quaternion.setFromUnitVectors(_vec3up, _vec3dir);

        this.updateMatrix();
    }

    updateHTMLElement(element: AnnotationElement)
    {
        element.requestUpdate();
    }

    emitClickEvent()
    {
        const event: IAnnotationClickEvent = { type: "click", annotation: this.annotation, sprite: this };
        this.dispatchEvent(event);
    }

    emitLinkEvent(link: string)
    {
        const event: IAnnotationLinkEvent = { type: "link", annotation: this.annotation, sprite: this, link };
        this.dispatchEvent(event);
    }
}

////////////////////////////////////////////////////////////////////////////////

export class AnnotationElement extends CustomElement
{
    protected sprite: AnnotationSprite;

    constructor(sprite: AnnotationSprite)
    {
        super();
        this.sprite = sprite;

        //this.onClick = this.onClick.bind(this);
        this.discardEvent = this.discardEvent.bind(this);

        this.addEventListener("pointerdown", this.discardEvent);
        this.addEventListener("pointermove", this.discardEvent);
        this.addEventListener("pointerup", this.discardEvent);
        this.addEventListener("pointercancel", this.discardEvent);
        this.addEventListener("click", this.discardEvent);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-annotation");
    }

    protected discardEvent(event: Event)
    {
        event.stopPropagation();
    }
}