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

import { customElement, PropertyValues, html, render } from "@ff/ui/CustomElement";
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import "@ff/ui/Button";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import AnnotationFactory from "./AnnotationFactory";
import { EQuadrant } from "client/../../libs/ff-three/source/HTMLSprite";

////////////////////////////////////////////////////////////////////////////////

const _quadrantClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];
const _color = new FFColor();
const _offset = new Vector3(0, 1, 0);

export default class ExtendedSprite extends AnnotationSprite
{
    static readonly typeName: string = "Extended";

    protected stemLine: Line;
    protected quadrant = -1;
    protected adaptive = true;
    protected originalHeight;
    protected originalWidth;

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

    renderHTMLElement(element: ExtendedAnnotation, bounds: DOMRect, camera: Camera)
    {
        super.renderHTMLElement(element, bounds, camera, this.stemLine, _offset);

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

        // update adaptive settings
        if(this.adaptive !== this.isAdaptive) {
            if(this.isAdaptive) {
                element.classList.remove("sv-static-width");
            }
            else {
                element.classList.add("sv-static-width");
                element.truncated = false;
                element.classList.remove("sv-short");
                element.requestUpdate();
            }
            this.adaptive = this.isAdaptive;
        }

        // don't show if behind the camera
        this.setVisible(!this.isBehindCamera(this.stemLine, camera));

        // check if annotation is out of bounds and update if needed
        if (this.adaptive && !this.isAnimating && this.annotation.data.expanded) {

            if(!element.truncated) {
                if(!element.classList.contains("sv-expanded")) {
                    element.requestUpdate().then(() => {
                        this.originalHeight = element.offsetHeight;
                        this.originalWidth = element.offsetWidth;
                        this.checkTruncate(element, bounds);
                    });
                    return;
                }
                else {
                    this.originalHeight = element.offsetHeight;
                    this.originalWidth = element.offsetWidth;
                }
            }

            this.checkTruncate(element, bounds);
        }
    }

    protected createHTMLElement(): ExtendedAnnotation
    {
        return new ExtendedAnnotation(this);
    }

    // Helper function to check if annotation should truncate
    protected checkTruncate(element: AnnotationElement, bounds: DOMRect) {
        const top = this.quadrant == EQuadrant.TopLeft || this.quadrant == EQuadrant.TopRight;
        const right = this.quadrant == EQuadrant.TopRight || this.quadrant == EQuadrant.BottomRight;
        const x = right ? element.getBoundingClientRect().left - bounds.left
            : element.getBoundingClientRect().right - bounds.left;
        const y = top ? element.getBoundingClientRect().bottom - bounds.top 
            : element.getBoundingClientRect().top - bounds.top;
        const shouldTruncateVert = !top ? y + this.originalHeight >= bounds.height : y - this.originalHeight <= 0;
        const shouldTruncateHoriz = right ? x + this.originalWidth >= bounds.width : x - this.originalWidth <= 0;
        const shouldTruncate = shouldTruncateVert || shouldTruncateHoriz;
        if(shouldTruncate !== element.truncated) {
            element.truncated = shouldTruncate;
            shouldTruncate ? element.classList.add("sv-short") : element.classList.remove("sv-short");
            element.requestUpdate().then(() => {
                //this.checkBounds(element, container);
            });
        }
        else {
            //this.checkBounds(element, container);
        }
    }
}

