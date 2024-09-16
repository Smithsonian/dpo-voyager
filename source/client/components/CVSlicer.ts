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

import { Box3, DoubleSide, Euler, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";

import { types } from "@ff/graph/Component";
import CObject3D from "@ff/scene/components/CObject3D";

import { ISlicer, ESliceAxis, TSliceAxis } from "client/schema/setup";

import UberPBRMaterial from "../shaders/UberPBRMaterial";

import CVScene from "./CVScene";
import CVModel2 from "./CVModel2";
import CVAssetReader from "./CVAssetReader";

////////////////////////////////////////////////////////////////////////////////

/**
 * Slicing plane vectors (X+, Y+, Z+, X-, Y-, Z-).
 */
const _planes = [
    [-1, 0, 0, 0 ],
    [ 0,-1, 0, 0 ],
    [ 0, 0,-1, 0 ],
    [ 1, 0, 0, 0 ],
    [ 0, 1, 0, 0 ],
    [ 0, 0, 1, 0 ],
];

/**
 * Component controlling global slicing parameters for all [[CVModel2]] components in a scene.
 */
export default class CVSlicer extends CObject3D
{
    static readonly typeName: string = "CVSlicer";

    static readonly text: string = "Slicer";
    static readonly icon: string = "";

    protected static ins = {
        enabled: types.Boolean("Slice.Enabled"),
        axis: types.Enum("Slice.Axis", ESliceAxis),
        position: types.Number("Slice.Position", { min: 0, max: 1, preset: 0.5 }),
        inverted: types.Boolean("Slice.Inverted"),
        color: types.ColorRGB("Slice.Color", [ 0, 0.61, 0.87 ]), // SI blue
        boundingBox: types.Object("Scene.BoundingBox", Box3),
    };

    ins = this.addInputs<CObject3D, typeof CVSlicer.ins>(CVSlicer.ins);

    get settingProperties() {
        return [
            this.ins.enabled,
            this.ins.color
        ];
    }

    get snapshotProperties() {
        return [
            this.ins.enabled,
            this.ins.axis,
            this.ins.position,
            this.ins.inverted,
        ];
    }

    protected get assetReader() {
        return this.getMainComponent(CVAssetReader);
    }

    protected plane: number[] = null;
    protected axisIndex = -1;
    protected xSliceSprites: Texture = null;
    protected sliceDimU = 43;
    protected sliceDimV = 11;
    protected sliceCount = 469;

    create()
    {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);
    }

    update(context)
    {
        const ins = this.ins;

        if(this.xSliceSprites == null) {
            this.assetReader.getTexture("xSlice.jpg").then((texture) => this.xSliceSprites = texture);
        }

        if (ins.axis.changed) {
            const axisIndex = ins.axis.getValidatedValue();

            if (axisIndex === this.axisIndex) {
                // if same axis is selected again, invert its orientation
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

        const boundingBox = this.ins.boundingBox.value;
        if (!boundingBox) {
            return true;
        }

        // set components of slicing plane vector
        this.plane = _planes[planeIndex];
        const min = boundingBox.min.getComponent(axisIndex);
        const max = boundingBox.max.getComponent(axisIndex);
        const value = 1 - ins.position.value;
        this.plane[3] = axisInverted ? value * (max - min) - max :  max - value * (max - min);

        // init slice plane
        const angle = Math.PI*0.5;
        if(!this.object3D && isFinite(min) && isFinite(max)) {
            const geometry = new PlaneGeometry( max-min, max-min );
            const material = new MeshBasicMaterial( {side: DoubleSide} );
            this.xSliceSprites.repeat.set(1/this.sliceDimU,1/this.sliceDimV);
            material.map = this.xSliceSprites;
            const plane = new Mesh( geometry, material );
            this.object3D = plane;
        }
        // update slice plane
        if(this.object3D) {
            const sliceIdx = Math.round(value * (this.sliceCount-1));
            this.xSliceSprites.offset.set((sliceIdx%this.sliceDimU)/this.sliceDimU, (1-(1/this.sliceDimV))-Math.floor(sliceIdx/this.sliceDimU)/this.sliceDimV);

            const pos = max - value * (max - min);
            this.object3D.setRotationFromEuler(new Euler(this.plane[1]*angle,this.plane[0]*angle,0));
            this.object3D.position.set(Math.abs(this.plane[0])*pos, Math.abs(this.plane[1])*pos, Math.abs(this.plane[2])*pos);
            this.object3D.updateMatrix();
        }

        const models = this.getGraphComponents(CVModel2);

        // set the slicing plane in the Uber materials of each scene model
        models.forEach(model => {
            if(model.ins.slicerEnabled.value) {
                const object = model.object3D;
                object.traverse((mesh: Mesh) => {
                    if (mesh.isMesh) {
                        const material = mesh.material as UberPBRMaterial;
                        if (material.isUberPBRMaterial) {
                            this.updateMaterial(material);
                        }
                    }
                });
            }
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
            inverted: data.inverted || false,
            color: data.color || [ 0, 0.61, 0.87 ]
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
            color: ins.color.value
        };
    }

    private updateMaterial(material: UberPBRMaterial)
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