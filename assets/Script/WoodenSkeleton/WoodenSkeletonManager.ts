import {_decorator} from 'cc';
import { ENTITY_STATE_ENUM, EVENT_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import DataManager from "db://assets/Runtime/DataManager";
import {WoodenSkeletonStateMachine} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonStateMachine";
import {EnemyManager} from "db://assets/Base/EnemyManager";
import {IEntity} from "db://assets/Levels";

const {ccclass, property} = _decorator;

@ccclass('WoodenSkeletonManager')
export class WoodenSkeletonManager extends EnemyManager {
    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(WoodenSkeletonStateMachine)
        await this.fsm.init()

        await super.init(params)
        // 检测在玩家移动后是否需要攻击
        EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onAttack, this)
    }

    /**
     * 检测是否需要攻击
     */
    onAttack () {
        if (!DataManager.Instance.player || this.state === ENTITY_STATE_ENUM.DEATH) return;

        const { x: playerX, y: playerY, state: playerState } = DataManager.Instance.player

        // @ts-ignore 判断敌人不攻击已死亡玩家
        if ((playerX === this.x && Math.abs(this.y - playerY) <= 1) || (playerY === this.y && Math.abs(this.x - playerX) <= 1) && [ENTITY_STATE_ENUM.IDLE, ENTITY_STATE_ENUM.ATTACK].includes(playerState)) {
            this.state = ENTITY_STATE_ENUM.ATTACK
            // 触发玩家死亡
            EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.DEATH)
        } else {
            this.state = ENTITY_STATE_ENUM.IDLE
        }
    }
}



