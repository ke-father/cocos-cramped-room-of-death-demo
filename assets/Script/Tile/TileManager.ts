import {_decorator, Component, Sprite, SpriteFrame, UITransform} from 'cc';
// @ts-ignore
import Levels from "db://assets/Levels";
import {TILE_TYPE_ENUM} from "db://assets/Enums";

const { ccclass, property } = _decorator;

// 瓦片宽度
export const TILE_WIDTH = 55
// 瓦片高度
export const TILE_HEIGHT = 55

@ccclass('TileManager')
export class TileManager extends Component {
    // 瓦片类型
    type: TILE_TYPE_ENUM
    // 是否可移动
    moveAble: boolean
    // 是否可转动
    turnAble: boolean

    /**
     * 生成单个瓦片方法
     * @param type 瓦片类型
     * @param spriteFrame 瓦片图片路径
     * @param h 横向索引
     * @param v 纵向索引
     */
    init (type: TILE_TYPE_ENUM, spriteFrame: SpriteFrame, h: number, v: number) {
        this.type = type
        switch (this.type) {
            case TILE_TYPE_ENUM.WALL_ROW:
            case TILE_TYPE_ENUM.WALL_COLUMN:
            case TILE_TYPE_ENUM.WALL_LEFT_TOP:
            case TILE_TYPE_ENUM.WALL_LEFT_BOTTOM:
            case TILE_TYPE_ENUM.WALL_RIGHT_TOP:
            case TILE_TYPE_ENUM.WALL_RIGHT_BOTTOM:
                this.moveAble = false
                this.turnAble = false
                break
            case TILE_TYPE_ENUM.CLIFF_CENTER:
            case TILE_TYPE_ENUM.CLIFF_LEFT:
            case TILE_TYPE_ENUM.CLIFF_RIGHT:
                this.moveAble = false
                this.turnAble = true
                break
            case TILE_TYPE_ENUM.FLOOR:
                this.moveAble = true
                this.turnAble = true
        }

        const sprite = this.addComponent(Sprite)
        // 获取图片资源
        sprite.spriteFrame = spriteFrame

        // 节点挂载UITransform组件
        const transform = this.getComponent(UITransform)
        // 设置图片大小
        transform.setContentSize(TILE_WIDTH, TILE_HEIGHT)

        // 设置节点位置 从左上角 所以y轴是负的
        this.node.setPosition(h * TILE_WIDTH, -v * TILE_HEIGHT)
    }
}


