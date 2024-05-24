import {StateMachine} from "db://assets/Base/StateMachine";
import {DIRECTION_ENUM, DIRECTION_ORDER_ENUM, PARAMS_NAME_ENUM} from "db://assets/Enums";
import State, {ANIMATION_SPEED} from "db://assets/Base/State";
import { AnimationClip } from "cc";
import DirectionSubStateMachine from "db://assets/Base/DirectionSubStateMachine";

const BASE_URL = 'texture/player/attack'

export default class AttackSubStateMachine extends DirectionSubStateMachine {
    constructor(fsm: StateMachine) {
        super(fsm)
        this.stateMachines.set(DIRECTION_ENUM.TOP, new State(fsm, `${BASE_URL}/top`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
            {
                // 第五帧执行
                frame: ANIMATION_SPEED * 4,
                // 回调方法
                func: 'onAttackShake',
                // 参数
                params: [DIRECTION_ENUM.TOP]
            }
        ]))
        this.stateMachines.set(DIRECTION_ENUM.BOTTOM, new State(fsm, `${BASE_URL}/bottom`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
            {
                // 第五帧执行
                frame: ANIMATION_SPEED * 4,
                // 回调方法
                func: 'onAttackShake',
                // 参数
                params: [DIRECTION_ENUM.BOTTOM]
            }
        ]))
        this.stateMachines.set(DIRECTION_ENUM.LEFT, new State(fsm, `${BASE_URL}/left`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
            {
                // 第五帧执行
                frame: ANIMATION_SPEED * 4,
                // 回调方法
                func: 'onAttackShake',
                // 参数
                params: [DIRECTION_ENUM.LEFT]
            }
        ]))
        this.stateMachines.set(DIRECTION_ENUM.RIGHT, new State(fsm, `${BASE_URL}/right`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
            {
                // 第五帧执行
                frame: ANIMATION_SPEED * 4,
                // 回调方法
                func: 'onAttackShake',
                // 参数
                params: [DIRECTION_ENUM.RIGHT]
            }
        ]))
    }
}
