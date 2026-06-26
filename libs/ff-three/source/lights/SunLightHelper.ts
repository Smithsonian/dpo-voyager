/**
 * Funded by the Netherlands eScience Center in the context of the
 * [Dynamic 3D]{@link https://research-software-directory.org/projects/dynamic3d} project
 * and the "Paradata in 3D Scholarship" workshop {@link https://research-software-directory.org/projects/paradata-in-3d-scholarship}
 *
 * @author Carsten Schnober <c.schnober@esciencecenter.nl>
 */

import { DirectionalLight, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from "three";
import DirectionalLightHelper from "./DirectionalLightHelper";

const _vec3 = new Vector3();

export default class SunLightHelper extends DirectionalLightHelper {
    public readonly type: string = 'SunLightHelper';
    light: DirectionalLight;

    private _cachedIntensity = 0;

    protected sun: Mesh;

    constructor(light: DirectionalLight, size: number = 1) {
        super(light, size);

        const sunGeometry = new SphereGeometry(size/2, 16, 16);
        const sunMaterial = new MeshBasicMaterial({
            color: this.light.color,
            opacity: 0.6,
            transparent: true,
            toneMapped: false,
            depthTest: false,
            depthWrite: false,
        });

        this.sun = new Mesh(sunGeometry, sunMaterial);
        this.sun.renderOrder = 2;
        this.target.frustumCulled = false;
        this.target.matrixWorldAutoUpdate = false;

        this.add(this.sun);
    }

    update() {
        if (this.sun.material instanceof MeshBasicMaterial &&
            (!(this.light.intensity === this._cachedIntensity) || this.light.intensity === 0)) 
        {
            this.sun.material.color.set(this.light.color);
            this.sun.material.needsUpdate = true;

            this.sun.getWorldPosition(_vec3);
            const startPos = this.target.geometry.getAttribute('instanceStart');
            const endPos = this.target.geometry.getAttribute('instanceEnd');
           
            startPos.setXYZ(0, _vec3.x, _vec3.y, _vec3.z);
            endPos.setXYZ(0, 0, 0, 0);
            startPos.needsUpdate = true;
            endPos.needsUpdate = true;

            this._cachedIntensity = this.light.intensity;
        }
    }

    dispose() {
        this.sun.geometry.dispose();
        if (this.sun.material instanceof MeshBasicMaterial) {
            this.sun.material.dispose();
        }
        super.dispose();
    }
}
