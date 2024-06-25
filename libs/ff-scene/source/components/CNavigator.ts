/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { types } from "@ff/graph/Component";

import OrbitManipulator from "@ff/three/OrbitManipulator";

import { IPointerEvent, ITriggerEvent } from "../RenderView";
import CCamera from "./CCamera";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    enabled: types.Boolean("Navigator.Enabled", true),
    overEnabled: types.Boolean("Override.Enabled"),
    overPush: types.Event("Override.Push"),
    orbit: types.Vector3("Override.Orbit", [ -25, -25, 0 ]),
    offset: types.Vector3("Override.Offset", [ 0, 0, 100 ]),
    minOrbit: types.Vector3("Min.Orbit", [ -90, -Infinity, -Infinity ]),
    minOffset: types.Vector3("Min.Offset", [ -Infinity, -Infinity, 0.1 ]),
    maxOrbit: types.Vector3("Max.Orbit", [ 90, Infinity, Infinity ]),
    maxOffset: types.Vector3("Max.Offset", [ Infinity, Infinity, Infinity ]),
};

const _outputs = {
    orbit: types.Vector3("Current.Orbit", [ -25, -25, 0 ]),
    offset: types.Vector3("Current.Offset", [ 0, 0, 100 ]),
};

export default class CNavigator extends Component
{
    static readonly typeName: string = "CNavigator";

    ins = this.addInputs(_inputs);
    outs = this.addOutputs(_outputs);

    protected manip = new OrbitManipulator();
    protected camera: CCamera = null;


    create()
    {
        super.create();

        this.trackComponent(CCamera, camera => {
            this.camera = camera;
        }, camera => {
            this.camera = null;
        });

        this.system.on<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on<ITriggerEvent>("wheel", this.onTrigger, this);
    }

    dispose()
    {
        this.system.off<IPointerEvent>(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off<ITriggerEvent>("wheel", this.onTrigger, this);

        super.dispose();
    }

    update(context)
    {
        const ins = this.ins;
        const manip = this.manip;

        // orbit, offset and limits
        if (ins.overPush.changed || (ins.overEnabled.value && (ins.orbit.changed || ins.offset.changed))) {
            manip.orbit.fromArray(ins.orbit.value);
            manip.offset.fromArray(ins.offset.value);
        }

        if (ins.minOrbit.changed || ins.minOffset.changed || ins.maxOrbit.changed || ins.maxOffset.changed) {
            manip.minOrbit.fromArray(ins.minOrbit.value);
            manip.minOffset.fromArray(ins.minOffset.value);
            manip.maxOrbit.fromArray(ins.maxOrbit.value);
            manip.maxOffset.fromArray(ins.maxOffset.value);
        }

        return true;
    }

    tick()
    {
        const { ins, outs, manip, camera } = this;

        if (ins.enabled.value) {
            const manipUpdated = manip.update();

            if (manipUpdated) {
                manip.orbit.toArray(outs.orbit.value);
                manip.offset.toArray(outs.offset.value);
                outs.orbit.set();
                outs.offset.set();
            }

            if (camera && (manipUpdated || this.updated)) {
                const cam = camera.camera;
                this.manip.toObject(cam);

                if (cam.isOrthographicCamera) {
                    cam.size = manip.offset.z;
                    cam.updateProjectionMatrix();
                }

                return true;
            }
        }

        return false;
    }

    protected onPointer(event: IPointerEvent)
    {
        const viewport = event.viewport;
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this.camera) {
            this.manip.setViewportSize(viewport.width, viewport.height);
            this.manip.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        const viewport = event.viewport;
        if (viewport.camera) {
            return;
        }

        if (this.ins.enabled.value && this.camera) {
            this.manip.setViewportSize(viewport.width, viewport.height);
            this.manip.onTrigger(event);
            event.stopPropagation = true;
        }
    }
}