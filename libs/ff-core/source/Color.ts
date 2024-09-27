/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Vector3, { IVector3 } from "./Vector3";
import Vector4, { IVector4 } from "./Vector4";

////////////////////////////////////////////////////////////////////////////////

export { Vector3, IVector3, Vector4, IVector4 };

/**
 * RGB color with alpha channel. The class is compatible with Vector4,
 * the field names for the colors are x (red), y (green), z (blue), and w (alpha).
 *
 * Source for RGB/HSL/HSV conversions: https://gist.github.com/mjackson/5311256
 */
export default class Color implements IVector4
{
    static fromString(color: string): Color
    {
        return (new Color()).setString(color);
    }

    static fromArray(color: number[]): Color
    {
        return new Color(color);
    }

    x: number;
    y: number;
    z: number;
    w: number;

    length: 4;

    constructor(red: number | number[] | string | Color = 0, green: number = 0, blue: number = 0, alpha: number = 1)
    {
        if (red instanceof Color) {
            this.x = red.x;
            this.y = red.y;
            this.z = red.z;
            this.w = red.w;
        }
        else if (Array.isArray(red)) {
            this.x = red[0] || 0;
            this.y = red[1] || 0;
            this.z = red[2] || 0;
            this.w = red[3] !== undefined ? red[3] : 1;
        }
        else if (typeof red === "string") {
            this.setString(red);
        }
        else {
            this.x = red;
            this.y = green;
            this.z = blue;
            this.w = alpha;
        }
    }

    get r() { return this.x; }
    get g() { return this.y; }
    get b() { return this.z; }
    get a() { return this.w; }

    set r(value: number) { this.x = value; }
    set g(value: number) { this.y = value; }
    set b(value: number) { this.z = value; }
    set a(value: number) { this.w = value; }

    get red(): number { return this.x; }
    get green(): number { return this.y; }
    get blue(): number { return this.z; }
    get alpha(): number { return this.w; }

    set red(value: number) { this.x = value; }
    set green(value: number) { this.y = value; }
    set blue(value: number) { this.z = value; }
    set alpha(value: number) { this.w = value; }

    get redByte(): number { return Math.floor(this.x * 255); }
    get greenByte(): number { return Math.floor(this.y * 255); }
    get blueByte(): number { return Math.floor(this.z * 255); }
    get alphaByte(): number { return Math.floor(this.w * 255); }

    set redByte(value: number) { this.x = value / 255.0; }
    set greenByte(value: number) { this.y = value / 255.0; }
    set blueByte(value: number) { this.z = value / 255.0; }
    set alphaByte(value: number) { this.w = value / 255.0; }

    inverseMultiply(factor: number): Color
    {
        this.x = this.x * (1 - factor) + factor;
        this.y = this.y * (1 - factor) + factor;
        this.z = this.z * (1 - factor) + factor;

        return this;
    }

    multiply(factor: number): Color
    {
        this.x *= factor;
        this.y *= factor;
        this.z *= factor;

        return this;
    }

    copy(color: Color)
    {
        this.x = color.x;
        this.y = color.y;
        this.z = color.z;
        this.w = color.w;
    }

    clone() : Color
    {
        return new Color(this.x, this.y, this.z, this.w);
    }
    
    set(red: number, green: number, blue: number, alpha?: number)
    {
        this.x = red;
        this.y = green;
        this.z = blue;
        this.w = alpha === undefined ? 1 : alpha;

        return this;
    }

    setBytes(red: number, green: number, blue: number, alpha?: number)
    {
        this.x = red / 255;
        this.y = green / 255;
        this.z = blue / 255;
        this.w = alpha === undefined ? 1 : alpha / 255;

        return this;
    }

    setUInt24RGB(x: number)
    {
        this.x = (x >> 16) & 0xff;
        this.y = (x >> 8) & 0xff;
        this.z = x & 0xff;
        this.w = 1;

        return this;
    }

    setUInt32RGBA(x: number)
    {
        this.x = (x >> 24) & 0xff;
        this.y = (x >> 16) & 0xff;
        this.z = (x >> 8) & 0xff;
        this.w = x & 0xff;
        this.w = 1;

        return this;
    }

    setRed(red: number) : Color
    {
        this.x = red;
        return this;
    }

