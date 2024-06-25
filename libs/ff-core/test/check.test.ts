/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { assert } from "chai";
import { is, to } from "@ff/core/check";

////////////////////////////////////////////////////////////////////////////////
// CHECK FUNCTION - TEST SUITE

export default function() {
    suite("check", function() {
        test("is.number", function() {
            assert.strictEqual(is.number.check(45), 45, "45");
            assert.strictEqual(is.number.check(Number.NEGATIVE_INFINITY), Number.NEGATIVE_INFINITY);
            assert.throws(() => is.number.check(NaN));
            assert.throws(() => is.number.check("45"));
            assert.throws(() => is.number.check(false));
            assert.throws(() => is.number.check({}));
            assert.throws(() => is.number.check(null));
            assert.throws(() => is.number.check(undefined));
        });

        test("to.number", function() {
            assert.strictEqual(to.number.is.number.check(37), 37, "37");
            assert.strictEqual(to.number.is.number.check(Number.NEGATIVE_INFINITY), Number.NEGATIVE_INFINITY);
            assert.strictEqual(to.number.is.number.check(true), 1, "true");
            assert.strictEqual(to.number.is.number.check(false), 0, "false");
            assert.strictEqual(to.number.is.number.check("19.35"), 19.35, '"19.35"');
            assert.throws(() => to.number.check(NaN));
            assert.throws(() => to.number.check(""));
            assert.throws(() => to.number.check(null));
            assert.throws(() => to.number.check(undefined));
        });

        test("is.boolean", function() {
            assert.strictEqual(is.boolean.check(true), true, "true");
            assert.strictEqual(is.boolean.check(false), false, "false");
            assert.throws(() => is.boolean.check(0));
            assert.throws(() => is.boolean.check(123));
            assert.throws(() => is.boolean.check(""));
            assert.throws(() => is.boolean.check("string"));
            assert.throws(() => is.boolean.check({}));
            assert.throws(() => is.boolean.check(null));
            assert.throws(() => is.boolean.check(undefined));
        });

        test("to.boolean", function() {
            assert.strictEqual(to.boolean.is.boolean.check(1), true, "true");
            assert.strictEqual(to.boolean.is.boolean.check(0), false, "false");
            assert.strictEqual(to.boolean.is.boolean.check("true"), true, '"true"');
            assert.strictEqual(to.boolean.is.boolean.check("false"), false, '"false"');
            assert.throws(() => to.boolean.check(""));
            assert.throws(() => to.boolean.check("string"));
            assert.throws(() => to.boolean.check({}));
            assert.throws(() => to.boolean.check(null));
            assert.throws(() => to.boolean.check(undefined));
        });

        test("is.string", function() {
            assert.strictEqual(is.string.check(""), "", '""');
            assert.strictEqual(is.string.check("string"), "string", '"string"');
            assert.throws(() => is.string.check(0));
            assert.throws(() => is.string.check(123));
            assert.throws(() => is.string.check(false));
            assert.throws(() => is.string.check(true));
            assert.throws(() => is.string.check({}));
            assert.throws(() => is.string.check(null));
            assert.throws(() => is.string.check(undefined));
        });

        test("to.string", function() {
            assert.strictEqual(to.string.is.string.check(45.123), "45.123", "45.123");
            assert.strictEqual(to.string.is.string.check(false), "false", "false");
            assert.strictEqual(to.string.is.string.check(true), "true", "true");
            assert.strictEqual(to.string.is.string.check(""), "", '""');
            assert.strictEqual(to.string.is.string.check("string"), "string", '"string"');
        });

        test("is.object", function() {
            let obj = { a: 1, b: "two" };
            assert.deepEqual(is.object.check(obj), obj, "object");
            assert.throws(() => is.object.check(0));
            assert.throws(() => is.object.check(false));
            assert.throws(() => is.object.check(function(a) { return a; }));
            assert.throws(() => is.object.check(null));
            assert.throws(() => is.object.check(undefined));
        });

        test("is.func", function() {
            let func = function(a) { return a; };
            assert.strictEqual(is.func.check(func), func, "function");
            assert.throws(() => is.func.check(0));
            assert.throws(() => is.func.check(false));
            assert.throws(() => is.func.check({}));
            assert.throws(() => is.func.check(null));
            assert.throws(() => is.func.check(undefined));
        });

        test("is.array", function() {
            let arr = [ 1, 2, "a", "b" ];
            assert.deepEqual(is.array.check(arr), arr, "array");
            assert.throws(() => is.array.check(new Float64Array(3)));
            assert.throws(() => is.array.check(0));
            assert.throws(() => is.array.check(false));
            assert.throws(() => is.array.check({}));
            assert.throws(() => is.array.check(function(a) { return a; }));
            assert.throws(() => is.array.check(null));
            assert.throws(() => is.array.check(undefined));
        });

        test("is.instanceOf", function() {
            class Test { a = 1; b = 2; }
            let instance = new Test();
            let obj = { a: 1, b: "string" };
            assert.deepEqual(is.instanceOf(Test).check(instance), instance, "Test instanceOf Test");
            assert.deepEqual(is.instanceOf(Object).check(instance), instance, "Test instanceOf Object");
            assert.deepEqual(is.instanceOf(Object).check(obj), obj, "object");
            assert.throws(() => is.instanceOf(Error).check(instance));
            assert.throws(() => is.instanceOf(Test).check(undefined));
            assert.throws(() => is.instanceOf(Test).check(null));
            assert.throws(() => is.instanceOf(Test).check({}));
        });

        test("is.email", function() {
            let email = "a@b.cd";
            assert.deepEqual(is.email.check(email), email, "email");
            assert.throws(() => is.email.check("a@b"));
            assert.throws(() => is.email.check("a@.com"));
            assert.throws(() => is.email.check("b.com"));
            assert.throws(() => is.email.check(0));
        });

        test("is.url", function() {
            let url1 = "http://a.cd:5000?g=1";
            assert.deepEqual(is.url.check(url1), url1, "url 1");
            let url2 = "https://1.1.1.1:5000?g=1";
            assert.deepEqual(is.url.check(url2), url2, "url 2");
            let url3 = "a.bc";
            assert.deepEqual(is.url.check(url3), url3, "url 3");
            let url4 = "212.35.11.10";
            assert.deepEqual(is.url.check(url4), url4, "url 4");

            assert.throws(() => is.url.check(":800"));
            assert.throws(() => is.url.check("212.35.11"));
            assert.throws(() => is.url.check(0));
        });

        test("is.json", function() {
            let obj = { a: "string", b: 5.21, c: false };
            let json = JSON.stringify(obj);
            assert.deepEqual(is.json.check(json), json);
            assert.throws(() => is.json.check(""));
            assert.throws(() => is.json.check(5));
            assert.throws(() => is.json.check(null));
            assert.throws(() => is.json.check(undefined));
        });

        test("to.json", function() {
            let obj = { a: "string", b: 5.21, c: false };
            let json = JSON.stringify(obj);
            assert.strictEqual(to.json.check(obj), json);
            assert.strictEqual(to.json.check(null), "null");
            assert.throws(() => to.json.check(""));
            assert.throws(() => to.json.check(5));
            assert.throws(() => to.json.check(undefined));
        });

        test("parse", function() {
            let obj = { a: "string", b: 5.21, c: false };
            let json = JSON.stringify(obj);
            assert.deepEqual(is.string.parse.check(json), obj);
            assert.strictEqual(is.string.parse.check("null"), null);
            assert.throws(() => is.parse.check(""));
            assert.throws(() => is.parse.check(undefined));
        });

        test("to.uuid", function() {
            let regexp = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
            let template = to.uuid.is.string.is.uuid;
            assert.isTrue(regexp.test(template.check(undefined)));
            assert.isTrue(regexp.test(template.check("12345678-ABCD-ef01-1234-12345678abcd")));
        });

        test("is.uuid", function() {
            let uuid = "12345678-ABCD-ef01-1234-12345678abcd";
            assert.deepEqual(is.uuid.check(uuid), uuid);
            assert.throws(() => is.uuid.check("1234578-ABCD-ef01-1234-12345678abcd"));
            assert.throws(() => is.uuid.check(""));
            assert.throws(() => is.uuid.check(null));
            assert.throws(() => is.uuid.check(undefined));
        });

        test("illegal conversions", function() {
            assert.throws(() => to.object);
            assert.throws(() => to.func);
            assert.throws(() => to.array);
            assert.throws(() => to.email);
            assert.throws(() => to.url);
        });

        test("min", function() {
            assert.strictEqual(is.number.min(5).check(6), 6);
            assert.strictEqual(is.number.to.min(7).check(3), 7);
            assert.strictEqual(to.number.min(3).check("2"), 3);
            assert.throws(() => is.number.min(5).check(2));
        });

        test("max", function() {
            assert.strictEqual(is.number.max(10).check(6), 6);
            assert.strictEqual(is.number.to.max(7).check(9), 7);
            assert.strictEqual(to.number.max(12).check("1e5"), 12);
            assert.throws(() => is.number.max(5).check(8));
        });

        test("between", function() {
            assert.strictEqual(is.number.between(2, 7).check(3), 3);
            assert.strictEqual(is.number.to.between(3, 4).check(6), 4);
            assert.strictEqual(is.number.to.between(3, 4).check(1), 3);
            assert.strictEqual(to.number.between(10, 20).check("300"), 20);
            assert.throws(() => is.number.between(5, 6).check(4));
            assert.throws(() => is.number.between(5, 6).check(7));
        });

        test("minLength", function() {
            assert.strictEqual(is.string.minLength(5).check("12345"), "12345");
            assert.deepEqual(is.array.minLength(3).check([1,2,3]), [1,2,3]);
            assert.throws(() => is.string.minLength(5).check("1234"));
            assert.throws(() => is.array.minLength(3).check([1,2]));
            assert.throws(() => is.number.minLength(3).check(5));
        });

        test("maxLength", function() {
            assert.strictEqual(is.maxLength(5).check("12345"), "12345");
            assert.deepEqual(is.array.maxLength(3).check([1,2,3]), [1,2,3]);
            assert.throws(() => is.maxLength(3).check("1234"));
            assert.throws(() => is.array.maxLength(2).check([1,2,3]));
            assert.throws(() => is.number.maxLength(3).check(5));
        });

        test("lengthBetween", function() {
            assert.strictEqual(is.string.lengthBetween(4, 6).check("12345"), "12345");
            assert.deepEqual(is.array.lengthBetween(2, 4).check([1,2,3]), [1,2,3]);
            assert.throws(() => is.string.lengthBetween(5, 6).check("1234"));
            assert.throws(() => is.lengthBetween(4, 6).check([1,2,3]));
            assert.throws(() => is.lengthBetween(3, 4).check(5));
        });

        test("oneOf", function() {
            let options = [ "one", "two", 3, 4, false ];
            assert.strictEqual(is.oneOf(options).check("one"), "one");
            assert.strictEqual(is.oneOf(options).check(4), 4);
            assert.strictEqual(is.oneOf(options).check(false), false);
            assert.strictEqual(is.oneOf("a", "b", "c").check("b"), "b");
            assert.throws(() => is.oneOf(options).check(true));
            assert.throws(() => is.oneOf(options).check(null));
            assert.throws(() => is.oneOf(options).check(undefined));
        });

        test("match", function() {
            let regexp = /hello/g;
            assert.strictEqual(is.match(regexp).check("hello world"), "hello world");
            assert.strictEqual(is.match(regexp).preset("nope").check("hello world"), "hello world");
            assert.strictEqual(is.match(regexp).preset("nope").check("foo bar"), "nope");
            assert.throws(() => is.match(regexp).check("foo bar"));
        });

        test("map", function() {
            assert.strictEqual(is.map(value => value + 1).check(5), 6);
            assert.strictEqual(is.number.map(value => String(value)).string.check(21), "21");
        });

        test("nested objects", function() {
            let template = is.like({
                a: is.number.between(3, 6),
                b: is.string.minLength(2).from("id"),
                c: is.like([ is.boolean ]).length(2),
                d: { x: is.number }
            });
            let src = { a: 5, id: "text", c: [ true, false ], d: { x: 2 } };
            let dst = { a: 5, b: "text", c: [ true, false ], d: { x: 2 } };
            assert.deepEqual(template.check(src), dst);
        });

        test("required/optional/preset", function() {
            let template = is.like({
                a: is.optional.number,
                b: is.optional.preset(3).number,
                c: is.optional.preset(4).number,
                d: is.required.string,
                e: is.required.preset("def").string,
                f: is.required.string.preset("ghi")
            });
            let src1 = { c: 17, d: "abc", f: "klm" };
            let dst = { c: 17, d: "abc", e: "def", f: "klm" };
            assert.deepEqual(template.check(src1), dst);
        });
    });
};
