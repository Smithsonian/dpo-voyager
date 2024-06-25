/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import uuid from "./uuid";

////////////////////////////////////////////////////////////////////////////////

export interface IClass {
    new(): any
}

class FormatError extends Error
{
}

let format = function(template: string, ...args)
{
    const reFormat = /%\d/g;
    const matches = template.match(reFormat);
    if (matches) {
        matches.forEach(match => {
            const index = parseInt(match.substr(1));
            template = template.replace(match, args[index - 1]);
        });
    }

    return template;
};

let not = function(value: any, message: string)
{
    return String(value) + " " + Checker.messages.not + " " + message;
};

////////////////////////////////////////////////////////////////////////////////
// CHECKERS

// common interface
interface ICheck {
    run: (value: any) => any;
    toString: (indent?: number) => string;
}

class CheckObjectRecursive implements ICheck
{
    constructor(private _template: { [id: string]: Checker | object }, private _maybeNull: boolean)
    {
        for (let key in _template) {
            const propValue: any = _template[key];

            // for plain objects, wrap in template (is.like)
            if (propValue instanceof Object && !(propValue instanceof Checker)) {
                _template[key] = new Checker(propValue);
            }
        }
    }

    run(value: any)
    {
        if (value === null && this._maybeNull) {
            return null;
        }

        if (value === null || typeof value !== "object" || Array.isArray(value)) {
            throw new FormatError(not(value, Checker.messages.object));
        }

        let result = {};
        for (let key in this._template) {
            const checker: Checker = this._template[key] as Checker;
            const sourceKey = checker._name ? checker._name : key;
            const hasSourceKey = value.hasOwnProperty(sourceKey);

            try {
                if (hasSourceKey || checker._required) {
                    result[key] = checker.check(hasSourceKey ? value[sourceKey] : undefined);
                }
            } catch(err) {
                if (!hasSourceKey && checker._required && !checker._hasPreset) {
                    throw new FormatError(format(Checker.messages.propMissing, key));
                }

                throw new FormatError(format(Checker.messages.propError, key, err.message));
            }
        }

        return result;
    }

    toString(indent?: number)
    {
        indent = indent || 0;
        const prefix = " ".repeat(indent);
        return Object.keys(this._template).reduce((text, key) => {
            const checker = this._template[key] as Checker;
            return text + prefix + "  [" + key + "] is " + checker.toString(indent + 2) + "\n";
        }, "an object {\n") + prefix + "}";
    }
}

class CheckArrayRecursive implements ICheck
{
    constructor(private _template: [ Checker ], private _maybeNull: boolean) {}

    run(values: any)
    {
        if (values === null && this._maybeNull) {
            return null;
        }

        if (values === null || !Array.isArray(values)) {
            throw new FormatError(not(values, Checker.messages.array));
        }

        const result = [];
        const checker = this._template[0];
        const count = { index: 0 };
        try {
            values.forEach((value, index) => {
                count.index = index;
                result[index] = checker.check(value);
            });
        } catch(err) {
            throw new FormatError(format(Checker.messages.elementError, count.index, err.message));
        }
        return result;
    }

    toString(indent?: number)
    {
        indent = indent || 0;
        let prefix = " ".repeat(indent);
        let checker = this._template[0];
        return "an array [\n  " + prefix + "each element is " + checker.toString(indent + 2) + "\n" + prefix + "]";
    }
}

class CheckMap implements ICheck
{
    constructor(private _map: (value: any) => any) {}

    run(value: any)
    {
        return this._map(value);
    }

    toString()
    {
        return "map";
    }
}

class CheckType implements ICheck
{
    constructor(private _type: IClass) {}

    run(value: any)
    {
        if (value instanceof this._type) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return format(Checker.messages.instanceOf, this._type.name || this._type.toString());
    }
}

class CheckNumber implements ICheck
{
    constructor(private _convert: boolean) {}

