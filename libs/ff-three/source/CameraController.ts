/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    Vector3,
    Matrix4,
    Box3,
    Euler,
} from "three";

import math from "@ff/core/math";

import {
    IManip,
    IPointerEvent,
    ITriggerEvent,
    IKeyboardEvent
} from "@ff/browser/ManipTarget";

import threeMath from "./math";
import UniversalCamera from "./UniversalCamera";

////////////////////////////////////////////////////////////////////////////////

const _mat4 = new Matrix4();
const _box3 = new Box3();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3c = new Vector3();
const _euler = new Euler();
const _axisZ = new Vector3(0, 0, 1);

export enum EControllerMode { Orbit, Fly, Walk }
enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }


export default class CameraController implements IManip
{
    camera: UniversalCamera;

    orbit = new Vector3(0, 0, 0);
    offset = new Vector3(0, 0, 50);
    pivot = new Vector3(0, 0, 0);

    minOrbit = new Vector3(-90, -Infinity, -Infinity);
    maxOrbit = new Vector3(90, Infinity, Infinity);
    minOffset = new Vector3(-Infinity, -Infinity, 0.1);
    maxOffset = new Vector3(Infinity, Infinity, 1000);

    boundsRadius = 0;

    orientationEnabled = true;
    offsetEnabled = true;

    controllerMode: EControllerMode = EControllerMode.Orbit

    /** Time constant of the camera's glide after releasing the pointer, in seconds. 0 disables inertia. */
    inertia = 0.15;
    /** Time constant of the wheel zoom and keyboard smoothing, in seconds. 0 disables smoothing. */
    smoothing = 0.08;

    protected mode = EManipMode.Off;
    protected phase = EManipPhase.Off;
    protected prevPinchDist = 0;

    /** Pointer movement since the last update, in pixels */
    protected deltaX = 0;
    protected deltaY = 0;
    protected deltaPinch = 0;
    /** Wheel steps not applied yet */
    protected deltaWheel = 0;

    /** Pointer velocity while dragging, then gliding velocity, in pixels per second */
    protected velocity = { x: 0, y: 0 };
    /** Time constant of the current glide, in seconds */
    protected glideTime = 0;
    protected lastUpdateTime = -1;

    protected viewportWidth = 100;
    protected viewportHeight = 100;
    protected orbitFactor = 220;

    constructor(camera?: UniversalCamera)
    {
        this.camera = camera;
    }

    onPointer(event: IPointerEvent)
    {
        if (event.isPrimary) {
            if (event.type === "pointer-down") {
                // grabbing stops the camera
                this.phase = EManipPhase.Active;
                this.velocity.x = this.velocity.y = 0;
            }
            else if (event.type === "pointer-up") {
                this.phase = EManipPhase.Release;
                this.glideTime = this.inertia;
                // releasing a slow or stopped pointer doesn't throw the camera
                if (Math.abs(this.velocity.x) + Math.abs(this.velocity.y) < 50) {
                    this.velocity.x = this.velocity.y = 0;
                }
                return true;
            }
        }

        if (event.type === "pointer-down") {
            this.mode = this.getModeFromEvent(event);
        }

        this.deltaX += event.movementX;
        this.deltaY += event.movementY;

        // calculate pinch
        if (event.pointerCount === 2) {
            const positions = event.activePositions;
            const dx = positions[1].clientX - positions[0].clientX;
            const dy = positions[1].clientY - positions[0].clientY;
            const pinchDist = Math.sqrt(dx * dx + dy * dy);

            const prevPinchDist = this.prevPinchDist || pinchDist;
            this.deltaPinch *= prevPinchDist > 0 ? (pinchDist / prevPinchDist) : 1;
            this.prevPinchDist = pinchDist;
        }
        else {
            this.deltaPinch = 1;
            this.prevPinchDist = 0;
        }

        return true;
    }

    onTrigger(event: ITriggerEvent)
    {
        if (event.type === "wheel") {
            this.deltaWheel += math.limit(event.wheel, -1, 1);
            return true;
        }

        return false;
    }

    onKeypress(event: IKeyboardEvent)
    {
        const isOrbit = this.controllerMode == EControllerMode.Orbit;
        const step = isOrbit ? 20 : 6;

        if(event.key === "ArrowUp" || event.key === "ArrowDown") {
            const mode = event.shiftKey ? EManipMode.Pan : isOrbit ? (event.ctrlKey ? EManipMode.Dolly : EManipMode.Orbit)
                : (event.ctrlKey ? EManipMode.Orbit : EManipMode.Dolly);
            this.push(mode, 0, event.key === "ArrowUp" ? -step : step);
            return true;
        }
        else if(event.key === "ArrowLeft" || event.key === "ArrowRight") {
            const mode = event.shiftKey ? EManipMode.Pan : EManipMode.Orbit;
            this.push(mode, event.key === "ArrowLeft" ? -step : step, 0);
            return true;
        }

        return false;
    }

