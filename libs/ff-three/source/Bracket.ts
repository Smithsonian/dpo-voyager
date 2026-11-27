/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Object3D,
    LineSegments,
    LineBasicMaterial,
    BufferGeometry,
    Float32BufferAttribute,
    Box3,
    Color,
    Material,
} from "three";

import { expandByGeometryBounds } from "./helpers";

////////////////////////////////////////////////////////////////////////////////

/** Returns a bounding box in the bracket's target space, or null */
export type BracketBoxSource = () => Readonly<Box3> | null;

export interface IBracketProps
{
    /** Color of the bracket lines. Default is white. */
    color?: Color;
    /** Length of the bracket lines relative to the size of the object. Default is 0.25. */
    length?: number;
    axes?:boolean;
    /** Box to show, read again on every update. Default is the target's geometry bounds, computed once. */
    source?: BracketBoxSource;
}

/**
 * Wireframe selection bracket.
 */
export default class Bracket extends LineSegments
{
    static readonly defaultProps = {
        color: new Color("#ffd633"),
        length: 0.25,
        axes: false,
    };

    protected props: IBracketProps;
    protected source: BracketBoxSource | null;
    /** The box the geometry was built from */
    protected box = new Box3();

    constructor(target: Object3D, props?: IBracketProps)
    {
        props = Object.assign({}, Bracket.defaultProps, props);

        const material = new LineBasicMaterial({
            color: props.color,
            toneMapped: false,
            depthTest: false
        });

        super(new BufferGeometry(), material);

        this.props = props;
        this.source = props.source || null;

        if (!this.source) {
            expandByGeometryBounds(target, this.box.makeEmpty());
        }
        else {
            this.box.copy(this.source() || this.box.makeEmpty());
        }
        this.build();

        this.renderOrder = 1;
    }

    /** Follows changes of the box source, if any. */
    update()
    {
        if (!this.source) {
            return;
        }

        const box = this.source();
        if (box ? box.equals(this.box) : this.box.isEmpty()) {
            return;
        }

        if (box) {
            this.box.copy(box);
        }
        else {
            this.box.makeEmpty();
        }

        this.geometry.dispose();
        this.geometry = new BufferGeometry();
        this.build();
    }

    dispose()
    {
        this.geometry.dispose();
        (this.material as Material).dispose();
    }

    protected build()
    {
        const { min: boxMin, max: boxMax } = this.box;
        const length = this.props.length;
        const min = [ boxMin.x, boxMin.y, boxMin.z ];
        const max = [ boxMax.x, boxMax.y, boxMax.z ];
        const size = [ (max[0] - min[0]) * length, (max[1] - min[1]) * length, (max[2] - min[2]) * length ];
        let vertices :number[];
        let colors :number[];
        let has_volume = isFinite(size[0]) && isFinite(size[1]) && isFinite(size[2])
        if ( has_volume && this.props.axes){
            vertices = [
                0, 0, 0,	length, 0, 0,   0, 0, 0,
                0, 0, 0,	0, length, 0,   0, 0, 0,
                0, 0, 0,	0, 0, length,   0, 0, 0,
            ];
            colors = [
                .65, .23, .29,	.65, .23, .29, .65, .23, .29, 
                .43, .63, .11,	.43, .63, .11,	.43, .63, .11,
                .25, .3, .88,	.25, .3, .88,	.25, .3, .88,

            ];
        }else if(has_volume) {
            vertices = [
                min[0], min[1], min[2], min[0] + size[0], min[1], min[2],
                min[0], min[1], min[2], min[0], min[1] + size[1], min[2],
                min[0], min[1], min[2], min[0], min[1], min[2] + size[2],

                max[0], min[1], min[2], max[0] - size[0], min[1], min[2],
                max[0], min[1], min[2], max[0], min[1] + size[1], min[2],
                max[0], min[1], min[2], max[0], min[1], min[2] + size[2],

                min[0], max[1], min[2], min[0] + size[0], max[1], min[2],
                min[0], max[1], min[2], min[0], max[1] - size[1], min[2],
                min[0], max[1], min[2], min[0], max[1], min[2] + size[2],

                min[0], min[1], max[2], min[0] + size[0], min[1], max[2],
                min[0], min[1], max[2], min[0], min[1] + size[1], max[2],
                min[0], min[1], max[2], min[0], min[1], max[2] - size[2],

                min[0], max[1], max[2], min[0] + size[0], max[1], max[2],
                min[0], max[1], max[2], min[0], max[1] - size[1], max[2],
                min[0], max[1], max[2], min[0], max[1], max[2] - size[2],

                max[0], min[1], max[2], max[0] - size[0], min[1], max[2],
                max[0], min[1], max[2], max[0], min[1] + size[1], max[2],
                max[0], min[1], max[2], max[0], min[1], max[2] - size[2],

                max[0], max[1], min[2], max[0] - size[0], max[1], min[2],
                max[0], max[1], min[2], max[0], max[1] - size[1], min[2],
                max[0], max[1], min[2], max[0], max[1], min[2] + size[2],

                max[0], max[1], max[2], max[0] - size[0], max[1], max[2],
                max[0], max[1], max[2], max[0], max[1] - size[1], max[2],
                max[0], max[1], max[2], max[0], max[1], max[2] - size[2],
            ];
        }else {
            vertices = [
                -1, 0, 0, 1, 0, 0,
                0, -1, 0, 0, 1, 0,
                0, 0, -1, 0, 0, 1,
            ];
        }

        this.geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
        if(colors) this.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
        (this.material as LineBasicMaterial).vertexColors = !!colors;
    }
}