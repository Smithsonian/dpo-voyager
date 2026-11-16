/**
 * Funded by the Netherlands eScience Center in the context of the
 * [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project.
 *
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 */

import System from "@ff/graph/System";

import CVOrbitNavigation from "../components/CVOrbitNavigation";
import CVScene from "../components/CVScene";
import "./Compass";
import type Compass from "./Compass";

////////////////////////////////////////////////////////////////////////////////

export default class CompassController
{
    private static readonly DRAG_THRESHOLD_PX = 4;
    private static readonly DRAG_SENSITIVITY = 0.5;

    readonly element: Compass;

    private _activePointerId = -1;
    private _compassHasDragged = false;
    private _compassDragStartX = 0;
    private _compassLastX = 0;

    constructor(private system: System)
    {
        this.element = document.createElement("sv-compass") as Compass;
        this.element.style.display = "none";
    }

    connect()
    {
        this.system.getComponent(CVOrbitNavigation).ins.orbit.on("value", this.updateRotation, this);
        this.element.addEventListener("pointerdown", this.onPointerDown);
        this.element.addEventListener("pointermove", this.onPointerMove);
        this.element.addEventListener("pointerup", this.onPointerUp);
        this.element.addEventListener("pointercancel", this.onPointerCancel);
        this.updateRotation();
    }

    disconnect()
    {
        this.system.getComponent(CVOrbitNavigation).ins.orbit.off("value", this.updateRotation, this);
        this.element.removeEventListener("pointerdown", this.onPointerDown);
        this.element.removeEventListener("pointermove", this.onPointerMove);
        this.element.removeEventListener("pointerup", this.onPointerUp);
        this.element.removeEventListener("pointercancel", this.onPointerCancel);
        if (this._activePointerId >= 0 && this.element.hasPointerCapture(this._activePointerId)) {
            this.element.releasePointerCapture(this._activePointerId);
        }
        this._activePointerId = -1;
        this._compassHasDragged = false;
        document.body.style.cursor = "";
    }

    toggle()
    {
        this.setVisible(!this.isVisible());
    }

    setVisible(visible: boolean)
    {
        this.element.style.display = visible ? "block" : "none";
    }

    isVisible(): boolean
    {
        return this.element.style.display !== "none";
    }

    private updateRotation = () => {
        const [, yaw] = this.system.getComponent(CVOrbitNavigation).ins.orbit.value;
        this.element.cameraRotation = -yaw;
    };

    private onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || this._activePointerId >= 0) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this._activePointerId = event.pointerId;
        this._compassHasDragged = false;
        this._compassDragStartX = event.clientX;
        this._compassLastX = event.clientX;
        this.element.setPointerCapture(event.pointerId);
        document.body.style.cursor = "grabbing";
    };

    private onPointerMove = (event: PointerEvent) => {
        if (event.pointerId !== this._activePointerId) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!this._compassHasDragged) {
            if (Math.abs(event.clientX - this._compassDragStartX) >= CompassController.DRAG_THRESHOLD_PX) {
                this._compassHasDragged = true;
                this._compassLastX = event.clientX;
            }
        }
        else {
            const dx = event.clientX - this._compassLastX;
            this._compassLastX = event.clientX;
            if (dx !== 0) {
                this.system.getComponent(CVScene)?.models.forEach(model => model.rotateAroundY(dx * CompassController.DRAG_SENSITIVITY));
            }
        }
    };

    private onPointerUp = (event: PointerEvent) => {
        this.finishPointer(event, true);
    };

    private onPointerCancel = (event: PointerEvent) => {
        this.finishPointer(event, false);
    };

    private finishPointer(event: PointerEvent, snapToNorth: boolean)
    {
        if (event.pointerId !== this._activePointerId) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const hasDragged = this._compassHasDragged;
        this._activePointerId = -1;
        this._compassHasDragged = false;
        document.body.style.cursor = "";
        if (this.element.hasPointerCapture(event.pointerId)) {
            this.element.releasePointerCapture(event.pointerId);
        }
        if (snapToNorth && !hasDragged) {
            const navIns = this.system.getComponent(CVOrbitNavigation).ins;
            const [pitch, , roll] = navIns.orbit.value;
            navIns.orbit.setValue([pitch, 0, roll]);
        }
    }
}
