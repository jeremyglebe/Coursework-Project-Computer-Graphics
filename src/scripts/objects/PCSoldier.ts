import { ExtendedObject3D, Scene3D, ThirdPersonControls, THREE } from '@enable3d/phaser-extension';
import Third from '@enable3d/phaser-extension/dist/third';
import { Group, Vector3 } from 'three';

export default class PCSoldier extends ExtendedObject3D {
    // System Connection Properties
    scene: Scene3D;
    third: Third;

    // Model & Animation Properties
    model: Group;
    animation_keys: string[] = ['Idle', 'Walk'];

    // PC Interaction Properties
    controls: ThirdPersonControls | null = null;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;

    constructor(scene: Scene3D, autoInit: boolean = true) {
        super();
        this.scene = scene;
        this.third = scene.third;
        if (autoInit) {
            this.init();
        }
    }

    async init(autoPlayDefault: boolean = true): Promise<PCSoldier> {
        await this.load();
        this.dispatchEvent({ type: 'initialized' });
        // Play the default animation
        if (autoPlayDefault) {
            this.anims.play('Idle');
        }
        return this;
    }

    async load(): Promise<Group> {
        // Load player model + default animation
        this.model = await this.third.load.fbx('./assets/fbx/Soldier.fbx');
        this.add(this.model);
        // Link to PCSoldier's animations from the scene's 3D animation mixer
        this.third.animationMixers.add(this.anims.mixer);
        // Extract the default animation from the mode and add it to the PCSoldier's animations as "Idle"
        this.anims.add('Idle', this.model.animations[0]);
        // For each additional animation key, load the animation and add it to the PCSoldier's animations
        // with the same key name. (Which we are, conveniently, using as the file name)
        for (let anim of this.animation_keys) {
            // No need to re-add the default animation
            if (anim !== 'Idle') {
                const fbx = await this.third.load.fbx(`./assets/fbx/Soldier/${anim}.fbx`);
                this.anims.add(anim, fbx.animations[0]);
            }
        }
        return this.model;
    }

    mountCamera(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = this.third.camera): ThirdPersonControls {
        this.controls = new ThirdPersonControls(camera, this, {
            offset: new THREE.Vector3(-2, 4, 0),
            targetRadius: 7,
            theta: 180, // in degrees
            phi: 25
        });
        this.camera = camera;
        return this.controls;
    }

    update() {
        // If threshold is too small or speed is too big, the player will become twitchy
        const threshold = 0.3;
        const speed = 5.0;
        // If the player has a camera, determine the camera's rotation about the y-axis
        if (this.camera) {
            let facing: Vector3 = new Vector3();
            // Get the direction, in vector form, the camera is facing
            this.camera.getWorldDirection(facing);
            // Calculate the angle of the camera's rotation about the y-axis
            const target_angle: number = Math.atan2(facing.x, facing.z);
            // Now get the angle of the player's rotation about the y-axis
            this.getWorldDirection(facing);
            const player_angle: number = Math.atan2(facing.x, facing.z);
            // Calculate the difference between the two angles
            let delta = target_angle - player_angle;
            // If the difference is below a certain threshold, set the angular velocity to 0
            if (Math.abs(delta) < threshold) {
                this.body.setAngularVelocityY(0);
            } else {
                // If the delta is less than 0, add 2pi to it
                if (delta < 0) {
                    delta += 2 * Math.PI;
                }
                // Now if the delta is less than pi, spin left, otherwise spin right
                let spin;
                if (delta < Math.PI) {
                    spin = speed;
                } else {
                    spin = -speed;
                }
                // Set the player's angular velocity to the difference between the two angles
                this.body.setAngularVelocityY(spin);
            }
        }
    }
}
