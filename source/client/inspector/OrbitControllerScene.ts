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

import { IManipEvent } from "@ff/react/Manip.old";
import OrbitController from "./OrbitController";
import Scene from "./Scene";

////////////////////////////////////////////////////////////////////////////////

export default class OrbitControllerScene extends Scene
{
    controller: OrbitController;

    protected setup(scene: THREE.Scene, camPosition?: THREE.Vector3): THREE.Camera
    {
        const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 100);
        camPosition && camera.position.set(camPosition.x, camPosition.y, camPosition.z);

        const controller = this.controller = new OrbitController(camera);
        controller.init();

        return camera;
    }

    protected update(time: number, delta: number)
    {
        // const rotation = new THREE.Quaternion();
        // this.camera.matrix.decompose(_vecA, rotation, _vecB);
        // const matrix = new THREE.Matrix4();
        // matrix.compose(_vec0, rotation, _vec1);
        // console.log(matrix.elements);

        this.controller.update();
    }

    onManipBegin(event: IManipEvent)
    {
        this.controller.onManipBegin(event);
    }

    onManipUpdate(event: IManipEvent)
    {
        this.controller.onManipUpdate(event);
    }

    onManipEnd(event: IManipEvent)
    {
        this.controller.onManipEnd(event);
    }

    onManipEvent(event: IManipEvent)
    {
        return this.controller.onManipEvent(event);
    }
}