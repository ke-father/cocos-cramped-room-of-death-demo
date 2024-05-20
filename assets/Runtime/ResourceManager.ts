// 数据中心
import {resources, SpriteFrame } from "cc";
import Singleton from "db://assets/Base/Singleton";

export default class ResourceManager extends Singleton {
    static get Instance() {
        return super.GetInstance<ResourceManager>()
    }

    // 异步加载图片资源
    loadDir (path: string, type: typeof SpriteFrame = SpriteFrame) {
        return new Promise<SpriteFrame[]>((resolve, reject) => {
            resources.loadDir(path, type, (err, assets) => {
                if (err) {
                    reject(err)
                    return
                }

                resolve(assets)
            })
        })
    }
}
