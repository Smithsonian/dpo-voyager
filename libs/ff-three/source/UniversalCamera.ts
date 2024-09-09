/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Camera,
    PerspectiveCamera,
    OrthographicCamera,
    Vector3,
    Box3,
    Matrix4,
    MathUtils,
} from "three";

import math from "@ff/core/math";

////////////////////////////////////////////////////////////////////////////////

const _halfPi = Math.PI * 0.5;
const _box = new Box3();
const _size = new Vector3();
const _center = new Vector3();
const _translation = new Vector3();
const _mat4a = new Matrix4();
const _mat4b = new Matrix4();

const _cameraOrientation = [
    new Vector3(0, -_halfPi, 0), // left
    new Vector3(0, _halfPi, 0),  // right
    new Vector3(-_halfPi, 0, 0),  // top
    new Vector3(_halfPi, 0, 0), // bottom
    new Vector3(0, 0, 0),        // front
    new Vector3(0, Math.PI, 0),  // back
];

export enum EProjection { Perspective, Orthographic }
export enum EViewPreset { None = -1, Left = 0, Right, Top, Bottom, Front, Back }

export default class UniversalCamera extends Camera
{
    type: string;
    isPerspectiveCamera: boolean;
    isOrthographicCamera: boolean;
    isUniversalCamera = true;

    fov = 50;
    size = 20;
    aspect = 1;
    distance = 20;
    zoom = 1;
    near = 0.1;
    far = 2000;

    // additional perspective parameters
    focus = 10;
    filmGauge = 35;
    filmOffset = 0;

    // view offset
    view = null;

    constructor(projection?: EProjection)
    {
        super();
        this.setProjection(projection);
    }

    setProjection(type: EProjection)
    {
        if (type === EProjection.Orthographic) {
            this.type = "OrthographicCamera";
            this.isPerspectiveCamera = false;
            this.isOrthographicCamera = true;
        }
        else {
            this.type = "PerspectiveCamera";
            this.isPerspectiveCamera = true;
            this.isOrthographicCamera = false;
        }

        this.updateProjectionMatrix();
    }

    getProjection(): EProjection
    {
        return this.isOrthographicCamera ? EProjection.Orthographic : EProjection.Perspective;
    }

    setPreset(preset: EViewPreset)
    {
        if (preset !== EViewPreset.None) {
            this.rotation.setFromVector3(_cameraOrientation[preset], "XYZ");
            this.position.set(0, 0, this.distance).applyQuaternion(this.quaternion);
        }
        else {
            this.rotation.set(0, 0, 0);
            this.position.set(0, 0, 0);
        }

        this.updateMatrix();
    }

    setFocalLength(focalLength: number)
    {
        const vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;
        this.fov = MathUtils.RAD2DEG * 2 * Math.atan(vExtentSlope);
        this.updateProjectionMatrix();
    }

    getFocalLength()
    {
        const vExtentSlope = Math.tan(MathUtils.DEG2RAD * 0.5 * this.fov);
        return 0.5 * this.getFilmHeight() / vExtentSlope;
    }

    getEffectiveFOV()
    {
        return MathUtils.RAD2DEG * 2 * Math.atan(
            Math.tan(MathUtils.DEG2RAD * 0.5 * this.fov) / this.zoom);
    }

    getFilmWidth()
    {
        return this.filmGauge * Math.min(this.aspect, 1);
    }

    getFilmHeight()
    {
        return this.filmGauge / Math.max(this.aspect, 1);
    }

    setViewOffset(viewportWidth: number, viewportHeight: number,
                  windowX: number, windowY: number, windowWidth: number, windowHeight: number)
    {
        if (this.isPerspectiveCamera) {
            PerspectiveCamera.prototype.setViewOffset.call(
                this, viewportWidth, viewportHeight, windowX, windowY, windowWidth, windowHeight);
        }
        else {
            OrthographicCamera.prototype.setViewOffset.call(
                this, viewportWidth, viewportHeight, windowX, windowY, windowWidth, windowHeight);
        }
    }

