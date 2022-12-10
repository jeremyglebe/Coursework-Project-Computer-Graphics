export default /* glsl */ `
#include <packing>
// The above include imports "perspectiveDepthToViewZ"
// and other GLSL functions from ThreeJS we need for reading depth.
uniform sampler2D sceneColorBuffer;
uniform sampler2D depthBuffer;
uniform sampler2D normalBuffer;
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
float getLinearDepth(vec3 pos) {
	return -(viewMatrix * vec4(pos, 1.0)).z;
}

float getLinearScreenDepth(sampler2D map) {
	vec2 uv = gl_FragCoord.xy * screenSize.zw;
	return readDepth(map,uv);
}
// Helper functions for reading normals and depth of neighboring pixels.
float getPixelDepth(int x, int y) {
	// screenSize.zw is pixel size 
	// vUv is current position
	return readDepth(depthBuffer, vUv + screenSize.zw * vec2(x, y));
}
vec3 getPixelNormal(int x, int y) {
	return texture2D(normalBuffer, vUv + screenSize.zw * vec2(x, y)).rgb;
}

float saturate(float num) {
	return clamp(num, 0.0, 1.0);
}

void main() {
	vec4 sceneColor = texture2D(sceneColorBuffer, vUv);
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

	// Apply multiplier & bias to each 
	float depthBias = multiplierParameters.x;
	float depthMultiplier = multiplierParameters.y;
	float normalBias = multiplierParameters.z;
	float normalMultiplier = multiplierParameters.w;

	depthDiff = depthDiff * depthMultiplier;
	depthDiff = saturate(depthDiff);
	depthDiff = pow(depthDiff, depthBias);

	normalDiff = normalDiff * normalMultiplier;
	normalDiff = saturate(normalDiff);
	normalDiff = pow(normalDiff, normalBias);


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
