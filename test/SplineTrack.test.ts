/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import SplineTrack, { InterpolationType } from "@ff/core/SplineTrack";

////////////////////////////////////////////////////////////////////////////////
// SPLINE TRACK CLASS - TEST SUITE

export default function() {
    suite("SplineTrack", function() {
        test("insert", function() {
            const track = new SplineTrack();
            assert.isTrue(track.empty());
            assert.lengthOf(track, 0);

            track.insert(5, 3);
            track.insert(3, 2);
            track.insert(4, 5);

            assert.isFalse(track.empty());
            assert.lengthOf(track, 3);
            assert.deepEqual(track.keys.items[0], { key: 3, value: { time: 3, value: 2, type: InterpolationType.Ease }});
            assert.deepEqual(track.keys.items[2], { key: 5, value: { time: 5, value: 3, type: InterpolationType.Ease }});

            assert.equal(track.valueAt(3), 2);
            assert.equal(track.valueAt(1), 2);
            assert.equal(track.valueAt(7), 3);
            assert.equal(track.valueAt(3.5), 3.5);
            assert.equal(track.valueAt(4.5), 4);
            assert.equal(track.valueAt(5), 3);
        });

        test("linear", function() {
            const track = new SplineTrack();
            track.insert(5, 3, InterpolationType.Linear);
            track.insert(4, 5, InterpolationType.Linear);
            track.insert(3, 2, InterpolationType.Linear);

            assert.equal(track.valueAt(1), 2);
            assert.equal(track.valueAt(3), 2);
            assert.equal(track.valueAt(3.5), 3.5);
            assert.equal(track.valueAt(4.5), 4);
            assert.equal(track.valueAt(6), 3);
        });

        test("spline", function() {
            const track = new SplineTrack();
            track.insertKey({
                time: 2, value: 20,
                leftValue: 0, rightValue: 0,
                leftTime: -0.5, rightTime: 0.5,
                type: InterpolationType.Spline
            });
            track.insertKey({
                time: 3, value: 30,
                leftValue: 0, rightValue: 0,
                leftTime: -0.5, rightTime: 0.5,
                type: InterpolationType.Spline
            });
            track.insertKey({
                time: 4, value: 40,
                leftValue: 0, rightValue: 0,
                leftTime: -0.5, rightTime: 0.5,
                type: InterpolationType.Spline
            });

            assert.equal(track.valueAt(2), 20);
            assert.equal(track.valueAt(2.5), 25);
            assert.equal(track.valueAt(3), 30);
            assert.equal(track.valueAt(3.5), 35);
            assert.equal(track.valueAt(4), 40);
        });
    })
}
