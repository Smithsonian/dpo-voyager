/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
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

import { IAnnotation } from "../components/Annotations";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export default class AnnotationView extends THREE.Group
{
    annotation: IAnnotation;
    protected mesh: THREE.Mesh;

    constructor(annotation: IAnnotation)
    {
        super();

        this.annotation = annotation;

        const geo = new THREE.ConeBufferGeometry(0.8, 1.6, 24);
        geo.translate(0, -0.8, 0);
        geo.rotateX(Math.PI);

        const mat = new THREE.MeshPhongMaterial({ color: "red" });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.matrixAutoUpdate = false;

        this.add(this.mesh);
        this.update();
    }

    update()
    {
        _vec3.fromArray(this.annotation.direction);
        this.mesh.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, _vec3);
        this.mesh.position.fromArray(this.annotation.position);
        this.mesh.updateMatrix();
    }
}