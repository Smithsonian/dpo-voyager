/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
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

import { Material, Vector3 } from "three";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new Vector3( 1, 0, 0 );

// Inject/replace custom functionality in common vertex shaders
export function injectVertexShaderCode(shader: string) : string {
    shader = '// Zone map support\n \
        #if defined(USE_ZONEMAP)\n \
            varying vec2 vZoneUv;\n \
        #endif\n \
        \n \
        #ifdef MODE_XRAY\n \
            varying float vIntensity;\n \
        #endif\n \
        \n'.concat(shader);

    shader = shader.slice(0,shader.lastIndexOf('}')).concat(
        '\n \
        #ifdef MODE_NORMALS\n \
            vNormal = normal;\n \
        #endif\n \
        \n \
        #ifdef MODE_XRAY\n \
            vIntensity = pow(abs(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 3.0);\n \
        #endif\n \
        \n \
        // Zone map support\n \
        #if defined(USE_ZONEMAP)\n \
            #if defined(USE_MAP)\n \
                vZoneUv = (mapTransform * vec3(vMapUv, 1)).xy;\n \
            #else\n \
                vZoneUv = uv;\n \
            #endif\n \
        #endif\n \
        }'
    )

    return shader;
}

// Inject/replace custom functionality in common fragment shaders
export function injectFragmentShaderCode(shader: string) {
    shader = shader.replace(
        'void main() {',
        '// Zone map support\n \
        #if defined(USE_ZONEMAP)\n \
            varying vec2 vZoneUv;\n \
            uniform sampler2D zoneMap;\n \
        #endif\n \
        \n \
        #ifdef MODE_XRAY\n \
            varying float vIntensity;\n \
        #endif\n \
        \n \
        #ifdef CUT_PLANE\n \
            uniform vec3 cutPlaneColor;\n \
        #endif\n \
        \n \
        void main() {'
    )

    shader = shader.replace(
        '#include <opaque_fragment>',
        '#include <opaque_fragment>\n \
        \n \
        #ifdef USE_ZONEMAP\n \
            vec4 zoneColor = texture2D(zoneMap, vZoneUv);\n \
        \n \
            #ifdef OVERLAY_ALPHA\n \
                gl_FragColor += mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(zoneColor.rgb, 1.0), zoneColor.a);\n \
            #endif\n \
            #ifndef OVERLAY_ALPHA\n \
                gl_FragColor = mix(gl_FragColor, vec4(zoneColor.rgb, 1.0), zoneColor.a);\n \
            #endif\n \
        #endif\n \
        \n'
    )

    shader = shader.slice(0,shader.lastIndexOf('}')).concat(
        '\n \
        #ifdef CUT_PLANE\n \
        if (!gl_FrontFacing) {\n \
            gl_FragColor = vec4(cutPlaneColor.rgb, 1.0);\n \
        }\n \
        #endif\n \
        \n \
        #ifdef MODE_NORMALS\n \
            gl_FragColor = vec4(vec3(normal * 0.5 + 0.5), 1.0);\n \
        #endif\n \
        \n \
        #ifdef MODE_XRAY\n \
            gl_FragColor = vec4(vec3(0.4, 0.7, 1.0) * vIntensity, 1.0);\n \
        #endif\n \
        }'
    )

    return shader;
}

// Add custom material defines
export function addCustomMaterialDefines(material: Material) {
    material.defines ??= {};

    material.defines["OBJECTSPACE_NORMALMAP"] = false;
    material.defines["MODE_NORMALS"] = false;
    material.defines["MODE_XRAY"] = false;
    material.defines["CUT_PLANE"] = false;
    material.defines["USE_ZONEMAP"] = false;
    material.defines["OVERLAY_ALPHA"] = false;
}

// Helper function to extend shaders (provides a clean scope)
export function extendShaders(material: Material) {
    const uniforms = {
        cutPlaneColor: { value: _vec3 },
        zoneMap: { value: null }
    };

    material.onBeforeCompile = (shader) => {
        shader.vertexShader = injectVertexShaderCode(shader.vertexShader);
        shader.fragmentShader = injectFragmentShaderCode(shader.fragmentShader);

        // add custom uniforms
        shader.uniforms.cutPlaneColor = uniforms.cutPlaneColor;
        shader.uniforms.zoneMap = uniforms.zoneMap;
        material.userData.shader = shader;
    }
}