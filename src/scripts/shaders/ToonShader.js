import { hookToMethod } from "../utils/hook";

export function ApplyToonShader(mesh, layers) {
    const material = mesh.material;
    
    const toonShaderFragment = `// Now try to set all colors to some preset magnitudes
    vec3 before = gl_FragColor.rgb;

    // Determine what the thresholds should be based on number of thresholds
    // and maximum color intensity
    const int numThresholds = ${layers};
    float maxThreshold = sqrt(3.0);
    float minThreshold = 0.0;
    float thresholds[numThresholds];
    for (int i = 0; i < numThresholds; i++) {
      thresholds[i] = minThreshold + (maxThreshold - minThreshold) * (float(i) / float(numThresholds - 1));
    }

    // Get the magnitude of the color
    float mag = length(before);
    // Get the index of the threshold that is closest to the magnitude
    int index = 0;
    for (int i = 0; i < numThresholds; i++) {
        if (abs(thresholds[i] - mag) < abs(thresholds[index] - mag)) {
            index = i;
        }
    }
    // Scale the color so its magnitude is equal to the threshold
    gl_FragColor.rgb = before * (thresholds[index] / mag);
}`

    hookToMethod(material, 'onBeforeCompile', (shader) => {
        // Replace the last character of the fragment shader with new code
        shader.fragmentShader = `${shader.fragmentShader.slice(0, -1)}\n${toonShaderFragment}`;
    });

}