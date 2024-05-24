import {_decorator} from 'cc';
import {IEntity} from "db://assets/Levels";
import {SmokeStateMachine} from "db://assets/Script/Smoke/SmokeStateMachine";
import {EntityManager} from "db://assets/Base/EntityManager";

const {ccclass, property} = _decorator;

@ccclass('SmokeManager')
export class SmokeManager extends EntityManager {
    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(SmokeStateMachine)
        await this.fsm.init()

        await super.init(params)
    }
}



