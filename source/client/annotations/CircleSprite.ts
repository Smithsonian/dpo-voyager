/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Group, Mesh, MeshBasicMaterial, BufferGeometry, Vector3 } from "three";

import { customElement, html, render } from "@ff/ui/CustomElement";
import math from "@ff/core/math";
import FFColor from "@ff/core/Color";
import "@ff/ui/Button";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import UniversalCamera from "@ff/three/UniversalCamera";
import AnnotationFactory from "./AnnotationFactory";

import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

////////////////////////////////////////////////////////////////////////////////

const _color = new FFColor();
const _offset = new Vector3(0, 0, 0);
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3c = new Vector3();
const _vec3d = new Vector3();

export default class CircleSprite extends AnnotationSprite
{
    static readonly typeName: string = "Circle";

    protected offset: Group;
    protected anchorMesh: Mesh;
    protected adaptive = true;
    protected originalHeight;
    protected originalWidth;

    constructor(annotation: Annotation)
    {
        super(annotation);

        this.offset = new Group();
        this.offset.matrixAutoUpdate = false;

        this.add(this.offset);

        this.anchorMesh = new Mesh(
            new BufferGeometry(),
            new MeshBasicMaterial()
        );
        this.anchorMesh.frustumCulled = false;
        this.anchorMesh.matrixAutoUpdate = false;

        this.offset.add(this.anchorMesh);

        this.update();
    }

    dispose()
    {
        this.offset = null;
        this.anchorMesh = null;

        super.dispose();
    }

    update()
    {
        const annotation = this.annotation.data;

        this.anchorMesh.scale.setScalar(annotation.scale);
        this.anchorMesh.position.y = annotation.offset;
        this.anchorMesh.updateMatrix();

        super.update();
    }

    renderHTMLElement(element: AnnotationElement, bounds: DOMRect, camera: UniversalCamera)
    {
        super.renderHTMLElement(element, bounds, camera, this.anchorMesh, _offset);

        // Override viewAngle calculation using temporary offset
        const anchor = this.anchorMesh;
        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(anchor.modelViewMatrix);

        _vec3b.set(0, 1, 0);
        _vec3b.applyMatrix4(anchor.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);

        this.viewAngle = _vec3c.angleTo(_vec3d);

        // Set opacity based on viewAngle
        const angleOpacity = math.scaleLimit(this.viewAngle * math.RAD2DEG, 90, 100, 1, 0);
        const opacity = this.annotation.data.visible ? angleOpacity : 0;

        element.setOpacity(opacity);

        const annotation = this.annotation.data;
        const isShowing = annotation.visible;

        this.offset.visible = isShowing;

        // update adaptive settings
        if(this.adaptive !== this.isAdaptive) {
            if(!this.isAdaptive) {
                element.truncated = false;
                element.classList.remove("sv-short");
                element.requestUpdate();
            }
            this.adaptive = this.isAdaptive;
        }

        // don't show if behind the camera
        this.setVisible(!this.isBehindCamera(this.offset, camera) && isShowing && this.annotation.data.visible); 
        if(!this.getVisible()) {
            element.setVisible(this.getVisible());
        }

        // check if annotation is out of bounds and update if needed
        if (this.adaptive && !this.isAnimating && annotation.expanded) {

            if(!element.truncated) {
                if(!element.classList.contains("sv-expanded")) {
                    element.requestUpdate().then(() => {
                        this.originalHeight = element.offsetHeight;
                        this.originalWidth = element.offsetWidth;
                        this.checkTruncate(element, bounds);
                    });
                }
                else {
                    this.originalHeight = element.offsetHeight;
                    this.originalWidth = element.offsetWidth;
                }
            }

            this.checkTruncate(element, bounds);
        }
    }

    protected createHTMLElement()
    {
        return new CircleAnnotation(this);
    }

