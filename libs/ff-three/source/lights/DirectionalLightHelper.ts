import { SpotLight, DirectionalLight, Light } from "three";
import LightHelper from "./LightHelper";

import {Line2} from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

type TargetLight = Light & (DirectionalLight|SpotLight);

export default class DirectionalLightHelper extends LightHelper {
  public readonly type :string = 'DirectionalLightHelper';
  light :TargetLight;

  protected target :Line2;
  protected targetMaterial :LineMaterial;

	constructor( light :TargetLight, size ?:number) {

		super(light, size);

    this.targetMaterial = new LineMaterial({
      opacity: 0.8,
      transparent: true,
      toneMapped: false,
      depthTest: false, //Directional lights have no real "position" so there is no point in using depth
      worldUnits: false,
      
      linewidth: 2,
    });
    this.targetMaterial.color = this.light.color;
    this.target = new Line2(
      new LineGeometry().setPositions([
        0, 0, 0, ...light.target.position.toArray(),
      ]),
      this.targetMaterial
    );
    this.target.scale.setScalar(1);
    this.target.matrixAutoUpdate = false;
    this.target.renderOrder = 2;
    this.add(this.target);
	}

  update(){
    super.update();
    if (this.light.parent) {
      this.target.scale.setScalar(this.light.parent.position.length() / this.light.parent.scale.y);
      this.target.updateMatrix();
    }
  }

	dispose() {
    this.target.geometry.dispose();
    super.dispose();
	}

}
