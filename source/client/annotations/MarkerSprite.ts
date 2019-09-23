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
const _vec3 = new THREE.Vector3();

export default class MarkerSprite extends AnnotationSprite
{
    protected balloon: THREE.Mesh;
    protected circle: THREE.Mesh;
    protected marker: THREE.Mesh;

    constructor(annotation: Annotation)
    {
        super(annotation);

        const shape = new THREE.Shape();
        const o1 = 30 * math.DEG2RAD;
        shape.absarc(0, 1, 0.5, -o1, math.PI + o1, false);
        shape.lineTo(-0.05, 0);
        const o2 = 20 * math.DEG2RAD;
        shape.absarc(0, 0, 0.05, math.PI + o2, -o2, false);
        //shape.lineTo(0.5, 1);

        this.balloon = new THREE.Mesh(
            new THREE.ShapeBufferGeometry(shape),
            new THREE.MeshBasicMaterial({ color: "red" }),
        );

        this.circle = new THREE.Mesh(
            new THREE.CircleBufferGeometry(0.45, 32),
            new THREE.MeshBasicMaterial({ color: "black" }),
        );
        this.circle.position.set(0, 1, 0.01);

        this.add(this.balloon, this.circle);

        _fontReader.load("fonts/Roboto-Bold").then(font => {
            const material = new THREE.RawShaderMaterial(createTextShader({
                map: font.texture,
                //side: THREE.DoubleSide,
                transparent: true,
                color: 0xffffff,
            }));
            const geometry = createTextGeometry({
                font: font.descriptor,
                align: "center",
                width: 100,
            });

            geometry.update(annotation.data.marker);
            this.marker = new THREE.Mesh(geometry, material);
            this.marker.scale.set(0.015, -0.015, -1);
            //this.marker.position.set(-1.05, 0.05, 0.02);
            this.marker.position.set(-0.77, 0.27, 0.02);
            this.add(this.marker);
            console.log("TEXT GEOMETRY UPDATED");
        });

        this.update();
    }

    update()
    {
        const annotation = this.annotation.data;
        const c = annotation.color;
        (this.balloon.material as THREE.MeshPhongMaterial).color.setRGB(c[0], c[1], c[2]);

        this.scale.setScalar(annotation.scale);

        if (this.marker) {
            (this.marker.geometry as any).update(annotation.marker);
        }

        super.update();
    }

    renderHTMLElement(container: HTMLElement, camera: THREE.Camera, anchor?: THREE.Object3D, offset?: THREE.Vector3): HTMLElement | null
    {
        camera.matrixWorld.decompose(_vec3, this.quaternion, _vec3);
        this.updateMatrix();
        console.log("onBeforeRender");

        return null;
    }
}