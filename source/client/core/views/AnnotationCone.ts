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

import AnnotationsView from "../components/AnnotationsView";
import AnnotationObject, { IAnnotation } from "./AnnotationObject";

////////////////////////////////////////////////////////////////////////////////

export default class AnnotationCone extends AnnotationObject
{
    protected mesh: THREE.Mesh;

    constructor(views: AnnotationsView, annotation: IAnnotation)
    {
        super(views, annotation);

        const geo = new THREE.ConeBufferGeometry(0.8, 1.6, 24);
        geo.translate(0, -0.8, 0);
        geo.rotateX(Math.PI);

        const mat = new THREE.MeshPhongMaterial({ color: "red" });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.matrixAutoUpdate = false;
        this.add(this.mesh);

        this.update();
    }

    setSelected(selected: boolean)
    {
        console.log("setSelected", selected);
        this.mesh.material["color"] = new THREE.Color(selected ? "yellow" : "red");
    }
}