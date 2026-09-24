"use strict";

const Mocha = require("mocha");

/**
 * Exposes both BDD (describe, it, before...) and TDD (suite, test, suiteSetup...) globals.
 */
module.exports = function(suite) {
    Mocha.interfaces.bdd(suite);
    Mocha.interfaces.tdd(suite);
};
