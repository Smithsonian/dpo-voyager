import { MeshBasicMaterial, Mesh, SphereGeometry, PointLight } from "three";
import LightHelper from "./LightHelper";


export default class PointLightHelper extends LightHelper {
  public readonly type = 'PointLightHelper';
  light :PointLight;

  protected distance :Mesh;

	constructor( light :PointLight) {

		super(light, 0.6);

    this.distance = new Mesh(
      new SphereGeometry(1),
      new MeshBasicMaterial({
        opacity: 0.15,
        transparent: true,
      }),
    );
    (this.distance.material as MeshBasicMaterial).color = light.color;
    this.distance.matrixAutoUpdate = false;
    this.add(this.distance);
	}

  update(){
    super.update();
    this.distance.scale.setScalar(this.light.distance);
    this.distance.updateMatrix()

  }

	dispose() {
    this.distance.geometry.dispose();
    (this.distance.material as MeshBasicMaterial).dispose();
    super.dispose();
	}

}
