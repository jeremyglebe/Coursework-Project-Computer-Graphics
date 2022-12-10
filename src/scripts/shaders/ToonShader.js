import ToonPhFragShader from '../shaders/toon_ph.frag.glsl.js';

export function ApplyToonShader(mesh, layers) {
    const material = mesh.material;
    material.onBeforeCompile = (shader) => {
        // Replace the material's fragment shader with a Toon (Phong-style) shader
        shader.fragmentShader = ToonPhFragShader;
    };
}
