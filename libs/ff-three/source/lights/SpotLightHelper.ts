import { ColorRepresentation, SpotLight, WireframeGeometry, LineSegments, ConeGeometry } from "three";

import DirectionalLightHelper from "./DirectionalLightHelper";



export default class SpotLightHelper extends DirectionalLightHelper {
  public readonly type = 'SpotLightHelper';
  light :SpotLight;

  protected cone :LineSegments;

	constructor( light :SpotLight) {

		super(light as any, 0.6);
    this.targetMaterial.depthTest = true;


    this.cone = new LineSegments(
      new WireframeGeometry(new ConeGeometry(1, 1, 16, 1, true)),
      this.material,
    );
    this.cone.matrixAutoUpdate = false;
    this.cone.position.set(0, -0.5*length, 0);
    this.cone.updateMatrix();
    this.add(this.cone);
	}

  update(){
    let length = this.light.distance || this.light.shadow.camera.far;
    let r = Math.min(Math.tan(this.light.angle), 1000)*length;
    this.cone.scale.set(r, length, r);
    this.cone.position.set(0, -0.5*length, 0);
    this.cone.updateMatrix();
    super.update()
  }

	dispose() {
    this.cone.geometry.dispose();
    super.dispose();
	}

}
