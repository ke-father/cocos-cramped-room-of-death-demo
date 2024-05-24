// 状态机 FSM finite state machine
import {_decorator, Animation, AnimationClip, Component, SpriteFrame} from 'cc';
import {FSM_PARAMS_TYPE_ENUM, PARAMS_NAME_ENUM} from "db://assets/Enums";
import State from "db://assets/Base/State";
import {StateMachine} from "db://assets/Base/StateMachine";

const { ccclass, property } = _decorator;

export abstract class SubStateMachine {
    private _currentState: State = null!
    // 状态机列表
    stateMachines: Map<string, State> = new Map()

    constructor (public fsm: StateMachine) {

    }

    get currentState () {
        return this._currentState
    }

    set currentState (newState) {
        this._currentState = newState
        this._currentState?.run()
    }

    abstract run (): void
}


