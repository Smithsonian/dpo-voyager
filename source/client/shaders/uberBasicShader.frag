uniform vec3 diffuse;
uniform float opacity;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

// Zone map support
#if defined(USE_ZONEMAP)
	varying vec2 vZoneUv;
#endif

#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_ZONEMAP
	uniform sampler2D zoneMap;
#endif

#ifdef USE_AOMAP
    uniform vec3 aoMapMix;
#endif

#ifdef MODE_XRAY
    varying float vIntensity;
#endif

#ifdef CUT_PLANE
	#if !defined(USE_TRANSMISSION)
    	varying vec3 vWorldPosition;
	#endif
    uniform vec4 cutPlaneDirection;
    uniform vec3 cutPlaneColor;
#endif

void main() {
	#ifdef CUT_PLANE
        if (dot(vWorldPosition, cutPlaneDirection.xyz) < -cutPlaneDirection.w) {
            discard;
        }
    #endif

	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>

	#ifdef CUT_PLANE
	    // on the cut surface (back facing fragments revealed), replace normal with cut plane direction
        if (!gl_FrontFacing) {
            normal = -cutPlaneDirection.xyz;
            diffuseColor.rgb = cutPlaneColor.rgb;
        }
	#endif

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

	// accumulation (baked indirect lighting only)
	#ifdef USE_LIGHTMAP

		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;

	#else

		reflectedLight.indirectDiffuse += vec3( 1.0 );

	#endif

	// modulation
	//#include <aomap_fragment>
	// REPLACED WITH
	#ifdef USE_AOMAP
	    // if cut plane is enabled, disable ambient occlusion on back facing fragments
	    #ifdef CUT_PLANE
            if (gl_FrontFacing) {
	    #endif

    	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
    	vec3 aoSample = vec3(texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r,texture2D(aoMap, vAoMapUv).r);
    	vec3 aoFactors = mix(vec3(1.0), aoSample, clamp(aoMapMix * aoMapIntensity, 0.0, 1.0));
    	float ambientOcclusion = aoFactors.x * aoFactors.y * aoFactors.z;
    	float ambientOcclusion2 = ambientOcclusion * ambientOcclusion;
    	reflectedLight.directDiffuse *= ambientOcclusion2;
    	reflectedLight.directSpecular *= ambientOcclusion;
    	//reflectedLight.indirectDiffuse *= ambientOcclusion;

    	#if defined( USE_CLEARCOAT ) 
			clearcoatSpecularIndirect *= ambientOcclusion;
		#endif

		#if defined( USE_SHEEN ) 
			sheenSpecularIndirect *= ambientOcclusion;
		#endif

		#if defined( USE_ENVMAP ) && defined( STANDARD )

			float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );

			reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

		#endif

    	#ifdef CUT_PLANE
    	    }
    	#endif
    #endif

	reflectedLight.indirectDiffuse *= diffuseColor.rgb;

	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	#include <envmap_fragment>

	#ifdef CUT_PLANE
	if (!gl_FrontFacing) {
		outgoingLight = cutPlaneColor.rgb;
	}
	#endif

	#include <opaque_fragment>

	#ifdef USE_ZONEMAP
		vec4 zoneColor = texture2D(zoneMap, vZoneUv);

		#ifdef OVERLAY_ALPHA
			gl_FragColor += mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(zoneColor.rgb, 1.0), zoneColor.a);
		#endif
		#ifndef OVERLAY_ALPHA
			gl_FragColor = mix(gl_FragColor, vec4(zoneColor.rgb, 1.0), zoneColor.a);
		#endif
	#endif

	#include <tonemapping_fragment>
	#include <colorspace_fragment>
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