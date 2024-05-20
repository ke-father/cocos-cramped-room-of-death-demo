// @ts-ignore
import level1 from "db://assets/levels/level1";
import level2 from "db://assets/Levels/level2";
import {DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, TILE_TYPE_ENUM} from "db://assets/Enums";

export interface ITile {
    src: number | null,
    type: TILE_TYPE_ENUM | null
}

export interface ILevel {
    mapInfo: Array<Array<ITile>>
}

export interface IEntity{
    x: number
    y: number
    type: ENTITY_TYPE_ENUM
    direction: DIRECTION_ENUM
    state: ENTITY_STATE_ENUM
}

const levels: Record<string, ILevel> = {
    level1,
    level2
}

export default levels
