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
import { IPickResult, IViewportPointerEvent, IViewportTriggerEvent } from "../components/PickManip";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export default class AnnotationView extends THREE.Group
{
    annotation: IAnnotation;

    constructor(annotation: IAnnotation)
    {
        super();

        this.annotation = annotation;

        const geo = new THREE.ConeBufferGeometry(0.8, 1.6, 24);
        geo.translate(0, -0.8, 0);
        geo.rotateX(Math.PI);

        const mat = new THREE.MeshPhongMaterial({ color: "red" });

        const mesh = new THREE.Mesh(geo, mat);
        _vec3.fromArray(annotation.direction);
        mesh.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, _vec3);
        mesh.position.fromArray(annotation.position);

        this.add(mesh);
    }

    onPointer(event: IViewportPointerEvent, pickInfo: IPickResult)
    {
        if (event.isPrimary && event.type === "up") {
            console.log(this.annotation.title);
        }

        return false;
    }

    onTrigger(event: IViewportTriggerEvent, pickInfo: IPickResult)
    {
        return false;
    }
}