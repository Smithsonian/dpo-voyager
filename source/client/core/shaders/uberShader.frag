#define STANDARD

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
// REPLACED WITH
#if defined(USE_MAP) || defined(USE_BUMPMAP) || defined(USE_NORMALMAP) || defined(USE_SPECULARMAP) || defined(USE_ALPHAMAP) || defined(USE_EMISSIVEMAP) || defined(USE_ROUGHNESSMAP) || defined(USE_METALNESSMAP) || defined(USE_LIGHTMAP) || defined(USE_AOMAP)
	varying vec2 vUv;
#endif

//#include <uv2_pars_fragment>
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
//#include <lights_pars_maps>
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
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>

	//#include <normal_fragment>
	// REPLACED WITH
	#ifdef FLAT_SHADED
    	// Workaround for Adreno/Nexus5 not able able to do dFdx( vViewPosition ) ...
    	vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );
    	vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );
    	vec3 normal = normalize( cross( fdx, fdy ) );
    #else
    	vec3 normal = normalize( vNormal );

      #ifdef DOUBLE_SIDED
    	normal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
      #endif
    #endif

    #ifdef USE_NORMALMAP
      #ifdef USE_OBJECTSPACE_NORMALMAP
        normal = normalize(normalMatrix * (texture2D(normalMap, vUv).xyz * 2.0 - 1.0));
      #else
    	normal = perturbNormal2Arb( -vViewPosition, normal );
      #endif
    #elif defined( USE_BUMPMAP )
    	normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );
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
