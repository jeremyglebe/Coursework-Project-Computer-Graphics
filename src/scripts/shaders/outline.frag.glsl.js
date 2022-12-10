export default /* glsl */ `
// <packing> comes from threejs and we are using its perspectiveDepthToViewZ and viewZToOrthographicDepth functions.
// This will ensure it easily works within the threejs ecosystem. (As opposed to writing our own functions)
#include <packing>
uniform sampler2D originalTexture;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform vec4 screenSize;
uniform vec3 outlineColor;
varying vec2 vUv;

// Function prototypes
float saturate(float num);
float depthAt(int x, int y);
vec3 normalAt(int x, int y);

void main() {
	vec4 sceneColor = texture2D(originalTexture, vUv);
	float depth = depthAt(0, 0);
	vec3 normal = normalAt(0, 0);

	// Get the difference between depth of neighboring pixels and current.
	float depthDiff = 0.0;
	depthDiff += abs(depth - depthAt(1, 0));
	depthDiff += abs(depth - depthAt(-1, 0));
	depthDiff += abs(depth - depthAt(0, 1));
	depthDiff += abs(depth - depthAt(0, -1));

	// Get the difference between normals of neighboring pixels and current
	float normalDiff = 0.0;
	normalDiff += distance(normal, normalAt(1, 0));
	normalDiff += distance(normal, normalAt(0, 1));
	normalDiff += distance(normal, normalAt(0, 1));
	normalDiff += distance(normal, normalAt(0, -1));

	normalDiff += distance(normal, normalAt(1, 1));
	normalDiff += distance(normal, normalAt(1, -1));
	normalDiff += distance(normal, normalAt(-1, 1));
	normalDiff += distance(normal, normalAt(-1, -1));

	depthDiff = saturate(depthDiff);
	normalDiff = saturate(normalDiff);


	float outline = normalDiff + depthDiff;
	// Combine outline with scene color.
	vec4 outlineColor = vec4(outlineColor, 1.0);
	gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));
}

float saturate(float num) {
	return clamp(num, 0.0, 1.0);
}

float depthAt(int x, int y) {
	// Get point from texture coordinates and screen size.
	vec2 point = vUv + screenSize.zw * vec2(x, y);
	// Sample depth texture and get z value.
	float fragCoordZ = texture2D(depthTexture, point).x;
	// Convert from clip space to view space.
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	// Convert from view space to orthographic depth.
	float orthoDepth = viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
	return orthoDepth;
}

vec3 normalAt(int x, int y) {
	return texture2D(normalTexture, vUv + screenSize.zw * vec2(x, y)).rgb;
}
`;
