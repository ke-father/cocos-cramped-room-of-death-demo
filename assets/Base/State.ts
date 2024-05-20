import {animation, AnimationClip, Sprite, SpriteFrame} from "cc";
import {PlayerStateMachine} from "db://assets/Script/Player/PlayerStateMachine";
import ResourceManager from "db://assets/Runtime/ResourceManager";
import {StateMachine} from "db://assets/Base/StateMachine";
import {sortSpriteFrame} from "db://assets/Utils";

// 动画播放速度 8帧
const ANIMATION_SPEED = 1 / 8

/**
 * 1.需要有动画编辑 —— AnimationClip
 * 2.需要播放动画的能力 —— Animation
 */
export default class State {
    private animationClip: AnimationClip

    constructor(private fsm: StateMachine, private path: string, private wrapMode: AnimationClip.WrapMode = AnimationClip.WrapMode.Normal) {
        this.init()
    }

    async init() {
        const promise = ResourceManager.Instance.loadDir(this.path)
        // @ts-ignore
        this.fsm.waitingList.push(promise)
        const spriteFrames = await promise

        this.animationClip = new AnimationClip();

        const track = new animation.ObjectTrack(); // 创建一个向量轨道
        track.path = new animation.TrackPath().toComponent(Sprite).toProperty('spriteFrame'); // 指定轨道路径，即指定目标对象为 "Foo" 子节点的 "position" 属性
        const frames: Array<[number, SpriteFrame]> = sortSpriteFrame(spriteFrames).map((item, index) => [ANIMATION_SPEED * index, item])
        track.channel.curve.assignSorted(frames)

        // 最后将轨道添加到动画剪辑以应用
        this.animationClip.addTrack(track);
        // 设置clip的name 成为唯一标识
        this.animationClip.name = this.path

        // 整个动画剪辑的周期
        this.animationClip.duration = frames.length * ANIMATION_SPEED;
        // 设置循环播放
        this.animationClip.wrapMode = this.wrapMode
    }

    run() {
        // 设置animation组件的clip（动画编辑）
        this.fsm.animationComponent.defaultClip = this.animationClip
        // 播放
        this.fsm.animationComponent.play()
    }
}
