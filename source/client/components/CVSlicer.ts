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

import Component, { types } from "@ff/graph/Component";

import { ISlicer, ESliceAxis, TSliceAxis } from "common/types/setup";

import UberPBRMaterial from "../shaders/UberPBRMaterial";

import CVScene from "./CVScene";
import CVModel2 from "./CVModel2";

////////////////////////////////////////////////////////////////////////////////

const _planes = [
    [-1, 0, 0, 0 ],
    [ 0,-1, 0, 0 ],
    [ 0, 0,-1, 0 ],
    [ 1, 0, 0, 0 ],
    [ 0, 1, 0, 0 ],
    [ 0, 0, 1, 0 ],
];

export default class CVSlicer extends Component
{
    static readonly typeName: string = "CVSlicer";

    protected static ins = {
        enabled: types.Boolean("Slice.Enabled"),
        axis: types.Enum("Slice.Axis", ESliceAxis),
        position: types.Number("Slice.Position", { min: 0, max: 1, preset: 0.5 }),
        inverted: types.Boolean("Slice.Inverted"),
        color: types.ColorRGB("Slice.Color", { preset: [ 0, 0.61, 0.87 ], static: true }), // SI blue
    };

    ins = this.addInputs(CVSlicer.ins);

    protected plane: number[] = null;
    protected axisIndex = -1;

    update(context)
    {
        const ins = this.ins;

        if (ins.axis.changed) {
            const axisIndex = ins.axis.getValidatedValue();

            if (axisIndex === this.axisIndex) {
                ins.inverted.setValue(!ins.inverted.value);
            }
            else {
                ins.inverted.setValue(false);
                this.axisIndex = axisIndex;
            }
        }

        if (!ins.enabled.value && !ins.enabled.changed) {
            return false;
        }

        const axisIndex = ins.axis.getValidatedValue();
        const axisInverted = ins.inverted.value;
        const planeIndex = axisIndex + (axisInverted ? 3 : 0);

        const boundingBox = this.getComponent(CVScene).modelBoundingBox;
        if (!boundingBox) {
            return true;
        }

        this.plane = _planes[planeIndex];
        const min = boundingBox.min.getComponent(axisIndex);
        const max = boundingBox.max.getComponent(axisIndex);
        const value = 1 - ins.position.value;
        this.plane[3] = axisInverted ? value * (max - min) - max :  max - value * (max - min);

        const models = this.getGraphComponents(CVModel2);

        models.forEach(model => {
            const object = model.object3D;
            object.traverse((mesh: THREE.Mesh) => {
                if (mesh.isMesh) {
                    const material = mesh.material as UberPBRMaterial;
                    if (material.isUberPBRMaterial) {
                        this.updateMaterial(material);
                    }
                }
            });
        });

        return true;
    }

    fromData(data: ISlicer)
    {
        data = data || {} as ISlicer;

        this.ins.setValues({
            enabled: data.enabled || false,
            axis: ESliceAxis[data.axis] || ESliceAxis.X,
            position: data.position || 0,
            inverted: data.inverted || false
        });
    }

    toData(): ISlicer
    {
        const ins = this.ins;

        return {
            enabled: ins.enabled.value,
            axis: ESliceAxis[ins.axis.getValidatedValue()] as TSliceAxis,
            position: ins.position.value,
            inverted: ins.inverted.value,
        };
    }

    protected updateMaterial(material: UberPBRMaterial)
    {
        const ins = this.ins;

        if (ins.enabled.changed) {
            material.enableCutPlane(ins.enabled.value);
            material.needsUpdate = true;
        }

        material.cutPlaneDirection.fromArray(this.plane);
        material.cutPlaneColor.fromArray(ins.color.value);
    }
}