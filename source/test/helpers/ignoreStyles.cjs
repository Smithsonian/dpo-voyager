"use strict";

// UI modules import their stylesheets, which webpack bundles. Node can't parse them and tests don't need them.
require.extensions[".scss"] = require.extensions[".css"] = () => {};
