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

import { Camera, ArrayCamera, PerspectiveCamera, Vector3, Quaternion, Matrix4, Group, 
    Mesh, RingGeometry, MeshBasicMaterial, BufferGeometry, RawShaderMaterial, 
    GreaterDepth, CircleGeometry, MathUtils, GLSL3 } from "three";
import * as createTextGeometry from "three-bmfont-text";
import * as createTextShader from "three-bmfont-text/shaders/msdf";

import { customElement, html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import GPUPicker from "@ff/three/GPUPicker";

import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import UniversalCamera from "@ff/three/UniversalCamera";
import AnnotationFactory from "./AnnotationFactory";
import CVAssetReader from "client/components/CVAssetReader";

import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _quat1 = new Quaternion();
const _mat4 = new Matrix4();

export default class CircleSprite extends AnnotationSprite
{
    static readonly typeName: string = "Circle";

    private _isExpanded = false;

    protected static readonly behindOpacity = 0.2;

    protected offset: Group;
    protected anchorMesh: Mesh;

    protected ringMesh: Mesh;
    protected ringGeometry: RingGeometry;
    protected ringMaterialA: MeshBasicMaterial;
    protected ringMaterialB: MeshBasicMaterial;

    protected markerGeometry: BufferGeometry;
    protected markerMaterialA: RawShaderMaterial;
    protected markerMaterialB: RawShaderMaterial;
    protected markerA: Mesh;
    protected markerB: Mesh;

    // Temporary until annotation scale implementation is resolved
    xrScale: number = 1.0;

    isWebGL2: boolean = false;

    constructor(annotation: Annotation, assetReader: CVAssetReader)
    {
        super(annotation);

        this._isExpanded = annotation.data.expanded;

        this.offset = new Group();
        this.offset.matrixAutoUpdate = false;

        this.add(this.offset);

        this.ringGeometry = new RingGeometry(0.45, 0.5, 32);

        this.ringMaterialA = new MeshBasicMaterial();
        this.ringMaterialB = new MeshBasicMaterial({
            depthFunc: GreaterDepth,
            depthWrite: false,
            opacity: CircleSprite.behindOpacity,
            transparent: true
        });

        this.ringMesh = new Mesh(
            this.ringGeometry,
            this.ringMaterialA,
        );

        const ringMeshB = new Mesh(
            this.ringGeometry,
            this.ringMaterialB,
        );

        this.ringMaterialA.toneMapped = false;
        this.ringMaterialB.toneMapped = false;

        const innerCircle = new Mesh(
            new CircleGeometry(0.45, 32),
            new MeshBasicMaterial({ color: 0, opacity: 0.65, transparent: true }),
        );

        innerCircle.matrixAutoUpdate = false;
        innerCircle.position.set(0, 0, 0.005);
        innerCircle.updateMatrix();

        this.anchorMesh = new Mesh(
            new BufferGeometry(),
            new MeshBasicMaterial()
        );
        this.anchorMesh.frustumCulled = false;

        this.offset.add(this.anchorMesh, this.ringMesh, ringMeshB, innerCircle);

        this.markerGeometry = null;
        this.markerA = null;
        this.markerB = null;

        assetReader.fontReader.load("fonts/Roboto-Bold").then(font => {
            this.markerMaterialA = new RawShaderMaterial(createTextShader.default({
                map: font.texture,
                transparent: true,
                color: 0xffffff,
                isWebGL2: this.isWebGL2,
                glslVersion: GLSL3,
            }));

            this.markerMaterialB = new RawShaderMaterial(createTextShader.default({
                map: font.texture,
                transparent: true,
                opacity: CircleSprite.behindOpacity,
                color: 0xffffff,
                depthFunc: GreaterDepth,
                depthWrite: false,
                isWebGL2: this.isWebGL2,
                glslVersion: GLSL3,
            }));

            this.markerGeometry = createTextGeometry.default({ font: font.descriptor });

            this.markerA = new Mesh(this.markerGeometry, this.markerMaterialA);
            this.markerA.matrixAutoUpdate = false;

            this.markerB = new Mesh(this.markerGeometry, this.markerMaterialB);
            this.markerB.matrixAutoUpdate = false;

            // we're async here, register marker for picking manually
            GPUPicker.add(this.markerA, false);
            GPUPicker.add(this.markerB, false);
            this.offset.add(this.markerA, this.markerB);

            this.update();
        });

        this.update();
    }

    dispose()
    {
        this.offset = null;
        this.anchorMesh = null;
        this.ringMesh = null;
        this.ringGeometry = null;
        this.ringMaterialA = null;
        this.ringMaterialB = null;
        this.markerGeometry = null;
        this.markerMaterialA = null;
        this.markerMaterialB = null;
        this.markerA = null;
        this.markerB = null;

        super.dispose();
    }

    update()
    {
        const annotation = this.annotation.data;

        const c = annotation.color;
        this.ringMaterialA.color.setRGB(c[0], c[1], c[2]);
        this.ringMaterialB.color.setRGB(c[0], c[1], c[2]);

        //this.anchorMesh.position.set(0, 0, annotation.scale * 0.1);

        if (this.markerA) {
            const length = annotation.marker.length;
            const scale = length > 1 ? 0.013 : 0.016;

            const geometry = this.markerGeometry;
            (geometry as any).update(annotation.marker);
            geometry.computeBoundingBox();
            geometry.boundingBox.getCenter(_vec3a);

            this.markerA.position.set(-scale * (_vec3a.x + 1), scale * _vec3a.y, 0.01);
            this.markerA.scale.set(scale, -scale, -1);
            this.markerA.updateMatrix();

            this.markerB.position.set(-scale * (_vec3a.x + 1), scale * _vec3a.y, 0.01);
            this.markerB.scale.set(scale, -scale, -1);
            this.markerB.updateMatrix();
        }

        super.update();
    }

    renderHTMLElement(element: AnnotationElement, container: HTMLElement, camera: UniversalCamera)
    {
        const annotation = this.annotation.data;
        let matrixCamera : PerspectiveCamera = null;
        const isShowing = this.annotation.data.visible;

        this.offset.visible = isShowing;

        if(camera instanceof ArrayCamera) {
            matrixCamera = ((camera as Camera) as ArrayCamera).cameras[0];
        }

        // billboard rotation
        if(matrixCamera) {
            _mat4.copy(matrixCamera.matrixWorldInverse);
        }
        else {
            _mat4.copy(camera.matrixWorldInverse);
        }
        _mat4.multiply(this.matrixWorld);
        _mat4.decompose(_vec3a, _quat1, _vec3b);
        this.offset.quaternion.copy(_quat1.invert());

        // get inverse world scale relative to user scale
        this.offset.parent.matrixWorld.decompose(_vec3a, _quat1, _vec3b);
        const invWorldScale = 1.0/_vec3b.x * (1.0/annotation.scale) * this.xrScale;

        // scale annotation with respect to camera distance
        const vpHeight = container.offsetHeight + 250;
        const vpScale = annotation.scale * 55 / vpHeight * invWorldScale;
        let scaleFactor = 1;

        if (camera.isPerspectiveCamera) {
            const distZ = -_vec3a.set(0, 0, 0).applyMatrix4(_mat4).z;
            const theta = camera.fov * MathUtils.DEG2RAD * 0.5;
            scaleFactor = Math.tan(theta) * distZ * vpScale;
        }
        else {
            scaleFactor = camera.size * 0.5 * vpScale;
        }

        this.offset.scale.setScalar(scaleFactor);
        this.offset.position.set(0, (annotation.offset + 1) * scaleFactor * 0.5, 0);

        this.offset.updateMatrix();

        // don't show if behind the camera
        this.setVisible(!this.isBehindCamera(this.offset, camera) && isShowing); 
        if(!this.getVisible()) {
            element.setVisible(this.getVisible());
        }

        if (annotation.expanded) {
            // calculate screen position of HTML sprite element
            _vec3a.set(0, 0, 0).applyMatrix4(this.anchorMesh.modelViewMatrix).applyMatrix4(camera.projectionMatrix);
            _vec3b.set(0.6, 0.5, 0).applyMatrix4(this.anchorMesh.modelViewMatrix).applyMatrix4(camera.projectionMatrix);
            const centerX = (_vec3a.x + 1) * 0.5 * container.clientWidth;
            const centerY = (1 - _vec3a.y) * 0.5 * container.clientHeight;
            const offsetX = (_vec3b.x + 1) * 0.5 * container.clientWidth - centerX;
            const offsetY = (1 - _vec3b.y) * 0.5 * container.clientHeight - centerY;

            let x = centerX + offsetX;
            let y = centerY + offsetY;
            element.classList.remove("sv-align-right", "sv-align-bottom");

            if (x + element.offsetWidth >= container.offsetWidth) {
                x = centerX - offsetX;
                element.classList.add("sv-align-right");
            }
            if (y + element.offsetHeight >= container.offsetHeight) {
                y = centerY - offsetY;
                element.classList.add("sv-align-bottom");
            }

            element.setPosition(x, y);
        }

        if(this._isExpanded !== annotation.expanded) {
            element.style.visibility = "";
            this._isExpanded = annotation.expanded
        }
    }

    protected createHTMLElement()
    {
        return new CircleAnnotation(this);
    }

    protected updateHTMLElement(element: AnnotationElement)
    {
        element.setVisible(this.getVisible());

        // Stops annotation box from occasionally showing before it has been positioned
        if(this.annotation.data.expanded && this._isExpanded !== this.annotation.data.expanded) {
            element.style.visibility = "hidden";
        }
        
        element.requestUpdate();
    }
}

AnnotationFactory.registerType(CircleSprite);

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-circle-annotation")
class CircleAnnotation extends AnnotationElement
{
    constructor(sprite: CircleSprite)
    {
        super(sprite);
    }

    setVisible(visible: boolean)
    {
        // element is visible only if the annotation is in expanded state
        super.setVisible(visible && this.sprite.annotation.data.expanded);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-circle-annotation");
    }

    protected render()
    {
        const annotation = this.sprite.annotation;
        const annotationData = annotation.data;

        return html`<div class="sv-title">${annotation.title}</div>
            ${annotationData.imageUri ? html`<div><img alt="${annotation.imageAltText}" src="${this.sprite.assetManager.getAssetUrl(annotationData.imageUri)}">${annotation.imageCredit ? html`<div class="sv-img-credit">${annotation.imageCredit}</div>` : null}</div>` : null}
            <div class="sv-content"><p>${unsafeHTML(annotation.lead)}</p></div>
            ${annotationData.audioId ? html`<div id="audio_container" @pointerdown=${this.onClickAudio}></div>` : null}
            ${annotationData.articleId ? html`<ff-button inline text="Read more..." icon="document" @click=${this.onClickArticle}></ff-button>` : null}`;
    }

    protected updated(changedProperties): void {
        super.updated(changedProperties);

        const annotation = this.sprite.annotation;
        const annotationData = annotation.data;

        const audioView = this.querySelector(".sv-audio-view");
        if(annotationData.audioId) {
            if(annotationData.expanded && !audioView) {
                const audioContainer = this.querySelector("#audio_container");
                audioContainer.append(this.sprite.audioManager.getPlayerById(annotationData.audioId));
            }
            else if(!annotationData.expanded && audioView) {
                this.sprite.audioManager.stop();
            }
        }
    }

    protected onClickArticle(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitLinkEvent(this.sprite.annotation.data.articleId);
    }

    protected onClickAudio(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitClickEvent();
    }
}