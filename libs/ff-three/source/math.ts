/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Vector3,
    Vector4,
    Matrix4,
    Euler,
    Quaternion,
} from "three";

import baseMath from "@ff/core/math";

////////////////////////////////////////////////////////////////////////////////

const _vec4a = new Vector4();
const _vec4b = new Vector4();
const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _mat4 = new Matrix4();
const _euler = new Euler();
const _quat = new Quaternion();

////////////////////////////////////////////////////////////////////////////////

//export type Matrix4 = Float32Array | number[];

const math = {
    PI: 3.1415926535897932384626433832795,
    DOUBLE_PI: 6.283185307179586476925286766559,
    HALF_PI: 1.5707963267948966192313216916398,
    QUARTER_PI: 0.78539816339744830961566084581988,
    DEG2RAD: 0.01745329251994329576923690768489,
    RAD2DEG: 57.295779513082320876798154814105,

    composeOrbitMatrix: function(orientation: Vector3, offset: Vector3, result?: Matrix4): Matrix4
    {
        const pitch = orientation.x;
        const head = orientation.y;
        const roll = orientation.z;

        const ox = offset.x;
        const oy = offset.y;
        const oz = offset.z;

        const sinX = Math.sin(pitch);
        const cosX = Math.cos(pitch);
        const sinY = Math.sin(head);
        const cosY = Math.cos(head);
        const sinZ = Math.sin(roll);
        const cosZ = Math.cos(roll);

        const m00 = cosY * cosZ;
        const m01 = cosZ * sinY * sinX - sinZ * cosX;
        const m02 = cosZ * sinY * cosX + sinZ * sinX;
        const m10 = cosY * sinZ;
        const m11 = sinX * sinY * sinZ + cosZ * cosX;
        const m12 = sinZ * sinY * cosX - cosZ * sinX;
        const m20 = -sinY;
        const m21 = cosY * sinX;
        const m22 = cosY * cosX;

        result = result || new Matrix4();
        const e = result.elements;

        e[0] = m00;
        e[1] = m10;
        e[2] = m20;
        e[3] = 0;
        e[4] = m01;
        e[5] = m11;
        e[6] = m21;
        e[7] = 0;
        e[8] = m02;
        e[9] = m12;
        e[10] = m22;
        e[11] = 0;

        e[12] = ox * m00 + oy * m01 + oz * m02;
        e[13] = ox * m10 + oy * m11 + oz * m12;
        e[14] = ox * m20 + oy * m21 + oz * m22;
        e[15] = 1;

        return result;
    },

    decomposeOrbitMatrix: function(matrix: Matrix4, orientationOut: Vector3, offsetOut: Vector3)
    {
        _euler.setFromRotationMatrix(matrix, "ZYX");
        orientationOut.setFromEuler(_euler);

        _mat4.copy(matrix).invert();
        _vec4a.set(0, 0, 0, 1);
        _vec4a.applyMatrix4(_mat4);

        offsetOut.x = -_vec4a.x;
        offsetOut.y = -_vec4a.y;
        offsetOut.z = -_vec4a.z;
    },

    isMatrix4Identity: function(matrix: Matrix4)
    {
        const e = matrix.elements;
        return e[0]  === 1 && e[1]  === 0 && e[2]  === 0 && e[3]  === 0
            && e[4]  === 0 && e[5]  === 1 && e[6]  === 0 && e[7]  === 0
            && e[8]  === 0 && e[9]  === 0 && e[10] === 1 && e[11] === 0
            && e[12] === 0 && e[13] === 0 && e[14] === 0 && e[15] === 1;
    },

    decomposeTransformMatrix: function(matrix: number[], posOut: number[], rotOut: number[], scaleOut: number[])
    {
        _mat4.fromArray(matrix);
        _mat4.decompose(_vec3a, _quat, _vec3b);
        _euler.setFromQuaternion(_quat, "XYZ");
        _vec3a.toArray(posOut);
        _vec3b.toArray(scaleOut);
        _vec3a.setFromEuler(_euler);
        _vec4a.multiplyScalar(baseMath.RAD2DEG);
        _vec3a.toArray(rotOut);
    }
};

export default math;