    /**
     * Stops any ongoing camera motion: inertia, pending wheel zoom and keyboard moves.
     */
    stop()
    {
        if (this.phase !== EManipPhase.Active) {
            this.mode = EManipMode.Off;
            this.phase = EManipPhase.Off;
        }
        this.velocity.x = this.velocity.y = 0;
        this.deltaX = this.deltaY = 0;
        this.deltaWheel = 0;
    }

    /**
     * Moves the camera by the given amount (in pixels) in the given mode,
     * gliding over time if inertia is enabled.
     */
    protected push(mode: EManipMode, dX: number, dY: number)
    {
        if (this.phase === EManipPhase.Active) {
            return;
        }

        if (mode !== this.mode) {
            this.velocity.x = this.velocity.y = 0;
        }
        this.mode = mode;

        const tau = this.smoothing;
        if (tau > 0) {
            // velocity that glides over the given distance
            this.velocity.x += dX / tau;
            this.velocity.y += dY / tau;
            this.glideTime = tau;
            this.phase = EManipPhase.Release;
        }
        else {
            this.deltaX = dX;
            this.deltaY = dY;
        }
    }

    setViewportSize(width: number, height: number)
    {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    /**
     * Copy the object's matrix into the controller's properties
     * effectively the inverse operation of updateCamera
     */
    updateController(object?: Object3D, adaptLimits?: boolean)
    {
        const camera = this.camera;
        object = object || camera;

        const orbit = this.orbit;
        const offset = this.offset;
        // orbit matrix is relative to the pivot point
        _mat4.copy(object.matrix);
        _mat4.elements[12] -= this.pivot.x;
        _mat4.elements[13] -= this.pivot.y;
        _mat4.elements[14] -= this.pivot.z;
        threeMath.decomposeOrbitMatrix(_mat4, orbit, offset);
        this.orbit.multiplyScalar(threeMath.RAD2DEG);

        if (adaptLimits) {
            this.minOffset.min(offset);
            this.maxOffset.max(offset);
        }
    }

    /**
     * Moves the pivot point to the given position, keeping the camera in place
     * and turning it to face the new pivot. Roll is preserved.
     * Resulting orbit and offset are clamped to the controller's limits.
     * @param position New pivot position.
     */
    setPivot(position: Vector3)
    {
        const { orbit, offset, pivot } = this;

        // current camera position
        _vec3a.copy(orbit).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3a, offset, _mat4);
        _vec3b.setFromMatrixPosition(_mat4).add(pivot);

        // camera's +Z axis must point from the new pivot to the camera
        _vec3c.copy(_vec3b).sub(position);
        const distance = _vec3c.length();
        if (distance === 0) {
            return;
        }
        _vec3c.divideScalar(distance);

        // orbit rotation is Rz(roll) * Ry(head) * Rx(pitch): remove roll, then solve for pitch and head
        _vec3c.applyAxisAngle(_axisZ, -_vec3a.z);
        const pitch = Math.asin(math.limit(-_vec3c.y, -1, 1)) * math.RAD2DEG;
        let head = Math.atan2(_vec3c.x, _vec3c.z) * math.RAD2DEG;
        // stay on the same turn as the current heading to avoid spinning when tweening
        head += 360 * Math.round((orbit.y - head) / 360);

        orbit.x = math.limit(pitch, this.minOrbit.x, this.maxOrbit.x);
        orbit.y = math.limit(head, this.minOrbit.y, this.maxOrbit.y);
        offset.set(0, 0, math.limit(distance, this.minOffset.z, this.maxOffset.z));
        pivot.copy(position);
    }

