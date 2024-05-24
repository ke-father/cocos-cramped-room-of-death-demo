// 数据中心
import {director, game, RenderRoot2D, UITransform } from "cc";
import Singleton from "db://assets/Base/Singleton";
import {DEFAULT_DURATION, DrawManager, SCREEN_HEIGHT, SCREEN_WIDTH} from "db://assets/Script/UI/DrawManager";
import {createUINode} from "db://assets/Utils";

export default class FaderManager extends Singleton {
    static get Instance() {
        return super.GetInstance<FaderManager>()
    }

    private _fader: DrawManager = null!

    get fader() {
        if (this._fader !== null) return this._fader

        const root = createUINode()
        // 创建2dUI节点
        root.addComponent(RenderRoot2D)

        const fadeNode = createUINode()
        fadeNode.setParent(root)

        this._fader = fadeNode.addComponent(DrawManager)
        this._fader.init()

        director.addPersistRootNode(root)

        return this._fader
    }

    fadeIn (duration: number = DEFAULT_DURATION) {
        console.log(this._fader)
        console.log(this._fader.getComponent(UITransform), this._fader.getComponent(UITransform).width, this._fader.getComponent(UITransform).height)
        // debugger
        return this.fader.fadeIn(duration)
    }

    fadeOut (duration: number = DEFAULT_DURATION) {
        return this.fader.fadeOut(duration)
    }

    mask () {
        return this.fader.mask()
    }
}
