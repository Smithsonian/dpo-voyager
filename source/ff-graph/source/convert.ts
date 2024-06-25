/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export type ValueType = "number" | "boolean" | "string" | "object";

const _identity = [
    function(srcVal) {
        return srcVal;
    },
    function(srcVal, dstVal) {
        for (let i = 0, n = dstVal.length; i < n; ++i) {
            dstVal[i] = srcVal[i];
        }
        return dstVal;
    }
];

const _toBoolean = [
    function(srcVal) {
        return !!srcVal;
    },
    function(srcVal, dstVal) {
        for (let i = 0, n = dstVal.length; i < n; ++i) {
            dstVal[i] = !!srcVal[i];
        }
        return dstVal;
    }
];

const _toString = [
    function(srcVal) {
        return String(srcVal);
    },
    function(srcVal, dstVal) {
        for (let i = 0, n = dstVal.length; i < n; ++i) {
            dstVal[i] = String(srcVal[i]);
        }
        return dstVal;
    }
];

const _parseFloat = [
    function(srcVal) {
        return parseFloat(srcVal) || 0;
    },
    function(srcVal, dstVal) {
        for (let i = 0, n = dstVal.length; i < n; ++i) {
            dstVal[i] = parseFloat(srcVal[i]) || 0;
        }
        return dstVal;
    }
];

const _booleanToNumber = [
    function(srcVal) {
        return srcVal ? 1 : 0;
    },
    function(srcVal, dstVal) {
        for (let i = 0, n = dstVal.length; i < n; ++i) {
            dstVal[i] = srcVal[i] ? 1 : 0;
        }
        return dstVal;
    }
];

const _illegalThrow = [
    function(srcVal, dstVal) {
        throw new Error(`illegal value conversion from ${typeof srcVal} to ${typeof dstVal}`);
    },
    function(srcVal, dstVal, elements) {
        throw new Error(`illegal array conversion from ${typeof srcVal[0]} to ${typeof dstVal[0]}`);
    }
];

const _conversionFunctions = {
    "number": {
        "number": _identity,
        "boolean": _toBoolean,
        "string": _toString,
        "object": _illegalThrow
    },
    "boolean": {
        "number": _booleanToNumber,
        "boolean": _identity,
        "string": _toString,
        "object": _illegalThrow
    },
    "string": {
        "number": _parseFloat,
        "boolean": _toBoolean,
        "string": _identity,
        "object": _illegalThrow
    },
    "object": {
        "number": _illegalThrow,
        "boolean": _toBoolean,
        "string": _toString,
        "object": _identity
    }
};

const _conversionTable = {
    "number": {
        "number": true,
        "boolean": true,
        "string": true,
        "object": false
    },
    "boolean": {
        "number": true,
        "boolean": true,
        "string": true,
        "object": false
    },
    "string": {
        "number": true,
        "boolean": true,
        "string": true,
        "object": false
    },
    "object": {
        "number": false,
        "boolean": true,
        "string": true,
        "object": true
    }
};

const _copyFunctions = [
    [
        function(srcVal, dstVal, fnConvert) {
            return fnConvert(srcVal, dstVal); // value > value
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[0] = fnConvert(srcVal); // value > [0]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[1] = fnConvert(srcVal); // value > [1]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[2] = fnConvert(srcVal); // value > [2]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[3] = fnConvert(srcVal); // value > [3]
            return dstVal;
        }
    ],
    [
        function(srcVal, dstVal, fnConvert) {
            return fnConvert(srcVal[0]); // [0] > value
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[0] = fnConvert(srcVal[0]); // [0] > [0]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[1] = fnConvert(srcVal[0]); // [0] > [1]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[2] = fnConvert(srcVal[0]); // [0] > [2]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[3] = fnConvert(srcVal[0]); // [0] > [3]
            return dstVal;
        }
    ],
    [
        function(srcVal, dstVal, fnConvert) {
            return fnConvert(srcVal[1]); // [1] > value
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[0] = fnConvert(srcVal[1]); // [1] > [0]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[1] = fnConvert(srcVal[1]); // [1] > [1]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[2] = fnConvert(srcVal[1]); // [1] > [2]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[3] = fnConvert(srcVal[1]); // [1] > [3]
            return dstVal;
        }
    ],
    [
        function(srcVal, dstVal, fnConvert) {
            return fnConvert(srcVal[2]); // [2] > value
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[0] = fnConvert(srcVal[2]); // [2] > [0]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[1] = fnConvert(srcVal[2]); // [2] > [1]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[2] = fnConvert(srcVal[2]); // [2] > [2]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[3] = fnConvert(srcVal[2]); // [2] > [3]
            return dstVal;
        }
    ],
    [
        function(srcVal, dstVal, fnConvert) {
            return fnConvert(srcVal[3]); // [3] > value
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[0] = fnConvert(srcVal[3]); // [3] > [0]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[1] = fnConvert(srcVal[3]); // [3] > [1]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[2] = fnConvert(srcVal[3]); // [3] > [2]
            return dstVal;
        },
        function(srcVal, dstVal, fnConvert) {
            dstVal[3] = fnConvert(srcVal[3]); // [3] > [3]
            return dstVal;
        }
    ]
];

function getConversionFunction(sourceType: ValueType, destinationType: ValueType, isArray: boolean)
{
    const index = isArray ? 1 : 0;
    return _conversionFunctions[sourceType][destinationType][index] as (inVal: any, outVal: any) => any;
}

function canConvert(sourceType, destinationType)
{
    return _conversionTable[sourceType][destinationType];
}

function getElementCopyFunction(sourceIndex: number, destinationIndex: number, fnConvert)
{
    if (sourceIndex === -1 && destinationIndex === -1) {
        return fnConvert;
    }
    if (sourceIndex <= 3 && destinationIndex <= 3) {
        return _copyFunctions[sourceIndex + 1][destinationIndex + 1];
    }

    return function(srcVal, dstVal, fnConvert) {
        dstVal[destinationIndex] = fnConvert(srcVal[sourceIndex]);
        return dstVal;
    }
}

function getMultiCopyFunction(sourceIsMulti: boolean, destinationIsMulti: boolean, fnCopy)
{
    if (sourceIsMulti === false) {
        if (destinationIsMulti === false) {
            // single > single
            return fnCopy;
        }
        else {
            // single > multi
            return function(srcVal, dstVal, fnConvert) {
                for (let i = 0, n = dstVal.length; i < n; ++i) {
                    dstVal[i] = fnCopy(srcVal, dstVal[i]);
                }
                return dstVal;
            }
        }
    }
    else {
        if (destinationIsMulti === false) {
            // multi > single
            return function(srcVal, dstVal, fnConvert) {
                if (srcVal.length > 0) {
                    dstVal = fnCopy(srcVal[0], dstVal);
                }
                return dstVal;
            }
        }
        else {
            // multi > multi
            return function(srcVal, dstVal, fnConvert) {
                for (let i = 0, m = srcVal.length, n = dstVal.length; i < n; ++i) {
                    dstVal[i] = fnCopy(srcVal[i % m], dstVal[i]);
                }
                return dstVal;
            }
        }
    }
}

export {
    getConversionFunction,
    canConvert,
    getElementCopyFunction,
    getMultiCopyFunction
};