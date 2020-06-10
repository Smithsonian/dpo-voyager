/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import Component, { types } from "@ff/graph/Component";
import { ITweenState } from "@ff/graph/components/CTweenMachine";
import { IPulseContext } from "@ff/graph/components/CPulse";

import { ITarget, ITargets } from "client/schema/model";

import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVModel2 from "./CVModel2";
import CVTargetManager from "./CVTargetManager";
import CVSetup from "./CVSetup";
import CVAnnotationView, { IAnnotationClickEvent } from "./CVAnnotationView";

////////////////////////////////////////////////////////////////////////////////

export enum ETargetType { Model, Zone };

export default class CVTargets extends Component
{
    static readonly typeName: string = "CVTargets";
    static readonly sceneSnapshotId = "target-default";

    protected static readonly ins = {
        enabled: types.Boolean("Targets.Enabled"),
        active: types.Boolean("Targets.Active", false),
        refresh: types.Event("Targets.Refresh"),
        type: types.Enum("Targets.Type", ETargetType),
        targetIndex: types.Integer("Targets.Index", -1),
        zoneIndex: types.Integer("Zone.Index"),
        forward: types.Event("Zone.Forward"),
        back: types.Event("Zone.Back"),
        first: types.Event("Step.First"),
    };

    protected static readonly outs = {
        //enagaged: types.Boolean("Targets.Engaged", false),
        count: types.Integer("Targets.Count"),
        targetIndex: types.Integer("Target.Index", -1),
        targetTitle: types.String("Target.Title"),
        targetLead: types.String("Target.Lead"),
        zoneCount: types.Integer("Target.Zones"),
        zoneIndex: types.Integer("Zone.Index"),
        stepTitle: types.String("Step.Title"),
    };

    ins = this.addInputs(CVTargets.ins);
    outs = this.addOutputs(CVTargets.outs);

    private _targets: ITarget[] = [];
    private _modelTarget: number = -1;
    private _annotationCount: number = 0;

    protected get model() {
        return this.getComponent(CVModel2);
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
    get activeZones() {
        const target = this.activeTarget;
        return target ? target.snapshots : null;
    }
    get activeTarget() { 
        return this._targets[this.outs.targetIndex.value];
    }
    get activeZone() {
        const target = this.activeTarget;
        return target ? target.snapshots[this.outs.zoneIndex.value] : null;
    }

    dispose()
    {
        this.ins.refresh.off("value", this.regenerateTargetList, this);
        super.dispose();
    }

    create()
    {
        super.create();
        this.ins.refresh.on("value", this.regenerateTargetList, this);
    }

    update(context: IPulseContext)
    {
        const { ins, outs } = this;

        const targets = this._targets;
        const machine = this.snapshots;
        
        if(machine === undefined || this.setup.tours.ins.enabled.value || this.manager.ins.engaged.value) {
            return;
        }

        // initialize targets with model
        if(targets.length === 0) {
            this._targets.splice(0, 0, {
                type: "Model",
                id: "model",
                title: this.node.name,
                snapshots: []
            });
        }

        if(ins.active.changed) {
            if(ins.active.value) {
                this.model.ins.selected.on("value", this.onModelClicked, this);
            }
            else {
                this.model.ins.selected.off("value", this.onModelClicked, this);
            }
        }

        if (ins.enabled.changed) {

            /*if (ins.enabled.value) {
                // store pre-target scene state
                const state: ITweenState = {
                    id: CVTargets.sceneSnapshotId,
                    curve: EEasingCurve.EaseOutQuad,
                    duration: 1,
                    threshold: 0,
                    values: machine.getCurrentValues(),
                };
                machine.setState(state);
            }
            else {
                outs.targetIndex.set();

                // recall pre-target scene state
                //machine.tweenTo(CVTargets.sceneSnapshotId, context.secondsElapsed);
                //machine.deleteState(CVTargets.sceneSnapshotId);

                return true;
            }*/
        }
  
        const targetIndex = ins.targetIndex.value; //Math.min(targets.length - 1, Math.max(-1, ins.targetIndex.value));
        const target = targets[targetIndex];
        const zoneCount = target ? target.snapshots.length : 0;
        outs.zoneCount.setValue(zoneCount);

        let nextStepIndex = -1;

        if (ins.targetIndex.changed || ins.enabled.changed) {
            if (targetIndex !== outs.targetIndex.value) {
                nextStepIndex = 0;
            }
         
            outs.targetIndex.setValue(targetIndex);
            outs.targetTitle.setValue(target ? target.title : "");
            //outs.targetLead.setValue(target ? target.lead : "");

            if(target) {
                const snapshot = target.snapshots[ins.zoneIndex.value];
                if(snapshot) {
                    machine.ins.id.setValue(snapshot.id); 
                }
            }
        }

        if (zoneCount === 0) {
            outs.zoneIndex.setValue(-1);
            outs.stepTitle.setValue("");
            return true;
        }
        else {
            ins.zoneIndex.setValue(0);
            outs.zoneIndex.setValue(0);
        }

        let tween = true;

        if (ins.enabled.changed) {
            nextStepIndex = outs.zoneIndex.value;
        }
        if (ins.zoneIndex.changed) {
            //nextStepIndex = Math.min(target.snapshots.length - 1, Math.max(0, ins.zoneIndex.value));
            //tween = false;
        }

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
            
        }

        if(ins.back.changed)
        {
            // recall pre-target scene state
            machine.tweenTo(CVTargets.sceneSnapshotId, context.secondsElapsed);
            machine.deleteState(CVTargets.sceneSnapshotId);     
        }

        return true;
    }

