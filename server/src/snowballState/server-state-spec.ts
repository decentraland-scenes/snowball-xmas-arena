export interface Vector3State{
  x:number
  y:number
  z:number
}
export interface Quaternion3State{
  x:number
  y:number
  z:number
  w:number
}


export interface ClockState{
  serverTime:number
}
export interface PlayerButtonState{
  forward:boolean
  backward:boolean
  left:boolean
  right:boolean
  shoot:boolean
}

export interface PlayerBattleDataState extends ClockState{
  //move this to player race specific data???
  worldPosition:Vector3State
  //playerPosition:Vector3State //car location will scene center since it does not move
  /*
  closestProjectedPoint:Vector3State //is scene relative, but when used with closestSegmentID + track data can compute where
  worldPosition:Vector3State
  closestSegmentID:number
  closestPointID:number

  closestSegmentPercent:number// relates to closestSegmentID.  what percent of this segement is player at
  closestSegmentDistance:number //how far player is from center, aka the segement
  
  currentSpeed:number
  */
  worldMoveDirection:Quaternion3State//world moving direction
  shootDirection:Quaternion3State //car forward direction
  cameraDirection:Quaternion3State //turn angle
  endTime:number //move this as wont change till the end
  enrollTime: number//time joined
  teamId:string//carModelId:string //move this as wont change much if at all?
  lap:number //move this as wont change till the end //currently base 1 index   first lap is lap:1
  //lapTimes //TODO ADD DEFINITION HERE!!!
  racePosition:number 
  
  lastKnownServerTime:number
  lastKnownClientTime:number

  //isDrifting: boolean
  //currentSpeed : number
}

export type BattleStatus="unknown"|"not-started"|"starting"|"started"|"ended"
export type PlayerConnectionStatus="unknown"|"connected"|"reconnecting"|"disconnected"|"lost connection"

export interface PlayerState{
  id:string
  sessionId:string

  connStatus:PlayerConnectionStatus
  type:"combatant"|"spectator"

  userData:PlayerUserDataState
  battleData:PlayerBattleDataState
  healthData:PlayerHealthDataState
  buttons: PlayerButtonState
  statsData: PlayerStatsDataState
}



export interface PlayerUserDataState{
  name:string
  userId:string
  ///snapshotFace128:string snapshots deprecated use AvatarTexture
}

export interface BattleState extends ClockState{
  id:string
  name:string
  status:BattleStatus
  startTime:number
  timeLimit:number
  endTime:number
  endTimeActual:number
  maxLaps:number //move to track data or is max laps race data?
}

//broadcast object instead of linking to state the level details
export interface LevelDataState{
  id:string
  name:string
  //status:RaceStatus

  //theme:Theme
  //FIXME cannot declare this
  trackFeatures:Map<any,ITrackFeatureState>//Map<any,TrackFeatureConstructorArgs>
  localTrackFeatures?:TrackFeatureConstructorArgs[] //for loading only, not for state sharing

  maxLaps:number //move to track data or is max laps race data?
  //trackPath:Vector3State[]
  //other track info?
}


export type TrackFeatureType='boost'|'slow-down'|'inert'|'wall'|'fresh-snow'|'spawn-point'|'ice-tile'|'fireplace'|'trench'|'powerup'

export function getTrackFeatureType(str:string){
  return str as TrackFeatureType
}

export interface TrackFeatureConstructorArgs{
    name:string
    position:ITrackFeaturePosition
    //triggerSize?:Vector3
    //shape:TrackFeatureShape
    health:HealthDataState
    type:TrackFeatureType
    lastTouchTime?:number
    activateTime?:number
}
export interface TrackFeatureUpdate extends TrackFeatureConstructorArgs{
  
}

//can we get rid of and replace with 'TrackFeatureConstructorArgs'?

export interface ITrackFeatureState extends ClockState{
  name:string
  position:ITrackFeaturePosition
  //triggerSize?:Vector3
  //shape:TrackFeatureShape
  health:HealthDataState 
  type:TrackFeatureType 
  lastTouchTime?:number
  activateTime?:number
}

export interface TrackFeatureStateConstructorArgs extends ITrackFeatureState{
}

export type TrackFeaturePositionConstructorArgs={
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation
}

export function createTrackFeaturePositionConstructorArgs(position:ITrackFeaturePosition){
  return { 
      position: position.position,
      rotation: position.rotation,
  } 
}

export interface ITrackFeaturePosition{
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation

}
export class TrackFeaturePosition implements ITrackFeaturePosition{
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation
  startSegment:number
  endSegment:number
  offset?:Vector3State
  centerOffset?:number
  //entity:Entity

  constructor(args:TrackFeaturePositionConstructorArgs){
    this.position = args.position
    this.rotation = args.rotation
  }
}

export interface BattleDataOptions{
  levelId:string
  name?:string
  maxLaps?:number
  maxPlayers?:number
  minPlayers?:number
  customRoomId?:string
  timeLimit?:number
  waitTimeToStart?:number
}


export interface TeamMemberState  {
  playerId: string
  teamId: string
  position: number

  //link to player state data
  _player:PlayerState
  _team:TeamState
}
export interface TeamState  {
  open: boolean
  id: string 
  name: string 
  score: number
  serverTime: number 
  maxPlayers: number 
  minPlayers: number 
  members:Map<any,TeamMemberState>
  gamePosition: number
  //battleData:Batte
}
export interface EnrollmentState extends ClockState{
  open:boolean
  startTime:number
  endTime:number
  maxPlayers:number
  teams:Map<any,TeamState>
}


export interface BattleRoomState{
  players:Map<any,PlayerState>
  battleData:BattleState
  enrollment:EnrollmentState
  levelData:LevelDataState
}


export interface BallThrowData {
  pos:Vector3State
  dir:Vector3State
  force:number
  teamColor:string
  id:string
  type:'normal'|'yellow'
  playerIdFrom:string
}


export interface AlterHealthDataState {
  playerIdTo:string
  playerIdFrom:string
  time:number
  desc:string
  amount:number
  position?:Vector3State
  respawnTime?:number
}

export interface PlayerRecieveHealthDataState extends AlterHealthDataState{
  
}
export interface PlayerGiveDamageDataState extends AlterHealthDataState{
  
}

//to collect server side a log of all damange given (maybe share it in stage but seems exessive)
//and you can build a list saving the changes that flow through PlayerHealthDataState
export interface PlayerDamageLogState extends ClockState{
  current:number
  max:number
  playerIdTo:string
  playerIdFrom:string
  damageTime:number
  damageDesc:string
  damageAmount:number
}


export interface HealthDataState extends ClockState{
  current:number
  max:number
  //canRegenerate:boolean
  //track what gave u last damange (was it LAVA!?)
  lastDamageTime?:number
  lastDamageDesc?:string
  lastDamageFrom?:string
  lastDamageAmount?:number
}

export interface ItemHealthDataState extends HealthDataState{}

export interface PlayerHealthDataState extends HealthDataState{}

export interface PlayerStatsKillDataState {
  playerIdAffected:string
  playerIdCredited:string
  time:number
  type: 'direct'|'indirect'
}
export interface PlayerStatsDataState {
  kills:PlayerStatsKillDataState[]//how many times kills others who and when
  deaths:PlayerStatsKillDataState[]//how many times died and by who and when
  hitsGiven:PlayerStatsKillDataState[]//how many hit someone
  shotsFired:number //how many times fired
  damageGiven:number //how much damange given out
}