    /**
     * Computes the camera's position from the controller's state.
     * @param result Vector receiving the position, in the camera's parent space.
     */
    getCameraPosition(result: Vector3): Vector3
    {
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3a, this.offset, _mat4);
        return result.setFromMatrixPosition(_mat4).add(this.pivot);
    }

    /**
     * Computes the camera's view direction (its -Z axis) from the controller's state.
     * @param result Vector receiving the normalized direction.
     */
    getViewDirection(result: Vector3): Vector3
    {
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.setScalar(0);
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, _mat4);
        const e = _mat4.elements;
        return result.set(-e[8], -e[9], -e[10]);
    }

    /**
     * Returns the distance of the given point along the camera's view axis.
     * Negative if the point is behind the camera.
     * @param point Position in world space.
     */
    getViewDepth(point: Vector3): number
    {
        // camera space position of the point, relative to the pivot
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3a, this.offset, _mat4);
        _mat4.invert();
        _vec3b.copy(point).sub(this.pivot).applyMatrix4(_mat4);
        return -_vec3b.z;
    }

    /**
     * Moves the pivot point along the camera's view axis, keeping the camera in place.
     * The resulting distance is clamped to the controller's offset limits.
     * @param distance Distance of the new pivot point in front of the camera.
     */
    setPivotDistance(distance: number)
    {
        distance = math.limit(distance, this.minOffset.z, this.maxOffset.z);

        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.copy(this.offset);
        _vec3b.z -= distance;
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, _mat4);

        this.pivot.add(_vec3c.setFromMatrixPosition(_mat4));
        this.offset.set(0, 0, distance);
    }

    /**
     * Adjusts the camera such that the given bounding box is entirely visible.
     * Moves the pivot point to the center of the box, keeping the current orbit.
     * This method can only be called if an internal camera has been assigned.
     * @param box Bounding box
     */
    zoomExtents(box: Box3)
    {
        if(this.controllerMode != EControllerMode.Orbit) {
            return;
        }

        const camera = this.camera;
        const offset = this.offset;

        if (!camera) {
            console.warn("CameraController.zoomExtents - camera not set");
            return;
        }

        // rotate box to camera space
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.setScalar(0);
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, _mat4);

        _box3.copy(box).applyMatrix4(_mat4.transpose());
        _box3.getSize(_vec3a);

        // orbit around the center of the box
        box.getCenter(this.pivot);
        offset.x = 0;
        offset.y = 0;

        const size = Math.max(_vec3a.x / camera.aspect, _vec3a.y);

        if (camera.isOrthographicCamera) {
            offset.z = size * 1.1; // add some padding
        }
        else {
            const fovFactor = 1 / (2 * Math.tan(camera.fov * math.DEG2RAD * 0.5));
            offset.z = (size * fovFactor + _vec3a.z * 0.25 /* was 0.5 */);
        }

        if(offset.z > this.maxOffset.z) {
            this.maxOffset.z = 2 * offset.length();
        }
        //this.maxOffset.z = Math.max(this.maxOffset.z, offset.z + _vec3a.z * 4);
    }

    /**
     * Updates the matrix of the given camera. If the camera's projection is orthographic,
     * updates the camera's size parameter as well.
     * @param object Updates this object if given, otherwise updates the internal camera.
     * @param force If true always updates, even if there haven't been any changes since the last update.
     */
    updateCamera(object?: Object3D, force?: boolean): boolean
    {
        const camera = this.camera;
        object = object || camera;

        if (!this.update() && !force) {
            return false;
        }

        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.copy(this.offset);

        if (camera.isOrthographicCamera) {
            _vec3b.z = this.maxOffset.z; // fixed distance = maxOffset.z
            if (this.controllerMode === EControllerMode.Orbit) {
                camera.size = this.offset.z; // use size to visualize distance
            }
            camera.far = 2 * this.maxOffset.z; // adjust far clipping
            camera.updateProjectionMatrix();
        }

        threeMath.composeOrbitMatrix(_vec3a, _vec3b, object.matrix);
        // orbit around the pivot point
        const e = object.matrix.elements;
        e[12] += this.pivot.x;
        e[13] += this.pivot.y;
        e[14] += this.pivot.z;
        object.matrixWorldNeedsUpdate = true;

        return true;
    }

    /**
     * Updates the manipulator.
     * @returns true if the state has changed during the update.
     */
    update(): boolean
    {
        const now = this.getTime();
        const dt = this.lastUpdateTime < 0 ? 1 / 60 : math.limit((now - this.lastUpdateTime) * 0.001, 0, 0.1);
        this.lastUpdateTime = now;

        const zoomed = this.updateWheel(dt);
        const moved = this.updatePointer(dt);
        return zoomed || moved;
    }

    /**
     * Current time in milliseconds.
     */
    protected getTime()
    {
        return performance.now();
    }

    /**
     * Applies pending wheel steps, smoothed over time.
     * @param dt Time since the last update, in seconds.
     */
    protected updateWheel(dt: number): boolean
    {
        if (this.deltaWheel === 0) {
            return false;
        }

        const tau = this.smoothing;
        let steps = tau > 0 ? this.deltaWheel * (1 - Math.exp(-dt / tau)) : this.deltaWheel;
        if (Math.abs(this.deltaWheel - steps) < 0.005) {
            steps = this.deltaWheel;
        }
        this.deltaWheel -= steps;

        // Orbit: each step scales the distance by 7%, symmetrically in and out
        const isOrbit = this.controllerMode === EControllerMode.Orbit;
        this.dolly(isOrbit ? Math.pow(1.07, steps) : steps);
        return true;
    }

    /**
     * Applies pointer movement while dragging, then inertia after release.
     * @param dt Time since the last update, in seconds.
     */
    protected updatePointer(dt: number): boolean
    {
        const velocity = this.velocity;

        if (this.phase === EManipPhase.Active) {
            // track pointer velocity (smoothed over ~50ms) for inertia after release
            if (dt > 0) {
                const blend = 1 - Math.exp(-dt / 0.05);
                velocity.x += (this.deltaX / dt - velocity.x) * blend;
                velocity.y += (this.deltaY / dt - velocity.y) * blend;
            }

            if (this.deltaX === 0 && this.deltaY === 0 && this.deltaPinch === 1) {
                return false;
            }

            this.updateByMode(this.deltaX, this.deltaY, this.deltaPinch);
            this.deltaX = 0;
            this.deltaY = 0;
            this.deltaPinch = 1;
            return true;
        }

        if (this.phase === EManipPhase.Release) {
            // movement since the last update, then exponential glide: the total distance is
            // velocity * tau whatever the frame rate
            let dX = this.deltaX, dY = this.deltaY;
            this.deltaX = this.deltaY = 0;
            this.deltaPinch = 1;

            const tau = this.mode === EManipMode.Off ? 0 : this.glideTime;
            const decay = tau > 0 ? Math.exp(-dt / tau) : 0;
            dX += velocity.x * tau * (1 - decay);
            dY += velocity.y * tau * (1 - decay);
            velocity.x *= decay;
            velocity.y *= decay;

            // stop when the remaining glide is less than half a pixel
            if ((Math.abs(velocity.x) + Math.abs(velocity.y)) * tau < 0.5) {
                dX += velocity.x * tau;
                dY += velocity.y * tau;
                velocity.x = velocity.y = 0;
                this.phase = EManipPhase.Off;
            }

            if (dX !== 0 || dY !== 0) {
                this.updateByMode(dX, dY, 1);
            }
            if (this.phase === EManipPhase.Off) {
                this.mode = EManipMode.Off;
            }
            return true;
        }

        if (this.deltaX !== 0 || this.deltaY !== 0) {
            this.updateByMode(this.deltaX, this.deltaY, 1);
            this.deltaX = 0;
            this.deltaY = 0;
            this.mode = EManipMode.Off;
            return true;
        }

        return false;
    }

    /**
     * Applies pointer deltas according to the current manipulation mode.
     */
    protected updateByMode(deltaX: number, deltaY: number, deltaPinch: number)
    {
        const isOrbit = this.controllerMode === EControllerMode.Orbit;

        switch(this.mode) {
            case EManipMode.Orbit:
                this.rotate(deltaY, deltaX, 0);
                break;

            case EManipMode.Roll:
                this.rotate(0, 0, deltaX);
                break;

            case EManipMode.Pan:
                this.pan(deltaX, deltaY);
                break;

            case EManipMode.Dolly:
                this.dolly(isOrbit ? deltaY * 0.0075 + 1 : deltaY * 0.175);
                break;

            case EManipMode.PanDolly:
                const pinch = deltaPinch - 1;
                this.dolly(isOrbit ? 1 / (pinch * 0.42 + 1) : pinch * -10);
                this.pan(deltaX * 0.75, deltaY * 0.75);
                break;
        }
    }

    /**
     * Rotates the camera around the pivot (Orbit mode) or around itself (Fly and Walk modes).
     * @param dPitch Pitch delta, in pixels.
     * @param dHead Heading delta, in pixels.
     * @param dRoll Roll delta, in pixels.
     */
    protected rotate(dPitch: number, dHead: number, dRoll: number)
    {
        this.movePivotToCamera();

        if (this.orientationEnabled) {
            const factor = -this.orbitFactor / this.viewportHeight;
            this.orbit.x += dPitch * factor;
            this.orbit.y += dHead * factor;
            this.orbit.z += dRoll * factor;
        }

        this.applyLimits();
    }

    /**
     * Moves the camera parallel to the view plane, following the pointer.
     * @param dX Horizontal delta, in pixels.
     * @param dY Vertical delta, in pixels.
     */
    protected pan(dX: number, dY: number)
    {
        this.movePivotToCamera();

        if (this.offsetEnabled) {
            if (this.controllerMode === EControllerMode.Orbit) {
                // Convert pixel deltas to world units at the pivot's distance.
                // ortho: offset.z is the camera's vertical size, so the ratio is already world/pixel.
                const { offset, camera } = this;
                const factor = (camera.isOrthographicCamera
                    ? offset.z
                    : offset.z * 2 * Math.tan(camera.fov * math.DEG2RAD * 0.5)) / this.viewportHeight;

                offset.x -= dX * factor;
                offset.y += dY * factor;
            }
            else {
                const factor = 20 * this.getMoveFactor() / this.viewportHeight;
                const isWalk = this.controllerMode === EControllerMode.Walk;
                this.moveCamera(-dX * factor, isWalk ? 0 : dY * factor, 0);
            }
        }

        this.applyLimits();
    }

    /**
     * Moves the camera along its view axis.
     * @param amount Orbit mode: factor applied to the distance to the pivot.
     * Fly and Walk modes: backwards distance, in units of getMoveFactor().
     */
    protected dolly(amount: number)
    {
        this.movePivotToCamera();

        if (this.offsetEnabled) {
            if (this.controllerMode === EControllerMode.Orbit) {
                this.offset.z *= amount;
            }
            else {
                this.moveCamera(0, 0, amount * this.getMoveFactor());
            }
        }

        this.applyLimits();
    }

    /**
     * Fly and Walk modes: moves the camera (and the pivot at its position) along the camera's axes.
     * Walk mode cancels pitch and roll so that the camera moves horizontally.
     */
    protected moveCamera(x: number, y: number, z: number)
    {
        _vec3b.set(x, y, z);

        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        if (this.controllerMode === EControllerMode.Walk) {
            _vec3b.applyEuler(_euler.set(-_vec3a.x, 0, -_vec3a.z, "XYZ"));
        }

        threeMath.composeOrbitMatrix(_vec3a, _vec3b, _mat4);
        this.pivot.add(_vec3c.setFromMatrixPosition(_mat4));
    }

    /**
     * Fly and Walk modes: the camera turns around itself. Moves the pivot to the camera's
     * position, with a zero offset. Does nothing in Orbit mode.
     */
    protected movePivotToCamera()
    {
        if (this.controllerMode !== EControllerMode.Orbit) {
            this.pivot.copy(this.getCameraPosition(_vec3c));
            this.offset.setScalar(0);
        }
    }

    /**
     * Scene size dependent speed for Fly and Walk modes.
     */
    protected getMoveFactor()
    {
        return this.boundsRadius / 25;
    }

    /**
     * Clamps orbit and offset to their limits. Offset limits only apply to Orbit mode.
     */
    protected applyLimits()
    {
        const { orbit, minOrbit, maxOrbit, offset, minOffset, maxOffset } = this;

        if (this.orientationEnabled) {
            orbit.x = math.limit(orbit.x, minOrbit.x, maxOrbit.x);
            orbit.y = math.limit(orbit.y, minOrbit.y, maxOrbit.y);
            orbit.z = math.limit(orbit.z, minOrbit.z, maxOrbit.z);
        }

        if (this.offsetEnabled && this.controllerMode === EControllerMode.Orbit) {
            offset.x = math.limit(offset.x, minOffset.x, maxOffset.x);
            offset.y = math.limit(offset.y, minOffset.y, maxOffset.y);
            offset.z = math.limit(offset.z, minOffset.z, maxOffset.z);
        }
    }

    protected getModeFromEvent(event: IPointerEvent): EManipMode
    {
        if (event.source === "mouse") {
            const button = event.originalEvent.button;

            // left button
            if (button === 0) {
                if (event.ctrlKey) {
                    return EManipMode.Pan;
                }
                if (event.altKey) {
                    return EManipMode.Dolly;
                }

                return EManipMode.Orbit;
            }

            // right button
            if (button === 2) {
                if (event.altKey) {
                    return EManipMode.Roll;
                }
                else {
                    return EManipMode.Pan;
                }
            }

            // middle button
            if (button === 1) {
                return EManipMode.Dolly;
            }
        }
        else if (event.source === "touch") {
            const count = event.pointerCount;

            if (count === 1) {
                return EManipMode.Orbit;
            }

            if (count === 2) {
                return EManipMode.PanDolly;
            }

            return EManipMode.Pan;
        }
    }
}