    // Helper function to check if annotation should truncate
    protected checkTruncate(element: AnnotationElement, bounds: DOMRect) {
        const x = element.getBoundingClientRect().left - bounds.left;
        const y = element.getBoundingClientRect().top - bounds.top;

        const shouldTruncate = y + this.originalHeight >= bounds.height;
        if(shouldTruncate !== element.truncated) {
            element.truncated = shouldTruncate;
            element.requestUpdate().then(() => {
                this.checkBounds(element, bounds);
            });
        }
        else {
            this.checkBounds(element, bounds);
        }
    }

    // Helper function to check and handle annotation overlap with bounds of container
    protected checkBounds(element: AnnotationElement, bounds: DOMRect) {
        const x = element.getBoundingClientRect().left - bounds.left;
        const y = element.getBoundingClientRect().top - bounds.top;

        if (x + element.offsetWidth >= bounds.width && !element.classList.contains("sv-align-right")) {
            element.classList.add("sv-align-right");
            element.requestUpdate();
        }
        else if (x + element.offsetWidth < bounds.width && element.classList.contains("sv-align-right")){
            element.classList.remove("sv-align-right");
            element.requestUpdate();
        }
        if (y + element.offsetHeight >= bounds.height && !element.classList.contains("sv-align-bottom")) {
            element.classList.add("sv-align-bottom");
            element.requestUpdate();
        }
        else if (y + element.offsetHeight < bounds.height && element.classList.contains("sv-align-bottom")) {
            element.classList.remove("sv-align-bottom");
            element.requestUpdate();
        }
    }
}

