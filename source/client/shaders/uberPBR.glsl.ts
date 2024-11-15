export const vertex = /* glsl */ `
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
`
export const fragment = /* glsl */ `
//#define STANDARD

#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef IOR
	uniform float ior;
#endif

#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;

	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif

	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif

#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif

#ifdef USE_DISPERSION
	uniform float dispersion;
#endif

#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif

#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;

	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif

	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif

#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;

	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif

varying vec3 vViewPosition;


#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>

#include <uv_pars_fragment>

// Zone map support
#if defined(USE_ZONEMAP)
	varying vec2 vZoneUv;
#endif

#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
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

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
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

    #include <clearcoat_normal_fragment_begin>
    #include <clearcoat_normal_fragment_maps>
    #include <emissivemap_fragment>
	
	// accumulation
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

	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	#include <transmission_fragment>

	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

    #ifdef USE_SHEEN

		// Sheen energy compensation approximation calculation can be found at the end of
		// https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view?usp=sharing
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );

		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;

	#endif

	#ifdef USE_CLEARCOAT

		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );

		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;

	#endif

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
`