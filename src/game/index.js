import core from '../core'
import ready from './ready'

export default {
    core,
    speed: 4,

    // 游戏状态
    state: 'ready',

    init() {

        this.audios = {
            jump: new Howl({src: 'res/audio/jump.mp3'}),
            eat: new Howl({src: 'res/audio/eat.mp3'}),
            one: new Howl({src: 'res/audio/1.ogg'}),
            two: new Howl({src: 'res/audio/2.ogg'}),
            three: new Howl({src: 'res/audio/3.ogg'}),
            ready: new Howl({src: 'res/audio/ready.ogg'}),
            go: new Howl({src: 'res/audio/go.ogg'})
        }


        this.load().then(res => {
            this.textures = res.game.textures
            this.shapes = res.shape.data.bodies

            // 添加游戏内容

            this.addBkg()
            this.addGround()
            this.addPlane()
            this.listen()

            this.ready = ready.init(this)
            this.ready.play()

            core.ticker.add(this.loop.bind(this))
        })
    },

    addBkg() {
        this.bkgs = []
        this.lastBkg = null
        for (let i = 0; i < 3; i++) {
            const
                bkg = new PIXI.Sprite(this.textures['background.png']),
                ratio = bkg.width / bkg.height

            if (ratio > window.design.ratio) bkg.scale.set(window.design.width / bkg.width)
            else bkg.scale.set(window.design.height / bkg.height)

            if (this.lastBkg) bkg.x = this.lastBkg.x + this.lastBkg.width - 1
            else bkg.x = 0

            this.lastBkg = bkg
            this.bkgs.push(bkg)

            core.stage.addChild(bkg)
        }
    },

    addGround() {
        this.grounds = []
        this.lastGround = null

        for (let i = 0; i < 3; i++) {
            const ground = new PIXI.Sprite(this.textures['groundSnow.png'])
            ground.anchor.set(.5)
            ground.position.set(ground.width * (i + .5),
                window.design.height - ground.height * .5)

            PIXI.extras.physics.enable(ground)
                .clearShapes()
                .loadPolygon(this.shapes.groundRock.fixtures[0].polygons)
                .setKinematic()
                .setLinearVelocity(planck.Vec2(-this.speed, 0))

            this.lastGround = ground

            this.grounds.push(ground)

            core.stage.addChild(ground)
        }
    },

    addPlane() {
        this.plane = new PIXI.extras.AnimatedSprite([
            this.textures['planeRed1.png'],
            this.textures['planeRed2.png'],
            this.textures['planeRed3.png'],
        ])

        this.plane.animationSpeed = .5
        this.plane.play()
        this.plane.anchor.set(.5)
        this.plane.position.set(250, window.design.height >> 1)

        const puff = new PIXI.extras.AnimatedSprite([
            this.textures['puffLarge.png'],
            this.textures['puffSmall.png']
        ])

        puff.anchor.set(.5)
        puff.position.set(-this.plane.width / 2 - 15, 10)
        puff.animationSpeed = 1.5
        puff.play()

        this.plane.addChild(puff)

        PIXI.extras.physics.enable(this.plane)
            .clearShapes()
            .loadPolygon(this.shapes.planeRed1.fixtures[0].polygons)
            .setFixedRotation(false)

        core.stage.addChild(this.plane)
    },

    load() {
        return new Promise(resolve => {
            core.loader
                .add('boom', 'res/boom.png')
                .add('game', 'res/game.json')
                .add('shape', 'res/shape.json')
                .load((loader, res) => {
                    progress.destroy()
                    resolve(res)
                })

            const progress = new PIXI.Text('0%', {
                fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
                fontSize: 36,
                fill: 0xffffff,
                align: 'center'
            })

            progress.position.set(
                window.design.width - progress.width >> 1,
                window.design.height - progress.height >> 1)

            core.stage.addChild(progress)

            core.loader.onProgress.add(loader => {
                progress.text = `${~~loader.progress}%`
                progress.x = window.design.width - progress.width >> 1
            })
        })
    },

    tap() {
        this.plane.body.applyLinearImpulse(
            planck.Vec2(0, this.plane.body.getMass() * 12),
            this.plane.body.getPosition())
    },

    listen() {
        const ok = window.hasOwnProperty('onpointerdown')
        ok ? core.view.addEventListener('pointerdown', this.tap.bind(this)) :
            core.view.addEventListener('touchstart', this.tap.bind(this))
    },

    loop() {
        // if (this.state !== 'run') return

        this.grounds.forEach(ground => {
            if (ground.x < -ground.width >> 1) {
                const lastPosition = this.lastGround.body.getPosition()
                ground.body.setPosition(planck.Vec2(
                    lastPosition.x + ground.width / PIXI.extras.physics.PTM,
                    lastPosition.y
                ))
                this.lastGround = ground
            }
        })

        // 背景移动
        this.bkgs.forEach((bkg, i) => {
            if (bkg.x < -bkg.width) {
                bkg.x = this.lastBkg.x + this.lastBkg.width - this.speed
                this.lastBkg = bkg
            }
            bkg.x -= this.speed
        })

        // 飞机高度限制
        {
            if (this.plane.x < window.design.width / 3) {
                const velocity = this.plane.body.getLinearVelocity()
                velocity.x = 1.5
                this.plane.body.setLinearVelocity(velocity)
            } else {
                const velocity = this.plane.body.getLinearVelocity()
                velocity.x = 0
                this.plane.body.setLinearVelocity(velocity)
            }

            const velocity = this.plane.body.getLinearVelocity()
            velocity.y > 10 ? velocity.y = 10 : null
            if (this.plane.y < this.plane.height >> 1) {
                velocity.y > 0 ? velocity.y = 0 : null
            }
            this.plane.body.setLinearVelocity(velocity)
        }


        // 飞机角度限制
        {
            const
                body = this.plane.body,
                angle = body.getAngle() % (Math.PI * 2),
                velocity = body.getLinearVelocity()

            if (velocity.y > 0 && angle < .3) body.setAngularVelocity(1)
            else if (velocity.y < 0 && angle > -.3) body.setAngularVelocity(-.5)
            else if (velocity.y != 0) body.setAngularVelocity(0)
        }
    }
}

core.resize()
document.body.appendChild(core.view)
window.addEventListener('resize', () => {
    /*
    * 微信浏览器内不加延时
    * 会出现放缩错误
    */
    setTimeout(core.resize, 100)
})