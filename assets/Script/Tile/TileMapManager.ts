import { _decorator, Component, Node, Sprite, resources, SpriteFrame, UITransform, Layers } from 'cc';
const { ccclass, property } = _decorator;
import {createUINode, randomByRange} from "../../Utils";
import {TileManager} from "db://assets/Script/Tile/TileManager";
import DataManager from "db://assets/Runtime/DataManager";
import ResourceManager from "db://assets/Runtime/ResourceManager";

@ccclass('TileMapManager')
export class TileMapManager extends Component {
    /**
     * 生成瓦片
     */
    async init () {
        DataManager.Instance.tileInfo = []
        // 获取map信息
        const { mapInfo } = DataManager.Instance
        // 初始化瓦片信息
        DataManager.Instance.tileInfo = []
        // 异步加载所有图片资源
        const spriteFrames = await ResourceManager.Instance.loadDir("texture/tile/tile")

        mapInfo.map((info, infoIndex) => {
            DataManager.Instance.tileInfo[infoIndex] = []
            info.map((item, itemIndex) => {
                if (!item.src || !item.type) return

                // 创建节点
                const node = createUINode()

                // 使用随机
                let number = item.src
                // 如果地图瓦片资源位1,5,9 启用随机
                // @ts-ignore
                if ([1,5,9].includes(number) && (infoIndex % 2 === 0) && (itemIndex % 2 === 0)) number += randomByRange(0, 4)

                // 创建图片路径
                const imgSrc = `tile (${number})`
                // 获取图片资源
                const spriteFrame = spriteFrames.find(v => v.name === imgSrc) || spriteFrames[0]

                // 节点挂载
                const tileManager = node.addComponent(TileManager)
                // 获取瓦片类型
                const type = item.type
                // 初始化方法
                tileManager.init(type, spriteFrame, infoIndex, itemIndex)
                DataManager.Instance.tileInfo[infoIndex][itemIndex] = tileManager

                // 挂载
                node.setParent(this.node)
            })
        })
    }
}


