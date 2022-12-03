import { ExtendedObject3D, Scene3D, THREE } from '@enable3d/phaser-extension'
import { ApplyToonShader } from '../shaders/ToonShader';

export default class MainScene extends Scene3D {
    constructor() {
        super({ key: 'MainScene' })
    }

    init() {
        this.accessThirdDimension()
    }

    create() {
        // creates a nice scene
        this.third.warpSpeed()

        // adds a box with physics
        const box1 = this.third.add.box({ x: 1, y: 2 })
        const box2 = this.third.physics.add.box({ x: -1, y: 2 })
        ApplyToonShader(box2, 6);

        this.createRobot(-3, 0, 3, true);
        this.createRobot(3, 0, 3, false);

        this.createKnight(0, 2, -5, true);

        this.third.lights.pointLight({color: 'white', intensity: 3, distance: 10 }).position.set(0, 1, 0);
    }

    update() { }

    async createRobot(x, y, z, toonShade): Promise<ExtendedObject3D> {
        const robot = new ExtendedObject3D();

        const fbx = await this.third.load.fbx('/assets/fbx/Idle.fbx');
        const animations = ['Jumping', 'LookingAround', 'Running', 'BodyJabCross', 'HipHopDancing']

        robot.add(fbx)
        this.third.animationMixers.add(robot.anims.mixer)

        robot.anims.add('Idle', fbx.animations[0])
        robot.anims.play('Idle')

        robot.traverse(child => {
            // Enable toon shading if requested
            if (child.isMesh && toonShade) {
                ApplyToonShader(child, 4);
            }
        })

        robot.traverse(child => {
            if (child.isMesh) child.castShadow = child.receiveShadow = true
        })

        robot.scale.set(0.03, 0.03, 0.03);
        robot.position.set(x, y, z);

        this.third.add.existing(robot)
        this.third.physics.add.existing(robot, { shape: 'box' })

        // load more animations
        for (let key of animations) {
            if (key !== 'Idle') {
                const fbx = await this.third.load.fbx(`/assets/fbx/${key}.fbx`);
                robot.anims.add(key, fbx.animations[0])
            }
        }

        this.time.addEvent({
            delay: 2500,
            loop: true,
            callback: () => {
                const anim = Phaser.Math.RND.pick(animations)
                robot.anims.play(anim, 350)
            }
        })

        return robot;
    }

    async createKnight(x, y, z, toonShade): Promise<ExtendedObject3D> {
        const knight = new ExtendedObject3D();

        const fbx = await this.third.load.fbx('/assets/fbx/castle_guard_01.fbx');
        const animations = ['Unarmed Walk Forward'];

        knight.add(fbx)
        this.third.animationMixers.add(knight.anims.mixer)

        knight.anims.add('Idle', fbx.animations[0])
        knight.anims.play('Idle')

        knight.traverse(child => {
            // Enable toon shading if requested
            if (child.isMesh && toonShade) {
                ApplyToonShader(child, 4);
            }
        })

        knight.traverse(child => {
            if (child.isMesh) child.castShadow = child.receiveShadow = true
        })

        knight.scale.set(0.03, 0.03, 0.03);
        knight.position.set(x, y, z);

        this.third.add.existing(knight);
        this.third.physics.add.existing(knight, { shape: 'box' });

        // load more animations
        for (let key of animations) {
            if (key !== 'Idle') {
                const fbx = await this.third.load.fbx(`/assets/fbx/${key}.fbx`);
                knight.anims.add(key, fbx.animations[0])
            }
        }

        this.time.addEvent({
            delay: 2500,
            loop: true,
            callback: () => {
                const anim = Phaser.Math.RND.pick(animations)
                knight.anims.play(anim, 350)
            }
        })

        return knight;
    }

}
