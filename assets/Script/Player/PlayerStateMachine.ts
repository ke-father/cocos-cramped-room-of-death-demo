import {_decorator, Animation} from 'cc';
import {ENTITY_STATE_ENUM, PARAMS_NAME_ENUM} from "db://assets/Enums";
import {getInitParamsNumber, getInitParamsTrigger, StateMachine} from "db://assets/Base/StateMachine";
import IdleSubStateMachine from "db://assets/Script/Player/IdleSubStateMachine";
import TurnLeftSubStateMachine from "db://assets/Script/Player/TurnLeftSubStateMachine";
import TurnRightStateMachine from "db://assets/Script/Player/TurnRightStateMachine";
import BlockFrontStateMachine from "db://assets/Script/Player/BlockFrontStateMachine";
import {EntityManager} from "db://assets/Base/EntityManager";
import BlockTurnLeftStateMachine from "db://assets/Script/Player/BlockTurnLeftStateMachine";
import BlockTurnRightStateMachine from "db://assets/Script/Player/BlockTurnRightStateMachine";
import BlockBackStateMachine from "db://assets/Script/Player/BlockBackStateMachine";
import BlockLeftStateMachine from "db://assets/Script/Player/BlockLeftStateMachine";
import BlockRightStateMachine from "db://assets/Script/Player/BlockRightStateMachine";
import DeathSubStateMachine from "db://assets/Script/Player/DeathSubStateMachine";
import AttackSubStateMachine from "db://assets/Script/Player/AttackSubStateMachine";

const { ccclass, property } = _decorator;

@ccclass('PlayerStateMachine')
export class PlayerStateMachine extends StateMachine {
    async init () {
        // 添加animation组件
        this.animationComponent = this.addComponent(Animation)

        this.initParams()
        this.initStateMachines()
        this.initAnimationEvent()

        await Promise.all(this.waitingList)
    }

    // 初始化params
    initParams () {
        this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.TURNLEFT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.TURNRIGHT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.DIRECTION, getInitParamsNumber())
        this.params.set(PARAMS_NAME_ENUM.BLOCKFRONT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.BLOCKBACK, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.BLOCKLEFT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.BLOCKRIGHT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger())
        this.params.set(PARAMS_NAME_ENUM.ATTACK, getInitParamsTrigger())
    }

    // 初始化状态机
    initStateMachines () {
        this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new IdleSubStateMachine(this))
        this.stateMachines.set(PARAMS_NAME_ENUM.TURNLEFT, new TurnLeftSubStateMachine(this))
        this.stateMachines.set(PARAMS_NAME_ENUM.TURNRIGHT, new TurnRightStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKFRONT, new BlockFrontStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKBACK, new BlockBackStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKLEFT, new BlockLeftStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKRIGHT, new BlockRightStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, new BlockTurnLeftStateMachine(this))
        // this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, new BlockTurnRightStateMachine(this))
        this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new DeathSubStateMachine(this))
        this.stateMachines.set(PARAMS_NAME_ENUM.ATTACK, new AttackSubStateMachine(this))
    }

    initAnimationEvent () {
        // 为动画组件监听动画播放完毕事件
        this.animationComponent.on(Animation.EventType.FINISHED, () => {
            const name = this.animationComponent.defaultClip.name
            // 设置白名单
            const whiteList = ['turn', 'block', 'attack']
            // 如果白名单包含名称则回归初始动画
            if (whiteList.some(v => name.includes(v))) {
                this.node.getComponent(EntityManager).state = ENTITY_STATE_ENUM.IDLE
            }
        })
    }

    run () {
        switch (this.currentState) {
            case this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT):
            case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
            case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
            case this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK):
                if (this.params.get(PARAMS_NAME_ENUM.ATTACK).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK)
                } else if (this.params.get(PARAMS_NAME_ENUM.DEATH).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.DEATH)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKBACK).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKLEFT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKRIGHT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT)
                } else if (this.params.get(PARAMS_NAME_ENUM.BLOCKFRONT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT)
                } else if (this.params.get(PARAMS_NAME_ENUM.TURNRIGHT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT)
                } else if (this.params.get(PARAMS_NAME_ENUM.TURNLEFT).value) {
                    this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT)
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


