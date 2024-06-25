/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { types } from "@ff/graph/propertyTypes";
import Component from "@ff/graph/Component";

import OrbitManip from "@ff/three/OrbitManipulator";
import CScene, { IActiveCameraEvent } from "./CScene";
import CCamera from "./CCamera";

import { IPointerEvent, ITriggerEvent } from "../RenderView";

////////////////////////////////////////////////////////////////////////////////

const _inputs = {
    enabled: types.Boolean("Enabled", true),
    orbit: types.Vector3("Orbit", [ 0, 0, 0 ]),
    offset: types.Vector3("Offset", [ 0, 0, 50 ]),
    minOrbit: types.Vector3("Min.Orbit", [ -90, NaN, NaN ]),
    minOffset: types.Vector3("Min.Offset", [ NaN, NaN, 0.1 ]),
    maxOrbit: types.Vector3("Max.Orbit", [ 90, NaN, NaN ]),
    maxOffset: types.Vector3("Max.Offset", [ NaN, NaN, 100 ])
};

const _outputs = {
    orbit: types.Vector3("Orbit"),
    offset: types.Vector3("Offset"),
    size: types.Number("Size")
};

export default class COrbitManipulator extends Component
{
    static readonly typeName: string = "COrbitManipulator";

    ins = this.addInputs(_inputs);
    outs = this.addOutputs(_outputs);

    private _manip = new OrbitManip();
    private _activeCameraComponent: CCamera;

    create()
    {
        super.create();

        this._manip.cameraMode = true;

        this.system.on(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.on("wheel", this.onTrigger, this);

        this.trackComponent(CScene, component => {
            component.on<IActiveCameraEvent>("active-camera", this.onActiveCamera, this);
        }, component => {
            component.off<IActiveCameraEvent>("active-camera", this.onActiveCamera, this);
        });

    }

    dispose()
    {
        super.dispose();

        this.system.off(["pointer-down", "pointer-up", "pointer-move"], this.onPointer, this);
        this.system.off("wheel", this.onTrigger, this);
    }

    update()
    {
        const manip = this._manip;
        const ins = this.ins;

        const { minOrbit, minOffset, maxOrbit, maxOffset } = ins;
        if (minOrbit.changed || minOffset.changed || maxOrbit.changed || maxOffset.changed) {
            manip.minOrbit.fromArray(minOrbit.value);
            manip.minOffset.fromArray(minOffset.value);
            manip.maxOrbit.fromArray(maxOrbit.value);
            manip.maxOffset.fromArray(maxOffset.value);
        }

        if (ins.orbit.changed) {
            manip.orbit.fromArray(ins.orbit.value);
        }
        if (ins.offset.changed) {
            manip.offset.fromArray(ins.offset.value);
        }

        return true;
    }

    tick()
    {
        const manip = this._manip;
        const { enabled } = this.ins;
        const { orbit, offset, size } = this.outs;

        if (enabled.value) {
            manip.update();

            manip.orbit.toArray(orbit.value);
            orbit.set();
            manip.offset.toArray(offset.value);
            offset.set();
            size.setValue(manip.size);


            const cameraComponent = this._activeCameraComponent;

            if (cameraComponent) {
                const parent = cameraComponent.parentComponent;
                if (parent) {
                    this._manip.toObject(parent.object3D);
                }
                else {
                    this._manip.toObject(cameraComponent.object3D);
                }

                if (cameraComponent.camera.isOrthographicCamera) {
                    cameraComponent.camera.size = this._manip.size;
                }

                return true;
            }
        }

        return false;
    }

    protected onPointer(event: IPointerEvent)
    {
        if (this.ins.enabled.value && this._activeCameraComponent) {
            const viewport = event.viewport;
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onPointer(event);
            event.stopPropagation = true;
        }
    }

    protected onTrigger(event: ITriggerEvent)
    {
        if (this.ins.enabled.value && this._activeCameraComponent) {
            const viewport = event.viewport;
            this._manip.setViewportSize(viewport.width, viewport.height);
            this._manip.onTrigger(event);
            event.stopPropagation = true;
        }
    }

    protected onActiveCamera(event: IActiveCameraEvent)
    {
        this._activeCameraComponent = event.next;
    }
}