/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector2_test from "./Vector2.test";
import Vector3_test from "./Vector3.test";
import Color_test from "./Color.test";

////////////////////////////////////////////////////////////////////////////////

suite("FF Core", function() {
    Vector2_test();
    Vector3_test();
    Color_test();
});
