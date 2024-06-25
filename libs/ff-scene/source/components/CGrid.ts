/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Color } from "three";

import { types } from "@ff/graph/propertyTypes";

import Grid, { IGridProps } from "@ff/three/Grid";

import CObject3D from "./CObject3D";

////////////////////////////////////////////////////////////////////////////////

export default class CGrid extends CObject3D
{
    static readonly typeName: string = "CGrid";

    static readonly gridIns = Object.assign({}, CObject3D.transformIns, {
        size: types.Number("Grid.Size", 20),
        mainDivs: types.Integer("Grid.Main.Divisions", 2),
        mainColor: types.ColorRGB("Grid.Main.Color", [ 1, 1, 1 ]),
        mainOpacity: types.Percent("Grid.Main.Opacity", 1),
        subDivs: types.Integer("Grid.Sub.Divisions", 10),
        subColor: types.ColorRGB("Grid.Sub.Color", [ 0.5, 0.5, 0.5 ]),
        subOpacity: types.Percent("Grid.Sub.Opacity", 1),
    });

    ins = this.addInputs<CObject3D, typeof CGrid["gridIns"]>(CGrid.gridIns);

    protected get grid() {
        return this.object3D as Grid;
    }

    update(context)
    {
        super.update(context);
        super.updateTransform();

        let grid = this.grid;

        const { size, mainDivs, mainColor, subDivs, subColor } = this.ins;
        if (size.changed || mainDivs.changed || mainColor.changed || subDivs.changed || subColor.changed) {

            const props: IGridProps = {
                size: size.value,
                mainDivisions: mainDivs.value,
                mainColor: new Color().fromArray(mainColor.value),
                subDivisions: subDivs.value,
                subColor: new Color().fromArray(subColor.value)
            };

            const newGrid = this.object3D = new Grid(props);
            if (grid) {
                newGrid.matrix.copy(grid.matrix);
                newGrid.matrixWorldNeedsUpdate = true;
            }
        }

        return true;
    }
}