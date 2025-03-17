import { ColorRepresentation, MeshBasicMaterial, Mesh, Light, SpotLight, SphereGeometry, PointLight, HemisphereLight, AmbientLight, Object3D, OctahedronGeometry, Color, PlaneGeometry, DoubleSide, BufferGeometry } from "three";
import LightHelper from "./LightHelper";

import {Line2} from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";

type SphereLight = AmbientLight|HemisphereLight;

export default class AmbientLightHelper extends Object3D {
  public readonly type = 'AmbientLightHelper';
  light :SphereLight;

  protected geometry :BufferGeometry;
  protected upper :Mesh;
  protected lower :Mesh;

	constructor( light :SphereLight, size :number = 1) {

		super();
    this.light = light;
    this.geometry =  new SphereGeometry( size/2, 8, 4, 0, Math.PI*2, 0, Math.PI/2 );
    this.upper = new Mesh(
     this.geometry,
      new MeshBasicMaterial({
        opacity: 0.4,
        transparent: true,
        toneMapped: false,
        side: DoubleSide,
      }),
    );
    this.upper.receiveShadow = false;
    console.log("Color", light.color);
    (this.upper.material as MeshBasicMaterial).color = light.color;
    this.add(this.upper);

    this.lower = new Mesh(
      this.geometry,
      new MeshBasicMaterial({
        opacity: 0.4,
        transparent: true,
        toneMapped: false,
        side: DoubleSide,
      }),
    );
    this.lower.rotateX(Math.PI);
    this.lower.updateMatrix();
    (this.lower.material as MeshBasicMaterial).color = ("groundColor" in light)? light.groundColor as Color : light.color;
    this.add(this.lower);
    this.position.set(0, -1, 0);

	}

  update(){

  }

	dispose() {
    this.geometry.dispose();
    (this.upper.material as MeshBasicMaterial).dispose();
    (this.lower.material as MeshBasicMaterial).dispose();
	}

}
