import * as THREE from 'three';
import { ShaderLib } from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { ShaderReplacement } from '../lib/ShaderReplacement.js';
import OutlineFragShader from '../shaders/outline.frag.glsl.js';
import OutlineVertShader from '../shaders/outline.vert.glsl.js';

class DrawOutlinePass extends Pass {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    resolution: THREE.Vector2;
    shaderQuad: Pass.FullScreenQuad;
    normalRenderingTarget: THREE.WebGLRenderTarget;
    depthBuffer: any = null;

    constructor(resolution, scene, camera) {
        super();
        this.scene = scene;
        this.camera = camera;
        this.resolution = new THREE.Vector2(resolution.x, resolution.y);
        this.shaderQuad = new Pass.FullScreenQuad();
        this.shaderQuad.material = this.createOutlinePostProcessMaterial();
        this.normalRenderingTarget = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y);
    }

    /**
     * @override
     * This function disposes of all the resources used by the pass.
     */
    dispose() {
        this.normalRenderingTarget.dispose();
        this.shaderQuad.dispose();
    }

    render(renderer, wbuf, rbuf) {
        // The depth buffer needs to remain constant throughout the pass, so we toggle writing to it off and on.
        this.toggleDepthBufferWriting(wbuf);

        // Obtain a render of object normals. High difference in normals indicates an edge between surfaces.
        // This render will be stored on a separate texture, not rendered to the screen.
        renderer.setRenderTarget(this.normalRenderingTarget);
        // Shader replacement tool lets us temporarily change mesh materials to render only the normals.
        const shaderReplacement = new ShaderReplacement(ShaderLib.normal);
        shaderReplacement.replace(this.scene, true, true);
        // Render the normals
        renderer.render(this.scene, this.camera);
        // Restore the original shaders for future passes
        shaderReplacement.reset(this.scene, true);

        // Pass the depth buffer, normal rendering, and original colors to the shader
        /** @ts-ignore (Uniforms is a property of materials, no matter what TypeScript says) */
        this.shaderQuad.material.uniforms['depthTexture'].value = rbuf.depthTexture;
        /** @ts-ignore (Uniforms is a property of materials, no matter what TypeScript says) */
        this.shaderQuad.material.uniforms['normalTexture'].value = this.normalRenderingTarget.texture;
        /** @ts-ignore (Uniforms is a property of materials, no matter what TypeScript says) */
        this.shaderQuad.material.uniforms['originalTexture'].value = rbuf.texture;

        // 2. Draw the outlines using the depth texture and normal texture
        // and combine it with the scene color
        if (this.renderToScreen) {
            // If this is the last effect, then renderToScreen is true.
            // So we should render to the screen by setting target null
            // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
            renderer.setRenderTarget(null);
            this.shaderQuad.render(renderer);
        } else {
            renderer.setRenderTarget(wbuf);
            this.shaderQuad.render(renderer);
        }

        // Restore write access to the depth buffer for any future passes.
        this.toggleDepthBufferWriting(wbuf);
    }

    toggleDepthBufferWriting(writeBuffer){
        // Toggle off writing to the depth buffer
        if(writeBuffer.depthBuffer){
            // Backup the depth buffer value
            this.depthBuffer = writeBuffer.depthBuffer;
            // Disable writing to the depth buffer
            writeBuffer.depthBuffer = false;
        }
        // Toggle on writing to the depth buffer
        else{
            // Restore the depth buffer value
            writeBuffer.depthBuffer = this.depthBuffer;
            // Unload the backup
            this.depthBuffer = null;
        }
    }

    createOutlinePostProcessMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                // These three textures will be replaced before actually rendering
                originalTexture: { value: null },
                depthTexture: { value: null },
                normalTexture: { value: null },
                // Color of the object outlines
                outlineColor: { value: new THREE.Color(0x000000) },
                cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far },
                screenSize: {
                    value: new THREE.Vector4(
                        this.resolution.x,
                        this.resolution.y,
                        1 / this.resolution.x,
                        1 / this.resolution.y
                    )
                }
            },
            vertexShader: OutlineVertShader,
            fragmentShader: OutlineFragShader
        });
    }
}

export { DrawOutlinePass };