AnnotationFactory.registerType(ExtendedSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-extended-annotation")
class ExtendedAnnotation extends AnnotationElement
{
    protected titleElement: HTMLDivElement;
    protected contentElement: HTMLDivElement;
    protected wrapperElement: HTMLDivElement;
    //protected handler = 0;
    protected isExpanded = undefined;

    constructor(sprite: AnnotationSprite)
    {
        super(sprite);

        this.onClickTitle = this.onClickTitle.bind(this);
        this.onClickArticle = this.onClickArticle.bind(this);
        this.onClickAudio = this.onClickAudio.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyDownArticle = this.onKeyDownArticle.bind(this);
        this.onClickOverlay = this.onClickOverlay.bind(this);

        this.addEventListener("keydown", this.onKeyDown);

        this.titleElement = this.appendElement("div");
        this.titleElement.classList.add("sv-title");
        this.titleElement.addEventListener("click", this.onClickTitle);
        this.titleElement.setAttribute("tabindex", "0");

        this.wrapperElement = this.appendElement("div");

        this.contentElement = this.createElement("div", null, this.wrapperElement);
        this.contentElement.classList.add("sv-annotation-body");
        this.contentElement.style.display = "none";
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-extended-annotation");
    }

    protected update(changedProperties: PropertyValues): void
    {
        super.update(changedProperties);

        const annotationObj = this.sprite.annotation;
        const annotation = this.sprite.annotation.data;
        const audio = this.sprite.audioManager;
        const isTruncated = !this.overlayed && this.truncated
            && (annotation.imageUri || annotation.articleId || annotationObj.lead.length > 0); // make sure we have content to truncate;

        // update title
        this.titleElement.innerText = this.sprite.annotation.title;

        const contentTemplate = html`
        ${annotation.imageUri && !isTruncated ? html`<div><img alt="${annotationObj.imageAltText}" src="${this.sprite.assetManager.getAssetUrl(annotation.imageUri)}">${annotationObj.imageCredit ? html`<div class="sv-img-credit">${annotationObj.imageCredit}</div>` : null}</div>` : null}
        ${!isTruncated ? html`<p>${unsafeHTML(annotationObj.lead)}</p>` : null}
        ${annotation.audioId && !this.overlayed ? html`<div id="audio_container" @pointerdown=${this.onClickAudio}></div>` : null}
        ${annotation.articleId && !isTruncated ? html`<ff-button inline id="read-more" text="Read more..." icon="document" @keydown=${this.onKeyDownArticle} @pointerdown=${this.onClickArticle}></ff-button>` : null}
        ${isTruncated ? html`<ff-button inline id="more-info" text="+more info" @pointerdown=${this.onClickOverlay} ></ff-button>` : null}`;    

        render(contentTemplate, this.contentElement);

        // update color
        _color.fromArray(annotation.color);
        this.style.borderColor = _color.toString();

        // update expanded height in case annotation changed
        if (this.isExpanded) {
            this.contentElement.style.height = "auto";
        }

        // update expanded/collapsed
        if (this.isExpanded !== annotation.expanded && !this.overlayed) {

            this.isExpanded = annotation.expanded;
            //window.clearTimeout(this.handler);

            if (this.isExpanded) {
                if(annotation.audioId) {
                    const audioContainer = this.querySelector("#audio_container");
                    if(audioContainer.firstChild) {
                        audioContainer.removeChild(audioContainer.firstChild);
                    }
                    audioContainer.append(audio.getPlayerById(annotation.audioId));
                }

                this.classList.add("sv-expanded");
                this.style.minWidth = this.sprite.annotation.lead.length < 40 && (!annotation.audioId || annotation.audioId.length == 0) ? "0" : "";
                this.contentElement.style.display = "block";
                this.contentElement.style.height = "auto"; //this.contentElement.scrollHeight + "px";
            }
            else {
                this.classList.remove("sv-expanded");
                this.contentElement.style.height = "0";
                //this.handler = window.setTimeout(() => this.contentElement.style.display = "none", 300);
                this.contentElement.style.display = "none";

                if(audio.activeId == annotation.audioId) {
                    this.sprite.audioManager.stop();
                }
            }
        }

        const audioView = this.querySelector(".sv-audio-view");
        if(annotation.audioId && !this.overlayed) {
            if(annotation.expanded) {
                const audioContainer = this.querySelector("#audio_container");
                if(audioView) {
                    audioContainer.removeChild(audioView);
                }
                audioContainer.append(audio.getPlayerById(annotation.audioId));
            }
            else if(!annotation.expanded && audioView && audio.activeId == annotation.audioId) {
                audio.stop();
            }
        }
    }

    protected onClickTitle(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitClickEvent();
    }

    protected onClickArticle(event: UIEvent)
    {
        event.stopPropagation();
        this.sprite.emitLinkEvent(this.sprite.annotation.data.articleId);
    }

    protected onClickAudio(event: MouseEvent)
    {
        event.stopPropagation();
    }

    protected onClickOverlay(event: UIEvent)
    {
        event.stopPropagation();
        const content = this.contentElement;
        this.overlayed = true;
        this.showOverlay(content);
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