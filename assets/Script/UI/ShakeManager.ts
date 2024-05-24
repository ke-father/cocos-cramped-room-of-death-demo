import { _decorator, Component, Node, game } from 'cc';
import EventManager from "db://assets/Runtime/EventManager";
import {EVENT_ENUM, SHAKE_TYPE_ENUM} from "db://assets/Enums";
const { ccclass, property } = _decorator;

const SHAKE_DURATION = 1000

@ccclass('ShakeManager')
export class ShakeManager extends Component {
    private isShaking = false
    private oldTime = 0
    private oldPos: { x: number, y: number } = { x: 0, y: 0 }
    private type: SHAKE_TYPE_ENUM

    onLoad () {
        EventManager.Instance.on(EVENT_ENUM.SCREEN_SHAKE, this.onShake, this)
    }

    onDestroy () {
        EventManager.Instance.off(EVENT_ENUM.SCREEN_SHAKE, this.onShake)
    }

    onShake (type: SHAKE_TYPE_ENUM) {
        if (this.isShaking) return

        this.type = type
        this.oldTime = game.totalTime
        this.isShaking = true
        this.oldPos.x = this.node.position.x
        this.oldPos.y = this.node.position.y
    }

    update () {
        if (this.isShaking) {
            const curSecond = (game.totalTime - this.oldTime) / 1000
            // 震动时长
            const totalSecond = SHAKE_DURATION / 1000
            // 震动幅度
            const amount = 1.6
            // 震动频率
            const frequency = 12
            const offset = amount * Math.sin(frequency * Math.PI * curSecond)

            switch (this.type) {
                case SHAKE_TYPE_ENUM.TOP:
                    this.node.setPosition(this.oldPos.x, this.oldPos.y - offset)
                    break
                case SHAKE_TYPE_ENUM.BOTTOM:
                    this.node.setPosition(this.oldPos.x, this.oldPos.y + offset)
                    break
                case SHAKE_TYPE_ENUM.LEFT:
                    this.node.setPosition(this.oldPos.x - offset, this.oldPos.y)
                    break
                case SHAKE_TYPE_ENUM.RIGHT:
                    this.node.setPosition(this.oldPos.x + offset, this.oldPos.y)
                    break
            }

            if (curSecond > totalSecond) {
                this.isShaking = false
                this.node.setPosition(this.oldPos.x, this.oldPos.y)
            }
        }
    }

    stop () {
        this.isShaking = false
    }
}


