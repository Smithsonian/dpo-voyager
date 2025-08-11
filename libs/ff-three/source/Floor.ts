/**
 * FF Typescript Foundation Library
 * Copyright 2020 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Mesh,
    PlaneGeometry,
    MathUtils,
    MeshStandardMaterial,
} from "three";

////////////////////////////////////////////////////////////////////////////////

export default class Floor extends Mesh
{
    geometry: PlaneGeometry;
    material: MeshStandardMaterial;

    constructor()
    {
        super(
            new PlaneGeometry(2, 2, 1, 1),
            new MeshStandardMaterial({transparent: true})
        );

        this.geometry.rotateX(-90 * MathUtils.DEG2RAD);

        this.material.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_pars_vertex>',
                'varying vec2 vUv;\n \
                uniform mat3 uvTransform;'
            )
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_vertex>',
                '#include <uv_vertex>\n \
                vUv = ( vec3( uv, 1 ) ).xy;'
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <uv_pars_fragment>',
                'varying vec2 vUv;'
            )
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <opaque_fragment>',
                '#include <opaque_fragment>\n \
                \n \
                vec2 coords = vUv * 2.0 - 1.0;\n \
                float f = dot(coords, coords);\n \
	            gl_FragColor = vec4(outgoingLight, mix(diffuseColor.a, 0.0, f));\n \
                \n'
            )
        }

        this.receiveShadow = true;
    }

    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    }
}