    setGreen(green: number) : Color
    {
        this.y = green;
        return this;
    }

    setBlue(blue: number) : Color
    {
        this.z = blue;
        return this;
    }

    setAlpha(alpha: number) : Color
    {
        this.w = alpha;
        return this;
    }

    setRedByte(red: number) : Color
    {
        this.x = red / 255;
        return this;
    }

    setGreenByte(green: number) : Color
    {
        this.y = green / 255;
        return this;
    }

    setBlueByte(blue: number) : Color
    {
        this.z = blue / 255;
        return this;
    }

    setAlphaByte(alpha: number) : Color
    {
        this.w = alpha / 255;
        return this;
    }

    setHSV(hue: number | IVector3 | IVector4, saturation: number = 1, value: number = 1, alpha?: number): Color
    {
        if (typeof hue === "object") {
            saturation = hue.y;
            value = hue.z;
            alpha = hue["w"] !== undefined ? hue["w"] : alpha;
            hue = hue.x;
        }

        const i = Math.floor(hue / 60);
        const f = hue / 60 - i;
        const p = value * (1 - saturation);
        const q = value * (1 - f * saturation);
        const t = value * (1 - (1 - f) * saturation);
        let r, g, b;

        switch (i % 6) {
            case 0: r = value; g = t; b = p; break;
            case 1: r = q; g = value; b = p; break;
            case 2: r = p; g = value; b = t; break;
            case 3: r = p; g = q; b = value; break;
            case 4: r = t; g = p; b = value; break;
            case 5: r = value; g = p; b = q; break;
        }

        this.x = r;
        this.y = g;
        this.z = b;

        if (alpha !== undefined) {
            this.w = alpha;
        }

        return this;
    }

    setHSL(hue: number | IVector3 | IVector4, saturation: number = 1, luminance: number = 1, alpha?: number): Color
    {
        if (typeof hue === "object") {
            saturation = hue.y;
            luminance = hue.z;
            alpha = hue["w"] !== undefined ? hue["w"] : alpha;
            hue = hue.x;
        }

        if (saturation === 0) {
            this.x = this.y = this.z = luminance;
        }
        else {
            hue /= 360;

            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = luminance < 0.5 ? luminance * (1 + saturation) : luminance + saturation - luminance * saturation;
            var p = 2 * luminance - q;

            this.x = hue2rgb(p, q, hue + 1/3);
            this.y = hue2rgb(p, q, hue);
            this.z = hue2rgb(p, q, hue - 1/3);
        }

        if (alpha !== undefined) {
            this.w = alpha;
        }

        return this;
    }

    fromArray(arr: number[])
    {
        this.x = arr[0] || 0;
        this.y = arr[1] || 0;
        this.z = arr[2] || 0;
        this.w = arr[3] !== undefined ? arr[3] : 1;
    }

    setString(color: string, alpha: number = 1, throws: boolean = true): Color
    {
        color = color.trim().toLowerCase();
        color = Color.presets[color] || color;
        let text = /^#?([0-9a-f]{3,8})$/i.exec(color)?.[1];
        if (text && (text.length === 3 || text.length == 4)) {
            const factor = 1 / 15;
            this.x = Number.parseInt(text.charAt(0), 16) * factor;
            this.y = Number.parseInt(text.charAt(1), 16) * factor;
            this.z = Number.parseInt(text.charAt(2), 16) * factor;
            this.w = (text.length == 4)? Number.parseInt(text.charAt(3), 16) * factor:alpha;
            return this;
        }else if (text && (text.length === 6 || text.length == 8) ) {
            const factor = 1 / 255;
            this.x = Number.parseInt(text.substr(0,2), 16) * factor;
            this.y = Number.parseInt(text.substr(2,2), 16) * factor;
            this.z = Number.parseInt(text.substr(4,2), 16) * factor;
            this.w =  (text.length == 8)? Number.parseInt(text.substr(6,2), 16) * factor:alpha;
            return this;
        }

        if (color.indexOf("rgb") === 0) {
            let result : any = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
            if (result) {
                const factor = 1 / 255;
                this.x = Number.parseInt(result[1]) * factor;
                this.y = Number.parseInt(result[2]) * factor;
                this.z = Number.parseInt(result[3]) * factor;
                this.w = alpha;
                return this;
            }

            result = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i);
            if (result) {
                const factor = 1 / 255;
                this.x = Number.parseInt(result[1]) * factor;
                this.y = Number.parseInt(result[2]) * factor;
                this.z = Number.parseInt(result[3]) * factor;
                this.w = Number.parseFloat(result[4]);
                return this;
            }
        }

