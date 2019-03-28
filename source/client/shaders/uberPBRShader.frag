//#define PHYSICAL

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifndef STANDARD
	uniform float clearCoat;
	uniform float clearCoatRoughness;
#endif

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif

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
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_AOMAP
    uniform vec3 aoMapMix;
#endif

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

#ifdef CUT_PLANE
    varying vec3 vWorldPosition;
    uniform vec4 cutPlaneDirection;
    uniform vec3 cutPlaneColor;
#endif

void main() {
    #ifdef CUT_PLANE
        if (dot(vWorldPosition, cutPlaneDirection.xyz) < -cutPlaneDirection.w) {
            discard;
        }
    #endif

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
    #include <normal_fragment_maps>

	#ifdef CUT_PLANE
	    // on the cut surface (back facing fragments revealed), replace normal with cut plane direction
        if (!gl_FrontFacing) {
            normal = -cutPlaneDirection.xyz;
            diffuseColor.rgb = cutPlaneColor.rgb;
        }
	#endif

	#include <emissivemap_fragment>

	// accumulation
    #if defined(USE_LIGHTMAP) || defined(USE_AOMAP)
        vec2 vUv2 = vUv;
    #endif

	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	//#include <aomap_fragment>
	// REPLACED WITH
	#ifdef USE_AOMAP
	    // if cut plane is enabled, disable ambient occlusion on back facing fragments
	    #ifdef CUT_PLANE
            if (gl_FrontFacing) {
	    #endif

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

    	#ifdef CUT_PLANE
    	    }
    	#endif
    #endif

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	gl_FragColor = vec4(outgoingLight, diffuseColor.a);

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
