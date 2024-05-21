import {_decorator, Animation} from 'cc';
import {PARAMS_NAME_ENUM} from "db://assets/Enums";
import {getInitParamsNumber, getInitParamsTrigger, StateMachine} from "db://assets/Base/StateMachine";
import IdleSubStateMachine from "db://assets/Script/Door/IdleSubStateMachine";
import DeathSubStateMachine from "db://assets/Script/Door/DeathSubStateMachine";

const {ccclass, property} = _decorator;

@ccclass('DoorStateMachine')
export class DoorStateMachine extends StateMachine {
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
        this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger())
    }

    // 初始化状态机
    initStateMachines() {
        this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new IdleSubStateMachine(this))
        this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new DeathSubStateMachine(this))
    }

    initAnimationEvent() {
        // 为动画组件监听动画播放完毕事件
        // this.animationComponent.on(Animation.EventType.FINISHED, () => {
        //     const name = this.animationComponent.defaultClip.name
        //     // 设置白名单
        //     const whiteList = ['attack']
        //     // 如果白名单包含名称则回归初始动画
        //     if (whiteList.some(v => name.includes(v))) {
        //         this.node.getComponent(EntityManager).state = ENTITY_STATE_ENUM.IDLE
        //     }
        // })
    }

    run() {
        switch (this.currentState) {
            case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
            case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
                if (this.params.get(PARAMS_NAME_ENUM.DEATH).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.DEATH)
                } else if  (this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
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


