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
import Vector3 from "@ff/core/Vector3";

import { types } from "@ff/graph/propertyTypes";
import { IComponentChangeEvent } from "@ff/graph/Component";

import CObject3D, { IRenderContext } from "@ff/scene/components/CObject3D";

import Viewport from "@ff/three/Viewport";
import ThreeGrid, { IGridProps } from "@ff/three/Grid";

import { EUnitType, IGrid } from "common/types/features";
import CVScene from "../../core/components/CVScene";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();

const _matRotationOffset = new THREE.Matrix4().makeRotationX(Math.PI * 0.5);
const _matIdentity = new THREE.Matrix4();


export default class CVGrid extends CObject3D
{
    static readonly typeName: string = "CVGrid";

    protected static readonly gridIns = {
        color: types.ColorRGB("Grid.Color", [ 0.5, 0.7, 0.8 ]),
        update: types.Event("Grid.Update"),
    };

    protected static readonly gridOuts = {
        size: types.Number("Size"),
        units: types.Enum("Units", EUnitType),
    };

    ins = this.addInputs<CObject3D, typeof CVGrid.gridIns>(CVGrid.gridIns);
    outs = this.addOutputs<CObject3D, typeof CVGrid.gridOuts>(CVGrid.gridOuts);

    private _lastViewport: Viewport = null;
    private _gridProps: IGridProps = {
        size: 20,
        mainDivisions: 2,
        subDivisions: 10,
        mainColor: new THREE.Color(0.5, 0.7, 0.8),
        subColor: new THREE.Color(0.25, 0.35, 0.4)
    };

    get grid() {
        return this.object3D as ThreeGrid;
    }
    get voyagerScene() {
        return this.getGraphComponent(CVScene);
    }

    create()
    {
        this.voyagerScene.on("change", this.onSceneChange, this);
        this.ins.pickable.setValue(false);
        this.ins.visible.setValue(false);
    }

    dispose()
    {
        this.voyagerScene.off("change", this.onSceneChange, this);
    }

    update(): boolean
    {
        const ins = this.ins;

        if (ins.color.changed || ins.update.changed) {
            const props = this._gridProps;

            if (ins.color.changed) {
                const mainColor = props.mainColor as THREE.Color;
                const subColor = props.subColor as THREE.Color;
                mainColor.fromArray(ins.color.value);
                subColor.r = mainColor.r * 0.5;
                subColor.g = mainColor.g * 0.5;
                subColor.b = mainColor.b * 0.5;
            }

            if (ins.update.changed) {
                const box = this.voyagerScene.boundingBox;
                const units = this.voyagerScene.ins.units.value;

                box.getSize(_vec3a as unknown as THREE.Vector3);
                let size = Math.max(_vec3a.x, _vec3a.y, _vec3a.z);
                size = Math.ceil(size) * 2;

                props.size = size;

                this.outs.size.setValue(size);
                this.outs.units.setValue(units);

                while(size > 100) {
                    size = size * 0.1;
                }

                props.mainDivisions = size;
                props.subDivisions = 10;

            }

            if (!this.object3D) {
                this.object3D = new ThreeGrid(props);
            }
            else {
                this.grid.update(props);
            }
        }

        if (ins.visible.changed) {
            this.grid.visible = ins.visible.value;
        }

        return true;
    }

    preRender(context: IRenderContext)
    {
        const viewport = context.viewport;
        const gridObject = this.object3D;

        if (viewport !== this._lastViewport) {
            this._lastViewport = viewport;

            const vpCamera = context.viewport.camera;

            if (vpCamera) {
                gridObject.matrix.extractRotation(vpCamera.matrixWorld).multiply(_matRotationOffset);
            }
            else {
                gridObject.matrix.extractRotation(_matIdentity);
            }

            gridObject.updateMatrixWorld(true);
        }
    }

    postRender(context: IRenderContext)
    {
        this.object3D.matrix.extractRotation(_matIdentity);
    }

    fromData(data: IGrid)
    {
        data = data || {} as IGrid;

        this.ins.copyValues({
            visible: !!data.visible,
            color: data.color || [ 0.5, 0.7, 0.8 ],
        });
    }

    toData(): IGrid
    {
        const ins = this.ins;

        return {
            visible: ins.visible.cloneValue(),
            color: ins.color.cloneValue(),
        };
    }

    protected onSceneChange(event: IComponentChangeEvent<CVScene>)
    {
        if (event.what === "boundingBox") {
            this.ins.update.set();
        }
    }
}