    protected onModelClicked()
    {
        // set target
        this.ins.targetIndex.setValue(this._modelTarget);

        console.log("TRANSITION");
        this.ins.forward.set();
    }

    protected onAnnotationClicked(event: IAnnotationClickEvent)
    {
        if(event.annotation != null) {
            // if target is active, set index
            let objIdx = this._targets.findIndex(o => o.id === event.annotation.id);
            if(objIdx > -1 && this._targets[objIdx].snapshots.length > 0)
            {
                this.ins.targetIndex.setValue(objIdx);
                this.ins.forward.set();
            }
        }
    }

    protected regenerateTargetList()
    {console.log("REGENERATING");
        if(this._targets.length === 0)
        {
            // add model header
            this._targets.splice(0, 0, {
                type: "Header",
                id: "",
                title: "Model",
                snapshots: []
            });

            // add model target
            this._targets.splice(1, 0, {
                type: "Model",
                id: "model",
                title: this.node.name,
                snapshots: []
            });

            // add annotation header
            this._targets.splice(2, 0, {
                type: "Header",
                id: "",
                title: "Annotations",
                snapshots: []
            });

            // add annotation targets
            const annotationView = this.model.getComponent(CVAnnotationView, true);           
            if(annotationView)
            {
                const annotationList = annotationView.getAnnotations();
                annotationList.forEach(annotation => {
                    const annoTarget : ITarget = {
                        type: "Annotation",
                        id: annotation.id,
                        title: annotation.data.title,
                        snapshots: []
                    };
                    this._targets.push(annoTarget);
                    this._annotationCount++;
                });
                annotationView.on<IAnnotationClickEvent>("click", this.onAnnotationClicked, this);
            }

            // add zone header
            this._targets.splice(3+this._annotationCount, 0, {
                type: "Header",
                id: "",
                title: "Zones",
                snapshots: []
            });
        }
        else {
            // annotations may have changed so refresh this section
            const annotationView = this.model.getComponent(CVAnnotationView, true);  
            if(annotationView)
            {
                const annotationList = annotationView.getAnnotations();
console.log("UPDATING TARGET LIST");
                // add new annotations
                const newList = annotationList.filter(annotation => !this._targets.some(target => target.id === annotation.id));
                if(newList.length > 0) {
                    const annoToAdd : ITarget[] = newList.map(annotation => ({
                        type: "Annotation",
                        id: annotation.id,
                        title: annotation.data.title,
                        snapshots: []
                    }));
                    this._targets.splice(3+this._annotationCount, 0, ...annoToAdd);
                    this._annotationCount += newList.length;
                }
                
                // remove old annotations and update
                this._targets.slice().reverse().forEach(function(item, index, object) {
                    if (item.type === "Annotation") {
                        const currentAnno = annotationList.findIndex(annotation => item.id === annotation.id)
                        if(currentAnno === -1) {
                            // if snapshot is present, delete from machine
                            if(item.snapshots.length > 0) {
                                item.snapshots.forEach(snapshot => { this.snapshots.deleteState(snapshot.id); });
                            }
                            this._targets.splice(object.length - 1 - index, 1);
                        }
                        else {
                            // annotation is still good but title may have been updated
                            item.title = annotationList[currentAnno].data.title;
                        }
                    }
                }.bind(this));
            }
        }
    }

    fromData(data: ITargets)
    {
        this._targets.length = 0; // clear target array
        this.regenerateTargetList();

        data.forEach(target => {
            if(target.type === "Model") {
                let objIdx = this._targets.findIndex(o => o.type === 'Model');
                if(objIdx > -1) {
                    this._targets[objIdx].snapshots = target.snapshots;
                    this._modelTarget = objIdx;
                }
            }
            else {
                let objIdx = this._targets.findIndex(o => o.id === target.id);
                if(objIdx > -1) {
                    this._targets[objIdx].snapshots = target.snapshots;
                }
            }
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
                snapshots: target.snapshots,
            };

            return data as ITarget;
        });
    }
}