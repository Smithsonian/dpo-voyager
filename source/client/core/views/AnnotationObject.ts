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

import RenderContext from "../app/RenderContext";

import { IAnnotation } from "../components/Annotations";
import AnnotationsView from "../components/AnnotationsView";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export { IAnnotation };

export default class AnnotationObject extends THREE.Object3D
{
    views: AnnotationsView;
    annotation: IAnnotation;

    constructor(views: AnnotationsView, annotation: IAnnotation)
    {
        super();

        this.matrixAutoUpdate = false;

        this.views = views;
        this.annotation = annotation;
    }

    update()
    {
        _vec3.fromArray(this.annotation.direction);
        this.quaternion.setFromUnitVectors(THREE.Object3D.DefaultUp, _vec3);
        this.position.fromArray(this.annotation.position);
        this.updateMatrix();
    }

    render(context: RenderContext)
    {
    }

    dispose()
    {
    }

    setSelected(selected: boolean)
    {
    }
}