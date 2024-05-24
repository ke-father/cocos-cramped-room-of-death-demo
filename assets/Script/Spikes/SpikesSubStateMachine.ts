import {
    PARAMS_NAME_ENUM,
    SPIKES_COUNT_MAP_NUMBER_ENUM
} from "db://assets/Enums";
import {SubStateMachine} from "db://assets/Base/SubStateMachine";

const BASE_URL = 'texture/spikes/spikesone'

export default class SpikesSubStateMachine extends SubStateMachine {
    run() {
        const value = this.fsm.getParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT)
        this.currentState = this.stateMachines.get(SPIKES_COUNT_MAP_NUMBER_ENUM[value as number])
    }
}
