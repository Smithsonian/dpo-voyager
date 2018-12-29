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

import math from "@ff/core/math";
import { types } from "@ff/graph/propertyTypes";
import Viewport from "@ff/three/Viewport";
import { IRenderContext } from "@ff/scene/RenderSystem";
import Object3D from "@ff/scene/components/Object3D";

import ThreeGrid, { IGridProps } from "@ff/three/Grid";
import { EUnitType } from "common/types";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();

const _matRotationOffset = new THREE.Matrix4().makeRotationX(Math.PI * 0.5);
const _matIdentity = new THREE.Matrix4();

export default class HomeGrid extends Object3D
{
    static readonly type: string = "HomeGrid";

    ins = this.ins.append({
        units: types.Enum("Units", EUnitType, EUnitType.cm),
        size: types.Number("Size", 20),
        mainColor: types.ColorRGB("MainColor", [ 0.5, 0.7, 0.8 ]),
        subColor: types.ColorRGB("SubColor", [ 0.25, 0.35, 0.4 ])
    });

    private lastViewport: Viewport;

    update(): boolean
    {
        let grid = this.object3D as ThreeGrid;

        const { size, mainColor, subColor } = this.ins;
        if (size.changed || mainColor.changed || subColor.changed) {

            const props: IGridProps = {
                size: size.value,
                mainDivisions: 2,
                mainColor: new THREE.Color().fromArray(mainColor.value),
                subDivisions: 10,
                subColor: new THREE.Color().fromArray(subColor.value)
            };

            const newGrid = this.object3D = new ThreeGrid(props);
            if (grid) {
                newGrid.matrix.copy(grid.matrix);
                newGrid.matrixWorldNeedsUpdate = true;
            }

            grid = newGrid;
        }

        // const { position, rotation, scale } = this.ins;
        // if (position.changed || rotation.changed || scale.changed) {
        //     grid.position.fromArray(position.value);
        //     _vec3a.fromArray(rotation.value).multiplyScalar(math.DEG2RAD);
        //     grid.rotation.setFromVector3(_vec3a, "XYZ");
        //     grid.scale.fromArray(scale.value);
        //     grid.updateMatrix();
        // }

        return true;
    }

    preRender(context: IRenderContext)
    {
        const viewport = context.viewport;
        if (viewport !== this.lastViewport) {
            this.lastViewport = viewport;

            const vpCamera = context.viewport.viewportCamera;
            this.object3D.matrixWorldNeedsUpdate = true;

            if (vpCamera) {
                this.object3D.matrix.extractRotation(vpCamera.matrixWorld).multiply(_matRotationOffset);
            }
            else {
                this.object3D.matrix.extractRotation(_matIdentity);
            }
        }
    }
}