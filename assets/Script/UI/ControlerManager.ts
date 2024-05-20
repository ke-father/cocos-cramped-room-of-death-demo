import { _decorator, Component, Node } from 'cc';
import EventManager from "db://assets/Runtime/EventManager";
import {CONTROLLER_ENUM, EVENT_ENUM} from "db://assets/Enums";
const { ccclass, property } = _decorator;

@ccclass('ControllerManager')
export class ControllerManager extends Component {
    handleControl (event: Event, type: string | CONTROLLER_ENUM) {
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_CTRL, type)
    }
}


