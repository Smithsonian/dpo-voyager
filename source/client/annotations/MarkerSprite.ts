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

import math from "@ff/core/math";

import FontReader from "client/io/FontReader";
import AnnotationSprite, { Annotation, AnnotationElement } from "./AnnotationSprite";

////////////////////////////////////////////////////////////////////////////////

// TODO: Temporary
const _fontReader = new FontReader(new THREE.LoadingManager());

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _quat = new THREE.Quaternion();

export default class MarkerSprite extends AnnotationSprite
{
    protected offset: THREE.Group;
    protected circleMaterial: THREE.MeshBasicMaterial;
    protected markerGeometry: any;

    constructor(annotation: Annotation)
    {
        super(annotation);

        // const shape = new THREE.Shape();
        // const o1 = 30 * math.DEG2RAD;
        // shape.absarc(0, 1, 0.5, -o1, math.PI + o1, false);
        // shape.lineTo(-0.05, 0);
        // const o2 = 20 * math.DEG2RAD;
        // shape.absarc(0, 0, 0.05, math.PI + o2, -o2, false);

        // this.balloon = new THREE.Mesh(
        //     new THREE.ShapeBufferGeometry(shape),
        //     new THREE.MeshBasicMaterial({ color: "red" }),
        // );

        this.offset = new THREE.Group();
        this.add(this.offset);

        this.circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const outerCircle = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.4, 32),
            this.circleMaterial,
        );

        const innerCircle = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.35, 32),
            new THREE.MeshBasicMaterial({ color: 0 }),
        );

        innerCircle.position.set(0, 0, 0.01);

        this.offset.add(outerCircle, innerCircle);

        _fontReader.load("fonts/Roboto-Bold").then(font => {
            const material = new THREE.RawShaderMaterial(createTextShader({
                map: font.texture,
                //side: THREE.DoubleSide,
                transparent: true,
                color: 0xffffff,
            }));
            this.markerGeometry = createTextGeometry({
                font: font.descriptor,
                align: "center",
                width: 100,
            });

            this.markerGeometry.update(annotation.data.marker);

            const marker = new THREE.Mesh(this.markerGeometry, material);
            marker.scale.set(0.015, -0.015, -1);
            //this.marker.position.set(-1.05, 0.05, 0.02);
            marker.position.set(-0.77, -0.67, 0.02);
            this.offset.add(marker);
        });

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;
        const c = annotation.color;
        this.circleMaterial.color.setRGB(c[0], c[1], c[2]);

        this.scale.setScalar(annotation.scale);
        this.updateMatrix();

        this.offset.position.set(0, 1, 0);

        if (this.markerGeometry) {
            this.markerGeometry.update(annotation.marker);
        }

        super.update();
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera, anchor?: THREE.Object3D, offset?: THREE.Vector3): HTMLElement | null
    {
        this.offset.matrixWorld.decompose(_vec3a, _quat, _vec3b);
        camera.matrixWorld.decompose(_vec3c, _quat, _vec3c);
        this.offset.matrixWorld.compose(_vec3a, _quat, _vec3b);
        this.offset.matrixWorldNeedsUpdate = false;

        return null;
    }
}