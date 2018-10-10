/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

type DefaultLightSet = "interior" | "exterior";

export default class DefaultLights extends THREE.Group
{
    protected lights: THREE.Light[];

    constructor(set?: DefaultLightSet)
    {
        super();
        this.lights = [];

        this.createLights(set || "interior");
    }

    protected createLights(set: DefaultLightSet)
    {
        let light: THREE.DirectionalLight;

        switch(set) {
            case "interior":
                // Light 1: warm, front right up
                light = new THREE.DirectionalLight(0xffeedd, 1.0);
                light.position.set(2, 1.3, 2.5);
                this.addLight(light);

                // Light 2: blueish, below, front left
                light = new THREE.DirectionalLight(0x283d4c, 1.0);
                light.position.set(-1.5, -2, 0.5);
                this.addLight(light);

                // Light 3: warm, back left
                light = new THREE.DirectionalLight(0xffeedd, 1.0);
                light.position.set(-2.5, 2, -2);
                this.addLight(light);

                // Light 4: blueish, below, back right
                light = new THREE.DirectionalLight(0x365166, 1.0);
                light.position.set(1.5, -2, -0.5);
                this.addLight(light);
                break;
            case "exterior":
                break;
        }

    }

    protected addLight(light: THREE.Light)
    {
        this.lights.push(light);
        this.add(light);
    }
}