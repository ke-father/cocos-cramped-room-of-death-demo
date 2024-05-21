import {_decorator, UITransform} from 'cc';
import {ENTITY_STATE_ENUM, EVENT_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import DataManager from "db://assets/Runtime/DataManager";
import {IEntity} from "db://assets/Levels";
import {EntityManager} from "db://assets/Base/EntityManager";
import {BurstStateMachine} from "db://assets/Script/Burst/BurstStateMachine";
import {TILE_HEIGHT, TILE_WIDTH} from "db://assets/Script/Tile/TileManager";

const {ccclass, property} = _decorator;

@ccclass('BurstManager')
export class BurstManager extends EntityManager {
    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(BurstStateMachine)
        await this.fsm.init()

        await super.init(params)

        // 获取transform组件
        const transform = this.getComponent(UITransform)
        // 设置节点大小
        transform.setContentSize(TILE_WIDTH, TILE_HEIGHT)

        // 检测在玩家移动后是否需要攻击
        EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onBurst, this)
    }

    update () {
        // 设置人物坐标 人物占4个瓦片大小
        this.node.setPosition(this.x * TILE_WIDTH, -this.y * TILE_HEIGHT)
    }

    /**
     * 检测是否需要攻击
     */
    onBurst () {
        if (!DataManager.Instance.player || this.state === ENTITY_STATE_ENUM.DEATH) return;

        const { x: playerX, y: playerY, state: playerState } = DataManager.Instance.player

        // @ts-ignore 判断玩家坐标
        if (playerX === this.x && playerY === this.y && ![ENTITY_STATE_ENUM.ATTACK, ENTITY_STATE_ENUM.DEATH].includes(this.state)) {
            // 设置地裂
            this.state = ENTITY_STATE_ENUM.ATTACK
            // 判断是否已经地裂
        } else if (this.state === ENTITY_STATE_ENUM.ATTACK) {
            // 设置死亡
            this.state = ENTITY_STATE_ENUM.DEATH

            // 如果此时玩家在瓦片上 通知玩家死亡
            if (this.x === playerX && this.y === playerY) {
                EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.AIRDEATH)
            }
        }
    }
}



