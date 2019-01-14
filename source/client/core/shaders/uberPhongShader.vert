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