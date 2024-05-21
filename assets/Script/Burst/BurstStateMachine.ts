import {_decorator, Animation} from 'cc';
import {ENTITY_STATE_ENUM, PARAMS_NAME_ENUM} from "db://assets/Enums";
import {getInitParamsNumber, getInitParamsTrigger, StateMachine} from "db://assets/Base/StateMachine";
import State from "db://assets/Base/State";

const {ccclass, property} = _decorator;

const BASE_URL = 'texture/burst'

@ccclass('BurstStateMachine')
export class BurstStateMachine extends StateMachine {
    async init() {
        // 添加animation组件
        this.animationComponent = this.addComponent(Animation)

        this.initParams()
        this.initStateMachines()
        this.initAnimationEvent()

        await Promise.all(this.waitingList)
    }

    // 初始化params
    initParams() {
        this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.DIRECTION, getInitParamsNumber())
        this.params.set(PARAMS_NAME_ENUM.ATTACK, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger())
    }

    // 初始化状态机
    initStateMachines() {
        this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new State(this, `${BASE_URL}/idle`))
        this.stateMachines.set(PARAMS_NAME_ENUM.ATTACK, new State(this, `${BASE_URL}/attack`))
        this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new State(this, `${BASE_URL}/death`))
    }

    initAnimationEvent() {
    }

    run() {
        switch (this.currentState) {
            case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
            case this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK):
            case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
                if (this.params.get(PARAMS_NAME_ENUM.DEATH).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.DEATH)
                } else if (this.params.get(PARAMS_NAME_ENUM.ATTACK).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK)
                } else if (this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
                } else {
                    this.currentState = this.currentState
                }
                break
            default:
                this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
        }
    }
}