    run(value: any)
    {
        let type = typeof value;
        if (type === "number" && !isNaN(value)) {
            return value;
        }

        if (this._convert) {
            if (type === "boolean") {
                return value ? 1 : 0;
            }

            if (typeof value === "string") {
                let result = parseFloat(value);
                if (!isNaN(result)) {
                    return result;
                }
            }
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.number;
    }
}

class CheckBoolean implements ICheck
{
    constructor(private _convert: boolean) {}

    run(value: any)
    {
        let type = typeof value;
        if (type === "boolean") {
            return value;
        }

        if (this._convert) {
            if (type === "number") {
                return !!value;
            }

            if (type === "string") {
                let lc = value.toLowerCase();
                if (lc === "true") {
                    return true;
                }
                else if (lc === "false") {
                    return false;
                }
            }
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.boolean;
    }
}

class CheckString implements ICheck
{
    constructor(private _convert: boolean) {}

    run(value: any)
    {
        let type = typeof value;
        if (type === "string") {
            return value;
        }

        if (this._convert) {
            return String(value);
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.string;
    }
}

class CheckObject implements ICheck
{
    run(value: any)
    {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.object;
    }
}

class CheckFunc implements ICheck
{
    run(value: any)
    {
        if (typeof value === "function") {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.func;
    }
}

class CheckArray implements ICheck
{
    run(value: any)
    {
        if (Array.isArray(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.array;
    }
}

class CheckPositive implements ICheck
{
    run(value: any)
    {
        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.positive.type);
        }

        if (value < 0) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return Checker.messages.positive.description;
    }
}

class CheckNegative implements ICheck
{
    run(value: any)
    {
        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.negative.type);
        }

        if (value > 0) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return Checker.messages.negative.description;
    }
}

class CheckNotZero implements ICheck
{
    run(value: any)
    {
        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.notZero.type);
        }

        if (value === 0) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return Checker.messages.notZero.description;
    }
}

class CheckMin implements ICheck
{
    constructor(private _min: number, private _convert: boolean) {}

    run(value: any)
    {
        let min = this._min;

        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.min.type);
        }

        if (this._convert) {
            return value < min ? min : value;
        }
        if (value < min) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.min.description, this._min);
    }
}

class CheckMax implements ICheck
{
    constructor(private _max: number, private _convert: boolean) {}

    run(value: any)
    {
        let max = this._max;

        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.max.type);
        }

        if (this._convert) {
            return value > max ? max : value;
        }
        if (value > max) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.max.description, this._max);
    }
}

class CheckBetween implements ICheck
{
    constructor(private _min: number, private _max: number, private _convert: boolean) {}

    run(value: any)
    {
        let min = this._min;
        let max = this._max;

        if (typeof value !== "number") {
            throw new FormatError(Checker.messages.between.type);
        }

        if (this._convert) {
            return value < min ? min : (value > max ? max : value);
        }
        if (value < min || value > max) {
            throw new FormatError(not(value, this.toString()));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.between.description, this._min, this._max)
    }
}

class CheckLength implements ICheck
{
    constructor(private _length: number, private _convert: boolean) {}

    run(value: any)
    {
        if (typeof value !== "string" && !Array.isArray(value)) {
            throw new FormatError(Checker.messages.length.type);
        }

        if (value.length !== this._length) {
            if (this._convert && value.length > this._length) {
                (value as any).length = this._length;
                return value;
            }

            throw new FormatError(format(Checker.messages.length.error, value.length, this._length));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.length.description, this._length);
    }
}

class CheckMinLength implements ICheck
{
    constructor(private _minLength: number) {}

    run(value: any)
    {
        if (typeof value !== "string" && !Array.isArray(value)) {
            throw new FormatError(Checker.messages.minLength.type);
        }

        if (value.length < this._minLength) {
            throw new FormatError(format(Checker.messages.minLength.error, value.length, this._minLength));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.minLength.description, this._minLength);
    }
}

