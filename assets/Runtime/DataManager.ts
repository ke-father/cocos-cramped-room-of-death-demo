// 数据中心
// @ts-ignore
import {ILevel, ITile} from "db://assets/Levels";
import Singleton from "db://assets/Base/Singleton";
import {TileManager} from "db://assets/Script/Tile/TileManager";
import {PlayerManager} from "db://assets/Script/Player/PlayerManager";
import {WoodenSkeletonManager} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonManager";
import {DoorManager} from "db://assets/Script/Door/DoorManager";
import {EnemyManager} from "db://assets/Base/EnemyManager";
import {BurstManager} from "db://assets/Script/Burst/BurstManager";
import {SpikesManager} from "db://assets/Script/Spikes/SpikesManager";
import {SmokeManager} from "db://assets/Script/Smoke/SmokeManager";

export type IRecord = Omit<ILevel, 'mapInfo'>

export default class DataManager extends Singleton {
    static get Instance() {
        return super.GetInstance<DataManager>()
    }

    // 地图信息
    mapInfo: Array<Array<ITile>>
    // 瓦片信息
    tileInfo: Array<Array<TileManager>>
    // 横向地图信息
    mapRowCount: number = 0
    // 纵向地图信息
    mapColumnCount: number = 0
    // 关卡索引
    levelIndex: number = 1
    // 玩家信息
    player: PlayerManager
    // 门信息
    door: DoorManager
    // 敌人群信息
    enemies: Array<EnemyManager>
    // 地裂
    bursts: Array<BurstManager>
    // 地刺陷阱
    spikes: Array<SpikesManager>
    // 烟雾
    smokes: Array<SmokeManager>
    // 记忆数据
    records: IRecord[]

    // 清空数据
    reset () {
        this.mapInfo = []
        this.tileInfo = []
        this.player = null
        this.door = null
        this.bursts = []
        this.spikes = []
        this.enemies = []
        this.smokes = []
        this.records = []
        this.mapRowCount = 0
        this.mapColumnCount = 0
    }
}
