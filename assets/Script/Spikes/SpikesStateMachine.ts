import {_decorator, Animation} from 'cc';
import {
    ENTITY_STATE_ENUM,
    ENTITY_TYPE_ENUM,
    PARAMS_NAME_ENUM,
    SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM
} from "db://assets/Enums";
import {getInitParamsNumber, getInitParamsTrigger, StateMachine} from "db://assets/Base/StateMachine";
import SpikesOneSubStateMachine from "db://assets/Script/Spikes/SpikesOneSubStateMachine";
import SpikesTwoSubStateMachine from "db://assets/Script/Spikes/SpikesTwoSubStateMachine";
import SpikesThreeSubStateMachine from "db://assets/Script/Spikes/SpikesThreeSubStateMachine";
import SpikesFourSubStateMachine from "db://assets/Script/Spikes/SpikesFourSubStateMachine";
import {EntityManager} from "db://assets/Base/EntityManager";
import {SpikesManager} from "db://assets/Script/Spikes/SpikesManager";

const {ccclass, property} = _decorator;

@ccclass('SpikesStateMachine')
export class SpikesStateMachine extends StateMachine {
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
        this.params.set(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, getInitParamsNumber())
        this.params.set(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, getInitParamsNumber())
    }

    // 初始化状态机
    initStateMachines() {
        this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_ONE, new SpikesOneSubStateMachine(this))
        this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_TWO, new SpikesTwoSubStateMachine(this))
        this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_THREE, new SpikesThreeSubStateMachine(this))
        this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_FOUR, new SpikesFourSubStateMachine(this))
    }

    initAnimationEvent() {
        // 为动画组件监听动画播放完毕事件
        this.animationComponent.on(Animation.EventType.FINISHED, () => {
            const name = this.animationComponent.defaultClip.name
            const value = this.getParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT)

            if (
                (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_ONE && name.includes('spikesone/two')) ||
                (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_TWO && name.includes('spikestwo/three')) ||
                (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_THREE && name.includes('spikesthree/four')) ||
                (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_FOUR && name.includes('spikesfour/five'))
            ) {
                this.node.getComponent(SpikesManager).backZero()
            }
        })
    }

    run() {
        const value = this.getParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT)

        switch (this.currentState) {
            case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE):
            case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_TWO):
            case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_THREE):
            case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_FOUR):
                if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_ONE) {
                    this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE)
                } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_TWO) {
                    this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_TWO)
                } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_THREE) {
                    this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_THREE)
                } else if (value === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_FOUR) {
                    this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_FOUR)
                } else {
                    this.currentState = this.currentState
                }
                break
            default:
                this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE)
        }
    }
}


