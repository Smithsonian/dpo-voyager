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

import { types } from "@ff/graph/propertyTypes";
import Component from "@ff/graph/Component";

import { ISectionTool } from "common/types/features";

import UberPBRMaterial from "../../core/shaders/UberPBRMaterial";
import CVModel from "../../core/components/CVModel";

////////////////////////////////////////////////////////////////////////////////

export default class CVSectionTool extends Component
{
    static readonly typeName: string = "CVSectionTool";

    protected static readonly sectionIns = {
        visible: types.Boolean("Section.Visible"),
        plane: types.Vector4("Section.Plane", [ 0, 0, 1, 0 ]),
        color: types.ColorRGB("Section.Color", [ 0, 0.61, 0.87 ]), // SI blue
    };

    ins = this.addInputs(CVSectionTool.sectionIns);


    update(context)
    {
        const models = this.getGraphComponents(CVModel);

        models.forEach(model => {
            const object = model.object3D;
            object.traverse((mesh: THREE.Mesh) => {
                if (mesh.isMesh) {
                    const material = mesh.material as UberPBRMaterial;
                    if (material.isUberPBRMaterial) {
                        console.log(mesh.name);
                        this.updateMaterial(material);
                    }
                }
            });
        });

        return true;
    }

    protected updateMaterial(material: UberPBRMaterial)
    {
        const ins = this.ins;

        if (ins.visible.changed) {
            material.enableCutPlane(ins.visible.value);
            material.needsUpdate = true;
        }

        material.cutPlaneDirection.fromArray(ins.plane.value);
        material.cutPlaneColor.fromArray(ins.color.value);
    }

    fromData(data: ISectionTool)
    {
        this.ins.copyValues({
            visible: data.active,
            plane: data.plane || [ 0, 1, 0 ],
        });
    }

    toData(): ISectionTool
    {
        const ins = this.ins;

        return {
            active: ins.visible.value,
            plane: ins.plane.cloneValue(),
        };
    }
}