import {_decorator, Component, Sprite, UITransform} from 'cc';
import {TILE_HEIGHT, TILE_WIDTH} from "db://assets/Script/Tile/TileManager";
import {
    DIRECTION_ENUM,
    DIRECTION_ORDER_ENUM,
    ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM,
    PARAMS_NAME_ENUM
} from "db://assets/Enums";
import {PlayerStateMachine} from "db://assets/Script/Player/PlayerStateMachine";
// @ts-ignore
import {IEntity} from "db://assets/Levels";
import {StateMachine} from "db://assets/Base/StateMachine";
import {randomUUID} from "db://assets/Utils";

const { ccclass, property } = _decorator;

@ccclass('EntityManager')
export class EntityManager extends Component {
    id: string = randomUUID()
    x = 0
    y = 0
    // 状态机
    fsm: StateMachine

    // 数据与UI分离
    private _direction: DIRECTION_ENUM
    private _state: ENTITY_STATE_ENUM
    private type: ENTITY_TYPE_ENUM

    get direction () {
        return this._direction
    }

    set direction (newDirection) {
        this._direction = newDirection
        this.fsm.setParams(PARAMS_NAME_ENUM.DIRECTION, DIRECTION_ORDER_ENUM[this._direction])
    }

    get state () {
        return this._state
    }

    set state (newState) {
        this._state = newState
        this.fsm.setParams(this._state, true)
    }

    async init (params: IEntity) {
        // 创建精灵图节点
        const sprite = this.addComponent(Sprite)
        // 设定宽高 自定义
        sprite.sizeMode = Sprite.SizeMode.CUSTOM

        // 获取transform组件
        const transform = this.getComponent(UITransform)
        // 设置节点大小
        transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4)

        this.x = params.x
        this.y = params.y
        this.type = params.type
        // 数据与状态分离 设置初始方向为top 初始动画为idle
        this.direction = params.direction
        this.state = params.state
    }

    update () {
        // 设置人物坐标 人物占4个瓦片大小
        this.node.setPosition(this.x * TILE_WIDTH - TILE_WIDTH * 1.5, -this.y * TILE_HEIGHT + TILE_HEIGHT * 1.5)
    }

    onDestroy () {
    }
}


