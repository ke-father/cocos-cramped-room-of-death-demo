// 瓦片地图枚举
export enum TILE_TYPE_ENUM {
    WALL_LEFT_TOP = "WALL_LEFT_TOP",
    WALL_COLUMN = "WALL_COLUMN",
    CLIFF_LEFT = "CLIFF_LEFT",
    WALL_RIGHT_BOTTOM = "WALL_RIGHT_BOTTOM",
    FLOOR = "FLOOR",
    WALL_ROW = "WALL_ROW",
    CLIFF_CENTER = "CLIFF_CENTER",
    WALL_LEFT_BOTTOM = "WALL_LEFT_BOTTOM",
    WALL_RIGHT_TOP = "WALL_RIGHT_TOP",
    CLIFF_RIGHT = "CLIFF_RIGHT"
}

// 事件枚举
export enum EVENT_ENUM {
    // 下一个关卡
    NEXT_LEVEL = 'NEXT_LEVEL',
    PLAYER_CTRL = 'PLAYER_CTRL',
    PLAYER_MOVE_END = 'PLAYER_MOVE_END',
    PLAYER_BORN = 'PLAYER_BORN',
    ATTACK_PLAYER = 'ATTACK_PLAYER',
    ATTACK_ENEMY = 'ATTACK_ENEMY',
    DOOR_OPEN = 'DOOR_OPEN',
    SHOW_SMOKE = 'SHOW_SMOKE',
    SCREEN_SHAKE = 'SCREEN_SHAKE',
    RECORD_STEP = 'RECORD_STEP',
    REVOKE_STEP = 'REVOKE_STEP',
    RESTART_LEVEL = 'RESTART_LEVEL',
    OUT_BATTLE = 'OUT_BATTLE',
    PLAYER_RESET = 'PLAYER_RESET'
}

// 方向枚举
export enum CONTROLLER_ENUM {
    TOP = 'TOP',
    BOTTOM = 'BOTTOM',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    TURNLEFT = 'TURNLEFT',
    TURNRIGHT = 'TURNRIGHT'
}

// 定义状态机枚举
export enum FSM_PARAMS_TYPE_ENUM {
    NUMBER = 'NUMBER',
    // 触发类型
    TRIGGER = 'TRIGGER'
}

// 参数名称枚举
export enum PARAMS_NAME_ENUM {
    IDLE = 'IDLE',
    TURNLEFT = 'TURNLEFT',
    TURNRIGHT = 'TURNRIGHT',
    DIRECTION = 'DIRECTION',
    BLOCKFRONT = 'BLOCKFRONT',
    BLOCKBACK = 'BLOCKBACK',
    BLOCKLEFT = 'BLOCKLEFT',
    BLOCKRIGHT = 'BLOCKRIGHT',
    BLOCKTURNLEFT = 'BLOCKTURNLEFT',
    BLOCKTURNRIGHT = 'BLOCKTURNRIGHT',
    ATTACK = 'ATTACK',
    DEATH = 'DEATH',
    AIRDEATH = 'AIRDEATH',
    SPIKES_CUR_COUNT = 'SPIKES_CUR_COUNT',
    SPIKES_TOTAL_COUNT = 'SPIKES_TOTAL_COUNT'
}

// 方向枚举
export enum DIRECTION_ENUM {
    TOP = 'TOP',
    BOTTOM = 'BOTTOM',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT'
}

export enum ENTITY_STATE_ENUM {
    IDLE = 'IDLE',
    TURNLEFT = 'TURNLEFT',
    TURNRIGHT = 'TURNRIGHT',
    BLOCKFRONT = 'BLOCKFRONT',
    BLOCKBACK = 'BLOCKBACK',
    BLOCKLEFT = 'BLOCKLEFT',
    BLOCKRIGHT = 'BLOCKRIGHT',
    BLOCKTURNLEFT = 'BLOCKTURNLEFT',
    BLOCKTURNRIGHT = 'BLOCKTURNRIGHT',
    ATTACK = 'ATTACK',
    DEATH = 'DEATH',
    AIRDEATH = 'AIRDEATH'
}

// 数据枚举映射 —— 方向
export enum DIRECTION_ORDER_ENUM {
    TOP,
    BOTTOM,
    LEFT,
    RIGHT
}

export enum ENTITY_TYPE_ENUM {
    PLAYER = 'PLAYER',
    SKELETON_WOODEN = 'SKELETON_WOODEN',
    SKELETON_IRON = 'SKELETON_IRON',
    DOOR = 'DOOR',
    BURST = 'BURST',
    SPIKES_ONE = 'SPIKES_ONE',
    SPIKES_TWO = 'SPIKES_TWO',
    SPIKES_THREE = 'SPIKES_THREE',
    SPIKES_FOUR = 'SPIKES_FOUR',
    SMOKE = 'SMOKE'
}

export enum SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM {
    SPIKES_ONE = 2,
    SPIKES_TWO = 3,
    SPIKES_THREE = 4,
    SPIKES_FOUR = 5
}

export enum SPIKES_COUNT_ENUM {
    ZERO = 'ZERO',
    ONE = 'ONE',
    TWO = 'TWO',
    THREE = 'THREE',
    FOUR = 'FOUR',
    FIVE = 'FIVE'
}

export enum SPIKES_COUNT_MAP_NUMBER_ENUM {
    ZERO = 0,
    ONE = 1,
    TWO = 2,
    THREE = 3,
    FOUR = 4,
    FIVE = 5
}

// 获取周围8块瓦片地图内容
export enum ROUND_TILE_INFO {
    LEFT_TOP = 'LEFT_TOP',
    TOP = 'TOP',
    RIGHT_TOP = 'RIGHT_TOP',
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    LEFT_BOTTOM = 'LEFT_BOTTOM',
    BOTTOM = 'BOTTOM',
    RIGHT_BOTTOM = 'RIGHT_BOTTOM'
}

export enum SHAKE_TYPE_ENUM {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    TOP = 'TOP',
    BOTTOM = 'BOTTOM'
}

export enum SCENE_ENUM {
    LOADING = 'Loading',
    START = 'Start',
    BATTLE = 'Battle'
}
