import {_decorator} from 'cc';
import {DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import {EntityManager} from "db://assets/Base/EntityManager";
import DataManager from "db://assets/Runtime/DataManager";
import {WoodenSkeletonStateMachine} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonStateMachine";

const {ccclass, property} = _decorator;

@ccclass('WoodenSkeletonManager')
export class WoodenSkeletonManager extends EntityManager {
    async init() {
        // 挂载组件
        this.fsm = this.addComponent(WoodenSkeletonStateMachine)
        await this.fsm.init()

        await super.init({
            x: 2,
            y: 4,
            type: ENTITY_TYPE_ENUM.PLAYER,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE
        })

        // 当玩家移动检测玩家方向
        EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection, this)
        // 检测在玩家移动后是否需要攻击
        EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onAttack, this)
        // 当玩家出生检测
        EventManager.Instance.on(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection, this)
        // 敌人死亡
        EventManager.Instance.on(EVENT_ENUM.ATTACK_ENEMY, this.onDie, this)
        // 初始化调用 需要在敌人生成后主动触发事件 检测
        this.onChangeDirection(true)
    }

    /**
     * 检测玩家方位
     * @param init
     */
    onChangeDirection (init = false) {
        if (!DataManager.Instance.player || this.state === ENTITY_STATE_ENUM.DEATH) return;

        const { x: playerX, y: playerY } = DataManager.Instance.player

        const disX = Math.abs(this.x - playerX)
        const disY = Math.abs(this.y - playerY)

        if (disX === disY) return

        if (playerX >= this.x && playerY <= this.y) {
            this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.RIGHT
        } else if (playerX <= this.x && playerY <= this.y) {
            this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.LEFT
        } else if (playerX <= this.x && playerY >= this.y) {
            this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.LEFT
        } else if (playerX >= this.x && playerY >= this.y) {
            this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.RIGHT
        }
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


    /**
     * 敌人死亡
     */
    onDie(id: string) {
        console.log(id)
        if (this.state === ENTITY_STATE_ENUM.DEATH) return

        if (id === this.id) {
            console.log(id)
            this.state = ENTITY_STATE_ENUM.DEATH
        }
    }
}



