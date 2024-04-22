/**
 * 3D Foundation Project
 * Copyright 2024 Smithsonian Institution
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

import { Vector3, Matrix4, Box3, Color } from "three";

import Viewport from "@ff/three/Viewport";
import ThreeGrid, { IGridProps } from "@ff/three/Grid";

import { types } from "@ff/graph/Component";
import CObject3D, { IRenderContext } from "@ff/scene/components/CObject3D";

import { IGrid } from "client/schema/setup";
import { EUnitType } from "client/schema/common";

import CVScene from "./CVScene";
import CVTape from "./CVTape";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();

const _matRotationOffset = new Matrix4().makeRotationX(Math.PI * 0.5);
const _matIdentity = new Matrix4();


export default class CVGrid extends CObject3D
{
    static readonly typeName: string = "CVGrid";

    static readonly text: string = "Grid";
    static readonly icon: string = "";

    protected tape: CVTape = null;

    protected static readonly gridIns = {
        color: types.ColorRGB("Grid.Color", [ 0.5, 0.7, 0.8 ]),
        opacity: types.Percent("Grid.Opacity", 1.0),
        boundingBox: types.Object("Scene.BoundingBox", Box3),
        labelEnabled: types.Boolean("Grid.LabelEnabled", true)
    };

    protected static readonly gridOuts = {
        size: types.Number("Size"),
        units: types.Enum("Units", EUnitType),
    };

    ins = this.addInputs<CObject3D, typeof CVGrid.gridIns>(CVGrid.gridIns);
    outs = this.addOutputs<CObject3D, typeof CVGrid.gridOuts>(CVGrid.gridOuts);

    get settingProperties() {
        return [
            this.ins.visible,
            this.ins.color,
            this.ins.opacity,
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.opacity,
        ];
    }

    get grid() {
        return this.object3D as ThreeGrid;
    }

    private _lastViewport: Viewport = null;
    private _gridProps: IGridProps = {
        size: 20,
        mainDivisions: 2,
        subDivisions: 10,
        mainColor: new Color(0.5, 0.7, 0.8),
        subColor: new Color(0.25, 0.35, 0.4)
    };

    create()
    {
        this.ins.pickable.setValue(false);
        this.ins.visible.setValue(false);

        // Create tape measurement
        this.tape = this.node.createComponent(CVTape);
        this.tape.ins.startPosition.setValue([0,0,0]);
        this.tape.ins.endPosition.setValue([0,0,0]);
        this.tape.ins.visible.setValue(false);
        this.tape.addTag("no_settings");    // hack to exclude from scene settings

        super.create();
    }

    activate()
    {
        const scene = this.getGraphComponent(CVScene);
        scene.outs.boundingBox.linkTo(this.ins.boundingBox);
    }

    update(): boolean
    {
        const ins = this.ins;

        if (ins.color.changed || ins.boundingBox.changed) {
            const props = this._gridProps;

            if (ins.color.changed) {
                const mainColor = props.mainColor as Color;
                const subColor = props.subColor as Color;
                mainColor.fromArray(ins.color.value);
                subColor.r = mainColor.r * 0.5;
                subColor.g = mainColor.g * 0.5;
                subColor.b = mainColor.b * 0.5;
            }

            if (ins.boundingBox.changed) {
                const scene = this.getGraphComponent(CVScene);
                const box = scene.outs.boundingBox.value;
                const units = scene.ins.units.value;

                box.getSize(_vec3a as unknown as Vector3);
                let size = Math.max(_vec3a.x, _vec3a.y, _vec3a.z);
                let f = 1;

                while (size / f > 5) {
                    f = f * 10;
                }

                size = Math.ceil(size / f) * f * 2;

                if (ENV_DEVELOPMENT) {
                    console.log("CVGrid.update - grid size = %s %s", size, EUnitType[units]);
                }

                props.size = size;
                this.outs.size.setValue(size);
                this.outs.units.setValue(units);

                props.mainDivisions = size / f;
                props.subDivisions = 10;

                _vec3b.set(0, box.min.y, 0);

                // update tape measurement to first major gridlines
                this.tape.ins.startPosition.setValue([-size/2, box.min.y+(size/100), -size/2-(size/100)]);
                this.tape.ins.endPosition.setValue([(-size/2)+(size/props.mainDivisions), box.min.y+(size/100), -size/2-(size/100)]);
            }

            if (!this.object3D) {
                this.object3D = new ThreeGrid(props);
            }
            else {
                this.grid.update(props);
            }

            if (ins.boundingBox.changed) {
                this.grid.position.copy(_vec3b);
                this.grid.updateMatrix();
            }
        }

        if (ins.visible.changed) {
            this.grid.visible = ins.visible.value;

            // update tape label
            this.tape.ins.visible.setValue(this.grid.visible && ins.labelEnabled.value);
        }
        if (ins.opacity.changed) {
            this.grid.opacity = ins.opacity.value;
        }
        if(ins.labelEnabled.changed) {
            this.tape.ins.visible.setValue(this.grid.visible && ins.labelEnabled.value);
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
        //this.object3D.matrix.extractRotation(_matIdentity);
        this.object3D.updateMatrix();
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
}