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

import { Node } from "@ff/graph/Component";

import CVTask, { types } from "./CVTask";
import HotSpotsTaskView from "../ui/story/HotSpotsTaskView";

import CVDocument from "./CVDocument";
import CVTargets from "./CVTargets";
import CVSnapshots, { EEasingCurve } from "./CVSnapshots";
import CVTargetManager from "./CVTargetManager";

import NVNode from "../nodes/NVNode";

////////////////////////////////////////////////////////////////////////////////

let _nextTourIndex = 0;
let _nextStepIndex = 0;

export default class CVHotSpotsTask extends CVTask
{
    static readonly typeName: string = "CVHotSpotsTask";

    static readonly text: string = "Targets";
    static readonly icon: string = "target";

    protected static readonly ins = {
        activeNode: types.String("Targets.ActiveNode"),
        createTour: types.Event("Tours.Create"),
        deleteTour: types.Event("Tours.Delete"),
        moveTourUp: types.Event("Tours.MoveUp"),
        moveTourDown: types.Event("Tours.MoveDown"),
        tourTitle: types.String("Tour.Title"),
        tourLead: types.String("Tour.Lead"),
        tourTags: types.String("Tour.Tags"),
        updateStep: types.Event("Step.Update"),
        createZone: types.Event("Zone.Create"),
        deleteStep: types.Event("Step.Delete"),
        moveStepUp: types.Event("Step.MoveUp"),
        moveStepDown: types.Event("Step.MoveDown"),
        stepTitle: types.String("Step.Title"),
        stepCurve: types.Enum("Step.Curve", EEasingCurve),
        stepDuration: types.Number("Step.Duration", 1),
        stepThreshold: types.Percent("Step.Threshold", 0.5),
    };

    protected static readonly outs = {
    };

    ins = this.addInputs<CVTask, typeof CVHotSpotsTask.ins>(CVHotSpotsTask.ins);
    outs = this.addOutputs<CVTask, typeof CVHotSpotsTask.outs>(CVHotSpotsTask.outs);

    targets: CVTargets = null;
    machine: CVSnapshots = null;

    get manager() {
        return this.getSystemComponent(CVTargetManager, true);
    }

    constructor(node: Node, id: string)
    {
        super(node, id);

        const configuration = this.configuration;
        configuration.bracketsVisible = false;
    }

    create()
    {
        super.create();
        this.startObserving();
    }

    dispose()
    {
        this.stopObserving();
        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const targets = this.targets;
        const machine = this.machine;

        if (!targets) {
            return false;
        }

        const targetList = targets.targets;
        const targetIndex = targets.outs.targetIndex.value;
        const target = targetList[targetIndex];

        if (target) {
            const zoneList = target.snapshots;
            const zoneIndex = targets.outs.zoneIndex.value;
            const zone = zoneList[zoneIndex];

            // tour step actions
            if (ins.createZone.changed) {
                const id = machine.setState({
                    values: machine.getCurrentValues(),
                    curve: EEasingCurve.EaseOutQuad,
                    duration: 1.5,
                    threshold: 0.5,
                });

                zoneList.splice(zoneIndex + 1, 0, {
                    title: "New Snapshot",
                    id
                });

                targets.ins.active.setValue(true);
                targets.ins.zoneIndex.setValue(zoneIndex + 1);
                machine.ins.id.setValue(id);
                return true;
            }

            if (zone) {
                if (ins.stepTitle.changed || ins.stepCurve.changed ||
                        ins.stepDuration.changed || ins.stepThreshold.changed) {
                    zone.title = ins.stepTitle.value;
                    machine.ins.curve.setValue(ins.stepCurve.value);
                    machine.ins.duration.setValue(ins.stepDuration.value);
                    machine.ins.threshold.setValue(ins.stepThreshold.value);
                    //targets.ins.zoneIndex.setValue(zoneIndex); console.log("state id: %s", machine.ins.id.value);
                    return true;
                }

                if (ins.updateStep.changed) {
                    machine.ins.store.set();
                    console.log("Updating snapshot: %s %s", zone.id, machine.ins.id.value);
                    return true;
                }
                if (ins.deleteStep.changed) {
                    zoneList.splice(zoneIndex, 1);
                    machine.ins.delete.set();
                    targets.ins.zoneIndex.setValue(zoneIndex);
                    return true;
                }
            }
        }

        return true;
    }

    createView()
    {
        return new HotSpotsTaskView(this);
    }

    activateTask()
    {
        super.activateTask();

        if (this.targets) {
            this.targets.ins.enabled.setValue(true);
            this.targets.ins.refresh.set();
        }
    }

    deactivateTask()
    {
        if (this.targets) {
            this.targets.ins.enabled.setValue(false);
        }

        super.deactivateTask();
    }

    protected onActiveDocument(previous: CVDocument, next: CVDocument)
    {
        if (previous) {
            if (this.isActiveTask) {
                this.targets.ins.enabled.setValue(false);
            }
            
            this.targets = null;
            this.machine = null;
        }
        if (next) {
            if (this.isActiveTask) {
                //this.targets.ins.enabled.setValue(true);
            }
        }

        this.changed = true;
    }

    protected onActiveNode(previous: NVNode, next: NVNode)
    {
        if(this.manager.ins.engaged.value)
        {
            super.onActiveNode(previous, next);
            return;
        }

        const prevTargets = previous ? previous.getComponent(CVTargets, true) : null;

        if(prevTargets)
        {
            prevTargets.outs.targetIndex.off("value", this.onTargetChange, this);
            prevTargets.outs.zoneIndex.off("value", this.onZoneChange, this);

            this.targets = null;
            this.machine = null;
        }

        if(next && next.model)
        {
            this.targets = next.getComponent(CVTargets, true);
            this.machine = this.targets.snapshots;
            this.ins.activeNode.setValue(next.name); 

            this.targets.outs.targetIndex.on("value", this.onTargetChange, this);
            this.targets.outs.zoneIndex.on("value", this.onZoneChange, this);

            this.targets.ins.refresh.set();
        }

        super.onActiveNode(previous, next);
    }

    protected onTargetChange()
    {
        const ins = this.ins;
        const tour = this.targets.activeTarget;

        //ins.tourTitle.setValue(tour ? tour.title : "", true);
        //ins.tourLead.setValue(tour ? tour.lead : "", true);
        //ins.tourTags.setValue(tour ? tour.tags.join(", ") : "", true);
    }

    protected onZoneChange()
    {
        const ins = this.ins;
        const zone = this.targets.activeZone;
        const state = zone ? this.machine.getState(zone.id) : null;
if(state) console.log("Setting values %f %s", state.duration, zone.id);
        ins.stepTitle.setValue(zone ? zone.title : "", true);
        ins.stepCurve.setValue(state ? state.curve : EEasingCurve.Linear, true);
        ins.stepDuration.setValue(state ? state.duration : 1, true);
        ins.stepThreshold.setValue(state ? state.threshold : 0.5, true);
    }
}