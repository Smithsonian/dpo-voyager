export const vertex = /* glsl */ `
#define PHONG

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif

#include <common>

//#include <uv_pars_vertex>
//#include <uv2_pars_vertex>
// REPLACED WITH
#if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP) || defined(USE_EMISSIVEMAP) || defined(USE_ROUGHNESSMAP) || defined(USE_METALNESSMAP) || defined(USE_LIGHTMAP) || defined(USE_AOMAP)
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif

#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

void main() {

//	#include <uv_vertex>
//	#include <uv2_vertex>
//  REPLACED WITH
#if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP) || defined(USE_EMISSIVEMAP) || defined(USE_ROUGHNESSMAP) || defined(USE_METALNESSMAP) || defined(USE_LIGHTMAP) || defined(USE_AOMAP)
	vUv = (uvTransform * vec3(uv, 1)).xy;
#endif

	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
	vNormal = normalize(transformedNormal);
#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = -mvPosition.xyz;

	// #include <worldpos_vertex>
	// REPLACED WITH
	#if defined(USE_ENVMAP) || defined(DISTANCE) || defined(USE_SHADOWMAP) || defined(CUT_PLANE)
    	vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
    #endif

	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef MODE_XRAY
    vec3 viewNormal = normalize(normalMatrix * objectNormal);
    vIntensity = pow(abs(1.0 - abs(dot(viewNormal, vec3(0.0, 0.0, 1.0)))), 3.0);
#endif

#ifdef MODE_NORMALS
    vNormal = normal;
#endif
}
`

export const fragment = /* glsl */ `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>

//#include <uv_pars_fragment>
//#include <uv2_pars_fragment>
// REPLACED WITH
#if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP) || defined(USE_EMISSIVEMAP) || defined(USE_ROUGHNESSMAP) || defined(USE_METALNESSMAP) || defined(USE_LIGHTMAP) || defined(USE_AOMAP)
	varying vec2 vUv;
#endif

#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_AOMAP
    uniform vec3 aoMapMix;
#endif

#if defined(USE_NORMALMAP) && defined(USE_OBJECTSPACE_NORMALMAP)
    uniform mat3 normalMatrix;
#endif

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	//#include <aomap_fragment>
	// REPLACED WITH
	#ifdef USE_AOMAP
    	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
    	vec3 aoSample = texture2D(aoMap, vUv).rgb;
    	vec3 aoFactors = mix(vec3(1.0), aoSample, clamp(aoMapMix * aoMapIntensity, 0.0, 1.0));
    	float ambientOcclusion = aoFactors.x * aoFactors.y * aoFactors.z;
    	float ambientOcclusion2 = ambientOcclusion * ambientOcclusion;
    	reflectedLight.directDiffuse *= ambientOcclusion2;
    	reflectedLight.directSpecular *= ambientOcclusion;
    	//reflectedLight.indirectDiffuse *= ambientOcclusion;

    	#if defined(USE_ENVMAP) && defined(PHYSICAL)
    		float dotNV = saturate(dot(geometry.normal, geometry.viewDir));
    		reflectedLight.indirectSpecular *= computeSpecularOcclusion(dotNV, ambientOcclusion, material.specularRoughness);
    	#endif
    #endif

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

    #ifdef MODE_NORMALS
        gl_FragColor = vec4(vec3(normal * 0.5 + 0.5), 1.0);
    #endif

    #ifdef MODE_XRAY
        gl_FragColor = vec4(vec3(0.4, 0.7, 1.0) * vIntensity, 1.0);
    #endif
}
`