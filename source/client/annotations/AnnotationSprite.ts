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

import { Object3D, Camera, ArrayCamera, PerspectiveCamera, Vector3 } from "three";

import { ITypedEvent } from "@ff/core/Publisher";
import HTMLSprite, { SpriteElement, html } from "@ff/three/HTMLSprite";

import Annotation from "../models/Annotation";
import CVAssetReader from "client/components/CVAssetReader";
import AnnotationOverlay from "client/ui/explorer/AnnotationOverlay";

////////////////////////////////////////////////////////////////////////////////

const _vec3up = new Vector3(0, 1, 0);
const _vec3dir = new Vector3();
const _vec3a = new Vector3();
const _vec3b = new Vector3();

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

    isAdaptive = true;
    isAnimating = false;
    assetManager = null;
    audioManager = null;

    /**
     * Returns the type name of this annotation object.
     * @returns {string}
     */
    get typeName() {
        return (this.constructor as typeof AnnotationSprite).typeName;
    }

    readonly annotation: Annotation;

    constructor(annotation: Annotation, assetReader?: CVAssetReader)
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

    protected isBehindCamera(anchor: Object3D, camera: Camera) : boolean
    {
        let matrixCamera : Camera = null;
        if(camera instanceof ArrayCamera && (camera as ArrayCamera).cameras.length > 0) {
            matrixCamera = (camera as ArrayCamera).cameras[0];
        }
        else {
            matrixCamera = camera;
        }

        const e = matrixCamera.matrixWorld.elements;

        anchor.updateMatrixWorld();
        _vec3a.setFromMatrixPosition(anchor.matrixWorld); 
        _vec3b.setFromMatrixPosition(matrixCamera.matrixWorld);
        
        _vec3dir.set(-e[8], -e[9], -e[10]).normalize();
        _vec3b.addScaledVector(_vec3dir, (matrixCamera as PerspectiveCamera).near); // add clip plane offset
        _vec3b.sub(_vec3a);

        return _vec3b.angleTo(_vec3dir) <= Math.PI / 2;
    }
}

////////////////////////////////////////////////////////////////////////////////

export class AnnotationElement extends SpriteElement
{
    protected sprite: AnnotationSprite;
    protected isTruncated: boolean = false;
    protected isOverlayed: boolean = false;

    get truncated()
    {
        return this.isTruncated
    }
    set truncated(value: boolean)
    {
        this.isTruncated = value;
    }
    get overlayed()
    {
        return this.isOverlayed
    }
    set overlayed(value: boolean)
    {
        this.isOverlayed = value;
    }

    constructor(sprite: AnnotationSprite)
    {
        super();
        this.sprite = sprite;

        //this.onClick = this.onClick.bind(this);
        this.discardEvent = this.discardEvent.bind(this);

        //this.addEventListener("pointerdown", this.discardEvent);
        //this.addEventListener("pointermove", this.discardEvent);
        //this.addEventListener("pointerup", this.discardEvent);
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

    showOverlay(content: HTMLElement)
    {
        this.requestUpdate().then(() => {
            AnnotationOverlay.show(this.parentElement, content, this.sprite).then(() => {
                this.overlayed = false;
                this.append(content); // attach content back to original container
                this.requestUpdate();
            });
        });
    }
}