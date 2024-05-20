// 事件中心
import {resources, SpriteFrame } from "cc";
import Singleton from "db://assets/Base/Singleton";

interface IItem {
    func: Function
    ctx: unknown
}

export default class EventManager extends Singleton {
    static get Instance() {
        return super.GetInstance<EventManager>()
    }

    // 事件数据
    private eventDic: Map<String, Array<IItem>> = new Map()

    /**
     * 绑定方法
     * @param eventName 事件名称
     * @param func 事件回调
     * @param ctx 上下文参数
     */
    on (eventName: string, func: Function, ctx: unknown) {
        // 判断是否已有事件数据
        if (this.eventDic.has(eventName)) {
            this.eventDic.get(eventName).push({ func, ctx })
        } else {
            this.eventDic.set(eventName, [{func, ctx}])
        }
    }

    /**
     * 解绑方法
     * @param eventName 事件名称
     * @param func 事件回调
     */
    off (eventName: string, func: Function) {
        // 判断是否已有时间数据
        if (this.eventDic.has(eventName)) {
            // 查找是否已有该方法
            const index = this.eventDic.get(eventName).findIndex(i => i.func === func)
            // 有则删除
            index > -1 && this.eventDic.get(eventName).splice(index, 1)
        }
    }

    /**
     * 触发方法
     * @param eventName 事件名称
     * @param prams 其余参数
     */
    emit (eventName: string, ...prams: unknown[]) {
        if (this.eventDic.has(eventName)) {
            this.eventDic.get(eventName).map(({func, ctx}) => {
                ctx ? func.apply(ctx, prams) : func(...prams)
            })
        }
    }

    // 清除所有数据
    clear () {
        this.eventDic.clear()
    }
}
