import {_decorator} from 'cc';
import {CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM, SHAKE_TYPE_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import {PlayerStateMachine} from "db://assets/Script/Player/PlayerStateMachine";
import {EntityManager} from "db://assets/Base/EntityManager";
import DataManager from "db://assets/Runtime/DataManager";
import {IEntity} from "db://assets/Levels";
import {ExamineFeasibility, ExaminePathPlayer, ExaminePathWeapon} from "db://assets/Utils/ExaminePath";

const {ccclass, property} = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
    targetX = 0
    targetY = 0
    // 速度 私有只读变量
    private readonly speed = 1 / 10
    // 是否移动
    isMoving = true

    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(PlayerStateMachine)
        await this.fsm.init()

        await super.init(params)

        this.targetX = this.x
        this.targetY = this.y

        // 绑定操作事件
        EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputMove, this)
        // 绑定玩家死亡
        EventManager.Instance.on(EVENT_ENUM.ATTACK_PLAYER, this.onDie, this)
    }

    onDestroy() {
        super.onDestroy();
        // 绑定操作事件
        EventManager.Instance.off(EVENT_ENUM.PLAYER_CTRL, this.inputMove)
        // 绑定玩家死亡
        EventManager.Instance.off(EVENT_ENUM.ATTACK_PLAYER, this.onDie)
    }

    update() {
        // 不断更新xy位置
        this.updateXY()
        super.update()
    }

    // 通过update的不断渲染去走动 没帧走动1 / 10 的距离
    updateXY() {
        if (this.targetX < this.x) {
            this.x -= this.speed
        } else if (this.targetX > this.x) {
            this.x += this.speed
        }

        if (this.targetY < this.y) {
            this.y -= this.speed
        } else if (this.targetY > this.y) {
            this.y += this.speed
        }

        if (Math.abs(this.targetX - this.x) <= 0.1 && Math.abs(this.targetY - this.y) <= 0.1 && this.isMoving) {
            this.isMoving = false
            this.x = this.targetX
            this.y = this.targetY
            // 添加事件触发
            EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
        }
    }

    /**
     * 玩家死亡
     */
    onDie(type: ENTITY_STATE_ENUM) {
        this.state = type
    }

    onAttackShake (type: SHAKE_TYPE_ENUM) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, type)
    }

    inputMove(inputDirection: CONTROLLER_ENUM) {
        if (this.isMoving) return
        // @ts-ignore 检测是否死亡
        if ([ENTITY_STATE_ENUM.DEATH, ENTITY_STATE_ENUM.AIRDEATH, ENTITY_STATE_ENUM.ATTACK].includes(this.state)) return

        // 检测是否会攻击
        const enemyId = this.willAttack(inputDirection)
        if (enemyId) {
            EventManager.Instance.emit(EVENT_ENUM.RECORD_STEP)
            this.state = ENTITY_STATE_ENUM.ATTACK
            EventManager.Instance.emit(EVENT_ENUM.ATTACK_ENEMY, enemyId)
            EventManager.Instance.emit(EVENT_ENUM.DOOR_OPEN)
            EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
            return;
        }

        // 检测是否可移动
        if (this.willBlock(inputDirection)) {
            switch (inputDirection) {
                case CONTROLLER_ENUM.LEFT:
                case CONTROLLER_ENUM.TOP:
                case CONTROLLER_ENUM.BOTTOM:
                case CONTROLLER_ENUM.RIGHT:
                    EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, inputDirection)
                    break
                case CONTROLLER_ENUM.TURNLEFT:
                case CONTROLLER_ENUM.TURNRIGHT:
                    // 判断朝向
                    switch (this.direction) {
                        case DIRECTION_ENUM.TOP:
                            EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, inputDirection === CONTROLLER_ENUM.TURNLEFT ? SHAKE_TYPE_ENUM.LEFT : SHAKE_TYPE_ENUM.RIGHT)
                            break
                        case DIRECTION_ENUM.RIGHT:
                            EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, inputDirection === CONTROLLER_ENUM.TURNLEFT ? SHAKE_TYPE_ENUM.TOP : SHAKE_TYPE_ENUM.BOTTOM)
                            break
                        case DIRECTION_ENUM.LEFT:
                            EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, inputDirection === CONTROLLER_ENUM.TURNLEFT ? SHAKE_TYPE_ENUM.BOTTOM : SHAKE_TYPE_ENUM.TOP)
                            break
                        case DIRECTION_ENUM.BOTTOM:
                            EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, inputDirection === CONTROLLER_ENUM.TURNLEFT ? SHAKE_TYPE_ENUM.RIGHT : SHAKE_TYPE_ENUM.LEFT)
                            break
                    }
            }
            return
        }

        this.move(inputDirection)
    }

    /**
     * 操作移动方向
     * @param inputDirection
     */
    move(inputDirection: CONTROLLER_ENUM) {
        EventManager.Instance.emit(EVENT_ENUM.RECORD_STEP)
        this.isMoving = true
        this.shouSmoke(inputDirection)
        switch (inputDirection) {
            case CONTROLLER_ENUM.TOP:
                this.targetY -= 1
                break
            case CONTROLLER_ENUM.BOTTOM:
                this.targetY += 1
                break
            case CONTROLLER_ENUM.LEFT:
                this.targetX -= 1
                break
            case CONTROLLER_ENUM.RIGHT:
                this.targetX += 1
                break
            case CONTROLLER_ENUM.TURNLEFT:
                // 更新当前方向
                this.updateDirection(ENTITY_STATE_ENUM.TURNLEFT)
                // 设置状态
                this.state = ENTITY_STATE_ENUM.TURNLEFT
                // 添加事件触发
                EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
                break
            case CONTROLLER_ENUM.TURNRIGHT:
                // 更新当前方向
                this.updateDirection(ENTITY_STATE_ENUM.TURNRIGHT)
                // 设置状态
                this.state = ENTITY_STATE_ENUM.TURNRIGHT
                // 添加事件触发
                EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
        }
    }

    shouSmoke (inputDirection: CONTROLLER_ENUM) {
        // @ts-ignore
        if ([CONTROLLER_ENUM.TOP, CONTROLLER_ENUM.LEFT, CONTROLLER_ENUM.RIGHT, CONTROLLER_ENUM.BOTTOM].includes(inputDirection)) {
            EventManager.Instance.emit(EVENT_ENUM.SHOW_SMOKE, this.x, this.y, inputDirection)
        }
    }

    // 更新方向
    updateDirection(direction: ENTITY_STATE_ENUM.TURNLEFT | ENTITY_STATE_ENUM.TURNRIGHT) {
        let updateState = this.direction
        switch (this.direction) {
            case DIRECTION_ENUM.TOP:
                updateState = direction === ENTITY_STATE_ENUM.TURNLEFT ? DIRECTION_ENUM.LEFT : DIRECTION_ENUM.RIGHT
                break
            case DIRECTION_ENUM.BOTTOM:
                updateState = direction === ENTITY_STATE_ENUM.TURNLEFT ? DIRECTION_ENUM.RIGHT : DIRECTION_ENUM.LEFT
                break
            case DIRECTION_ENUM.LEFT:
                updateState = direction === ENTITY_STATE_ENUM.TURNLEFT ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.TOP
                break
            case DIRECTION_ENUM.RIGHT:
                updateState = direction === ENTITY_STATE_ENUM.TURNLEFT ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.BOTTOM
                break
        }
        this.direction = updateState
    }

    /**
     * 检测下一个地图类型
     * @param inputDirection 输入的方向
     * @return 返回结果 true不可走动 false可走动
     */
    willBlock(inputDirection: CONTROLLER_ENUM): boolean {
        const {targetX: x, targetY: y, direction} = this
        const {tileInfo} = DataManager.Instance
        const {x: doorX, y: doorY, state: doorState} = DataManager.Instance.door || {
            x: 0,
            y: 0,
            state: ENTITY_STATE_ENUM.IDLE
        }
        const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH)
        const bursts = DataManager.Instance.bursts.filter(burst => burst.state !== ENTITY_STATE_ENUM.DEATH)

        const playerRoundTIleInfo = ExaminePathPlayer(x, y, tileInfo)
        const weaponRoundTileInfo = ExaminePathWeapon(x, y, tileInfo)

        const playerTopNextY = y - 1
        const playerBottomNextY = y + 1
        const playerRightNextX = x + 1
        const playerLeftNextX = x - 1

        switch (inputDirection) {
            case CONTROLLER_ENUM.TOP:
                if (playerTopNextY < 0) {
                    this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    return true
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    let state = ExamineFeasibility(
                        {
                            TOP: playerRoundTIleInfo.TOP
                        },
                        {
                            TOP: weaponRoundTileInfo.TOP
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    let state = ExamineFeasibility(
                        {
                            TOP: playerRoundTIleInfo.TOP
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    let state = ExamineFeasibility(
                        {
                            TOP: playerRoundTIleInfo.TOP,
                        },
                        {
                            LEFT_TOP: playerRoundTIleInfo.LEFT_TOP
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    let state = ExamineFeasibility(
                        {
                            TOP: playerRoundTIleInfo.TOP
                        },
                        {
                            RIGHT_TOP: playerRoundTIleInfo.RIGHT_TOP,
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                break
            case CONTROLLER_ENUM.BOTTOM:
                if (playerBottomNextY > DataManager.Instance.mapColumnCount) {
                    this.state = ENTITY_STATE_ENUM.BLOCKBACK

                    return true
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    let state = ExamineFeasibility(
                        {
                            BOTTOM: playerRoundTIleInfo.BOTTOM
                        },
                        {
                            BOTTOM: weaponRoundTileInfo.BOTTOM
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    let state = ExamineFeasibility(
                        {
                            BOTTOM: playerRoundTIleInfo.BOTTOM
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    let state = ExamineFeasibility(
                        {
                            BOTTOM: playerRoundTIleInfo.BOTTOM
                        },
                        {
                            LEFT_BOTTOM: playerRoundTIleInfo.LEFT_BOTTOM,
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    let state = ExamineFeasibility(
                        {
                            BOTTOM: playerRoundTIleInfo.BOTTOM
                        },
                        {
                            RIGHT_BOTTOM: playerRoundTIleInfo.RIGHT_BOTTOM,
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                break
            case CONTROLLER_ENUM.LEFT:
                if (playerLeftNextX < 0) {
                    this.state = ENTITY_STATE_ENUM.BLOCKLEFT

                    return true
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    let state = ExamineFeasibility(
                        {
                            LEFT: playerRoundTIleInfo.LEFT
                        },
                        {
                            LEFT_BOTTOM: playerRoundTIleInfo.LEFT_BOTTOM
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    let state = ExamineFeasibility(
                        {
                            LEFT: playerRoundTIleInfo.LEFT
                        },
                        {
                            LEFT_TOP: playerRoundTIleInfo.LEFT_TOP
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    let state = ExamineFeasibility(
                        {
                            LEFT: playerRoundTIleInfo.LEFT
                        },
                        {
                            LEFT: weaponRoundTileInfo.LEFT
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    let state = ExamineFeasibility(
                        {
                            LEFT: playerRoundTIleInfo.LEFT
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }
                break
            case CONTROLLER_ENUM.RIGHT:
                if (playerLeftNextX > DataManager.Instance.mapRowCount) {
                    this.state = ENTITY_STATE_ENUM.BLOCKRIGHT

                    return true
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    let state = ExamineFeasibility(
                        {
                            RIGHT: playerRoundTIleInfo.RIGHT
                        },
                        {

                            RIGHT_BOTTOM: playerRoundTIleInfo.RIGHT_BOTTOM
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    let state = ExamineFeasibility(
                        {
                            RIGHT: playerRoundTIleInfo.RIGHT
                        },
                        {
                            RIGHT_TOP: playerRoundTIleInfo.RIGHT_TOP
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    let state = ExamineFeasibility(
                        {
                            RIGHT: playerRoundTIleInfo.RIGHT
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    let state = ExamineFeasibility(
                        {
                            RIGHT: playerRoundTIleInfo.RIGHT
                        },
                        {
                            RIGHT: weaponRoundTileInfo.RIGHT
                        }
                    )

                    if (!state) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    return false
                }
                break
            case CONTROLLER_ENUM.TURNLEFT:
                let nextTurnLeftX
                let nextTurnLeftY
                if (direction === DIRECTION_ENUM.TOP) {
                    nextTurnLeftX = x - 1
                    nextTurnLeftY = y - 1
                } else if (direction === DIRECTION_ENUM.BOTTOM) {
                    nextTurnLeftX = x + 1
                    nextTurnLeftY = y + 1
                } else if (direction === DIRECTION_ENUM.LEFT) {
                    nextTurnLeftX = x - 1
                    nextTurnLeftY = y + 1
                } else if (direction === DIRECTION_ENUM.RIGHT) {
                    nextTurnLeftX = x + 1
                    nextTurnLeftY = y - 1
                }

                if (
                    (x === doorX && nextTurnLeftY === doorY) ||
                    (nextTurnLeftX === doorX && y === doorY) ||
                    (nextTurnLeftX === doorX && nextTurnLeftY === doorY) &&
                    doorState !== ENTITY_STATE_ENUM.DEATH
                ) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
                    return true
                }

                // 检测敌人碰撞
                if (enemies.filter(enemy => (x === enemy.x && nextTurnLeftY === enemy.y) || (nextTurnLeftX === enemy.x && y === enemy.y) || (nextTurnLeftX === enemy.x && nextTurnLeftY === enemy.y)).length) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
                    return true
                }

                if (
                    (tileInfo[nextTurnLeftX][y] && !tileInfo[nextTurnLeftX][y].turnAble) ||
                    (tileInfo[nextTurnLeftX][nextTurnLeftY] && !tileInfo[nextTurnLeftX][nextTurnLeftY].turnAble)
                ) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
                    return true
                }

                break
            case CONTROLLER_ENUM.TURNRIGHT:
                let nextTurnRightX
                let nextTurnRightY
                if (direction === DIRECTION_ENUM.TOP) {
                    nextTurnRightX = x + 1
                    nextTurnRightY = y - 1
                } else if (direction === DIRECTION_ENUM.BOTTOM) {
                    nextTurnRightX = x - 1
                    nextTurnRightY = y + 1
                } else if (direction === DIRECTION_ENUM.LEFT) {
                    nextTurnRightX = x - 1
                    nextTurnRightY = y - 1
                } else if (direction === DIRECTION_ENUM.RIGHT) {
                    nextTurnRightX = x + 1
                    nextTurnRightY = y + 1
                }

                if (
                    (x === doorX && nextTurnRightY === doorY) ||
                    (nextTurnRightX === doorX && y === doorY) ||
                    (nextTurnRightX === doorX && nextTurnRightY === doorY) &&
                    doorState !== ENTITY_STATE_ENUM.DEATH
                ) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
                    return true
                }

                // 检测敌人碰撞
                if (enemies.filter(enemy => (x === enemy.x && nextTurnRightY === enemy.y) || (nextTurnRightX === enemy.x && y === enemy.y) || (nextTurnRightX === enemy.x && nextTurnRightY === enemy.y)).length) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
                    return true
                }

                if (
                    (tileInfo[x][nextTurnRightY] && !tileInfo[x][nextTurnRightY].turnAble) ||
                    (tileInfo[nextTurnRightX][y] && !tileInfo[nextTurnRightX][y].turnAble) ||
                    (tileInfo[nextTurnRightX][nextTurnRightY] && !tileInfo[nextTurnRightX][nextTurnRightY].turnAble)
                ) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
                    return true
                }

                break
        }

        return false
    }

    // 检测是否攻击
    willAttack(inputDirection: CONTROLLER_ENUM) {
        const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH)

        let returnEnemyId = ''

        enemies.forEach(enemy => {
            const {x: enemyX, y: enemyY, id: enemyId} = enemy
            switch (inputDirection) {
                case CONTROLLER_ENUM.TOP:
                    if (this.direction === DIRECTION_ENUM.TOP && this.x === enemyX && this.y - 2 === enemyY) {
                        this.state = ENTITY_STATE_ENUM.ATTACK
                        returnEnemyId = enemyId
                    }
                    break
                case CONTROLLER_ENUM.BOTTOM:
                    if (this.direction === DIRECTION_ENUM.BOTTOM && this.x === enemyX && this.y + 2 === enemyY) {
                        this.state = ENTITY_STATE_ENUM.ATTACK
                        returnEnemyId = enemyId
                    }
                    break
                case CONTROLLER_ENUM.LEFT:
                    if (this.direction === DIRECTION_ENUM.LEFT && this.x - 2 === enemyX && this.y === enemyY) {
                        this.state = ENTITY_STATE_ENUM.ATTACK
                        returnEnemyId = enemyId
                    }
                    break
                case CONTROLLER_ENUM.RIGHT:
                    if (this.direction === DIRECTION_ENUM.RIGHT && this.x + 2 === enemyX && this.y === enemyY) {
                        this.state = ENTITY_STATE_ENUM.ATTACK
                        returnEnemyId = enemyId
                    }
            }
        })

        return returnEnemyId
    }
}


