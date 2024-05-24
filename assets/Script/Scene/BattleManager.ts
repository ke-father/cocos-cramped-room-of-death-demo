import {_decorator, Component, Node, director} from 'cc';
import {TileMapManager} from "db://assets/Script/Tile/TileMapManager";
import {createUINode} from "../../Utils";
// @ts-ignore
import Levels, {IEntity, ILevel} from "db://assets/Levels";
import DataManager, {IRecord} from "db://assets/Runtime/DataManager";
import {TILE_HEIGHT, TILE_WIDTH} from "db://assets/Script/Tile/TileManager";
import EventManager from "db://assets/Runtime/EventManager";
import {DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, SCENE_ENUM} from "db://assets/Enums";
import {PlayerManager} from "db://assets/Script/Player/PlayerManager";
import {WoodenSkeletonManager} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonManager";
import {DoorManager} from "db://assets/Script/Door/DoorManager";
import {BurstManager} from "db://assets/Script/Burst/BurstManager";
import {SpikesManager} from "db://assets/Script/Spikes/SpikesManager";
import {IronSkeletonManager} from "db://assets/Script/IronSkeleton/IronSkeletonManager";
import {SmokeManager} from "db://assets/Script/Smoke/SmokeManager";
import FaderManager from "db://assets/Runtime/FaderManager";
import {ShakeManager} from "db://assets/Script/UI/ShakeManager";

