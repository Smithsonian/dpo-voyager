/**
 * 3D Foundation Project
 * Copyright 2020 Smithsonian Institution
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
import { ITweenState } from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";
import CRenderer from "@ff/scene/components/CRenderer";
import { IPointerEvent } from "@ff/scene/RenderView";

import { ITarget, ITargets } from "client/schema/model";

import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVModel2, { IModelClickEvent } from "./CVModel2";
import CVTargetManager from "./CVTargetManager";
import CVSetup from "./CVSetup";
import VGPUPicker from "../utils/VGPUPicker";
import UberPBRMaterial from "client/shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

export enum ETargetType { Model, Zone };

export default class CVTargets extends Component
{
    static readonly typeName: string = "CVTargets";
    static readonly sceneSnapshotId = "target-default";

    protected picker: VGPUPicker = null;

    protected static readonly ins = {
        enabled: types.Boolean("Targets.Enabled"),
        active: types.Boolean("Targets.Active", false),
        visible: types.Boolean("Targets.Visible", false),
        type: types.Enum("Targets.Type", ETargetType),
        targetIndex: types.Integer("Targets.Index", -1),
        snapshotIndex: types.Integer("Snapshot.Index"),
        forward: types.Event("Zone.Forward"),
        back: types.Event("Zone.Back"),
        first: types.Event("Step.First"),
    };

    protected static readonly outs = {
        count: types.Integer("Targets.Count"),
        targetIndex: types.Integer("Target.Index", -1),
        targetTitle: types.String("Target.Title"),
        targetLead: types.String("Target.Lead"),
        zoneCount: types.Integer("Target.Zones", 0),
        snapshotIndex: types.Integer("Snapshot.Index"),
        stepTitle: types.String("Step.Title"),
    };

    ins = this.addInputs(CVTargets.ins);
    outs = this.addOutputs(CVTargets.outs);

    private _targets: ITarget[] = [];
    private _modelTarget: number = -1;
    private _zoneCanvas: HTMLCanvasElement = null;
    private _zoneTexture: THREE.CanvasTexture = null;

    get model() {
        return this.getComponent(CVModel2);
    }
    get material() {
        let mat = null;
        if(this.model.object3D.type === "Mesh") {
            const mesh = this.model.object3D as THREE.Mesh;
            mat = mesh.material as UberPBRMaterial;
        }
        else {
            const mesh = this.model.object3D.getObjectByProperty("type", "Mesh") as THREE.Mesh;
            if(mesh) {
                mat = mesh.material as UberPBRMaterial;
            }
        }
        return mat;
    }
    get setup() {
        return this.getSystemComponent(CVSetup, true);
    }
    get manager() {
        return this.getSystemComponent(CVTargetManager, true);
    }
    get snapshots() {
        return this.getSystemComponent(CVSnapshots, true);
    }
    get targets() {
        return this._targets;
    }
    get activeSnapshots() {
        const target = this.activeTarget;
        return target ? target.snapshots : null;
    }
    get activeTarget() { 
        return this._targets[this.outs.targetIndex.value];
    }
    get activeSnapshot() {
        const target = this.activeTarget;
        return target ? target.snapshots[this.outs.snapshotIndex.value] : null;
    }

    get zoneCanvas() {
        if(this._zoneCanvas) {
            return this._zoneCanvas;
        } 
        else {
            return this._zoneCanvas = this.createZoneCanvas();
        }
    }
    set zoneCanvas(canvas) {
        this._zoneCanvas = canvas;
    }

    get zoneTexture() {
        if(this._zoneTexture) {
            return this._zoneTexture;
        } 
        else {
            this._zoneTexture = new THREE.CanvasTexture(this.zoneCanvas);
            this.material.zoneMap = this._zoneTexture;
            return this._zoneTexture;
        }
    }
    set zoneTexture(texture) {
        this._zoneTexture = texture;
    }

    dispose()
    {
        this.model.off<IPointerEvent>("pointer-up", this.onModelClicked, this);
        super.dispose();
    }

    create()
    {
        super.create();
        this.model.on<IPointerEvent>("pointer-up", this.onModelClicked, this);
    }

    update(context: IPulseContext)
    {
        const { ins, outs } = this;

        const targets = this._targets;
        const machine = this.snapshots;
        
        if(machine === undefined || this.setup.tours.ins.enabled.value || this.manager.ins.engaged.value) {
            return;
        }
  
        const targetIndex = ins.targetIndex.value;
        const target = targets[targetIndex];
        const zoneCount = targets.length;
        outs.zoneCount.setValue(zoneCount);

        if (ins.targetIndex.changed || ins.enabled.changed) {       
            outs.targetIndex.setValue(targetIndex);
            outs.targetTitle.setValue(target ? target.title : "");

            if(target) {
                const snapshot = target.snapshots[ins.snapshotIndex.value];
                if(snapshot) {
                    machine.ins.id.setValue(snapshot.id); 
                }
            }
        }

        if (zoneCount === 0) {
            outs.snapshotIndex.setValue(-1);
            outs.stepTitle.setValue("");
            return true;
        }
        else {
            ins.snapshotIndex.setValue(0);
            outs.snapshotIndex.setValue(0);
        }

        let tween = true;

        if(ins.forward.changed)
        {
            // store pre-target scene state
            const state: ITweenState = {
                id: CVTargets.sceneSnapshotId,
                curve: EEasingCurve.EaseOutQuad,
                duration: 1,
                threshold: 0,
                values: machine.getCurrentValues(),
            };
            machine.setState(state);

            tween ? machine.ins.tween.set() : machine.ins.recall.set();
            //outs.enagaged.setValue(true);
            this.manager.ins.engaged.setValue(true);
            
            return true;
        }

        if(ins.back.changed)
        {
            // recall pre-target scene state
            machine.tweenTo(CVTargets.sceneSnapshotId, context.secondsElapsed);
            machine.deleteState(CVTargets.sceneSnapshotId);    
            
            return true;
        }

        if(ins.visible.changed)
        {
            if(this.material && this.material.zoneMap) {
                const refresh = this.zoneTexture;
                this.material.enableZoneMap(ins.visible.value);
            }
        }

        return true;
    }

    protected onModelClicked(event: IModelClickEvent)
    {
        if(event.isDragging || !this.ins.active.value) {
            return;
        }

        let newTargetIdx = -1;

        if(this.outs.zoneCount.value > 0)// TODO: Only needed if we have active zones
        {
            const uv: THREE.Vector2 = new THREE.Vector2; 
            if(this.picker === null) {
                this.picker = new VGPUPicker(event.view.renderer);
            }

            VGPUPicker.add(event.object3D, true);

            const sceneComponent = this.system.getComponent(CRenderer, true).activeSceneComponent;
            const scene = sceneComponent && sceneComponent.scene;
            const camera = sceneComponent &&sceneComponent.activeCamera;

            const mesh = event.object3D as THREE.Mesh;
            const material = mesh.material as UberPBRMaterial;

            const zoneColor = this.picker.pickZone(scene, material.zoneMap, camera, event); 
            const hexColor = "#" + zoneColor.x.toString(16).padStart(2, '0') + zoneColor.y.toString(16).padStart(2, '0') + zoneColor.z.toString(16).padStart(2, '0');
            const zoneIndex = this._targets.findIndex(target => target.color === hexColor);

            if(zoneIndex > -1 && this._targets[zoneIndex].snapshots.length > 0) {
                newTargetIdx = zoneIndex;
            }
        }

        // if needed set model index
        if(newTargetIdx === -1 && this._modelTarget != -1 && this._targets[this._modelTarget].snapshots.length > 0) {
            newTargetIdx = this._modelTarget;
        }


        if(newTargetIdx > -1) {
            // set new target
            this.ins.targetIndex.setValue(newTargetIdx);
            this.ins.forward.set();
        }
    }

    protected createZoneCanvas()
    {   
        const material = this.material;
        const dim = material.map ? material.map.image.width : 4096;

        const canvas  = document.createElement('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        canvas.width = dim;
        canvas.height = dim;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "scale-down";
        canvas.style.boxSizing = "border-box";
        canvas.style.position = "absolute";
        canvas.style.zIndex = "2";
        ctx.lineWidth = 10;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.fillStyle = '#FF0000';
        ctx.strokeStyle = '#FF0000'

        // if we have a pre-loaded zone texture we need to copy the image
        if(material.zoneMap && material.zoneMap.image) {
            ctx.drawImage(material.zoneMap.image,0,0);
        }

        return canvas;
    }

    fromData(data: ITargets)
    {
        this._targets.length = 0; // clear target array

        data.forEach(target => {
            if(target.type === "Model") {
                let objIdx = this._targets.findIndex(o => o.type === 'Model');
                if(objIdx > -1) {
                    this._modelTarget = objIdx;
                }
            }

            this._targets.splice(this._targets.length, 0, {
                type: target.type,
                id: target.id,
                title: target.title,
                color: target.color, 
                snapshots: target.snapshots
            });
        });

        
        this.ins.targetIndex.setValue(-1);
        this.outs.count.setValue(this._targets.length);

        if(this._targets.some(target => target.snapshots.length > 0)) {
            this.ins.active.setValue(true);
        }
    }

    toData(): ITarget[] | null
    {
        if (this._targets.length === 0) {
            return null;
        }

        return  this._targets.filter(target => target.snapshots.length > 0).map(target => {
            const data: ITarget = {
                type: target.type,
                id: target.id,
                title: target.title,
                color: target.color,
                snapshots: target.snapshots,
            };
            
            return data as ITarget; 
        });
    }
}