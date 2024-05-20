// 状态机 FSM finite state machine
import {_decorator, Animation, AnimationClip, Component, SpriteFrame} from 'cc';
import {FSM_PARAMS_TYPE_ENUM, PARAMS_NAME_ENUM} from "db://assets/Enums";
import State from "db://assets/Base/State";
import {SubStateMachine} from "db://assets/Base/SubStateMachine";

const { ccclass, property } = _decorator;

type ParamsValueType = boolean | number

export interface  IParamsValue {
    type: FSM_PARAMS_TYPE_ENUM,
    value: ParamsValueType
}

export const getInitParamsTrigger = () => {
    return {
        type: FSM_PARAMS_TYPE_ENUM.TRIGGER,
        value: false
    }
}

export const getInitParamsNumber = () => {
    return {
        type: FSM_PARAMS_TYPE_ENUM.NUMBER,
        value: 0
    }
}

@ccclass('StateMachine')
export abstract class StateMachine extends Component {
    private _currentState: State | SubStateMachine = null!
    // 参数列表
    params: Map<string, IParamsValue> = new Map()
    // 状态机列表
    stateMachines: Map<string, State | SubStateMachine> = new Map()
    // 动画
    animationComponent: Animation
    // 等待加载动画图片
    waitingList: Array<Promise<SpriteFrame>> = []

    getParams (paramsName: string) {
        if (this.params.has(paramsName)) return this.params.get(paramsName).value
    }

    setParams (paramsName: string, value: ParamsValueType) {
        if (this.params.has(paramsName)) {
            this.params.get(paramsName).value = value
            this.run()
            this.resetTrigger()
        }
    }

    get currentState () {
        return this._currentState
    }

    set currentState (newState) {
        this._currentState = newState
        this._currentState.run()
    }

    resetTrigger () {
        // 遍历Map
        for (const [_, value] of this.params) {
            // 如果是trigger类型重置
            if (value.type === FSM_PARAMS_TYPE_ENUM.TRIGGER) value.value = false
        }
    }

    abstract init (): void
    abstract run (): void
}


