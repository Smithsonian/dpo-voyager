/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import{
    Object3D,
    Camera,
    Vector3,
    Matrix4,
    Box3,
} from "three";

import math from "@ff/core/math";

import threeMath from "./math";

import {
    IManip,
    IPointerEvent,
    ITriggerEvent
} from "@ff/browser/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new Vector3();
const _vec3b = new Vector3();

enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }


export default class OrbitManipulator implements IManip
{
    orbit = new Vector3(0, 0, 0);
    offset = new Vector3(0, 0, 50);
    size = 50;
    zoom = 1;

    minOrbit = new Vector3(-90, -Infinity, -Infinity);
    maxOrbit = new Vector3(90, Infinity, Infinity);
    minOffset = new Vector3(-Infinity, -Infinity, 0.1);
    maxOffset = new Vector3(Infinity, Infinity, 1000);

    orientationEnabled = true;
    offsetEnabled = true;
    cameraMode = true;
    orthographicMode = false;

    protected mode = EManipMode.Off;
    protected phase = EManipPhase.Off;
    protected prevPinchDist = 0;

    protected deltaX = 0;
    protected deltaY = 0;
    protected deltaPinch = 0;
    protected deltaWheel = 0;

    protected viewportWidth = 100;
    protected viewportHeight = 100;

    constructor()
    {
    }

