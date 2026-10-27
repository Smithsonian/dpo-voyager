"use strict";

const path = require("path");

// tsx reads path aliases (client/*, @ff/*) and compiler options from this file
process.env.TSX_TSCONFIG_PATH = path.resolve(__dirname, "source/test/tsconfig.json");

module.exports = {
    "node-option": ["import=tsx"],
    // "bdd" (describe/it) for new tests, "tdd" (suite/test) for the legacy libs/* test suites
    ui: path.resolve(__dirname, "source/test/setup/ui.cjs"),
    require: [
        "source/test/setup/globals.ts",
        "source/test/setup/client.ts",
    ],
};
