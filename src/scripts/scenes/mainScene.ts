import { EffectComposer, ExtendedObject3D, RenderPass, Scene3D, ShaderPass, THREE } from '@enable3d/phaser-extension';
import { ApplyToonShader } from '../shaders/ToonShader';
import { CustomOutlinePass } from '../shaders/CustomOutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { hookToMethod } from '../utils/hook';

export default class MainScene extends Scene3D {
    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        this.accessThirdDimension();
    }

    create() {
        // creates a nice scene
        this.third.warpSpeed();
        // this.third.physics.debug?.enable();

        // Monkey patch the MeshNormalMaterial vertex shader to make normals update with animation.
        // This is a hack, but it works.
        THREE.MeshNormalMaterial.prototype.onBeforeCompile = function (shader) {
            // Get the old vertex shader
            const oldVertexShader = shader.vertexShader;
            // Create a new vertex shader where normals are relative to worldspace
            const newVertexShader = oldVertexShader.replace(
                '#include <defaultnormal_vertex>',
                THREE.ShaderChunk['defaultnormal_vertex'].replace(
                    'transformedNormal = normalMatrix * transformedNormal;',
                    // take into consideration only the model matrix
                    'transformedNormal =  mat3(modelMatrix) * transformedNormal;'
                )
            );
        };

        // adds a box with physics
        const box1 = this.third.add.box({ x: 1, y: 2 });
        const box2 = this.third.physics.add.box({ x: -1, y: 2 });
        ApplyToonShader(box2, 6);

        const depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            depthTexture: depthTexture,
            depthBuffer: true
        });
        this.third.composer = new EffectComposer(this.third.renderer, renderTarget);

        const pass = new RenderPass(this.third.scene, this.third.camera);
        this.third.composer.addPass(pass);

        // Outline pass.
        const customOutline = new CustomOutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.third.scene,
            this.third.camera
        );
        this.third.composer.addPass(customOutline);

        // Antialias pass.
        const effectFXAA = new ShaderPass(FXAAShader);
        effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        this.third.composer.addPass(effectFXAA);

        console.log(this);

        const prom_ply = this.createKnight(0, 2, -5, true);
        prom_ply.then((ply) => {
            this.input.keyboard.on('keydown-W', () => {
                ply.body.setVelocity(0, 0, 10);
            });
            this.input.keyboard.on('keyup-W', () => {
                ply.body.setVelocity(0, 0, 0);
            });
            this.input.keyboard.on('keydown-A', () => {
                ply.body.setVelocity(-10, 0, 0);
            });
            this.input.keyboard.on('keyup-A', () => {
                ply.body.setVelocity(0, 0, 0);
            });
            this.input.keyboard.on('keydown-S', () => {
                ply.body.setVelocity(0, 0, -10);
            });
            this.input.keyboard.on('keyup-S', () => {
                ply.body.setVelocity(0, 0, 0);
            });
            this.input.keyboard.on('keydown-D', () => {
                ply.body.setVelocity(10, 0, 0);
            });
            this.input.keyboard.on('keyup-D', () => {
                ply.body.setVelocity(0, 0, 0);
            });

            console.log(ply);

            hookToMethod(ply.animationMixer, 'update', ()=>{
                // Loop through the object's children
                ply.traverse((child) => {
                    // If the child is a mesh, update its morph targets
                    if (child.isMesh) {
                        // console.log("Mesh found!");
                        child.updateMorphTargets();
                        // child.geometry.computeVertexNormals();
                        child.geometry.morphTargetsRelative = true;
                        child.geometry.attributes.normal.needsUpdate = true;
                    }
                });
            });
        });

        this.third.lights.pointLight({ color: 'white', intensity: 3, distance: 10 }).position.set(0, 1, 0);
    }

    update() {}

    async createKnight(x, y, z, toonShade): Promise<ExtendedObject3D> {
        const knight = new ExtendedObject3D();

        const fbx = await this.third.load.fbx('/assets/fbx/castle_guard_01.fbx');
        const animations = ['Unarmed Walk Forward'];

        knight.add(fbx);
        this.third.animationMixers.add(knight.anims.mixer);

        knight.anims.add('Idle', fbx.animations[0]);
        knight.anims.play('Idle');

        knight.traverse((child) => {
            // Enable toon shading if requested
            if (child.isMesh && toonShade) {
                ApplyToonShader(child, 4);
            }
        });

        knight.traverse((child) => {
            if (child.isMesh) child.castShadow = child.receiveShadow = true;
        });

        knight.scale.set(0.03, 0.03, 0.03);
        knight.position.set(x, y, z);

        this.third.add.existing(knight);
        this.third.physics.add.existing(knight, {
            shape: 'box',
            width: 50,
            height: 160,
            depth: 50,
            offset: {
                x: 0,
                y: -2.5,
                z: 0
            },
            mass: 1000
        });

        // load more animations
        for (let key of animations) {
            if (key !== 'Idle') {
                const fbx = await this.third.load.fbx(`/assets/fbx/${key}.fbx`);
                knight.anims.add(key, fbx.animations[0]);
            }
        }

        this.time.addEvent({
            delay: 2500,
            loop: true,
            callback: () => {
                const anim = Phaser.Math.RND.pick(animations);
                // knight.anims.play(anim, 350);
            }
        });

        return knight;
    }
}