    onPointer(event: IPointerEvent)
    {
        if (event.isPrimary) {
            if (event.type === "pointer-down") {
                this.phase = EManipPhase.Active;
            }
            else if (event.type === "pointer-up") {
                this.phase = EManipPhase.Release;
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

    setViewportSize(width: number, height: number)
    {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    setFromCamera(camera: Camera, adaptLimits: boolean = false)
    {
        const orbit = this.orbit;
        const offset = this.offset;
        threeMath.decomposeOrbitMatrix(camera.matrix, orbit, offset);
        this.orbit.multiplyScalar(threeMath.RAD2DEG);

        const cam = camera as any;

        if ((this.orthographicMode = cam.isOrthographicCamera)) {
            this.size = cam.isUniversalCamera ? cam.size : cam.top - cam.bottom;
        }
        if (adaptLimits) {
            this.minOffset.min(offset);
            this.maxOffset.max(offset);
        }
    }

    setFromObject(object: Object3D)
    {
        threeMath.decomposeOrbitMatrix(object.matrix, this.orbit, this.offset);
        this.orbit.multiplyScalar(threeMath.RAD2DEG);

        this.orthographicMode = false;
    }

    setFromMatrix(matrix: Matrix4, invert: boolean = false)
    {
        threeMath.decomposeOrbitMatrix(matrix, this.orbit, this.offset);
        this.orbit.multiplyScalar(threeMath.RAD2DEG);

        this.orthographicMode = false;
    }

    zoomExtent(box: Box3, fovY: number = 52)
    {
        box.getSize(_vec3a);
        box.getCenter(_vec3b);

        const extent = Math.max(_vec3a.x, _vec3a.y, _vec3a.z);

        if (this.orthographicMode) {
            this.offset.z = extent * 1.5;
            this.maxOffset.z = extent * 2;
        }
        else {
            this.offset.z = 0.75 * extent + 0.75 * extent / (2 * Math.tan(fovY * math.DEG2RAD * 0.5));
            this.maxOffset.z = this.offset.z * 3;
        }

    }

    /**
     * Updates the matrix of the given camera. If the camera's projection is orthographic,
     * updates the camera's size parameter as well.
     * @param camera
     */
    toCamera(camera: Camera)
    {
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.copy(this.offset);

        if (this.orthographicMode) {
            _vec3b.z = this.maxOffset.z;
        }

        threeMath.composeOrbitMatrix(_vec3a, _vec3b, camera.matrix);
        camera.matrixWorldNeedsUpdate = true;

        const cam = camera as any;
        if (cam.isOrthographicCamera) {
            if (cam.isUniversalCamera) {
                cam.size = this.offset.z;
            }
            else {
                const aspect = camera.userData["aspect"] || 1;
                const halfSize = this.offset.z * 0.5;
                cam.left = -halfSize * aspect;
                cam.right = halfSize * aspect;
                cam.bottom = -halfSize;
                cam.top = halfSize;
            }
            cam.updateProjectionMatrix();
        }
    }

    /**
     * Sets the given object's matrix from the manipulator's current orbit and offset.
     * @param object
     */
    toObject(object: Object3D)
    {
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.copy(this.offset);

        if (this.orthographicMode) {
            _vec3b.z = this.maxOffset.z;
        }

        threeMath.composeOrbitMatrix(_vec3a, _vec3b, object.matrix);
        object.matrixWorldNeedsUpdate = true;
    }

    /**
     * Sets the given matrix from the manipulator's current orbit and offset.
     * @param matrix
     */
    toMatrix(matrix: Matrix4)
    {
        _vec3a.copy(this.orbit).multiplyScalar(math.DEG2RAD);
        _vec3b.copy(this.offset);

        if (this.orthographicMode) {
            _vec3b.z = this.maxOffset.z;
        }

        threeMath.composeOrbitMatrix(_vec3a, _vec3b, matrix);
    }

    /**
     * Updates the manipulator.
     * @returns true if the state has changed during the update.
     */
    update(): boolean
    {
        if (this.phase === EManipPhase.Off && this.deltaWheel === 0) {
            return false;
        }

        if (this.deltaWheel !== 0) {
            this.updatePose(0, 0, this.deltaWheel * 0.07 + 1, 0, 0, 0);
            this.deltaWheel = 0;
            return true;
        }

        if (this.phase === EManipPhase.Active) {
            if (this.deltaX === 0 && this.deltaY === 0 && this.deltaPinch === 1) {
                return false;
            }

            this.updateByMode();
            this.deltaX = 0;
            this.deltaY = 0;
            this.deltaPinch = 1;
            return true;
        }
        else if (this.phase === EManipPhase.Release) {
            this.deltaX *= 0.85;
            this.deltaY *= 0.85;
            this.deltaPinch = 1;
            this.updateByMode();

            const delta = Math.abs(this.deltaX) + Math.abs(this.deltaY);
            if (delta < 0.1) {
                this.mode = EManipMode.Off;
                this.phase = EManipPhase.Off;
            }
            return true;
        }

        return false;
    }

    protected updateByMode()
    {
        switch(this.mode) {
            case EManipMode.Orbit:
                this.updatePose(0, 0, 1, this.deltaY, this.deltaX, 0);
                break;

            case EManipMode.Pan:
                this.updatePose(this.deltaX, this.deltaY, 1, 0, 0, 0);
                break;

            case EManipMode.Roll:
                this.updatePose(0, 0, 1, 0, 0, this.deltaX);
                break;

            case EManipMode.Dolly:
                this.updatePose(0, 0, this.deltaY * 0.0075 + 1, 0, 0, 0);
                break;

            case EManipMode.PanDolly:
                const pinchScale = (this.deltaPinch - 1) * 0.5 + 1;
                this.updatePose(this.deltaX, this.deltaY, 1 / pinchScale, 0, 0, 0);
                break;
        }
    }

    protected updatePose(dX, dY, dScale, dPitch, dHead, dRoll)
    {
        const {
            orbit, minOrbit, maxOrbit,
            offset, minOffset, maxOffset
        } = this;

        let inverse = this.cameraMode ? -1 : 1;

        if (this.orientationEnabled) {
            orbit.x += inverse * dPitch * 300 / this.viewportHeight;
            orbit.y += inverse * dHead * 300 / this.viewportHeight;
            orbit.z += inverse * dRoll * 300 / this.viewportHeight;

            // check limits
            orbit.x = math.limit(orbit.x, minOrbit.x, maxOrbit.x);
            orbit.y = math.limit(orbit.y, minOrbit.y, maxOrbit.y);
            orbit.z = math.limit(orbit.z, minOrbit.z, maxOrbit.z);
        }

        if (this.offsetEnabled) {
            const factor = offset.z = dScale * offset.z;

            offset.x += dX * factor * inverse * 2 / this.viewportHeight;
            offset.y -= dY * factor * inverse * 2 / this.viewportHeight;

            // check limits
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