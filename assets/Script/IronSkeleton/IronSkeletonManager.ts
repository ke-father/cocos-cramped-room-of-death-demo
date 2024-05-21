import {_decorator} from 'cc';
import {EnemyManager} from "db://assets/Base/EnemyManager";
import {IEntity} from "db://assets/Levels";
import {IronSkeletonStateMachine} from "db://assets/Script/IronSkeleton/IronSkeletonStateMachine";

const {ccclass, property} = _decorator;

@ccclass('IronSkeletonManager')
export class IronSkeletonManager extends EnemyManager {
    async init(params: IEntity) {
        // 挂载组件
        this.fsm = this.addComponent(IronSkeletonStateMachine)
        await this.fsm.init()

        await super.init(params)
    }
}



