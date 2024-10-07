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

import { Box3, DoubleSide, Euler, Mesh, MeshBasicMaterial, NotEqualStencilFunc, PlaneGeometry, ReplaceStencilOp, Texture } from "three";

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
    protected sliceSprites: Texture[] = [null,null,null];
    protected sliceDims = [{u: 20, v: 20}, {u: 14, v: 20}, {u: 27, v: 20}];
    protected sliceSize = [{x: 70.2, y: 36.4, z: 52}, {x: 70.2, y: 52, z: 36.4}, {x: 36.4, y: 52, z: 70.2}];
    protected sliceCounts = [400, 280, 540];

    create()
    {
        super.create();

        const scene = this.getGraphComponent(CVScene);
        this.ins.boundingBox.linkFrom(scene.outs.boundingBox);
    }

    update(context)
    {
        const ins = this.ins;

        if(this.sliceSprites[0] == null) {
            this.assetReader.getTexture("xSlice.jpg").then((texture) => {this.sliceSprites[0] = texture; ins.enabled.set();});
        }
        if(this.sliceSprites[1] == null) {
            this.assetReader.getTexture("ySlice.jpg").then((texture) => {this.sliceSprites[1] = texture; ins.enabled.set(); });
        }
        if(this.sliceSprites[2] == null) {
            this.assetReader.getTexture("zSlice.jpg").then((texture) => {this.sliceSprites[2] = texture; ins.enabled.set(); });
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

                if(this.object3D) {
                    this.sliceSprites[axisIndex].repeat.set(1/this.sliceDims[axisIndex].u,1/this.sliceDims[axisIndex].v);
                    this.object3D["material"].map = this.sliceSprites[axisIndex];
                    this.object3D.scale.set(this.sliceSize[axisIndex].x, this.sliceSize[axisIndex].y, 1.0);
                    this.object3D.updateMatrix();
                }
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
        let min = boundingBox.min.getComponent(axisIndex);
        let max = boundingBox.max.getComponent(axisIndex);
        const boundsScale = this.sliceSize[axisIndex].z/(max-min);
        min *= boundsScale;
        max *= boundsScale;
        const value = 1 - ins.position.value;
        this.plane[3] = axisInverted ? value * (max - min) - max :  max - value * (max - min);

        // init slice plane
        const angle = Math.PI*0.5;
        if(!this.object3D && isFinite(min) && isFinite(max) && this.sliceSprites[axisIndex]) {
            //const geometry = new PlaneGeometry( ((max-min)*1.929)/1.41, (max-min)/1.41 );
            const geometry = new PlaneGeometry( 1.0, 1.0 );
            const material = new MeshBasicMaterial( {side: DoubleSide} );
            
            material.stencilWrite = true;
            material.stencilRef = 0;
            material.stencilFunc = NotEqualStencilFunc;
            material.stencilFail = ReplaceStencilOp;
            material.stencilZFail = ReplaceStencilOp;
            material.stencilZPass = ReplaceStencilOp;

            this.sliceSprites[axisIndex].repeat.set(1/this.sliceDims[axisIndex].u,1/this.sliceDims[axisIndex].v);
            material.map = this.sliceSprites[axisIndex];
            const plane = new Mesh( geometry, material );
            this.object3D = plane;
            this.object3D.scale.set(this.sliceSize[axisIndex].x, this.sliceSize[axisIndex].y, 1.0);
            this.object3D.renderOrder = 10;
        }
        // update slice plane
        if(this.object3D) {
            const idx = Math.round(value * (this.sliceCounts[axisIndex]));
            const sliceIdx = this.plane[0] ? this.sliceCounts[axisIndex] - idx : idx;
            
            this.sliceSprites[axisIndex].offset.set((sliceIdx%this.sliceDims[axisIndex].u)/this.sliceDims[axisIndex].u, (1-(1/this.sliceDims[axisIndex].v))-Math.floor(sliceIdx/this.sliceDims[axisIndex].u)/this.sliceDims[axisIndex].v);

            const pos = max - value * (max - min);
            const rotPlane = _planes[axisIndex];
            this.object3D.setRotationFromEuler(new Euler(rotPlane[1]*3*angle,rotPlane[0]*angle+rotPlane[2]*2*angle,-rotPlane[1]*angle+rotPlane[2]*angle));
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

        if (ins.enabled.value != material.defines["CUT_PLANE"]) {
            material.enableCutPlane(ins.enabled.value);
            material.needsUpdate = true;
        }

        material.cutPlaneDirection.fromArray(this.plane);
        material.cutPlaneColor.fromArray(ins.color.value);
    }
}