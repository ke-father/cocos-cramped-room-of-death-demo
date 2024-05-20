import { Node, UITransform,Layers, SpriteFrame } from 'cc'

// 创建UI节点
export const createUINode = (name = '') => {
    const node = new Node()

    // 节点挂载UITransform组件
    const transform = node.addComponent(UITransform)
    // 设置锚点
    transform.setAnchorPoint(0, 1)
    // 设置layer 摄像机分组
    node.layer = 1 << Layers.nameToLayer('UI_2D')

    return node
}

// 随机渲染
export const randomByRange = (start: number, end: number) =>  Math.floor(start + (end - start) * Math.random())

// 排序加载图片
export const sortSpriteFrame = (spriteFrames: SpriteFrame[]) => {
    let reg = /\(\d+\)/
    let getNumberWithName = (name: string) => parseInt(name.match(reg)[1] || '0')

    return spriteFrames.sort((a, b) => getNumberWithName(a.name) - getNumberWithName(b.name))
}

// 随机字符串方法
export function randomUUID () {
    return 'xxxxxxxxxxxxxxxyyyyy'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}
