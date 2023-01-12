import { ColyseusCallbacksCollection,ColyseusCallbacksArray, ColyseusCallbacksMap, ColyseusCallbacksReferences } from "./client-colyseus-ext"
import * as serverStateSpec from "./server-state-spec"


export type PlayerMapState=ColyseusCallbacksMap<any,serverStateSpec.PlayerState> & Map<any,serverStateSpec.PlayerState> &{
}
export type PlayerState=ColyseusCallbacksReferences<serverStateSpec.PlayerState> & serverStateSpec.PlayerState & {
    userData:PlayerUserDataState
    battleData:PlayerBattleDataState
    buttons: PlayerButtonState
    healthData:PlayerHealthDataState
    statsData:PlayerStatsDataState
}

export type PlayerStatsKillDataState= ColyseusCallbacksReferences<serverStateSpec.PlayerStatsKillDataState> & serverStateSpec.PlayerStatsKillDataState & {

}

export type PlayerStatsDataState= ColyseusCallbacksReferences<serverStateSpec.PlayerStatsDataState> & serverStateSpec.PlayerStatsDataState & {
    kills:ColyseusCallbacksArray<any,serverStateSpec.PlayerStatsKillDataState> & Array<serverStateSpec.PlayerStatsKillDataState>
}

export type PlayerHealthDataState = ColyseusCallbacksReferences<serverStateSpec.PlayerHealthDataState> & serverStateSpec.PlayerHealthDataState & {
}
export type PlayerBattleDataState= ColyseusCallbacksReferences<serverStateSpec.PlayerBattleDataState> & serverStateSpec.PlayerBattleDataState & {
}
export type PlayerButtonState= ColyseusCallbacksReferences<serverStateSpec.PlayerButtonState> & serverStateSpec.PlayerButtonState & {
}
export type BattleState= ColyseusCallbacksReferences<serverStateSpec.BattleState> & serverStateSpec.BattleState & {
}
export type TeamState= ColyseusCallbacksReferences<serverStateSpec.TeamState> & serverStateSpec.TeamState & {
}

export type EnrollmentState= ColyseusCallbacksReferences<serverStateSpec.EnrollmentState> & serverStateSpec.EnrollmentState & {
    teams:ColyseusCallbacksMap<any,serverStateSpec.TeamMemberState> & Map<any,serverStateSpec.TeamMemberState>
}

export type PlayerUserDataState= ColyseusCallbacksReferences<serverStateSpec.PlayerUserDataState> & serverStateSpec.PlayerUserDataState & {
}

export type Vector3State= ColyseusCallbacksReferences<serverStateSpec.Vector3State> & serverStateSpec.Vector3State & {
}

export type ITrackFeatureState = ColyseusCallbacksReferences<serverStateSpec.ITrackFeatureState> & serverStateSpec.ITrackFeatureState & {   
    
}

export type LevelDataState = ColyseusCallbacksReferences<serverStateSpec.LevelDataState> & serverStateSpec.LevelDataState & {   
    trackFeatures?:ColyseusCallbacksMap<any,serverStateSpec.ITrackFeatureState> & Map<any,serverStateSpec.ITrackFeatureState>
}

export type BattleRoomState=ColyseusCallbacksReferences<serverStateSpec.BattleRoomState> & serverStateSpec.BattleRoomState & {
    players:PlayerMapState
    battleData:BattleState
    enrollment:EnrollmentState
    levelData:LevelDataState
}
type Vector3Type = serverStateSpec.Vector3State&{
    
}
export class Vector3StateSupport implements serverStateSpec.Vector3State{
    x:number
    y:number
    z:number
    
    constructor(x:number,y:number,z:number){
        this.x = x;
        this.y = y
        this.z = z
    }
    copyFrom(vec:Vector3Type){
        this.x = vec.x
        this.y = vec.y
        this.z = vec.z
    }
}
