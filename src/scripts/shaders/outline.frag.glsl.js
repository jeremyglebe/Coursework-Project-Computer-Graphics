export default /* glsl */ `
// <packing> comes from threejs and we are using its perspectiveDepthToViewZ function. This will ensure it easily
// works within the threejs ecosystem. (As opposed to writing our own function)
#include <packing>
uniform sampler2D originalTexture;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform float cameraNear;
uniform float cameraFar;
uniform vec4 screenSize;
uniform vec3 outlineColor;
uniform vec4 multiplierParameters;
uniform int debugVisualize;
varying vec2 vUv;

// Helper functions for reading from depth buffer.
float readDepth (sampler2D depthSampler, vec2 coord) {
	float fragCoordZ = texture2D(depthSampler, coord).x;
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}
// Helper functions for reading normals and depth of neighboring pixels.
float getPixelDepth(int x, int y) {
	// screenSize.zw is pixel size 
	// vUv is current position
	return readDepth(depthTexture, vUv + screenSize.zw * vec2(x, y));
}
vec3 getPixelNormal(int x, int y) {
	return texture2D(normalTexture, vUv + screenSize.zw * vec2(x, y)).rgb;
}

float saturate(float num) {
	return clamp(num, 0.0, 1.0);
}

void main() {
	vec4 sceneColor = texture2D(originalTexture, vUv);
	float depth = getPixelDepth(0, 0);
	vec3 normal = getPixelNormal(0, 0);

	// Get the difference between depth of neighboring pixels and current.
	float depthDiff = 0.0;
	depthDiff += abs(depth - getPixelDepth(1, 0));
	depthDiff += abs(depth - getPixelDepth(-1, 0));
	depthDiff += abs(depth - getPixelDepth(0, 1));
	depthDiff += abs(depth - getPixelDepth(0, -1));

	// Get the difference between normals of neighboring pixels and current
	float normalDiff = 0.0;
	normalDiff += distance(normal, getPixelNormal(1, 0));
	normalDiff += distance(normal, getPixelNormal(0, 1));
	normalDiff += distance(normal, getPixelNormal(0, 1));
	normalDiff += distance(normal, getPixelNormal(0, -1));

	normalDiff += distance(normal, getPixelNormal(1, 1));
	normalDiff += distance(normal, getPixelNormal(1, -1));
	normalDiff += distance(normal, getPixelNormal(-1, 1));
	normalDiff += distance(normal, getPixelNormal(-1, -1));

	depthDiff = saturate(depthDiff);
	normalDiff = saturate(normalDiff);


	float outline = normalDiff + depthDiff;
	// float outline = depthDiff;
	// float outline = normalDiff;

	// Combine outline with scene color.
	vec4 outlineColor = vec4(outlineColor, 1.0);
	gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));

	// For debug visualization of the different inputs to this shader.
	if (debugVisualize == 1) {
		gl_FragColor = sceneColor;
	}
	if (debugVisualize == 2) {
		gl_FragColor = vec4(vec3(depth), 1.0);
	}
	if (debugVisualize == 3) {
		gl_FragColor = vec4(normal, 1.0);
	}
}
`;
