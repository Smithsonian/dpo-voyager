import {  BoxGeometry, FrontSide, Mesh, MeshBasicMaterial, Object3D, RectAreaLight } from "three";

import {Line2} from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";


export default class RectLightHelper extends Object3D {
  public readonly type :string = 'RectLightHelper';
  light :RectAreaLight;

  protected lines :LineSegments2;
  protected area :Mesh;

	constructor( light :RectAreaLight) {

		super();
    this.light = light;
    const material = new LineMaterial({
      opacity: 0.8,
      transparent: true,
      toneMapped: false,
      worldUnits: false,
      
      linewidth: 2,
    });
    material.color = this.light.color;

    this.lines = new LineSegments2(
      new LineSegmentsGeometry().setPositions([
        0, 0, 0,        0, 0, -1,
        5, -5, 0,     5, 5, 0,
        5, 5, 0,      -5, 5, 0,
        -5, 5, 0,     -5, -5, 0,
        -5, -5, 0,    5, -5, 0,
      ]),
      material
    );
    this.add(this.lines);

    const boxMats = [
      null, null, null, null,
      new MeshBasicMaterial({
        opacity: 0.1, //Back side
        transparent: true,
        toneMapped: false,
        side: FrontSide,
      }),
      new MeshBasicMaterial({
        opacity: 0.4, //Front side
        transparent: true,
        toneMapped: false,
        side: FrontSide,
      }),
    ];
    boxMats[4].color = boxMats[5].color = light.color;

    this.area = new Mesh(
      new BoxGeometry(10, 10, 0),
      boxMats,
    )
    this.add(this.area)
	}

  update(){

  }

	dispose() {
    this.lines.geometry.dispose();
    this.area.geometry.dispose();

    (this.lines.material as LineMaterial).dispose();
    let mats = (this.area.material as MeshBasicMaterial[]);
    mats[4].dispose();
    mats[5].dispose();
	}

}
