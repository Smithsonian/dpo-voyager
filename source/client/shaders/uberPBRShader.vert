//#define PHYSICAL
//#define STANDARD

varying vec3 vViewPosition;

#if defined(USE_TRANSMISSION) || defined(CUT_PLANE)

	varying vec3 vWorldPosition;

#endif

// Zone map support
#if defined(USE_ZONEMAP)	
	varying vec2 vZoneUv;
#endif

#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

//#ifdef CUT_PLANE
//    varying vec3 vWorldPosition;
//#endif

void main() {

	#include <uv_vertex>

// Zone map support
#if defined(USE_ZONEMAP)
	#if defined(USE_MAP)
		vZoneUv = (mapTransform * vec3(vMapUv, 1)).xy;
	#else
		vZoneUv = uv;
	#endif
#endif

	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

#ifdef MODE_XRAY
    vIntensity = pow(abs(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 3.0);
#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	// #include <worldpos_vertex>
	// REPLACED WITH
	#if defined(USE_ENVMAP) || defined(DISTANCE) || defined(USE_SHADOWMAP) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0 || defined(CUT_PLANE)
    	vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
    #endif

	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef USE_TRANSMISSION

	vWorldPosition = worldPosition.xyz;

#endif

#ifdef CUT_PLANE
    vWorldPosition = worldPosition.xyz / worldPosition.w;
#endif

#ifdef MODE_NORMALS
    vNormal = normal;
#endif
}