class CheckMaxLength implements ICheck
{
    constructor(private _maxLength: number, private _convert: boolean) {}

    run(value: any)
    {
        if (typeof value !== "string" && !Array.isArray(value)) {
            throw new FormatError(Checker.messages.maxLength.type);
        }

        if (value.length > this._maxLength) {
            if (this._convert) {
                (value as any).length = this._maxLength;
                return value;
            }

            throw new FormatError(format(Checker.messages.maxLength.error, value.length, this._maxLength));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.maxLength.description, this._maxLength);
    }
}

class CheckLengthBetween implements ICheck
{
    constructor(private _minLength: number, private _maxLength: number, private _convert: boolean) {}

    run(value: any)
    {
        if (typeof value !== "string" && !Array.isArray(value)) {
            throw new FormatError(Checker.messages.lengthBetween.type);
        }

        if (value.length < this._minLength || value.length > this._maxLength) {
            if (this._convert && value.length > this._maxLength) {
                (value as any).length = this._maxLength;
                return value;
            }

            throw new FormatError(format(Checker.messages.lengthBetween.error,
                value.length, this._minLength, this._maxLength));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.lengthBetween.description, this._minLength, this._maxLength);
    }
}

class CheckNotEmpty implements ICheck
{
    constructor() {}

    run(value: any)
    {
        if (typeof value !== "string" && !Array.isArray(value)) {
            throw new FormatError(Checker.messages.notEmpty.type);
        }

        if (value.length < 1) {
            throw new FormatError(format(Checker.messages.notEmpty.error));
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.notEmpty.description);
    }
}

class CheckOneOf implements ICheck
{
    _options: any[];

    constructor(...args)
    {
        let options = this._options = [];
        args.forEach(arg => {
            if (Array.isArray(arg)) {
                arg.forEach(a => { options.push(a) });
            }
            else {
                options.push(arg);
            }
        });
    }

