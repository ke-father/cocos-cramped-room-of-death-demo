import {_decorator} from 'cc';
import {DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import {EntityManager} from "db://assets/Base/EntityManager";
import DataManager from "db://assets/Runtime/DataManager";
import {DoorStateMachine} from "db://assets/Script/Door/DoorStateMachine";
import {IEntity} from "db://assets/Levels";

const {ccclass, property} = _decorator;

@ccclass('DoorManager')
export class DoorManager extends EntityManager {
    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(DoorStateMachine)
        await this.fsm.init()

        await super.init(params)

        EventManager.Instance.on(EVENT_ENUM.DOOR_OPEN, this.onOpen, this)
    }

    onOpen () {
        const enemies = DataManager.Instance.enemies
        if (enemies.every(enemy => enemy.state === ENTITY_STATE_ENUM.DEATH) && this.state !== ENTITY_STATE_ENUM.DEATH) this.state = ENTITY_STATE_ENUM.DEATH
    }

    onDestroy () {
        super.onDestroy()
        EventManager.Instance.off(EVENT_ENUM.DOOR_OPEN, this.onOpen)
    }
}



