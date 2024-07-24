/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

const math = {

    PI: 3.1415926535897932384626433832795,
    DOUBLE_PI: 6.283185307179586476925286766559,
    HALF_PI: 1.5707963267948966192313216916398,
    QUARTER_PI: 0.78539816339744830961566084581988,
    DEG2RAD: 0.01745329251994329576923690768489,
    RAD2DEG: 57.295779513082320876798154814105,

    limit: (v, min, max) => v < min ? min : (v > max ? max : v),

    limitInt: function(v, min, max) {
        v = Math.trunc(v);
        return v < min ? min : (v > max ? max : v);
    },

    normalize: (v, min, max) => (v - min) / (max - min),

    normalizeLimit: (v, min, max) => {
        v = (v - min) / (max - min);
        return v < 0.0 ? 0.0 : (v > 1.0 ? 1.0 : v);
    },

    denormalize: (t, min, max) => (min + t) * (max - min),

    scale: (v, minIn, maxIn, minOut, maxOut) =>
        minOut + (v - minIn) / (maxIn - minIn) * (maxOut - minOut),

    scaleLimit: (v, minIn, maxIn, minOut, maxOut) => {
        v = v < minIn ? minIn : (v > maxIn ? maxIn : v);
        return minOut + (v - minIn) / (maxIn - minIn) * (maxOut - minOut);
    },

    deg2rad: function(degrees) {
        return degrees * 0.01745329251994329576923690768489;
    },

    rad2deg: function(radians) {
        return radians * 57.295779513082320876798154814105;
    },

    deltaRadians: function(radA, radB) {
        radA %= math.DOUBLE_PI;
        radA = radA < 0 ? radA + math.DOUBLE_PI : radA;
        radB %= math.DOUBLE_PI;
        radB = radB < 0 ? radB + math.DOUBLE_PI : radB;

        if (radB - radA > math.PI) {
            radA += math.DOUBLE_PI;
        }

        return radB - radA;
    },

    deltaDegrees: function(degA, degB) {
        degA %= math.DOUBLE_PI;
        degA = degA < 0 ? degA + math.DOUBLE_PI : degA;
        degB %= math.DOUBLE_PI;
        degB = degB < 0 ? degB + math.DOUBLE_PI : degB;

        if (degB - degA > math.PI) {
            degA += math.DOUBLE_PI;
        }

        return degB - degA;
    },

    curves: {
        linear: t => t,

        easeIn: t => Math.sin(t * math.HALF_PI),
        easeOut: t => Math.cos(t * math.HALF_PI - math.PI) + 1.0,
        ease: t => Math.cos(t * math.PI - math.PI) * 0.5 + 0.5,

        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    }
};

export default math;