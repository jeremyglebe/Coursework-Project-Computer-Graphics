export default /* glsl */ `
// <packing> comes from threejs and we are using its perspectiveDepthToViewZ and viewZToOrthographicDepth functions.
// This will ensure it easily works within the threejs ecosystem. (As opposed to writing our own functions)
#include <packing>
uniform sampler2D originalTexture;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform vec2 scrRatios;
uniform vec3 outlineColor;
varying vec2 vUv;

// Function prototypes
float saturate(float num);
float depthAt(int x, int y);
vec3 normalAt(int x, int y);

void main() {
	vec4 original = texture2D(originalTexture, vUv);
	float depth = depthAt(0, 0);
	vec3 normal = normalAt(0, 0);

	// Get the difference between depth of neighboring pixels and current.
	float depth_variance = 0.0;
	depth_variance += abs(depth - depthAt(1, 0));
	depth_variance += abs(depth - depthAt(-1, 0));
	depth_variance += abs(depth - depthAt(0, 1));
	depth_variance += abs(depth - depthAt(0, -1));

	// Get the difference between normals of neighboring pixels and current
	float norm_variance = 0.0;
	norm_variance += distance(normal, normalAt(1, 0));
	norm_variance += distance(normal, normalAt(0, 1));
	norm_variance += distance(normal, normalAt(0, 1));
	norm_variance += distance(normal, normalAt(0, -1));

	norm_variance += distance(normal, normalAt(1, 1));
	norm_variance += distance(normal, normalAt(1, -1));
	norm_variance += distance(normal, normalAt(-1, 1));
	norm_variance += distance(normal, normalAt(-1, -1));

	depth_variance = saturate(depth_variance);
	norm_variance = saturate(norm_variance);


	float outline_lerp_value = norm_variance + depth_variance;
	// Combine outline with scene color.
	vec4 outline_solid = vec4(outlineColor, 1.0);
	gl_FragColor = vec4(mix(original, outline_solid, outline_lerp_value));
}

float saturate(float num) {
	return clamp(num, 0.0, 1.0);
}

float depthAt(int x, int y) {
	// Get point from texture coordinates and screen size.
	vec2 point = vUv + scrRatios * vec2(x, y);
	// Sample depth texture and get z value.
	float fragCoordZ = texture2D(depthTexture, point).x;
	// Convert from clip space to view space.
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	// Convert from view space to orthographic depth.
	float orthoDepth = viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
	return orthoDepth;
}

vec3 normalAt(int x, int y) {
	return texture2D(normalTexture, vUv + scrRatios * vec2(x, y)).rgb;
}
`;
