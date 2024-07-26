/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import math from "@ff/core/math";
import Vector3 from "@ff/core/Vector3";

const eps = 1e-6;

////////////////////////////////////////////////////////////////////////////////
// TEST SUITE - CLASS Vector2

const assertEqual = (vector: Vector3, x: number, y: number, z: number, message: string) => {
    assert.equal(vector.x, x, `${message} (x)`);
    assert.equal(vector.y, y, `${message} (y)`);
    assert.equal(vector.z, z, `${message} (z)`);
}

const assertApproxEqual = (vector: Vector3, x: number, y: number, z: number, message: string) => {
    assert.approximately(vector.x, x, eps, `${message} (x)`);
    assert.approximately(vector.y, y, eps, `${message} (y)`);
    assert.approximately(vector.z, z, eps, `${message} (z)`);
};

export default () => {
    suite("Vector3", () => {
        test("constructors", () => {
            assertEqual(new Vector3(), 0, 0, 0, "without values");
            assertEqual(new Vector3(NaN, NaN, NaN), 0, 0, 0, "with NaN");
            assertEqual(new Vector3(1, 2, 3), 1, 2, 3, "with values");
            assertEqual(Vector3.makeCopy(new Vector3(7, 8, 9)), 7, 8, 9, "makeCopy");
            assertEqual(Vector3.makeFromArray([3, 4, 5]), 3, 4, 5, "makeFromArray");
            assertEqual(Vector3.makeFromScalar(5), 5, 5, 5, "makeFromScalar");
            assertEqual(Vector3.makeOnes(), 1, 1, 1, "makeOnes");
            assertEqual(Vector3.makeZeros(), 0, 0, 0, "makeZeros");
            assertEqual(Vector3.makeUnitX(), 1, 0, 0, "makeUnitX");
            assertEqual(Vector3.makeUnitY(), 0, 1, 0, "makeUnitY");
            assertEqual(Vector3.makeUnitZ(), 0, 0, 1, "makeUnitZ");
        });
        test("set/copy/clone", () => {
            assertEqual(new Vector3().set(11, 12, 13), 11, 12, 13, "set");
            assertEqual(new Vector3().setFromScalar(3.21), 3.21, 3.21, 3.21, "setFromScalar");
            assertEqual(new Vector3().setFromArray([6, 9, 11]), 6, 9, 11, "setFromArray");
            assertEqual(new Vector3(1, 2).setZeros(), 0, 0, 0, "setZeros");
            assertEqual(new Vector3(3, 4).setOnes(), 1, 1, 1, "setOnes");
            assertEqual(new Vector3(3, 4).setUnitX(), 1, 0, 0, "setUnitX");
            assertEqual(new Vector3(3, 4).setUnitY(), 0, 1, 0, "setUnitY");
            assertEqual(new Vector3(3, 4).setUnitZ(), 0, 0, 1, "setUnitZ");
            assertEqual(new Vector3().copy(new Vector3(3, 2, 1)), 3, 2, 1, "copy");
            assertEqual(new Vector3(5, 4, 3).clone(), 5, 4, 3, "clone");
            const arr = new Vector3(-3, 2, -1).toArray();
            assert.deepEqual(arr, [-3, 2, -1], "toArray");
            new Vector3(5, 8, -2).toArray(arr);
            assert.deepEqual(arr, [5, 8, -2], "toArray - array supplied");
        });
        test("add/sub/mul/div", () => {
            assertApproxEqual(new Vector3(0.5, 1.5, 2.5).add(new Vector3(1, 2, 3)), 1.5, 3.5, 5.5, "add");
            assertApproxEqual(new Vector3(1.1, 2.2, 3.3).addScalar(3.3), 4.4, 5.5, 6.6, "addScalar");
            assertApproxEqual(new Vector3(5, 7, 9).sub(new Vector3(1.1, 2.2, 3.3)), 3.9, 4.8, 5.7, "sub");
            assertApproxEqual(new Vector3(3.3, 4.4, 5.5).subScalar(1.1), 2.2, 3.3, 4.4, "subScalar");
            assertApproxEqual(new Vector3(4, 8, 12).mul(new Vector3(0.5, 2, 0.25)), 2, 16, 3, "mul");
            assertApproxEqual(new Vector3(3.5, 5.5, 2).mulScalar(2), 7, 11, 4, "mulScalar");
            assertApproxEqual(new Vector3(5, 7, 9).div(new Vector3(2, 10, 3)), 2.5, 0.7, 3, "div");
            assertApproxEqual(new Vector3(6, 9, 12).divScalar(20), 0.3, 0.45, 0.6, "divScalar");
        });
        test("translate/rotate/scale", () => {
            assertApproxEqual(new Vector3(4, 6, -3).translate(0.5, -0.5, 3), 4.5, 5.5, 0, "translate");
            assertApproxEqual(new Vector3(1, 0, 0).rotateZ(90 * math.DEG2RAD), 0, 1, 0, "rotate");
            assertApproxEqual(new Vector3(0, 3, 4).rotateX(270 * math.DEG2RAD), 0, 4, -3, "rotate");
            assertApproxEqual(new Vector3(8, 12, -3).scale(0.5, 3, 2), 4, 36, -6, "scale");
        });
        test("invert/negate", () => {
            assertApproxEqual(new Vector3(2, 4, 8).invert(), 0.5, 0.25, 0.125, "invert");
            assertApproxEqual(new Vector3(-5, 3, 1).negate(), 5, -3, -1, "negate");
        });
        test("normalize/homogenize/dot/length", () => {
            const length = new Vector3(3, 5, 7).length();
            assertApproxEqual(new Vector3(3, 5, 7).normalize(), 3 / length, 5 / length, 7 / length, "normalize");
            assertApproxEqual(new Vector3(4, 5, 2).homogenize(), 2, 2.5, 1, "homogenize");
            assert.equal(new Vector3(2, 7, 3).dot(new Vector3(-3, 5, 2)), 35, "dot");
            assert.approximately(new Vector3(-3, 3.4, 4).length(), Math.sqrt(9 + 3.4 * 3.4 + 16), eps, "length");
            assert.equal(new Vector3(2, 7, 3).lengthSquared(), 62, "lengthSquared");
        });
        test("distance/cross", () => {
            assert.equal(new Vector3(5, 8, 2).distanceTo(new Vector3(-3, 3, 1)), Math.sqrt(8*8 + 5*5 + 1), "distanceTo");
        });
        test("min/max/zero", () => {
            assert.equal(new Vector3(-4, 7, -6).min(), -6, "min #1");
            assert.equal(new Vector3(3, 1, 7).min(), 1, "min #2");
            assert.equal(new Vector3(2, 3, 4).min(), 2, "min #3");
            assert.equal(new Vector3(8, 1, -6).max(), 8, "max #1");
            assert.equal(new Vector3(3, 1, 7).max(), 7, "max #2");
            assert.equal(new Vector3(-4, 3, 1).max(), 3, "max #3");
            assert.isTrue(new Vector3().isZero(), "isZero #1");
            assert.isNotTrue(new Vector3(1, 0, 0).isZero(), "isZero #2");
            assert.isNotTrue(new Vector3(0, 1, 0).isZero(), "isZero #3");
            assert.isNotTrue(new Vector3(0, 0, 1).isZero(), "isZero #4");
        });
    });
}