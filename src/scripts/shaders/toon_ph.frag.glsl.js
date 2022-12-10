/**
 * This file was modified from the THREE.js Phong shader and much of the code remains exactly the same.
 * Changes for the toon shading effect are placed at the end of the shader and are marked with comments.
 * I do not claim ownership of the original code.
 *
 * Addendum: This was a primarily educational project. This toon shader is obviously not needed in practical
 * applications, as THREE.js already has a toon shader. But the toon shading process is highlighted in my
 * code and is much more readable than digging through the THREE.js version.
 */
export default /* glsl */ `
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
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
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
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

    /** TOON SHADING MODIFICATIONS START HERE ************************************************************************/
    // Now try to set all colors to some preset magnitudes
    vec3 old_light = outgoingLight;
    // Determine what the thresholds should be based on number of thresholds
    // and maximum color intensity
    const int numThresholds = 4;
    float maxThreshold = sqrt(3.0);
    float minThreshold = 0.0;
    float thresholds[numThresholds];
    for (int i = 0; i < numThresholds; i++) {
      thresholds[i] = minThreshold + (maxThreshold - minThreshold) * (float(i) / float(numThresholds - 1));
    }
    // Get the magnitude of the color
    float mag = length(old_light);
    // Get the index of the threshold that is closest to the magnitude
    int index = 0;
    for (int i = 0; i < numThresholds; i++) {
        if (abs(thresholds[i] - mag) < abs(thresholds[index] - mag)) {
            index = i;
        }
    }
	// Determine the new light color
	vec3 toon_light = old_light * (thresholds[index] / mag);
    // Scale the color so its magnitude is equal to the threshold
	gl_FragColor = vec4( toon_light, diffuseColor.a );
    /** TOON SHADING MODIFICATIONS END HERE **************************************************************************/

}
`;
