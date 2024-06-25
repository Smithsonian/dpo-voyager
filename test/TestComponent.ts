/**
 * FF Typescript/React Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component, { IUpdateContext } from "@ff/graph/Component";
import { types } from "@ff/graph/propertyTypes";

////////////////////////////////////////////////////////////////////////////////

export enum Enum1 { four, five, six }
export enum Enum2 { seven, eight, nine }

const ins = {
    num0: types.Number("Test.Number0"),
    num1: types.Number("Test.Number1", 42),
    vec2: types.Vector2("Test.Vector2"),
    vec3: types.Vector3("Test.Vector3", { preset: [ 1, 2, 3] }),
    vec4: types.Vector4("Test.Vector4", [ 1, 2, 3, 4 ]),
    bool0: types.Boolean("Test.Boolean0", false),
    bool1: types.Boolean("Test.Boolean1", { preset: true }),
    str0: types.String("Test.String0"),
    str1: types.String("Test.String1", "Hello"),
    strVec2: types.Property("Test.StrVec", [ "first", "second" ]),
    option0: types.Option("Test.Enum0", [ "one", "two", "three" ]),
    option1: types.Enum("Test.Enum1", Enum1, 2),
    option2: types.Property("Test.Enum2", { options: [ "seven", "eight", "nine" ], preset: 1 }),
    obj0: types.Object("Test.Object0", Object)
};

const outs = {
    num0: types.Number("Test.Number0"),
    num1: types.Number("Test.Number1", 42),
    vec2: types.Vector2("Test.Vector2"),
    vec3: types.Vector3("Test.Vector3", { preset: [ 1, 2, 3] }),
    vec4: types.Vector4("Test.Vector4", [ 1, 2, 3, 4 ]),
    bool0: types.Boolean("Test.Boolean0", false),
    bool1: types.Boolean("Test.Boolean1", { preset: true }),
    str0: types.String("Test.String0"),
    str1: types.String("Test.String1", "Hello"),
    strVec2: types.Property("Test.StrVec", [ "first", "second" ]),
    option0: types.Option("Test.Enum0", [ "one", "two", "three" ]),
    option1: types.Enum("Test.Enum1", Enum1, 2),
    option2: types.Property("Test.Enum2", { options: [ "seven", "eight", "nine" ], preset: 1 }),
    obj0: types.Object("Test.Object0", Object)
};

export default class TestComponent extends Component
{
    static readonly typeName: string = "TestComponent";

    static readonly isNodeSingleton: boolean = false;

    ins = this.addInputs(ins);
    outs = this.addOutputs(outs);

    create()
    {
    }

    update(context: IUpdateContext)
    {
        return false;
    }

    tick(context: IUpdateContext)
    {
        return false;
    }
}


