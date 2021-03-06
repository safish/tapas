import core from '../core'


// 操作指南
export default {
    container: new PIXI.Container(),

    init(game) {
        this.textures = game.textures
        this.audios = game.audios
        this.game = game

        core.stage.addChild(this.container)

        this.addNum()
        this.addTapTicker()
        this.addBtn()

        this.listen()

        return this
    },

    addNum() {
        this.num = new PIXI.extras.AnimatedSprite([
            this.textures['number3.png'],
            this.textures['number2.png'],
            this.textures['number1.png'],
            this.textures['textGetReady.png'],
            this.textures['textGameOver.png']
        ])

        this.num.anchor.set(.5)
        this.num.position.set(design.width >> 1, design.height >> 1)

        this.container.addChild(this.num)
    },

    addBtn() {
        this.btns = {}

        let text = new PIXI.Text('Replay', {
            fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
            fontSize: 36,
            fill: 0x4caf50,
            align: 'center'
        })

        this.btns.replay = new PIXI.mesh.NineSlicePlane(this.textures['grey_button13.png'])
        this.btns.replay.width = 200
        this.btns.replay.height = 100
        this.btns.replay.pivot.set(100, 50)
        this.btns.replay.position.set(design.width >> 1,
            design.height * .5 + 60)

        this.btns.replay.addChild(text)
        text.position.set((this.btns.replay.width - text.width) * .5,
            (this.btns.replay.height - text.height) * .5)

        text = new PIXI.Text('Quit', {
            fontFamily: '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
            fontSize: 36,
            fill: 0xff5722,
            align: 'center'
        })

        this.btns.quit = new PIXI.mesh.NineSlicePlane(this.textures['grey_button13.png'])
        this.btns.quit.width = 200
        this.btns.quit.height = 100
        this.btns.quit.pivot.set(100, 50)
        this.btns.quit.position.set(design.width >> 1,
            design.height * .5 + 90)


        this.btns.quit.addChild(text)
        text.position.set((this.btns.replay.width - text.width) * .5,
            (this.btns.replay.height - text.height) * .5)

        // 初始隐藏
        this.btns.replay.visible =
        this.btns.quit.visible = false

        this.container.addChild(this.btns.replay)
    },

    addTapTicker() {
        this.tapTicker = new PIXI.extras.AnimatedSprite([
            this.textures['tap.png'],
            this.textures['tapTick.png']
        ])

        this.tapTicker.animationSpeed = 1.8
        this.tapTicker.play()
        this.tapTicker.anchor.set(.5)
        this.tapTicker.position.set(design.width * .6, design.height >> 1)

        this.container.addChild(this.tapTicker)
    },

    showBtn() {

        createjs.Tween.get(this.btns.replay)
            .set({alpha: 0, visible: true})
            .to({alpha: 1}, 300)

        createjs.Tween.get(this.btns.quit)
            .set({alpha: 0, visible: true})
            .to({alpha: 1}, 300)
    },

    start(i=0) {
        return new Promise(resolve => {
            loop.call(this, i)
            function loop(i) {
                switch (i) {
                    case 0: {
                        this.audios.three.play()
                        break
                    }

                    case 1: {
                        this.audios.two.play()
                        break
                    }

                    case 2: {
                        this.audios.one.play()
                        break
                    }

                    case 3: {
                        this.audios.ready.play()
                        break
                    }

                    default: {
                        this.tapTicker.visible = false
                        this.audios.go.play()

                        createjs.Tween.get(this.num.scale)
                            .to({x: 1.5, y: 1.5}, 200)
                            .to({x: 0, y: 0}, 300)
                            .call(resolve)

                        return
                    }
                }
                this.num.gotoAndStop(i)
                setTimeout(loop.bind(this, i + 1), 1000)
            }
        })
    },

    over() {
        this.num.gotoAndStop(4)
        this.audios.over.play()

        // 前置显示
        core.stage.setChildIndex(this.container,
            core.stage.children.length - 1)

        new Promise(resolve => {
            createjs.Tween.get(this.num.scale)
                .to({x: 1.5, y: 1.5}, 300)
                .to({x: 1, y: 1}, 200)
                .wait(300)
                .call(resolve)
        }).then(() => {
            createjs.Tween.get(this.num)
                .to({y: this.num.y - 60}, 300)
                .call(() => this.showBtn())
        })
    },

    replay() {


        this.btns.replay.visible =
        this.btns.quit.visible = false

        this.num.position.set(design.width >> 1, design.height >> 1)

        this.tapTicker.visible = true

        return this.start()
    },

    listen() {
        const pointerDown = window.hasOwnProperty('onpointerdown') ?
            'pointerdown' :  window.hasOwnProperty('ontouchstart') ? 'touchstart' : 'mousedown'

        this.btns.replay.interactive =
        this.btns.quit.interactive = true

        this.btns.replay.on(pointerDown, () => {
            this.game.replay()
        })

        this.btns.quit.on(pointerDown, () => {
            console.log('quit')
        })

    }
}