/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import math from "@ff/core/math";
import Vector2 from "@ff/core/Vector2";

const eps = 1e-6;

////////////////////////////////////////////////////////////////////////////////
// TEST SUITE - CLASS Vector2

const assertEqual = (vector: Vector2, x: number, y: number, message: string) => {
    assert.equal(vector.x, x, message);
    assert.equal(vector.y, y, message);
}

const assertApproxEqual = (vector: Vector2, x: number, y: number, message: string) => {
    assert.approximately(vector.x, x, eps, `${message} (x)`);
    assert.approximately(vector.y, y, eps, `${message} (y)`);
};

export default () => {
    suite("Vector2", () => {
        test("constructors", () => {
            assertEqual(new Vector2(), 0, 0, "without values");
            assertEqual(new Vector2(NaN, NaN), 0, 0, "with NaN");
            assertEqual(new Vector2(1, 2), 1, 2, "with values");
            assertEqual(Vector2.makeCopy(new Vector2(7, 8)), 7, 8, "makeCopy");
            assertEqual(Vector2.makeFromArray([3, 4]), 3, 4, "makeFromArray");
            assertEqual(Vector2.makeFromScalar(5), 5, 5, "makeFromScalar");
            assertEqual(Vector2.makeOnes(), 1, 1, "makeOnes");
            assertEqual(Vector2.makeZeros(), 0, 0, "makeZeros");
            assertEqual(Vector2.makeUnitX(), 1, 0, "makeUnitX");
            assertEqual(Vector2.makeUnitY(), 0, 1, "makeUnitY");
        });
        test("set/copy/clone", () => {
            assertEqual(new Vector2().set(11, 12), 11, 12, "set");
            assertEqual(new Vector2().setFromScalar(3.21), 3.21, 3.21, "setFromScalar");
            assertEqual(new Vector2().setFromArray([6, 9]), 6, 9, "setFromArray");
            assertEqual(new Vector2(1, 2).setZeros(), 0, 0, "setZeros");
            assertEqual(new Vector2(3, 4).setOnes(), 1, 1, "setOnes");
            assertEqual(new Vector2(3, 4).setUnitX(), 1, 0, "setUnitX");
            assertEqual(new Vector2(3, 4).setUnitY(), 0, 1, "setUnitY");
            assertEqual(new Vector2().copy(new Vector2(3, 2)), 3, 2, "copy");
            assertEqual(new Vector2(5, 4).clone(), 5, 4, "clone");
            const arr = new Vector2(-3, 2).toArray();
            assert.deepEqual(arr, [-3, 2], "toArray");
            new Vector2(5, 8).toArray(arr);
            assert.deepEqual(arr, [5, 8], "toArray - array supplied");
        });
        test("add/sub/mul/div", () => {
            assertApproxEqual(new Vector2(0.5, 1.5).add(new Vector2(1, 2)), 1.5, 3.5, "add");
            assertApproxEqual(new Vector2(1.1, 2.2).addScalar(3.3), 4.4, 5.5, "addScalar");
            assertApproxEqual(new Vector2(5, 7).sub(new Vector2(1.1, 2.2)), 3.9, 4.8, "sub");
            assertApproxEqual(new Vector2(3.3, 4.4).subScalar(1.1), 2.2, 3.3, "subScalar");
            assertApproxEqual(new Vector2(4, 8).mul(new Vector2(0.5, 2)), 2, 16, "mul");
            assertApproxEqual(new Vector2(3.5, 5.5).mulScalar(2), 7, 11, "mulScalar");
            assertApproxEqual(new Vector2(5, 7).div(new Vector2(2, 10)), 2.5, 0.7, "div");
            assertApproxEqual(new Vector2(6, 9).divScalar(20), 0.3, 0.45, "divScalar");
        });
        test("translate/rotate/scale", () => {
            assertApproxEqual(new Vector2(4, 6).translate(0.5, -0.5), 4.5, 5.5, "translate");
            assertApproxEqual(new Vector2(1, 0).rotate(90 * math.DEG2RAD), 0, 1, "rotate");
            assertApproxEqual(new Vector2(3, 4).rotate(270 * math.DEG2RAD), 4, -3, "rotate");
            assertApproxEqual(new Vector2(8, 12).scale(0.5, 3), 4, 36, "scale");
        });
        test("invert/negate", () => {
            assertApproxEqual(new Vector2(2, 4).invert(), 0.5, 0.25, "invert");
            assertApproxEqual(new Vector2(-5, 3).negate(), 5, -3, "negate");
        });
        test("normalize/dot/length", () => {
            const length = new Vector2(3, 5).length();
            assertApproxEqual(new Vector2(3, 5).normalize(), 3 / length, 5 / length, "normalize");
            assert.equal(new Vector2(2, 7).dot(new Vector2(-3, 5)), 29, "dot");
            assert.approximately(new Vector2(-3, 3.4).length(), Math.sqrt(9 + 3.4 * 3.4), eps, "length");
            assert.equal(new Vector2(2, 7).lengthSquared(), 53, "lengthSquared");
        });
        test("distance/angle", () => {
            assert.equal(new Vector2(5, 8).distanceTo(new Vector2(-3, 3)), Math.sqrt(8*8 + 5*5), "distanceTo");
            assert.approximately(new Vector2(0, 1).angle(), 90 * math.DEG2RAD, eps, "angle");
            assert.approximately(new Vector2(3, 4).angleTo(new Vector2(-4, 3)), 90 * math.DEG2RAD, eps, "angleTo");
        });
        test("min/max/zero", () => {
            assert.equal(new Vector2(-4, 7).min(), -4, "min #1");
            assert.equal(new Vector2(3, 1).min(), 1, "min #2");
            assert.equal(new Vector2(-4, 7).max(), 7, "max #1");
            assert.equal(new Vector2(3, 1).max(), 3, "max #2");
            assert.isTrue(new Vector2().isZero(), "isZero #1");
            assert.isNotTrue(new Vector2(1, 0).isZero(), "isZero #2");
            assert.isNotTrue(new Vector2(0, 1).isZero(), "isZero #3");
        });
    });
}