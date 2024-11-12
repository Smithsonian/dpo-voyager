/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
  Object3D,
  Vector3,
  Matrix4,
  Box3,
  Color,
  Material,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Sphere,
} from "three";

import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

import { computeLocalBoundingBox } from "./helpers";

////////////////////////////////////////////////////////////////////////////////

export interface IAxesProps
{
  /** 
   * Color of the bracket lines. Default is to use color-coded xyz axes
   * If four colors are provided, the first one will be used to show the origin point
   */
  colors?: [Color, Color, Color]| [Color, Color, Color, Color];
  /** Length of the bracket lines relative to the size of the object. Default is 0.25. */
  length?: number;
  width?:number;
  depthTest?: boolean,
}

/**
* Wireframe selection bracket.
*/
export default class Axes extends LineSegments2
{
  static readonly defaultProps = {
      length: 0.15,
      width: 2,
      depthTest: false,
      colors: [new Color(0xffd633), new Color(0xa63b4a), new Color(0x6fa21c), new Color(0x2f83e1)],
  };

  private originPoint?:Points;

  constructor(target: Object3D, props?: IAxesProps)
  {
      props = Object.assign({}, Axes.defaultProps, props);

      const box = new Box3();
      box.makeEmpty();

      computeLocalBoundingBox(target, box);

      const size = (box.isEmpty()? 1: box.getBoundingSphere(new Sphere()).radius) * props.length;

      const originColor :Color = props.colors.length === 4? props.colors[0]: null;

      let vertices :number[] = [
          0, 0, 0,	size, 0, 0,
          0, 0, 0,	0, size, 0,
          0, 0, 0,	0, 0, size,
      ];


      let colors :number[] = [];
      for(let color of props.colors.slice(-3)){
        let a = color.toArray();
        colors.push(...a, ...a);
      }

      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(vertices);
      geometry.setColors(colors);

      const material = new LineMaterial({
          vertexColors: true,
          toneMapped: false,
          depthTest: props.depthTest,
          worldUnits: false, //Disables size attenuation
          linewidth: props.width,
      });

      super(geometry, material);

      if(originColor){
        const originGeometry = new BufferGeometry();
        originGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3));
        const originMaterial = new PointsMaterial({ 
            size: props.width+1,
            toneMapped: false,
            color: originColor,
            sizeAttenuation: false,
            depthTest: props.depthTest
        });
        this.originPoint = new Points(originGeometry, originMaterial);
        this.originPoint.renderOrder = 2;
        this.add(this.originPoint);
      }

      this.renderOrder = 2;
      this.update();
  }

  update(){
    
  }

  dispose()
  {
      if(this.originPoint){
          this.remove(this.originPoint);
          this.originPoint.geometry.dispose();
          (this.originPoint.material as Material).dispose();
      }

      this.geometry.dispose();
      (this.material as Material).dispose();
  }
}