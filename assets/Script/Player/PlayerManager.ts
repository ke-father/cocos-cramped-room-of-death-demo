import {_decorator} from 'cc';
import {CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM} from "db://assets/Enums";
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
        console.log(type)
        this.state = type
    }

    inputMove(inputDirection: CONTROLLER_ENUM) {
        if (this.isMoving) return
        // @ts-ignore 检测是否死亡
        if ([ENTITY_STATE_ENUM.DEATH, ENTITY_STATE_ENUM.AIRDEATH, ENTITY_STATE_ENUM.ATTACK].includes(this.state)) return

        // 检测是否会攻击
        const enemyId = this.willAttack(inputDirection)
        if (enemyId) {
            console.log('attack')
            EventManager.Instance.emit(EVENT_ENUM.ATTACK_ENEMY, enemyId)
            EventManager.Instance.emit(EVENT_ENUM.DOOR_OPEN)
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
        const {x: doorX, y: doorY, state: doorState} = DataManager.Instance.door || {
            x: 0,
            y: 0,
            state: ENTITY_STATE_ENUM.IDLE
        }
        const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH)
        const bursts = DataManager.Instance.bursts.filter(burst => burst.state !== ENTITY_STATE_ENUM.DEATH)

        const playerRoundTIleInfo = ExaminePathPlayer(x, y, tileInfo)
        const weaponRoundTileInfo = ExaminePathWeapon(x, y, tileInfo)

        console.log(playerRoundTIleInfo, weaponRoundTileInfo)

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


                    // const weaponNextY = y - 2
                    //
                    // const playerTile = tileInfo[x][playerTopNextY]
                    // const weaponTile = tileInfo[x][weaponNextY]
                    //
                    // // 检测门的碰撞
                    // if (
                    //     (x === doorX && playerTopNextY === doorY) ||
                    //     (x === doorX && weaponNextY === doorY) &&
                    //     doorState !== ENTITY_STATE_ENUM.DEATH
                    // ) {
                    //     this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    //     return true
                    // }
                    //
                    // // 检测敌人碰撞
                    // if (enemies.filter(enemy => (x === enemy.x && playerTopNextY === enemy.y) || (x === enemy.x && weaponNextY === enemy.y)).length) {
                    //     this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    //     return true
                    // }
                    //
                    // // 判断地裂
                    // if (bursts.filter(burst => (x === burst.x && playerTopNextY === burst.y) && (!weaponTile || weaponTile.turnAble)).length) {
                    //     this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    //     return false
                    // }
                    //
                    // // 检测移动碰撞
                    // if (playerTile && playerTile.moveAble && (!weaponTile || weaponTile.turnAble)) {
                    // } else {
                    //     this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    //     return true
                    // }
                }

                if (direction === DIRECTION_ENUM.BOTTOM) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerTopNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (x === enemy.x && playerTopNextY === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerTopNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (!tileInfo[x][playerTopNextY] || !tileInfo[x][playerTopNextY].moveAble) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerTopNextY === doorY) ||
                        (playerLeftNextX === doorX && playerTopNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy =>
                        (playerLeftNextX === enemy.x && playerTopNextY === enemy.y) ||
                        (x === enemy.x && playerTopNextY === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    for (let burst of bursts) {
                        const {x: burstX, y:burstY } = burst
                        console.log(x, burstX, playerTopNextY, burstY)
                        console.log(tileInfo[playerLeftNextX][playerTopNextY], tileInfo[playerLeftNextX][playerTopNextY]?.turnAble)
                        console.log((x === burstX && playerTopNextY === burstY) && (!tileInfo[playerLeftNextX][playerTopNextY] || tileInfo[playerLeftNextX][playerTopNextY]?.turnAble))
                        console.log((x === burstX && playerTopNextY === burstY), (!tileInfo[playerLeftNextX][playerTopNextY] || tileInfo[playerLeftNextX][playerTopNextY]?.turnAble))
                        if ((x === burstX && playerTopNextY === burstY) && (!tileInfo[playerLeftNextX][playerTopNextY] || tileInfo[playerLeftNextX][playerTopNextY]?.turnAble)) {
                            return false
                        }
                    }

                    if (
                        (!tileInfo[x][playerTopNextY] || !tileInfo[x][playerTopNextY].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerTopNextY] || !tileInfo[playerLeftNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerTopNextY === doorY) ||
                        (playerRightNextX === doorX && playerTopNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerRightNextX === enemy.x && playerTopNextY === enemy.y) || (x === enemy.x && playerTopNextY === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerTopNextY === burst.y) && (playerRightNextX === burst.x && playerTopNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

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

                    // 检测门的碰撞
                    if (
                        (x === doorX && playerBottomNextY === doorY) ||
                        (x === doorX && weaponNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (x === enemy.x && playerBottomNextY === enemy.y) || (x === enemy.x && weaponNextY === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerBottomNextY === burst.y) && (x === burst.x && weaponNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (playerTile && playerTile.moveAble && (!weaponTile || weaponTile.moveAble)) {
                    } else {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerBottomNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (x === enemy.x && playerBottomNextY === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerBottomNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (!tileInfo[x][playerBottomNextY] || !tileInfo[x][playerBottomNextY].moveAble) {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerBottomNextY === doorY) ||
                        (playerLeftNextX === doorX && playerBottomNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && playerBottomNextY === enemy.y) || (playerLeftNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerBottomNextY === burst.y) && (playerLeftNextX === burst.x && playerBottomNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[x][playerBottomNextY] || !tileInfo[x][playerBottomNextY].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerBottomNextY] || !tileInfo[playerLeftNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKBACK
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    // 检测门的碰撞
                    if (
                        (x === doorX && playerBottomNextY === doorY) ||
                        (playerRightNextX === doorX && playerBottomNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerRightNextX === enemy.x && playerBottomNextY === enemy.y) || (playerRightNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (x === burst.x && playerBottomNextY === burst.y) && (playerRightNextX === burst.x && playerBottomNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

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
                    // 检测门的碰撞
                    if (
                        (playerLeftNextX === doorX && y === doorY) ||
                        (playerLeftNextX === doorX && playerBottomNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && playerBottomNextY === enemy.y) || (playerLeftNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerLeftNextX === burst.x && y === burst.y) && (playerLeftNextX === burst.x && playerBottomNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble) ||
                        (!tileInfo[playerLeftNextX][playerBottomNextY] || !tileInfo[playerLeftNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    // 检测门的碰撞
                    if (
                        (playerLeftNextX === doorX && y === doorY) ||
                        (playerLeftNextX === doorX && playerTopNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && playerTopNextY === enemy.y) || (playerLeftNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerLeftNextX === burst.x && y === burst.y) && (playerLeftNextX === burst.x && playerTopNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

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

                    // 检测门的碰撞
                    if (
                        (playerLeftNextX === doorX && y === doorY) ||
                        (weaponNextX === doorX && y === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && y === enemy.y) || (weaponNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerLeftNextX === burst.x && y === burst.y) && (weaponNextX === burst.x && y === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble) ||
                        (!tileInfo[weaponNextX][y] || !tileInfo[weaponNextX][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKLEFT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    // 检测门的碰撞
                    if (
                        (playerRightNextX === doorX && y === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerLeftNextX === burst.x && y === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

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
                    // 检测门的碰撞
                    if (
                        (playerRightNextX === doorX && y === doorY) ||
                        (playerRightNextX === doorX && playerBottomNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerRightNextX === enemy.x && playerBottomNextY === enemy.y) || (playerRightNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerRightNextX === burst.x && y === burst.y) && (playerRightNextX === burst.x && playerBottomNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[playerRightNextX][playerBottomNextY] || !tileInfo[playerRightNextX][playerBottomNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.TOP) {
                    // 检测门的碰撞
                    if (
                        (playerRightNextX === doorX && y === doorY) ||
                        (playerRightNextX === doorX && playerTopNextY === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerRightNextX === enemy.x && playerTopNextY === enemy.y) || (playerRightNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerRightNextX === burst.x && y === burst.y) && (playerRightNextX === burst.x && playerTopNextY === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[playerRightNextX][playerTopNextY] || !tileInfo[playerRightNextX][playerTopNextY].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.LEFT) {
                    // 检测门的碰撞
                    if (
                        (playerLeftNextX === doorX && y === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerLeftNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerRightNextX === burst.x && y === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerLeftNextX][y] || !tileInfo[playerLeftNextX][y].moveAble)
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
                        return true
                    }
                }

                if (direction === DIRECTION_ENUM.RIGHT) {
                    const weaponNextX = x + 2

                    // 检测门的碰撞
                    if (
                        (playerRightNextX === doorX && y === doorY) ||
                        (weaponNextX === doorX && y === doorY) &&
                        doorState !== ENTITY_STATE_ENUM.DEATH
                    ) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 检测敌人碰撞
                    if (enemies.filter(enemy => (playerRightNextX === enemy.x && y === enemy.y) || (weaponNextX === enemy.x && y === enemy.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return true
                    }

                    // 判断地裂
                    if (bursts.filter(burst => (playerRightNextX === burst.x && y === burst.y) && (weaponNextX === burst.x && y === burst.y)).length) {
                        this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                        return false
                    }

                    if (
                        (!tileInfo[playerRightNextX][y] || !tileInfo[playerRightNextX][y].moveAble) ||
                        (!tileInfo[weaponNextX][y] || !tileInfo[weaponNextX][y].moveAble)
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

                // 判断地裂
                if (bursts.filter(burst => ((!tileInfo[playerLeftNextX][y] || tileInfo[playerLeftNextX][y].turnAble) && (!tileInfo[playerLeftNextX][nextTurnLeftY] || tileInfo[playerLeftNextX][playerTopNextY]?.turnAble))).length) {
                    console.log(!tileInfo[nextTurnLeftY][nextTurnLeftY])
                    this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    return false
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
                    (x === doorX && nextTurnRightY === doorY) ||
                    (nextTurnRightX === doorX && y === doorY) ||
                    (nextTurnRightX === doorX && nextTurnRightY === doorY) &&
                    doorState !== ENTITY_STATE_ENUM.DEATH
                ) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
                    return true
                }

                // 检测敌人碰撞
                if (enemies.filter(enemy => (x === enemy.x && nextTurnRightY === enemy.y) || (nextTurnRightX === enemy.x && y === enemy.y) || (nextTurnRightX === enemy.x && nextTurnRightY === enemy.y)).length) {
                    this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
                    return true
                }

                // 判断地裂
                if (bursts.filter(burst => (nextTurnRightX === burst.x && y === burst.y) && (nextTurnRightX === burst.x && nextTurnRightY === burst.y)).length) {
                    this.state = ENTITY_STATE_ENUM.BLOCKFRONT
                    return false
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


