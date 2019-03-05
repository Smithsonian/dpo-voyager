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

import { types } from "@ff/graph/Component";

import { ESliceAxis, ISliceTool, TSliceAxis } from "common/types/features";

import "../ui/PropertyBoolean";
import "../ui/PropertyOptions";
import "../ui/PropertySlider";

import UberPBRMaterial from "../../core/shaders/UberPBRMaterial";
import CVModel from "../../core/components/CVModel";

import CVTool, { customElement, html, ToolView } from "./CVTool";

////////////////////////////////////////////////////////////////////////////////

const _planes = [
    [-1, 0, 0, 0 ],
    [ 0,-1, 0, 0 ],
    [ 0, 0,-1, 0 ],
    [ 1, 0, 0, 0 ],
    [ 0, 1, 0, 0 ],
    [ 0, 0, 1, 0 ],
];

export default class CVSliceTool extends CVTool
{
    static readonly typeName: string = "CVSliceTool";

    static readonly text = "Slice Tool";
    static readonly icon = "knife";

    protected static readonly sliceIns = {
        enabled: types.Boolean("Slice.Enabled"),
        axis: types.Enum("Slice.Axis", ESliceAxis),
        position: types.Number("Slice.Position", { min: -1, max: 1, preset: 0 }),
        inverted: types.Boolean("Slice.Inverted"),
        color: types.ColorRGB("Slice.Color", [ 0, 0.61, 0.87 ]), // SI blue
    };

    ins = this.addInputs(CVSliceTool.sliceIns);

    protected plane: number[] = null;
    protected axisIndex = -1;

    update()
    {
        const ins = this.ins;

        if (ins.axis.changed) {
            const axisIndex = ins.axis.getValidatedValue();

            if (axisIndex === this.axisIndex) {
                ins.inverted.setValue(!ins.inverted.value, true);
            }
            else {
                ins.inverted.setValue(false, true);
                this.axisIndex = axisIndex;
            }
        }

        const index = ins.axis.getValidatedValue() + (ins.inverted.value ? 3 : 0);
        this.plane = _planes[index];
        this.plane[3] = ins.position.value;

        const document = this.activeDocument;
        if (document) {
            const models = document.getInnerComponents(CVModel);

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
        }
        return true;
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

    createView()
    {
        return new SliceToolView(this);
    }

    fromData(data: ISliceTool)
    {
        data = data || {} as ISliceTool;

        this.ins.setValues({
            enabled: data.enabled || false,
            axis: ESliceAxis[data.axis] || ESliceAxis.X,
            position: data.position || 0,
            inverted: data.inverted || false
        });
    }

    toData(): ISliceTool
    {
        const ins = this.ins;

        return {
            enabled: ins.enabled.value,
            axis: ESliceAxis[ins.axis.getValidatedValue()] as TSliceAxis,
            position: ins.position.value,
            inverted: ins.inverted.value,
        };
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-slice-tool-view")
export class SliceToolView extends ToolView<CVSliceTool>
{
    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-slice-tool-view");
    }

    protected render()
    {
        const enabled = this.tool.ins.enabled;
        const axis = this.tool.ins.axis;
        const position = this.tool.ins.position;

        return html`<sv-property-boolean .property=${enabled} name="Slice Tool"></sv-property-boolean>
            <sv-property-options .property=${axis}></sv-property-options>
            <sv-property-slider .property=${position}></sv-property-slider>`;
    }
}