    clearViewOffset()
    {
        if (this.view !== null) {
            this.view.enabled = false;
        }

        this.updateProjectionMatrix();
    }

    zoomToView()
    {
        // TODO: Implement
    }

    moveToView(boundingBox: Box3)
    {
        this.updateMatrixWorld(false);
        _box.copy(boundingBox);
        _mat4a.extractRotation(this.matrixWorldInverse);
        _box.applyMatrix4(_mat4a);
        _box.getSize(_size);
        _box.getCenter(_center);

        const objectSize = Math.max(_size.x / this.aspect, _size.y);
        _translation.set(-_center.x, -_center.y, 0);

        if (this.isPerspectiveCamera) {
            _translation.z = _size.z / (2 * Math.tan(this.fov * math.DEG2RAD * 0.5));
        }
        else {
            this.size = objectSize * 0.5;
            _translation.z = _size.z * 2;
            this.far = Math.max(this.far, _translation.z * 2);
        }

        _mat4a.extractRotation(this.matrixWorld);
        _translation.applyMatrix4(_mat4a);

        this.matrix.decompose(this.position, this.quaternion, this.scale);
        this.position.copy(_translation);
        this.updateMatrix();
    }

    updateProjectionMatrix()
    {
        const near = this.near;
        const far = this.far;
        const aspect = this.aspect;
        const zoom = this.zoom;
        const view = this.view;

        if (this.isOrthographicCamera) {
            const size = this.size;

            const dy = size / (2 * zoom);
            const dx = dy * aspect;

            let left = -dx;
            let right = dx;
            let top = dy;
            let bottom = -dy;

            if (view && view.enabled) {
                const zoomW = zoom / (view.width / view.fullWidth);
                const zoomH = zoom / (view.height / view.fullHeight);
                const scaleW = size * aspect / view.width;
                const scaleH = size / view.height;

                left += scaleW * (view.offsetX / zoomW);
                right = left + scaleW * (view.width / zoomW);
                top -= scaleH * (view.offsetY / zoomH);
                bottom = top - scaleH * (view.height / zoomH);

            }

            this.projectionMatrix.makeOrthographic(left, right, top, bottom, near, far);
        }
        else {
            let top = near * Math.tan(MathUtils.DEG2RAD * 0.5 * this.fov) / zoom;
            let height = 2 * top;
            let width = aspect * height;
            let left = -0.5 * width;

            if (view && view.enabled) {
                left += view.offsetX * width / view.fullWidth;
                top -= view.offsetY * height / view.fullHeight;
                width *= view.width / view.fullWidth;
                height *= view.height / view.fullHeight;
            }

            var skew = this.filmOffset;
            if (skew !== 0) {
                left += near * skew / this.getFilmWidth();
            }

            this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, far);
        }

        (this as any).projectionMatrixInverse.copy(this.projectionMatrix).invert();
    }

    copy(source: this, recursive: boolean)
    {
        super.copy(source, recursive);

        this.type = source.type;
        this.isOrthographicCamera = source.isOrthographicCamera;
        this.isPerspectiveCamera = source.isPerspectiveCamera;

        this.fov = source.fov;
        this.size = source.size;
        this.aspect = source.aspect;
        this.zoom = source.zoom;
        this.near = source.near;
        this.far = source.far;

        this.focus = source.focus;
        this.filmGauge = source.filmGauge;
        this.filmOffset = source.filmOffset;

        this.view = source.view ? Object.assign({}, source.view) : null;

        return this;
    }

    clone(): this
    {
        return new (this.constructor as any)().copy(this);
    }

    toJSON(meta)
    {
        const data = super.toJSON(meta);
        Object.assign(data.object, {
            fov: this.fov,
            size: this.size,
            aspect: this.aspect,
            zoom: this.zoom,
            near: this.near,
            far: this.far,
            focus: this.focus,
            filmGauge: this.filmGauge,
            filmOffset: this.filmOffset,
        });

        if (this.view !== null) {
            (data.object as any).view = Object.assign({}, this.view);
        }

        return data;
    }
}