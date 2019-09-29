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
import * as createTextGeometry from "three-bmfont-text";
import * as createTextShader from "three-bmfont-text/shaders/msdf";

import { customElement, PropertyValues, html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import GPUPicker from "@ff/three/GPUPicker";

import FontReader from "client/io/FontReader";
import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import UniversalCamera from "@ff/three/UniversalCamera";

////////////////////////////////////////////////////////////////////////////////

const _quadrantClasses = [ "sv-q0", "sv-q1", "sv-q2", "sv-q3" ];

// TODO: Temporary
const _fontReader = new FontReader(new THREE.LoadingManager());

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat1 = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();
const _offset = new THREE.Vector3(0, 1, 0);

export default class MarkerSprite extends AnnotationSprite
{
    protected static readonly behindOpacity = 0.2;

    protected offset: THREE.Group;
    protected dummyMesh: THREE.Mesh;

    protected ringMesh: THREE.Mesh;
    protected ringGeometry: THREE.RingBufferGeometry;
    protected ringMaterialA: THREE.MeshBasicMaterial;
    protected ringMaterialB: THREE.MeshBasicMaterial;

    protected markerGeometry: THREE.BufferGeometry;
    protected markerMaterialA: THREE.RawShaderMaterial;
    protected markerMaterialB: THREE.RawShaderMaterial;
    protected markerA: THREE.Mesh;
    protected markerB: THREE.Mesh;

    private _quadrant = -1;

    constructor(annotation: Annotation)
    {
        super(annotation);

        this.offset = new THREE.Group();
        this.offset.matrixAutoUpdate = false;

        this.add(this.offset);

        this.ringGeometry = new THREE.RingBufferGeometry(0.35, 0.4, 32);

        this.ringMaterialA = new THREE.MeshBasicMaterial();
        this.ringMaterialB = new THREE.MeshBasicMaterial({
            depthFunc: THREE.GreaterDepth,
            depthWrite: false,
            opacity: MarkerSprite.behindOpacity,
            transparent: true
        });

        this.ringMesh = new THREE.Mesh(
            this.ringGeometry,
            this.ringMaterialA,
        );

        const ringMeshB = new THREE.Mesh(
            this.ringGeometry,
            this.ringMaterialB,
        );

        const innerCircle = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.35, 32),
            new THREE.MeshBasicMaterial({ color: 0, opacity: 0.65, transparent: true }),
        );

        innerCircle.matrixAutoUpdate = false;
        innerCircle.position.set(0, 0, 0.005);
        innerCircle.updateMatrix();

        this.dummyMesh = new THREE.Mesh(
            new THREE.BufferGeometry(),
            new THREE.MeshBasicMaterial()
        );

        this.add(this.dummyMesh);
        this.offset.add(this.ringMesh, ringMeshB, innerCircle);

        this.markerGeometry = null;
        this.markerA = null;
        this.markerB = null;

        _fontReader.load("fonts/Roboto-Bold").then(font => {
            this.markerMaterialA = new THREE.RawShaderMaterial(createTextShader({
                map: font.texture,
                transparent: true,
                color: 0xffffff,
            }));

            this.markerMaterialB = new THREE.RawShaderMaterial(createTextShader({
                map: font.texture,
                transparent: true,
                opacity: MarkerSprite.behindOpacity,
                color: 0xffffff,
                depthFunc: THREE.GreaterDepth,
                depthWrite: false
            }));

            this.markerGeometry = createTextGeometry({ font: font.descriptor });

            this.markerA = new THREE.Mesh(this.markerGeometry, this.markerMaterialA);
            this.markerA.matrixAutoUpdate = false;

            this.markerB = new THREE.Mesh(this.markerGeometry, this.markerMaterialB);
            this.markerB.matrixAutoUpdate = false;

            // we're async here, register marker for picking manually
            GPUPicker.add(this.markerA, false);
            GPUPicker.add(this.markerB, false);
            this.offset.add(this.markerA, this.markerB);

            this.update();
        });

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;

        const c = annotation.color;
        this.ringMaterialA.color.setRGB(c[0], c[1], c[2]);
        this.ringMaterialB.color.setRGB(c[0], c[1], c[2]);

        if (this.markerA) {
            const length = annotation.marker.length;
            const scale = length > 1 ? 0.011 : 0.013;

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

    renderHTMLElement(container: HTMLElement, camera: UniversalCamera): HTMLElement | null
    {
        const annotation = this.annotation.data;

        // billboard rotation
        _mat4.getInverse(this.matrixWorld, false);
        _mat4.multiply(camera.matrixWorld);
        _mat4.decompose(_vec3a, _quat1, _vec3b);
        this.offset.quaternion.copy(_quat1);

        // scale annotation with respect to camera distance
        const annotationScale = annotation.scale;
        let scaleFactor = 1;

        if (camera.isPerspectiveCamera) {
            _vec3a.set(0, 0, 0).applyMatrix4(_mat4);
            scaleFactor = Math.tan(camera.fov * THREE.Math.DEG2RAD * 0.5) * _vec3a.length() * annotationScale / 150;
        }
        else {
            scaleFactor = camera.size * annotationScale / 30;
        }

        this.offset.scale.setScalar(scaleFactor);
        this.offset.position.set(0, (annotation.offset + 1) * scaleFactor * 0.5, 0);

        this.offset.updateMatrix();


        const element = super.renderHTMLElement(container, camera, this.dummyMesh, _offset) as MarkerAnnotation;

        // update quadrant/orientation
        if (this.orientationQuadrant !== this._quadrant) {
            element.classList.remove(_quadrantClasses[this._quadrant]);
            element.classList.add(_quadrantClasses[this.orientationQuadrant]);
            this._quadrant = this.orientationQuadrant;
        }

        return element;
    }

    protected createHTMLElement(): HTMLElement
    {
        return new MarkerAnnotation(this);
    }

    protected setHTMLElementVisible(element: AnnotationElement, visible: boolean)
    {
        // visibility handled by the element's render method
        element.requestUpdate();
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-marker-annotation")
class MarkerAnnotation extends AnnotationElement
{
    constructor(sprite: MarkerSprite)
    {
        super(sprite);
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-marker-annotation");
    }

    protected render()
    {
        const annotation = this.sprite.annotation.data;
        this.style.display = annotation.expanded && this.sprite.visible ? "block" : "none";

        return html`<div class="sv-title">${annotation.title}</div>
            <p>${annotation.lead}</p>
            ${annotation.articleId ? html`<ff-button inline text="Read more..." icon="document" @click=${this.onClickArticle}></ff-button>` : null}`;
    }

    protected onClickArticle(event: MouseEvent)
    {
        event.stopPropagation();
        this.sprite.emitLinkEvent(this.sprite.annotation.data.articleId);
    }
}