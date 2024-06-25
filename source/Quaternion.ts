/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

////////////////////////////////////////////////////////////////////////////////

export interface IQuaternion
{
    x: number;
    y: number;
    z: number;
    w: number;
}

export default class Quaternion implements IQuaternion
{
    x: number;
    y: number;
    z: number;
    w: number;
}