        if (color.indexOf("hsl") === 0) {
            let result: any = color.match(/(\d+(\.\d+)?)/g);
            if (result) {
                this.setHSL(
                    Number.parseFloat(result[0]),
                    Number.parseFloat(result[1]) * 0.01,
                    Number.parseFloat(result[2]) * 0.01,
                    result[3] !== undefined ? Number.parseFloat(result[3]) : alpha
                );
            }
            return this;
        }

        if (throws) {
            throw new RangeError("failed to parse color from string: " + color);
        }

        return this;
    }

    toUInt24RGB(): number
    {
        return Math.floor(this.x * 255) << 16
            + Math.floor(this.y * 255) << 8
            + Math.floor(this.z * 255);
    }

    toUInt32RGBA(): number
    {
        return Math.floor(this.x * 255) << 24
            + Math.floor(this.y * 255) << 16
            + Math.floor(this.z * 255) << 8
            + Math.floor(this.w * 255);
    }

    toVector3(rgb: IVector3): IVector3
    {
        if (rgb) {
            rgb.x = this.r;
            rgb.y = this.g;
            rgb.z = this.b;
            return rgb;
        }

        return new Vector3(this.r, this.g, this.b);
    }

    toVector4(rgba: IVector4): IVector4
    {
        if (rgba) {
            rgba.x = this.r;
            rgba.y = this.g;
            rgba.z = this.b;
            rgba.w = this.a;
            return rgba;
        }

        return new Vector4(this.r, this.g, this.b, this.a);
    }

    toHSV(hsv?: IVector3): IVector3
    {
        let r = this.x, g = this.y, b = this.z;

        let min = Math.min(r, g, b);
        let max = Math.max(r, g, b);
        let d = max - min;
        let h = 0;
        let s = max === 0 ? 0 : d / max;
        let v = max;

        if (d !== 0) {
            h = (r === max ? (g - b) / d + (g < b ? 6 : 0) : (g === max ? (b - r) / d + 2 : (r - g) / d + 4)) * 60;
        }

        if (hsv) {
            hsv.x = h;
            hsv.y = s;
            hsv.z = v;
            return hsv;
        }

        return new Vector3(h, s, v);
    }

    toHSL(hsl?: IVector3): IVector3
    {
        let r = this.x, g = this.y, b = this.z;

        let min = Math.min(r, g, b);
        let max = Math.max(r, g, b);
        let d = max - min;
        let h = 0, s = 0, l = (max + min) * 0.5;

        if (d !== 0) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h = (r === max ? (g - b) / d + (g < b ? 6 : 0) : g === max ? 2 + (b - r) / d : 4 + (r - g) / d) * 60;
        }

        if (hsl) {
            hsl.x = h;
            hsl.y = s;
            hsl.z = l;
            return hsl;
        }

        return new Vector3(h, s, l);
    }

    toRGBArray(arr?: number[])
    {
        if (arr) {
            arr[0] = this.r;
            arr[1] = this.g;
            arr[2] = this.b;
            return arr;
        }

        return [ this.r, this.g, this.b ];
    }

    toRGBAArray(arr?: number[])
    {
        if (arr) {
            arr[0] = this.r;
            arr[1] = this.g;
            arr[2] = this.b;
            arr[3] = this.a;
            return arr;
        }

        return [ this.r, this.g, this.b, this.a ];
    }

    toString(includeAlpha?: boolean): string
    {
        let bytes = [this.redByte, this.greenByte, this.blueByte];
        if (includeAlpha || (typeof includeAlpha === "undefined" && this.w < 1)) {
            bytes.push(this.alphaByte);
        }
        return "#"+bytes.map(b=>b.toString(16).padStart(2,"0")).join("");
    }

    private static presets = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgrey": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkslategrey": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dimgrey": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "grey": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgray": "#d3d3d3",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightslategrey": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370db",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#db7093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "slategrey": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    }
}