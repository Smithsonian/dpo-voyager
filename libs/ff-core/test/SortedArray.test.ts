/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import SortedArray from "@ff/core/SortedArray";

////////////////////////////////////////////////////////////////////////////////
// SORTED ARRAY CLASS - TEST SUITE

export default function() {
    suite("SortedArray", function() {
        test("insert", function() {
            const items = [
                { key: 1, value: 0 },
                { key: 1, value: 1 },
                { key: 2, value: 2 },
                { key: 5, value: 3 },
                { key: 5, value: 4 },
                { key: 9, value: 5 },
                { key: 13, value: 6 }
            ];
            const sortedArray = new SortedArray();
            sortedArray.insertAt(5, 3);  // 5 at 0
            sortedArray.insertAt(9, 5);  // 9 at 1
            sortedArray.insertAt(2, 2);  // 2 at 0
            sortedArray.insertAt(1, 0);  // 1 at 0
            sortedArray.insertAt(13, 6); // 13 at 4
            sortedArray.insertAt(5, 4);  // 5 at 3
            sortedArray.insertAt(1, 1);  // 1 at 1

            assert.deepEqual(sortedArray.items, items);
        });

        test("remove", function() {
            const sortedArray = new SortedArray();
            sortedArray.insertAt(5, 2);
            sortedArray.insertAt(2, 0);
            sortedArray.insertAt(8, 3);
            sortedArray.insertAt(3, 1);

            assert.equal(sortedArray.removeAt(3), true);
            assert.equal(sortedArray.removeAt(4), false);
            assert.equal(sortedArray.removeAt(8), true);

            assert.deepEqual(sortedArray.items, [
                { key: 2, value: 0 },
                { key: 5, value: 2 }
            ]);
        });

        test("find", function() {
            const sortedArray = new SortedArray();
            sortedArray.insertAt(5, 2);
            sortedArray.insertAt(2, 0);
            sortedArray.insertAt(8, 3);
            sortedArray.insertAt(3, 1);

            assert.deepEqual(sortedArray.findAt(5), { key: 5, value: 2 });
            assert.deepEqual(sortedArray.findAt(3), { key: 3, value: 1 });
            assert.deepEqual(sortedArray.findAt(1), null);
        });

        test("indexAtBefore", function() {
            const sortedArray = new SortedArray();
            sortedArray.insertAt(5, 2);
            sortedArray.insertAt(2, 0);
            sortedArray.insertAt(8, 3);
            sortedArray.insertAt(3, 1);

            assert.deepEqual(sortedArray.indexAtBefore(1), -1);
            assert.deepEqual(sortedArray.indexAtBefore(2), 0);
            assert.deepEqual(sortedArray.indexAtBefore(3), 1);
            assert.deepEqual(sortedArray.indexAtBefore(4), 1);
            assert.deepEqual(sortedArray.indexAtBefore(5), 2);
            assert.deepEqual(sortedArray.indexAtBefore(6), 2);
            assert.deepEqual(sortedArray.indexAtBefore(8), 3);
            assert.deepEqual(sortedArray.indexAtBefore(9), 3);
        });

        test("removeBetween", function() {
            const sortedArray = new SortedArray();
            sortedArray.insertAt(5, 3);
            sortedArray.insertAt(9, 5);
            sortedArray.insertAt(3, 1);
            sortedArray.insertAt(7, 4);
            sortedArray.insertAt(2, 0);
            sortedArray.insertAt(4, 2);

            let removed = sortedArray.removeBetween(0, 2);
            assert.equal(removed.length, 0);
            assert.equal(sortedArray.length, 6);
            assert.deepEqual(sortedArray.findAt(2), { key: 2, value: 0 });

            removed = sortedArray.removeBetween(2, 4);
            assert.equal(removed.length, 2);
            assert.equal(sortedArray.length, 4);
            assert.isNull(sortedArray.findAt(2));
            assert.isNull(sortedArray.findAt(3));
            assert.deepEqual(sortedArray.findAt(4), { key: 4, value: 2 });

            removed = sortedArray.removeBetween(7, 10);
            assert.equal(removed.length, 2);
            assert.deepEqual(removed[0], { key: 7, value: 4 });
            assert.equal(sortedArray.length, 2);
            assert.isNull(sortedArray.findAt(7));
            assert.deepEqual(sortedArray.findAt(5), { key: 5, value: 3 });
        });
    });
}
