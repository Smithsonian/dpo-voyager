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
    Vector3,
    Matrix4,
    Box3,
    Color,
    Points,
    PointsMaterial,
} from "three";

import { computeLocalBoundingBox } from "./helpers";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3();
const _mat4 = new Matrix4();

export interface IBracketProps
{
    /** Color of the bracket lines. Default is white. */
    color?: Color;
    /** Length of the bracket lines relative to the size of the object. Default is 0.25. */
    length?: number;
    axes?:boolean;
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

    constructor(target: Object3D, props?: IBracketProps)
    {
        props = Object.assign({}, Bracket.defaultProps, props);

        const box = new Box3();
        box.makeEmpty();

        computeLocalBoundingBox(target, box);

        const length = props.length;
        const min = [ box.min.x, box.min.y, box.min.z ];
        const max = [ box.max.x, box.max.y, box.max.z ];
        const size = [ (max[0] - min[0]) * length, (max[1] - min[1]) * length, (max[2] - min[2]) * length ];
        let vertices :number[];
        let colors :number[];
        let has_volume = isFinite(size[0]) && isFinite(size[1]) && isFinite(size[2])
        if ( has_volume && props.axes){
            vertices = [
                0, 0, 0,	length, 0, 0,
                0, 0, 0,	0, length, 0,
                0, 0, 0,	0, 0, length,
            ];
            colors = [
                1, 0, 0,	1, 0.6, 0,
                0, 1, 0,	0.6, 1, 0,
                0, 0, 1,	0, 0.6, 1

            ]
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

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
        if(colors) geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
        const material = new LineBasicMaterial({
            color: props.color,
            vertexColors: !!colors,
            
            depthTest: false
        });

        super(geometry, material);

        // Origin, as in "geometry's internal (0,0,0) point". We generally don't need this?
        // const originGeometry = new BufferGeometry();
        // originGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3));
        // const originMaterial = new PointsMaterial({ 
        //     size: 3,
        //     color: props.color,
        //     sizeAttenuation: false,
        //     depthTest: false
        // });
        // const originPoint = new Points(originGeometry, originMaterial);
        // originPoint.renderOrder = 2;
        // this.add(originPoint);



        this.renderOrder = 1;
    }

    dispose()
    {
        if (this.parent) {
            this.parent.remove(this);
        }

        this.geometry.dispose();
    }

    protected static expandBoundingBox(object: Object3D, root: Object3D, box: Box3)
    {
        const geometry = (object as any).geometry;
        if (geometry !== undefined) {

            let parent = object;
            _mat4.identity();
            while(parent && parent !== root) {
                _mat4.premultiply(parent.matrix);
                parent = parent.parent;
            }

            if (geometry.isGeometry) {
                const vertices = geometry.vertices;
                for (let i = 0, n = vertices.length; i < n; ++i) {
                    _vec3.copy(vertices[i]).applyMatrix4(_mat4);
                    box.expandByPoint(_vec3);
                }
            }
            else if (geometry.isBufferGeometry) {
                const attribute = geometry.attributes.position;
                if (attribute !== undefined) {
                    for (let i = 0, n = attribute.count; i < n; ++i) {
                        _vec3.fromBufferAttribute(attribute, i).applyMatrix4(_mat4);
                        box.expandByPoint(_vec3);
                    }
                }
            }
        }

        const children = object.children;
        for (let i = 0, n = children.length; i < n; ++i) {
            Bracket.expandBoundingBox(children[i], root, box);
        }
    }
}