    run(value: any)
    {
        let options = this._options;
        for (let i = 0; i < options.length; ++i) {
            if (value === options[i]) {
                return value;
            }
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return format(Checker.messages.oneOf, this._options.join("|"));
    }
}

class CheckEmail implements ICheck
{
    private static readonly _regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    run(value: any)
    {
        if (typeof value === "string" && CheckEmail._regexp.test(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.email;
    }
}

class CheckUrl implements ICheck
{
    private static readonly _regexp = /^(?:(https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/;

    run(value: any)
    {
        if (typeof value === "string" && CheckUrl._regexp.test(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.url;
    }
}

class CheckJson implements ICheck
{
    constructor(private _convert: boolean) {}

    run(value: any)
    {
        let type = typeof value;
        if (this._convert && type === "object") {
            return JSON.stringify(value);
        }

        if (type === "string") {
            try {
                JSON.parse(value);
            } catch(err) {
                throw new FormatError(not(value, this.toString()));
            }

            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.json;
    }
}

class CheckParse implements ICheck
{
    run(value: any)
    {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch(err) {
                throw new FormatError(not(value, this.toString()));
            }
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.parse;
    }
}

class CheckUuid implements ICheck
{
    private static readonly _regexp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;

    constructor(private _convert: boolean) {}

    run(value: any)
    {
        if (value === undefined && this._convert) {
            return uuid();
        }
        if (typeof value === "string" && CheckUuid._regexp.test(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));

    }

    toString()
    {
        return Checker.messages.uuid;
    }
}

class CheckMatch implements ICheck
{
    constructor(private _pattern: RegExp) {}

    run(value: any)
    {
        this._pattern.lastIndex = 0;

        if (typeof value === "string" && this._pattern.test(value)) {
            return value;
        }

        throw new FormatError(not(value, this.toString()));
    }

    toString()
    {
        return Checker.messages.match;
    }
}

class CheckPreset implements ICheck
{
    constructor(private _preset: any) {}

    run(value: any)
    {
        if (value === undefined) {
            let preset = this._preset;
            return preset && typeof preset === "function" ? preset() : preset;
        }

        return value;
    }

    toString()
    {
        return format(Checker.messages.preset, this._preset);
    }
}

export class Checker
{
    static messages = {
        not: "is not",
        propMissing: "missing required property ['%1'] in object",
        propError: "in property ['%1']: %2",
        elementError: "array element [%1] %2",
        number: "a number",
        boolean: "a boolean",
        string: "a string",
        object: "an object",
        func: "a function",
        array: "an array",
        int: "an integer",
        instanceOf: "an instance of '%1'",
        oneOf: "one of [%1]",
        positive: {
            type: "'positive' only applicable to numbers",
            description: "positive"
        },
        negative: {
            type: "'negative' only applicable to numbers",
            description: "negative"
        },
        notZero: {
            type: "'notZero' only applicable to numbers",
            description: "not zero"
        },
        min: {
            type: "'min' only applicable to numbers",
            description: "%1 or greater"
        },
        max: {
            type: "'max' only applicable to numbers",
            description: "%1 or smaller"
        },
        between: {
            type: "'between' only applicable to numbers",
            description: "between %1 and %2"
        },
        length: {
            type: "'length' only applicable to strings and arrays",
            error: "length is %1, must be exactly %2",
            description: "of length %1"
        },
        minLength: {
            type: "'minLength' only applicable to strings and arrays",
            error: "length is %1, must be %2 or more",
            description: "of length %1 or more"
        },
        maxLength: {
            type: "'maxLength' only applicable to strings and arrays",
            error: "length is %1, must be %2 or less",
            description: "of length %1 or less"
        },
        lengthBetween: {
            type: "'lengthBetween' only applicable to strings and arrays",
            error: "length is %1, must be between %2 and %3",
            description: "of length between %1 and %2"
        },
        notEmpty: {
            type: "'notEmpty' only applicable to strings and arrays",
            error: "must not be empty",
            description: "not empty"
        },
        email: "a valid email address",
        url: "a valid URL",
        path: "a valid path",
        json: "a valid JSON string",
        parse: "an object from JSON",
        uuid: "a valid UUID",
        match: "a match to regular expression",
        preset: "preset value <%1>"
    };

    private _stack: ICheck[] = undefined;
    _name: string;
    _required: boolean;
    _maybeNull: boolean;
    _convert: boolean;
    _hasPreset: boolean;

    constructor(arg: Checker | { [id: string]: Checker } | "is" | "to")
    {
        this._name = null;
        this._required = true;
        this._hasPreset = false;
        this._maybeNull = false;

        if (arg instanceof Checker) {
            this._stack = [];
            this._convert = arg._convert;
        }
        else if (typeof arg === "object") {
            this._stack = [ new CheckObjectRecursive(arg, this._maybeNull) ];
            this._convert = false;
        }
        else if (typeof arg === "string") {
            this._stack = undefined;

            switch (arg) {
                case "is":
                    this._convert = false;
                    break;
                case "to":
                    this._convert = true;
                    break;
            }
        }
    }

    private _arg()
    {
        return  this._stack ? this : new Checker(this);
    }

    private _add(checker: ICheck)
    {
        let self = this._arg();
        self._stack.push(checker);
        return self;
    }

    private _cantConvertTo(type: string)
    {
        if (this._convert) {
            throw new Error("can't convert to " + type);
        }
    }

    check(value: any)
    {
        if (this._stack === null) {
            throw new Error("incomplete - did you forget to add any checks?");
        }

        let _pastPreset = false;

        return this._stack.reduce((temp, check) => {
                try {
                    _pastPreset = _pastPreset || check instanceof CheckPreset;
                    return check.run(temp);
                } catch(err) {
                    if (this._hasPreset && !_pastPreset) {
                        return undefined;
                    }

                    throw(err);
                }
            }, value);
    }

    toString(indent?: number)
    {
        indent = indent || 0;
        return this._stack.map(checker => checker.toString(indent)).join(", ");
    }

    preset(presetValue: any) : Checker
    {
        let self = this._arg();
        self._hasPreset = true;
        return self._add(new CheckPreset(presetValue));
    }

    from(name: string) : Checker
    {
        let self = this._arg();
        self._name = name;
        return self;
    }

    get required() : Checker
    {
        let self = this._arg();
        self._required = true;
        return self;
    }

    get optional() : Checker
    {
        let self = this._arg();
        self._required = false;
        return self;
    }

    get maybeNull(): Checker
    {
        const self = this._arg();
        self._maybeNull = true;
        return self;
    }

    get is() : Checker
    {
        let self = this._arg();
        self._convert = false;
        return self;
    }

    get to() : Checker
    {
        let self = this._arg();
        self._convert = true;
        return self;
    }

    like(template: { [id: string]: Checker | object } | [Checker]) : Checker
    {
        this._cantConvertTo("object");
        if (Array.isArray(template)) {
            return this._add(new CheckArrayRecursive(template, this._maybeNull));
        }
        else {
            return this._add(new CheckObjectRecursive(template, this._maybeNull));
        }
    }

    get number() : Checker
    {
        return this._add(new CheckNumber(this._convert));
    }

    get boolean() : Checker
    {
        return this._add(new CheckBoolean(this._convert));
    }

    get string() : Checker
    {
        return this._add(new CheckString(this._convert));
    }

    get object() : Checker
    {
        this._cantConvertTo("object");
        return this._add(new CheckObject());
    }

    get func() : Checker
    {
        this._cantConvertTo("function");
        return this._add(new CheckFunc());
    }

    get array() : Checker
    {
        this._cantConvertTo("array");
        return this._add(new CheckArray());
    }

    get email() : Checker
    {
        this._cantConvertTo("email string");
        return this._add(new CheckEmail());
    }

    get url() : Checker
    {
        this._cantConvertTo("url string");
        return this._add(new CheckUrl());
    }

    get json() : Checker
    {
        return this._add(new CheckJson(this._convert));
    }

    get parse() : Checker
    {
        return this._add(new CheckParse());
    }

    get uuid() : Checker
    {
        return this._add(new CheckUuid(this._convert));
    }

    instanceOf(type: IClass) : Checker
    {
        this._cantConvertTo("class type");
        return this._add(new CheckType(type));
    }

    get positive(): Checker
    {
        return this._add(new CheckPositive());
    }

    get negative(): Checker
    {
        return this._add(new CheckNegative());
    }

    get notZero(): Checker
    {
        return this._add(new CheckNotZero());
    }

    min(min: number) : Checker
    {
        return this._add(new CheckMin(min, this._convert));
    }

    max(max: number) : Checker
    {
        return this._add(new CheckMax(max, this._convert));
    }

    between(min: number, max: number) : Checker
    {
        return this._add(new CheckBetween(min, max, this._convert));
    }

    length(length: number): Checker
    {
        return this._add(new CheckLength(length, this._convert));
    }

    minLength(minLength: number): Checker
    {
        return this._add(new CheckMinLength(minLength));
    }

    maxLength(maxLength: number): Checker
    {
        return this._add(new CheckMaxLength(maxLength, this._convert));
    }

    lengthBetween(minLength: number, maxLength: number)
    {
        return this._add(new CheckLengthBetween(minLength, maxLength, this._convert));
    }

    get notEmpty(): Checker
    {
        return this._add(new CheckNotEmpty());
    }

    oneOf(...args)
    {
        return this._add(new CheckOneOf(...args));
    }

    match(pattern: RegExp) : Checker
    {
        return this._add(new CheckMatch(pattern));
    }

    map(map: (value: any) => any)
    {
        return this._add(new CheckMap(map));
    }
}

const is = new Checker("is");
const to = new Checker("to");

export { is, to };
