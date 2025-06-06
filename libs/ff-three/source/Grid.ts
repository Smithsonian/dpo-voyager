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
    axesEnabled: boolean;
}

export default class Grid extends LineSegments
{
    constructor(props: IGridProps)
    {
        const material = new LineBasicMaterial({
            color: 0xffffffff,
            vertexColors: true,
        });

        super(undefined, material);
        this.update(props);
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
        const xColor = new Color(0xa63b4a);
        const yColor = new Color(0x6fa21c);
        const zColor = new Color(0x2f83e1);

        const divisions = props.mainDivisions * props.subDivisions;
        const step = props.size / divisions;
        const halfSize = props.size * 0.5;

        const vertices = [];
        const colors = [];
        
        for (let i = 0, j = 0, k = -halfSize; i <= divisions; ++i, k += step) {
            vertices.push(-halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, -halfSize, k, 0, halfSize);

            if(i == (divisions)/2 && props.axesEnabled){
                //Origins

                xColor.toArray(colors, j); j += 3;
                xColor.toArray(colors, j); j += 3;
                zColor.toArray(colors, j); j += 3;
                zColor.toArray(colors, j); j += 3;

            }else{
                const color = i % props.subDivisions === 0 ? mainColor : subColor;
    
                color.toArray(colors, j); j += 3;
                color.toArray(colors, j); j += 3;
                color.toArray(colors, j); j += 3;
                color.toArray(colors, j); j += 3;

            }
        }

        if(props.axesEnabled){
            vertices.push(0, -halfSize, 0, 0, halfSize, 0);
            colors.push(...yColor.toArray());
            colors.push(...yColor.toArray());
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

        return geometry;
    }
}