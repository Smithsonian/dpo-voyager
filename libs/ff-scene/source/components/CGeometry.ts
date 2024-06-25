/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { BufferGeometry } from "three";

import { types } from "@ff/graph/propertyTypes";

import Component from "@ff/graph/Component";

////////////////////////////////////////////////////////////////////////////////

export default class CGeometry extends Component
{
    static readonly typeName: string = "CGeometry";

    protected static readonly geometryOuts = {
        self: types.Object("Geometry", CGeometry)
    };

    outs = this.addOutputs(CGeometry.geometryOuts);

    private _geometry: BufferGeometry = null;
    
    get geometry() {
        return this._geometry;
    }

    set geometry(geometry: BufferGeometry) {
        if (geometry !== this._geometry) {
            if (this._geometry) {
                this._geometry.dispose();
            }

            this._geometry = geometry;
            this.outs.self.setValue(geometry ? this : null);
        }
    }
}