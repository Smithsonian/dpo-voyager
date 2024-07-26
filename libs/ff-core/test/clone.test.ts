/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import clone from "@ff/core/clone";

////////////////////////////////////////////////////////////////////////////////
// CLONE FUNCTION - TEST SUITE

class _CustomType {
    a: number = 12;
    b: string = "Hello";
}

export default function() {
    suite("clone", function() {
        test("clone primitive types", function() {
            const a = 4.51;
            assert.strictEqual(clone(a), a, "number");

            const b = "a string";
            assert.strictEqual(clone(b), b, "string");

            const c = false;
            assert.strictEqual(clone(c), c, "boolean");
        });

        test('clone undefined, null, 0, ""', function() {
            const a = undefined;
            assert.strictEqual(clone(a), a, "undefined");

            const b = null;
            assert.strictEqual(clone(b), b, "null");

            const c = "";
            assert.strictEqual(clone(c), c, "empty string");

            const d = 0;
            assert.strictEqual(clone(d), d, "0");
        });

        test("clone date", function() {
            const a = new Date(2012, 3, 25, 17, 48, 13, 851);
            assert.strictEqual(clone(a).valueOf(), a.valueOf());
        });

        test("clone array", function() {
            const a = [ 1.3, 0, false, true, undefined, "", null, "string", { a: "1" }, [ 2, 3 ] ];
            assert.deepEqual(clone(a), a);
        });

        test("clone typed array", function() {
            const a = new Float64Array([ 1.1, 2.2, 3.3, 4.4 ]);
            assert.deepEqual(clone(a), a, "Float64Array");

            const b = new Int8Array([ 2, 4, 6, 8, 10 ]);
            const bClone = clone(b);
            assert.equal(bClone.constructor, b.constructor, "Typed Array, equal constructors");
            assert.deepEqual(bClone, b, "Int8Array");
        });

        test("clone deep nested object", function() {
            const a = {
                one: [1.3, 0, false, true, undefined, "", null, "string", { a: "1" }, [2, 3]],
                two: { a: new Date(2012, 3, 25, 17, 48, 13, 851), b: undefined, c: false },
                func: function(a) { return a; },
                arrowFunc: (a) => a
            };
            assert.deepEqual(clone(a), a);
        });

        test("custom objects are copied by reference", function() {
            const a = {
                cantCopy: new Error("an error"),
                noWay: new _CustomType()
            };
            const aClone = clone(a);
            assert.equal(a.cantCopy, aClone.cantCopy);
            assert.equal(a.noWay, aClone.noWay);
            assert.notEqual(a, aClone);
            assert.deepEqual(a, aClone);
        });
    });
};
