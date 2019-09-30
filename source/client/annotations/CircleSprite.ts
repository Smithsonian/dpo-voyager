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

import { customElement, html } from "@ff/ui/CustomElement";
import "@ff/ui/Button";

import GPUPicker from "@ff/three/GPUPicker";

import FontReader from "client/io/FontReader";
import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";
import UniversalCamera from "@ff/three/UniversalCamera";
import AnnotationFactory from "./AnnotationFactory";

////////////////////////////////////////////////////////////////////////////////

// TODO: Temporary until the framework has centralized font management
const _fontReader = new FontReader(new THREE.LoadingManager());

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _quat1 = new THREE.Quaternion();
const _mat4 = new THREE.Matrix4();

export default class CircleSprite extends AnnotationSprite
{
    static readonly typeName: string = "Circle";

    protected static readonly behindOpacity = 0.2;

    protected offset: THREE.Group;
    protected anchorMesh: THREE.Mesh;

    protected ringMesh: THREE.Mesh;
    protected ringGeometry: THREE.RingBufferGeometry;
    protected ringMaterialA: THREE.MeshBasicMaterial;
    protected ringMaterialB: THREE.MeshBasicMaterial;

    protected markerGeometry: THREE.BufferGeometry;
    protected markerMaterialA: THREE.RawShaderMaterial;
    protected markerMaterialB: THREE.RawShaderMaterial;
    protected markerA: THREE.Mesh;
    protected markerB: THREE.Mesh;


    constructor(annotation: Annotation)
    {
        super(annotation);

        this.offset = new THREE.Group();
        this.offset.matrixAutoUpdate = false;

        this.add(this.offset);

        this.ringGeometry = new THREE.RingBufferGeometry(0.45, 0.5, 32);

        this.ringMaterialA = new THREE.MeshBasicMaterial();
        this.ringMaterialB = new THREE.MeshBasicMaterial({
            depthFunc: THREE.GreaterDepth,
            depthWrite: false,
            opacity: CircleSprite.behindOpacity,
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
            new THREE.CircleBufferGeometry(0.45, 32),
            new THREE.MeshBasicMaterial({ color: 0, opacity: 0.65, transparent: true }),
        );

        innerCircle.matrixAutoUpdate = false;
        innerCircle.position.set(0, 0, 0.005);
        innerCircle.updateMatrix();

        this.anchorMesh = new THREE.Mesh(
            new THREE.BufferGeometry(),
            new THREE.MeshBasicMaterial()
        );
        this.anchorMesh.frustumCulled = false;

        this.offset.add(this.anchorMesh, this.ringMesh, ringMeshB, innerCircle);

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
                opacity: CircleSprite.behindOpacity,
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

        // billboard rotation
        _mat4.copy(camera.matrixWorldInverse);
        _mat4.multiply(this.matrixWorld);
        _mat4.decompose(_vec3a, _quat1, _vec3b);
        this.offset.quaternion.copy(_quat1.inverse());

        // scale annotation with respect to camera distance
        const vpHeight = container.offsetHeight + 250;
        const vpScale = annotation.scale * 55 / vpHeight;
        let scaleFactor = 1;

        if (camera.isPerspectiveCamera) {
            const distZ = -_vec3a.set(0, 0, 0).applyMatrix4(_mat4).z;
            const theta = camera.fov * THREE.Math.DEG2RAD * 0.5;
            scaleFactor = Math.tan(theta) * distZ * vpScale;
        }
        else {
            scaleFactor = camera.size * 0.5 * vpScale;
        }

        this.offset.scale.setScalar(scaleFactor);
        this.offset.position.set(0, (annotation.offset + 1) * scaleFactor * 0.5, 0);

        this.offset.updateMatrix();

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
    }

    protected createHTMLElement()
    {
        return new CircleAnnotation(this);
    }

    protected updateHTMLElement(element: AnnotationElement)
    {
        element.setVisible(this.visible);
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
        const annotation = this.sprite.annotation.data;

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