AnnotationFactory.registerType(CircleSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-circle-annotation")
class CircleAnnotation extends AnnotationElement
{
    protected markerElement: HTMLDivElement;
    protected contentElement: HTMLDivElement;
    protected isExpanded = undefined;

    constructor(sprite: CircleSprite)
    {
        super(sprite);
        
        this.onClickMarker = this.onClickMarker.bind(this);
        this.onClickArticle = this.onClickArticle.bind(this);
        this.onClickAudio = this.onClickAudio.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyDownArticle = this.onKeyDownArticle.bind(this);
        this.onClickOverlay = this.onClickOverlay.bind(this);

        this.addEventListener("keydown", this.onKeyDown);

        this.markerElement = this.appendElement("div");
        this.markerElement.classList.add("sv-marker");
        this.markerElement.addEventListener("click", this.onClickMarker);
        this.markerElement.setAttribute("tabindex", "0");

        this.contentElement = this.appendElement("div");
        this.contentElement.classList.add("sv-annotation-body");
        this.contentElement.style.display = "none";
    }

    setVisible(visible: boolean)
    {
        this.style.display = visible ? "flex" : "none";
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-circle-annotation");
    }

    protected updated(changedProperties): void {
        super.updated(changedProperties);

        const annotation = this.sprite.annotation;
        const annotationData = annotation.data;
        const isTruncated = !this.overlayed && this.truncated 
            && (annotationData.imageUri || annotationData.articleId || annotation.lead.length > 0); // make sure we have content to truncate
        const audio = this.sprite.audioManager;

        // update title
        this.markerElement.innerText = annotationData.marker;
        
        const contentTemplate = html`
            ${!this.isOverlayed ? html`<div class="sv-title">${annotation.title}</div>` : null}
            ${annotationData.imageUri && !isTruncated ? html`<div><img alt="${annotation.imageAltText}" src="${this.sprite.assetManager.getAssetUrl(annotationData.imageUri)}">${annotation.imageCredit ? html`<div class="sv-img-credit">${annotation.imageCredit}</div>` : null}</div>` : null}
            ${!isTruncated ? html`<div class="sv-content"><p>${unsafeHTML(annotation.lead)}</p></div>` : null}
            ${annotationData.audioId && !this.isOverlayed ? html`<div id="audio_container" @pointerdown=${this.onClickAudio}></div>` : null}
            ${annotationData.articleId && !isTruncated ? html`<ff-button inline id="read-more" text="Read more..." icon="document" @keydown=${this.onKeyDownArticle} @pointerdown=${this.onClickArticle}></ff-button>` : null}
            ${isTruncated ? html`<ff-button inline id="more-info" text="+more info" @pointerdown=${this.onClickOverlay}></ff-button>` : null}`;  

        render(contentTemplate, this.contentElement);

        // update color
        _color.fromArray(annotationData.color);
        this.markerElement.style.borderColor = _color.toString();

        // update expanded height in case annotation changed
        if (this.isExpanded) {
            this.contentElement.style.height = "auto";
        }

        // update expanded/collapsed
        if (this.isExpanded !== annotationData.expanded && !this.overlayed) {

            this.isExpanded = annotationData.expanded;

            if (this.isExpanded) {
                if(annotationData.audioId) {
                    const audioContainer = this.querySelector("#audio_container");
                    if(audioContainer.firstChild) {
                        audioContainer.removeChild(audioContainer.firstChild);
                    }
                    audioContainer.append(audio.getPlayerById(annotationData.audioId));
                }

                this.classList.add("sv-expanded");
                //this.style.minWidth = annotationData.lead.length < 40 && (!annotationData.audioId || annotationData.audioId.length == 0) ? "0" : "";
                this.contentElement.style.display = "block";
                this.contentElement.style.height = "auto"; //this.contentElement.scrollHeight + "px";
            }
            else {
                this.classList.remove("sv-expanded");
                this.contentElement.style.display = "none";

                if(audio.activeId == annotationData.audioId) {
                    this.sprite.audioManager.stop();
                }
            }
        }

        // Handle shifting annotation body when out-of-bounds
        if (this.isExpanded) {
            this.contentElement.style.removeProperty("transform");
            if (this.classList.contains("sv-align-right") && !this.overlayed) {
                this.contentElement.style.transform = `translateX(-${this.offsetWidth}px)`;
            }
            if (this.classList.contains("sv-align-bottom") && !this.overlayed) {
                this.contentElement.style.transform = `translateY(-${this.offsetHeight-this.markerElement.offsetHeight}px)`;
            }
        }

        const audioView = this.querySelector(".sv-audio-view");
        if(annotationData.audioId && !this.overlayed) {
            if(annotationData.expanded) {
                const audioContainer = this.querySelector("#audio_container");
                if(audioView) {
                    audioContainer.removeChild(audioView);
                }
                audioContainer.append(audio.getPlayerById(annotationData.audioId));
            }
            else if(!annotationData.expanded && audioView && audio.activeId == annotationData.audioId) {
                audio.stop();
            }
        }
    }

    protected onClickMarker(event: MouseEvent)
    {
        this.contentElement.style.display = "block";    // makes sure we have a valid height when doing out-of-bounds check
        event.stopPropagation();
        this.sprite.emitClickEvent();
    }

    protected onClickArticle(event: UIEvent)
    {
        event.stopPropagation();
        this.sprite.emitLinkEvent(this.sprite.annotation.data.articleId);
    }

    protected onClickOverlay(event: UIEvent)
    {
        event.stopPropagation();
        const content = this.contentElement;
        this.overlayed = true;
        this.showOverlay(content);
    }

    protected onClickAudio(event: MouseEvent)
    {
        event.stopPropagation();
    }

    protected onKeyDown(event: KeyboardEvent)
    {
        if (event.code === "Space" || event.code === "Enter") {
            const target = event.target as HTMLElement;
            if(target.id === "more-info") {
                this.onClickOverlay(event);
            }
            else {
                this.sprite.emitClickEvent();
            }
        }
    }

    protected onKeyDownArticle(event: KeyboardEvent)
    {
        if (event.code === "Space" || event.code === "Enter") {
            const target = event.target as HTMLElement;
            if(target.id === "read-more") {
                this.onClickArticle(event);
            }
        }
    }
}