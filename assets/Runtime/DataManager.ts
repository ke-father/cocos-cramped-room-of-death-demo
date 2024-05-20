// 数据中心
// @ts-ignore
import {ITile} from "db://assets/Levels";
import Singleton from "db://assets/Base/Singleton";
import {TileManager} from "db://assets/Script/Tile/TileManager";
import {PlayerManager} from "db://assets/Script/Player/PlayerManager";
import {WoodenSkeletonManager} from "db://assets/Script/WoodenSkeleton/WoodenSkeletonManager";

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
    // 敌人群信息
    enemies: Array<WoodenSkeletonManager>

    // 清空数据
    reset () {
        this.mapInfo = []
        this.tileInfo = []
        this.player = null
        this.enemies = []
        this.mapRowCount = 0
        this.mapColumnCount = 0
    }
}
