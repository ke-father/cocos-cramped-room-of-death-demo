import {_decorator} from 'cc';
import {CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM} from "db://assets/Enums";
import EventManager from "db://assets/Runtime/EventManager";
import {PlayerStateMachine} from "db://assets/Script/Player/PlayerStateMachine";
import {EntityManager} from "db://assets/Base/EntityManager";
import DataManager from "db://assets/Runtime/DataManager";

const {ccclass, property} = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
    targetX = 0
    targetY = 0
    // 速度 私有只读变量
    private readonly speed = 1 / 10
    // 是否移动
    isMoving = true

    async init() {
        // 挂载组件
        this.fsm = this.addComponent(PlayerStateMachine)
        await this.fsm.init()

        await super.init({
            x: 2,
            y: 8,
            type: ENTITY_TYPE_ENUM.PLAYER,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE
        })

        this.targetX = this.x
        this.targetY = this.y

        // 绑定操作事件
        EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputMove, this)
        // 绑定玩家死亡
        EventManager.Instance.on(EVENT_ENUM.ATTACK_PLAYER, this.onDie, this)
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

    inputMove(inputDirection: CONTROLLER_ENUM) {
        if (this.isMoving) return
        // @ts-ignore 检测是否死亡
        if ([ENTITY_STATE_ENUM.DEATH, ENTITY_STATE_ENUM.AIRDEATH, ENTITY_STATE_ENUM.ATTACK].includes(this.state)) return

        // 检测是否会攻击
        const enemyId = this.willAttack(inputDirection)
        console.log(enemyId)
        if (enemyId) {
            console.log('attack')
            console.log(EventManager.Instance)
            EventManager.Instance.emit(EVENT_ENUM.ATTACK_ENEMY, enemyId)
            console.log(EventManager.Instance)
            return;
        }

        // 检测是否可移动
        if (this.willBlock(inputDirection)) {
            console.log('block')
            return
        }

        this.move(inputDirection)
    }

    /**
     * 操作移动方向
     * @param inputDirection
     */
    move(inputDirection: CONTROLLER_ENUM) {
        this.isMoving = true
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
                    const weaponNextY = y - 2

                    const playerTile = tileInfo[x][playerTopNextY]
                    const weaponTile = tileInfo[x][weaponNextY]

                    if (playerTile && playerTile.moveAble && (!weaponTile || weaponTile.moveAble)) {
                    } else {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    if (!tileInfo[x][playerTopNextY] || !tileInfo[x][playerTopNextY].moveAble) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    if (
                        (!tileInfo[x][playerTopNextY] || !tileInfo[x][playerTopNextY].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerTopNextY] || !tileInfo[playerLeftNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    if (
                        (!tileInfo[x][playerTopNextY] || !tileInfo[x][playerTopNextY].moveAble) ||
                        (!tileInfo[playerRightNextX][playerTopNextY] || !tileInfo[playerRightNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                break
            case CONTROLLER_ENUM.BOTTOM:
                if (playerBottomNextY > DataManager.Instance.mapColumnCount) {
                    this.state = ENTITY_STATE_ENUM.BLOCKBACK

                    return true
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    const weaponNextY = y + 2

                    const playerTile = tileInfo[x][playerBottomNextY]
                    const weaponTile = tileInfo[x][weaponNextY]

                    if (playerTile && playerTile.moveAble && (!weaponTile || weaponTile.moveAble)) {
                    } else {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    if (!tileInfo[x][playerBottomNextY] || !tileInfo[x][playerBottomNextY].moveAble) {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    if (
                        (!tileInfo[x][playerBottomNextY] || !tileInfo[x][playerBottomNextY].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerBottomNextY] || !tileInfo[playerLeftNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    if (
                        (!tileInfo[x][playerBottomNextY] || !tileInfo[x][playerBottomNextY].moveAble) ||
                        (!tileInfo[playerRightNextX][playerBottomNextY] || !tileInfo[playerRightNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
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
                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerBottomNextY] || !tileInfo[playerLeftNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerTopNextY] || !tileInfo[playerLeftNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    const weaponNextX = x - 2

                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[weaponNextX][y] || !tileInfo[weaponNextX][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }
                break
            case CONTROLLER_ENUM.RIGHT:
                if (playerLeftNextX > DataManager.Instance.mapRowCount) {
                    this.state = ENTITY_STATE_ENUM.BLOCKRIGHT

                    return true
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[playerRightNextX][playerBottomNextY] || !tileInfo[playerRightNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[playerRightNextX][playerTopNextY] || !tileInfo[playerRightNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {

                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    const weaponNextY = x + 2
                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[weaponNextY][y] || !tileInfo[weaponNextY][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
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
                    (!tileInfo[x][nextTurnLeftY] || !tileInfo[x][nextTurnLeftY].turnAble) ||
                    (!tileInfo[nextTurnLeftX][y] || !tileInfo[nextTurnLeftX][y].turnAble) ||
                    (!tileInfo[nextTurnLeftX][nextTurnLeftY] || !tileInfo[nextTurnLeftX][nextTurnLeftY].turnAble)
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
                    (!tileInfo[x][nextTurnRightY] || !tileInfo[x][nextTurnRightY].turnAble) ||
                    (!tileInfo[nextTurnRightX][y] || !tileInfo[nextTurnRightX][y].turnAble) ||
                    (!tileInfo[nextTurnRightX][nextTurnRightY] || !tileInfo[nextTurnRightX][nextTurnRightY].turnAble)
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
                case CONTROLLER_ENUM.LEFT:
                case CONTROLLER_ENUM.RIGHT:
            }
        })

        return returnEnemyId
    }
}


