import { _decorator, Component, Node } from 'cc';
import {TileMapManager} from "db://assets/Script/Tile/TileMapManager";
import {createUINode} from "../../Utils";
// @ts-ignore
import Levels, {ILevel} from "db://assets/Levels";
import DataManager from "db://assets/Runtime/DataManager";
import {TILE_HEIGHT, TILE_WIDTH} from "db://assets/Script/Tile/TileManager";
import EventManager from "db://assets/Runtime/EventManager";
import {EVENT_ENUM} from "db://assets/Enums";
import {PlayerManager} from "db://assets/Script/Player/PlayerManager";
import {WoodenSkeletonManager} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonManager";
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
    // 关卡
    level: ILevel
    // 舞台
    stage: Node

    onLoad () {
        // 事件中心绑定
        EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this)
    }

    onDestroy () {
        // 事件中心解绑
        EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel)
    }

    start () {
        this.generateStage()
        this.initLevel()
    }

    // 初始化关卡
    initLevel () {
        // 获取map信息
        const level = Levels[`level${DataManager.Instance.levelIndex}`]
        if (level) {
            this.clearLevel()

            this.level = level

            // 存储地图组件
            DataManager.Instance.mapInfo = this.level.mapInfo
            // 存储横向地图个数
            DataManager.Instance.mapRowCount = this.level.mapInfo.length || 0
            // 存储纵向地图个数
            DataManager.Instance.mapColumnCount = this.level.mapInfo[0].length || 0

            // 渲染地图
            this.generateTileMap()
            // 渲染敌人
            this.generateEnemies()
            // 渲染人物
            this.generatePlayer()
        }
    }

    // 切换关卡
    nextLevel () {
        DataManager.Instance.levelIndex++
        this.initLevel()
    }

    // 清空关卡
    clearLevel () {
        // 清空舞台元素
        this.stage.destroyAllChildren()
        // 清空数据中心内容
        DataManager.Instance.reset()
    }

    // 生成舞台
    generateStage () {
        // 创建舞台
        this.stage = createUINode()
        // 将舞台挂载
        this.stage.setParent(this.node)
    }

    // 生成瓦片地图
    async generateTileMap () {
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
    async generatePlayer () {
        // 创建player节点
        const player = createUINode()
        // 将节点挂载到舞台上
        player.setParent(this.stage)
        // 添加渲染组件
        const playerManager = player.addComponent(PlayerManager)
        // 调用初始化
        await playerManager.init()
        // 储存玩家信息
        DataManager.Instance.player = playerManager
        // 需要在敌人生成后主动触发事件 检测
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true)
    }

    // 生成敌人
    async generateEnemies () {
        // 创建player节点
        const enemy = createUINode()
        // 将节点挂载到舞台上
        enemy.setParent(this.stage)
        // 添加渲染组件
        const enemyManager = enemy.addComponent(WoodenSkeletonManager)
        // 调用初始化
        await enemyManager.init()
        // 储存敌人信息
        DataManager.Instance.enemies.push(enemyManager)
    }

    // 设置适应位置
    adaptPos () {
        // 获取地图横向 纵向数据
        const { mapRowCount, mapColumnCount } = DataManager.Instance
        // 横向偏移量
        const disX = (TILE_WIDTH * mapRowCount) / 2
        // 纵向偏移量
        const disY = (TILE_HEIGHT * mapColumnCount) / 2 + 80

        // 设置舞台宽高 横向向左  纵向向上
        this.stage.setPosition(-disX, disY)
    }
}


