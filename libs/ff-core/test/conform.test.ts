/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import conform from "@ff/core/conform";

////////////////////////////////////////////////////////////////////////////////
// CONFORM FUNCTION - TEST SUITE

export default function() {
    suite("conform", function() {
        test("basics", function() {
            const source: any = { a: 4.51, b: "abc" };
            assert.deepEqual(source, conform(source, { a: 0, b: "" }, true));
            assert.deepEqual(source, conform(source, { a: 0, b: false }, false));
            assert.deepEqual({ a: 4.51, b: false }, conform(source, { a: 0, b: false }, true));
        });

        test("value types", function() {
            assert.deepEqual(4, conform(4, 0, true));
            assert.deepEqual(true, conform(true, false, true));
            assert.deepEqual("abc", conform("abc", "", true));
            assert.deepEqual(5, conform("abc", 5, true));
            assert.deepEqual(null, conform(null, 6, false));
            assert.deepEqual(6, conform(6, null, false));
            assert.deepEqual(null, conform(null, undefined, false));
            assert.deepEqual(undefined, conform(undefined, null, false));
            assert.deepEqual(undefined, conform(null, undefined, true));
            assert.deepEqual(null, conform(undefined, null, true));
        });

        test("objects", function() {
            const source: any = { a:4, b:"abc", c:{ a:2, b:"xx" }, d: [ "a", 2, "7", { a:1 } ] };
            assert.deepEqual({ a:4, b:"abc", c:{}, d:[ "a", 2, "7", { a:1 } ]} as any, conform(source, { a:0, b:0, c:"", d:"" }, false), "any type");
            assert.deepEqual({ a:4, b:0, c:"", d:"" }, conform(source, { a: 0, b: 0, c: "", d: "" }, true), "match type");
            assert.deepEqual({ b:"abc", c:{ b:"xx" }, d:[ "a", "7" ] }, conform(source, { b:"", c:{ b:"" }, d:[""] }, true), "match type 2");
        });

        test("arrays", function() {
            const source: any = [ 2, true, "x" ];
            assert.deepEqual([ 2 ], conform(source, [ 0 ], true));
            assert.deepEqual(source, conform(source, [], false));
            assert.deepEqual([ "x" ], conform(source, [ "" ], true));
        });
    });
};
