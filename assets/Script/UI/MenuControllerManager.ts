import { _decorator, Component, Node } from 'cc';
import EventManager from "db://assets/Runtime/EventManager";
import {EVENT_ENUM} from "db://assets/Enums";
const { ccclass, property } = _decorator;

@ccclass('MenuControllerManager')
export class MenuControllerManager extends Component {
    handleUndo () {
        EventManager.Instance.emit(EVENT_ENUM.REVOKE_STEP)
    }

    handleRestart () {
        EventManager.Instance.emit(EVENT_ENUM.RESTART_LEVEL)
    }

    handleOut () {
        EventManager.Instance.emit(EVENT_ENUM.OUT_BATTLE)
    }
}


