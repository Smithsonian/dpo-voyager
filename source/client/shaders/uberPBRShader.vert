//#define PHYSICAL
//#define STANDARD

varying vec3 vViewPosition;

#if defined(USE_TRANSMISSION)

	varying vec3 vWorldPosition;

#endif

// Zone map support
#if defined(USE_ZONEMAP)	
	varying vec2 vZoneUv;
#endif

#ifdef MODE_XRAY
    varying float vIntensity;
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

void main() {

	#include <uv_vertex>

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

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>

	#include <shadowmap_vertex>
	#include <fog_vertex>

#ifdef USE_TRANSMISSION

	vWorldPosition = worldPosition.xyz;

#endif

#ifdef MODE_XRAY
    vIntensity = pow(abs(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 3.0);
#endif

// Zone map support
#if defined(USE_ZONEMAP)
	#if defined(USE_MAP)
		vZoneUv = (mapTransform * vec3(vMapUv, 1)).xy;
	#else
		vZoneUv = uv;
	#endif
#endif

#ifdef MODE_NORMALS
    vNormal = normal;
#endif
}