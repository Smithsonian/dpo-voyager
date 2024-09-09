/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    LineSegments,
    LineBasicMaterial,
    BufferGeometry,
    Float32BufferAttribute,
    Color,
} from "three";

////////////////////////////////////////////////////////////////////////////////

export interface IGridProps
{
    size: number;
    mainDivisions: number;
    subDivisions: number;
    mainColor: Color | string | number;
    subColor: Color | string | number;
}

export default class Grid extends LineSegments
{
    constructor(props: IGridProps)
    {
        const geometry = Grid.generate(props);
        const material = new LineBasicMaterial({
            color: 0xffffffff,
            vertexColors: true,
        });

        super(geometry, material);
    }

    set opacity(value: number) {
        this.material["opacity"] = value;
        this.material["transparent"] = value < 1;
    }

    update(props: IGridProps)
    {
        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = Grid.generate(props);
    }

    protected static generate(props: IGridProps): BufferGeometry
    {
        const mainColor = new Color(props.mainColor as any);
        const subColor = new Color(props.subColor as any);

        const divisions = props.mainDivisions * props.subDivisions;
        const step = props.size / divisions;
        const halfSize = props.size * 0.5;

        const vertices = [];
        const colors = [];

        for (let i = 0, j = 0, k = -halfSize; i <= divisions; ++i, k += step) {
            vertices.push(-halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, -halfSize, k, 0, halfSize);

            const color = i % props.subDivisions === 0 ? mainColor : subColor;

            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

        return geometry;
    }
}