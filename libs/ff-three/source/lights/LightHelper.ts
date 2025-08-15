import { Object3D, ColorRepresentation, Material, MeshBasicMaterial,  Light, SphereGeometry, WireframeGeometry, LineSegments, LineBasicMaterial } from "three";




export default class LightHelper extends Object3D {
  public readonly type :string = 'LightHelper';
  public light :Light;
 
  protected material :LineBasicMaterial;
  protected source :LineSegments;

	constructor( light:Light, size :number = 1) {

		super();

		this.light = light;


    this.material = new LineBasicMaterial({
      opacity: 0.8,
      transparent: true,
      toneMapped: false,
    });
    this.material.color = this.light.color;

    //Ponctual light indicator
    this.source = new LineSegments(
      new WireframeGeometry(new SphereGeometry(size/10, 8, 4)),
      this.material,
    );
    this.add(this.source);
  }

  update(){
        if (!this.light.parent) {
          console.debug("Light has been deleted.")
          this.dispose();
          this.source.geometry.dispose(); // FIXME: this does not remove the visible indicator
        }
  }

	dispose() {
    this.source.geometry.dispose();
    this.material.dispose();
	}

}