const {ccclass, property} = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    // 关卡
    level: ILevel
    // 舞台
    stage: Node
    // 烟雾图层
    private SmokeLayer: Node
    private inited = false

    onLoad() {
        DataManager.Instance.levelIndex = 2
        // 事件中心绑定 - 下一关
        EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this)
        // 事件中心绑定 - 检测是否要过关
        EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived, this)
        // 事件中心绑定 — 跑步烟雾
        EventManager.Instance.on(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke, this)
        // 事件中心绑定 —— 记录步数
        EventManager.Instance.on(EVENT_ENUM.RECORD_STEP, this.record, this)
        // 事件中心绑定 —— 撤销步数
        EventManager.Instance.on(EVENT_ENUM.REVOKE_STEP, this.revoke, this)
        // 事件中心绑定 —— 初始化关卡
        EventManager.Instance.on(EVENT_ENUM.RESTART_LEVEL, this.restart, this)
        // 事件中心绑定 退出
        EventManager.Instance.on(EVENT_ENUM.OUT_BATTLE, this.outBattle, this)
    }

    onDestroy() {
        // 事件中心绑定 - 下一关
        EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel)
        // 事件中心绑定 - 检测是否要过关
        EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived)
        // 事件中心绑定 — 跑步烟雾
        EventManager.Instance.off(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke)
        // 事件中心绑定 —— 记录步数
        EventManager.Instance.off(EVENT_ENUM.RECORD_STEP, this.record)
        // 事件中心绑定 —— 撤销步数
        EventManager.Instance.off(EVENT_ENUM.SCREEN_SHAKE, this.revoke)
        // 事件中心绑定 —— 初始化关卡
        EventManager.Instance.off(EVENT_ENUM.RESTART_LEVEL, this.restart)
        // 事件中心绑定 退出
        EventManager.Instance.off(EVENT_ENUM.OUT_BATTLE, this.outBattle)
    }

    start() {
        this.generateStage()
        this.initLevel()
    }

    // 初始化关卡
    async initLevel() {
        // 获取map信息
        const level = Levels[`level${DataManager.Instance.levelIndex}`]
        if (level) {
            if (this.inited) {
                await FaderManager.Instance.fadeIn()
            } else {
                await FaderManager.Instance?.mask()
            }

            this.clearLevel()

            this.level = level

            // 存储地图组件
            DataManager.Instance.mapInfo = this.level.mapInfo
            // 存储横向地图个数
            DataManager.Instance.mapRowCount = this.level.mapInfo.length || 0
            // 存储纵向地图个数
            DataManager.Instance.mapColumnCount = this.level.mapInfo[0].length || 0

            await Promise.all([
                // 渲染地图
                await this.generateTileMap(),
                // 生成地裂地图
                await this.generateBursts(),
                // 生成地刺陷阱
                await this.generateSpikes(),
                // 预加载烟雾图层
                await this.generateSmokeLayer(),
                // 渲染敌人
                await this.generateEnemies(),
                // 生成门
                await this.generateDoor(),
                // 渲染人物
                await this.generatePlayer()
            ])

            await FaderManager.Instance.fadeOut()
            this.inited = true
        } else {
            this.outBattle()
        }
    }

    // 切换关卡
    async nextLevel() {
        DataManager.Instance.levelIndex++
        await this.initLevel()
    }

    // 清空关卡
    clearLevel() {
        // 清空舞台元素
        this.stage.destroyAllChildren()

        // 清空数据中心内容
        DataManager.Instance.reset()
    }

    // 生成舞台
    generateStage() {
        // 创建舞台
        this.stage = createUINode()
        // 将舞台挂载
        this.stage.setParent(this.node)
        // 添加舞台震动效果
        this.stage.addComponent(ShakeManager)
    }

    // 生成瓦片地图
    async generateTileMap() {
        // 创建tileMap
        const tileMap = createUINode()
        // 挂载地图
        tileMap.setParent(this.stage)
        // 挂载组件
        const tileMapManager = tileMap.addComponent(TileMapManager)
        // 初始化组件
        await tileMapManager.init()

        // 设置适应位置
        this.adaptPos()
    }

    // 生成人物
    async generatePlayer() {
        const player = createUINode()
        // 将节点挂载到舞台上
        player.setParent(this.stage)
        // 添加渲染组件
        const playerManager = player.addComponent(PlayerManager)
        // 调用初始化
        await playerManager.init(this.level.player)
        // 储存玩家信息
        DataManager.Instance.player = playerManager
        // 需要在敌人生成后主动触发事件 检测
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true)
    }

    // 生成敌人
    async generateEnemies() {const promise = []
        for (let enemyInfo of this.level.enemies) {
            const enemyNode = createUINode()
            enemyNode.name = enemyInfo.type
            // 将节点挂载到舞台上
            enemyNode.setParent(this.stage)

            const manager = enemyInfo.type === ENTITY_TYPE_ENUM.SKELETON_WOODEN ? WoodenSkeletonManager : IronSkeletonManager

            // 添加渲染组件
            const enemyManager = enemyNode.addComponent(manager)
            // 调用初始化
            promise.push(enemyManager.init(enemyInfo))
            // 储存敌人信息
            DataManager.Instance.enemies.push(enemyManager)
        }

        await Promise.all(promise)
    }

    /**
     * 生成门
     */
    async generateDoor() {
        const Door = createUINode()
        // 将节点挂载到舞台上
        Door.setParent(this.stage)
        // 添加渲染组件
        const doorManager = Door.addComponent(DoorManager)
        // 调用初始化
        await doorManager.init(this.level.door)
        // 储存玩家信息
        DataManager.Instance.door = doorManager
    }

    /**
     * 生成地裂地图
     */
    async generateBursts() {
        const promise = []

        for (let burstInfo of this.level.bursts) {
            const burstNode = createUINode()
            // 将节点挂载到舞台上
            burstNode.setParent(this.stage)
            // 添加渲染组件
            const burstManager = burstNode.addComponent(BurstManager)
            // 调用初始化
            promise.push(burstManager.init(burstInfo))
            // 储存玩家信息
            DataManager.Instance.bursts.push(burstManager)
        }

        await Promise.all(promise)
    }

    async generateSpikes() {
        const promise = []

        for (let spikeInfo of this.level.spikes) {
            const spikeNode = createUINode()
            // 将节点挂载到舞台上
            spikeNode.setParent(this.stage)
            // 添加渲染组件
            const spikesManager = spikeNode.addComponent(SpikesManager)
            // 调用初始化
            promise.push(spikesManager.init(spikeInfo))
            // 储存玩家信息
            DataManager.Instance.spikes.push(spikesManager)
        }

        await Promise.all(promise)
    }

    // 设置适应位置
    adaptPos() {
        // 获取地图横向 纵向数据
        const {mapRowCount, mapColumnCount} = DataManager.Instance
        // 横向偏移量
        const disX = (TILE_WIDTH * mapRowCount) / 2
        // 纵向偏移量
        const disY = (TILE_HEIGHT * mapColumnCount) / 2 + 80

        this.stage.getComponent(ShakeManager).stop()

        // 设置舞台宽高 横向向左  纵向向上
        this.stage.setPosition(-disX, disY)
    }

    // 是否切关
    checkArrived() {
        if (!DataManager.Instance.player || !DataManager.Instance.door) return

        const {x: playerX, y: playerY, state: playerState} = DataManager.Instance.player
        const {x: doorX, y: doorY, state: doorState} = DataManager.Instance.door

        // @ts-ignore
        if (playerX === doorX && playerY === doorY && ![ENTITY_STATE_ENUM.DEATH, ENTITY_STATE_ENUM.AIRDEATH].includes(playerState) && doorState === ENTITY_STATE_ENUM.DEATH) {
            EventManager.Instance.emit(EVENT_ENUM.NEXT_LEVEL)
        }

    }

    // 生成烟雾
    generateSmoke(x: number, y: number, direction: DIRECTION_ENUM) {
        // 查询是否有死掉的资源 重复利用
        const item = DataManager.Instance.smokes.find(smoke => smoke.state === ENTITY_STATE_ENUM.DEATH)
        if (item) {
            item.x = x
            item.y = y
            item.direction = direction
            item.state = ENTITY_STATE_ENUM.IDLE
            this.node.setPosition(x * TILE_WIDTH - TILE_WIDTH * 1.5, -y * TILE_HEIGHT + TILE_HEIGHT * 1.5)
        } else {
            const smoke = createUINode()
            // 将节点挂载到舞台上
            smoke.setParent(this.SmokeLayer)
            // 添加渲染组件
            const smokeManager = smoke.addComponent(SmokeManager)
            // 调用初始化
            smokeManager.init({
                x,
                y,
                type: ENTITY_TYPE_ENUM.SMOKE,
                direction,
                state: ENTITY_STATE_ENUM.IDLE
            })
            // 储存玩家信息
            DataManager.Instance.smokes.push(smokeManager)
        }
    }

    // 预加载烟雾层  防止烟雾遮盖人物
    async generateSmokeLayer() {
        this.SmokeLayer = createUINode()
        // 将节点挂载到舞台上
        this.SmokeLayer.setParent(this.stage)
        const smoke = createUINode()
        // 添加渲染组件
        const smokeManager = smoke.addComponent(SmokeManager)
        // 初始化预加载状态机
        smokeManager.init({} as IEntity)
    }

    record() {
        const item: IRecord = {
            player: {
                x: DataManager.Instance.player.x,
                y: DataManager.Instance.player.y,
                state: DataManager.Instance.player.state,
                direction: DataManager.Instance.player.direction,
                type: DataManager.Instance.player.type
            },
            door: {
                x: DataManager.Instance.door.x,
                y: DataManager.Instance.door.y,
                state: DataManager.Instance.door.state,
                direction: DataManager.Instance.door.direction,
                type: DataManager.Instance.door.type
            },
            enemies: DataManager.Instance.enemies.map(({x, y, direction, type, state}) => ({
                x, y, type, state, direction
            })),
            bursts: DataManager.Instance.bursts.map(({x, y, direction, type, state}) => ({
                x, y, type, state, direction
            })),
            spikes: DataManager.Instance.spikes.map(({x, y, count, type}) => ({
                x, y, count, type
            }))
        }

        DataManager.Instance.records.push(item)
    }

    revoke() {
        const item = DataManager.Instance.records.pop()
        if (item) {
            DataManager.Instance.player.x = DataManager.Instance.player.targetX = item.player.x
            DataManager.Instance.player.y = DataManager.Instance.player.targetY = item.player.y
            // @ts-ignore
            DataManager.Instance.player.state = [ENTITY_STATE_ENUM.IDLE, ENTITY_STATE_ENUM.DEATH, ENTITY_STATE_ENUM.AIRDEATH].includes(item.player.state) ? item.player.state : ENTITY_STATE_ENUM.IDLE
            DataManager.Instance.player.direction = item.player.direction
            DataManager.Instance.player.type = item.player.type

            DataManager.Instance.door.x = item.door.x
            DataManager.Instance.door.y = item.door.y
            DataManager.Instance.door.state = item.door.state
            DataManager.Instance.door.direction = item.door.direction
            DataManager.Instance.door.type = item.door.type

            for (let index in DataManager.Instance.enemies) {
                const itemEnemy = item.enemies[index]
                DataManager.Instance.enemies[index].x = itemEnemy.x
                DataManager.Instance.enemies[index].y = itemEnemy.y
                DataManager.Instance.enemies[index].state = itemEnemy.state
                DataManager.Instance.enemies[index].type = itemEnemy.type
                DataManager.Instance.enemies[index].direction = itemEnemy.direction
            }

            for (let index in DataManager.Instance.bursts) {
                const itemBursts = item.bursts[index]
                DataManager.Instance.bursts[index].x = itemBursts.x
                DataManager.Instance.bursts[index].y = itemBursts.y
                DataManager.Instance.bursts[index].state = itemBursts.state
                DataManager.Instance.bursts[index].type = itemBursts.type
                DataManager.Instance.bursts[index].direction = itemBursts.direction
            }

            for (let index in DataManager.Instance.spikes) {
                const itemSpikes = item.spikes[index]
                DataManager.Instance.spikes[index].x = itemSpikes.x
                DataManager.Instance.spikes[index].y = itemSpikes.y
                DataManager.Instance.spikes[index].type = itemSpikes.type
                DataManager.Instance.spikes[index].count = itemSpikes.count
            }
        }
    }

    restart () {
        DataManager.Instance.reset()
        this.initLevel()
    }

    async outBattle () {
        await FaderManager.Instance.fadeIn()
        director.loadScene(SCENE_ENUM.START)
    }
}


