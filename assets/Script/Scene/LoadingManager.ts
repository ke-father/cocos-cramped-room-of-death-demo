import { _decorator, Component, Node, director, resources, ProgressBar } from 'cc';
import FaderManager from "db://assets/Runtime/FaderManager";
import {SCENE_ENUM} from "db://assets/Enums";
const { ccclass, property } = _decorator;

@ccclass('LoadingManager')
export class LoadingManager extends Component {
    @property(ProgressBar) bar: ProgressBar = null!

    onLoad () {
        resources.preloadDir('texture/ctrl', (cur, total) => {
            this.bar.progress = cur / total
        }, () => {
            director.loadScene(SCENE_ENUM.START)
        })
    }
}


