import {
    EffectComposer,
    RenderPass,
    Scene3D,
    ShaderPass,
    ThirdPersonControls,
    THREE
} from '@enable3d/phaser-extension';
import { ApplyToonShader, ToonPhShaderPackage } from '../shaders/ToonShader';
import { DrawOutlinePass } from '../post-processing/DrawOutlinePass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { hookToMethod } from '../utils/hook';
import { Vector3 } from 'three';
import PCSoldier from '../objects/PCSoldier';

export default class MainScene extends Scene3D {
    prevMouse: { x: number; y: number } | null = null;
    controls: ThirdPersonControls | null = null;
    player: PCSoldier | null = null;
    key_shift: Phaser.Input.Keyboard.Key | null = null;
    cinematic: boolean = false;
    worldLights: {
        ambientLight: THREE.AmbientLight;
        directionalLight: THREE.DirectionalLight;
        hemisphereLight: THREE.HemisphereLight;
    };

    constructor() {
        super({ key: 'MainScene' });
    }

    init() {
        this.accessThirdDimension();
    }

    async create() {
        this.input.on('pointerdown', (pointer) => {
            this.input.mouse.requestPointerLock();
        });
        // Create phaser key for shift
        this.key_shift = this.input.keyboard.addKey('SHIFT');
        // Listener to toggle cinematic mode
        this.input.keyboard.on('keydown-C', () => {
            this.cinematic = !this.cinematic;
        });

        // creates a nice scene
        const { lights } = await this.third.warpSpeed();
        this.worldLights = lights as any;
        this.worldLights.ambientLight.intensity = 0.2;
        this.worldLights.hemisphereLight.intensity = 0.5;
        this.worldLights.directionalLight.intensity = 2.0;
        // this.third.physics.debug?.enable();

        const depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
        const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            depthTexture: depthTexture,
            depthBuffer: true
        });
        this.third.composer = new EffectComposer(this.third.renderer, renderTarget);

        const pass = new RenderPass(this.third.scene, this.third.camera);
        this.third.composer.addPass(pass);

        // Outline pass.
        const outlinePass = new DrawOutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.third.scene,
            this.third.camera
        );
        this.third.composer.addPass(outlinePass);

        // Antialias pass.
        const effectFXAA = new ShaderPass(FXAAShader);
        effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        this.third.composer.addPass(effectFXAA);

        const ply = await this.spawnPlayer(0, 2, -5, true);
        this.player = ply;
        const speed = 5.0;
        this.input.keyboard.on('keydown-W', () => {
            // Set the player's velocity based on the camera rotation
            let facing: Vector3 = new Vector3();
            this.third.camera.getWorldDirection(facing);
            const velocity = facing.multiplyScalar(speed);
            // Set the body's velocity
            ply.body.setVelocity(velocity.x, 0, velocity.z);
            // Animation
            if (ply.anims.current != 'Walk') ply.anims.play('Walk');
        });
        this.input.keyboard.on('keyup-W', () => {
            ply.body.setVelocity(0, 0, 0);
            if (ply.anims.current != 'Idle') ply.anims.play('Idle');
        });
        this.input.keyboard.on('keydown-A', () => {
            // Set the player's velocity based on the camera rotation
            let facing: Vector3 = new Vector3();
            this.third.camera.getWorldDirection(facing);
            // Rotate the facing vector by 90 degrees left
            const left = facing.applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
            const velocity = left.multiplyScalar(speed);
            // Set the body's velocity
            ply.body.setVelocity(velocity.x, 0, velocity.z);
        });
        this.input.keyboard.on('keyup-A', () => {
            ply.body.setVelocity(0, 0, 0);
        });
        this.input.keyboard.on('keydown-S', () => {
            // Set the player's velocity based on the camera rotation
            let facing: Vector3 = new Vector3();
            this.third.camera.getWorldDirection(facing);
            // Negate the facing vector to get the opposite direction
            // Also reduce speed by half when going backwards
            const velocity = facing.multiplyScalar(-speed / 2);
            // Set the body's velocity
            ply.body.setVelocity(velocity.x, 0, velocity.z);
        });
        this.input.keyboard.on('keyup-S', () => {
            ply.body.setVelocity(0, 0, 0);
        });
        this.input.keyboard.on('keydown-D', () => {
            // Set the player's velocity based on the camera rotation
            let facing: Vector3 = new Vector3();
            this.third.camera.getWorldDirection(facing);
            // Rotate the facing vector by 90 degrees right
            const right = facing.applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2);
            const velocity = right.multiplyScalar(speed);
            // Set the body's velocity
            ply.body.setVelocity(velocity.x, 0, velocity.z);
        });
        this.input.keyboard.on('keyup-D', () => {
            ply.body.setVelocity(0, 0, 0);
        });

        if (this.player) this.controls = this.player.mountCamera();

        // Add controls for phi and theta
        this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
            if (ptr.locked) {
                this.controls?.update(ptr.movementX, ptr.movementY);
            } else if (this.prevMouse && this.key_shift?.isDown) {
                const dx = ptr.x - this.prevMouse.x;
                const dy = ptr.y - this.prevMouse.y;
                this.controls?.update(dx, dy);
            }
            this.prevMouse = { x: ptr.x, y: ptr.y };
        });

        hookToMethod(ply.animationMixer, 'update', () => {
            // Loop through the object's children
            ply.traverse((child) => {
                // If the child is a mesh, update its morph targets
                if (child.isMesh) {
                }
            });
        });
    }

    update() {
        if (this.controls) this.controls.update(0, 0);
        if (this.input.mousePointer.locked && !this.cinematic) this.player?.update();
    }

    async spawnPlayer(x, y, z, toonShade): Promise<PCSoldier> {
        const soldier: PCSoldier = new PCSoldier(this, false);
        await soldier.load();
        soldier.anims.play('Idle');

        soldier.traverse((child) => {
            // Enable toon shading if requested
            if (child.isMesh && toonShade) {
                ApplyToonShader(child, 4);
            }
        });

        soldier.traverse((child) => {
            if (child.isMesh) child.castShadow = child.receiveShadow = true;
        });

        soldier.scale.set(0.03, 0.03, 0.03);
        soldier.position.set(x, y, z);

        this.third.add.existing(soldier);
        this.third.physics.add.existing(soldier, {
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

        return soldier;
    }
}
