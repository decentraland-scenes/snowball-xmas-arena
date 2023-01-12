import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { CONFIG } from "../rooms/config";
import * as serverStateSpec from "./server-state-spec";


export class Quaternion3State extends Schema implements serverStateSpec.Quaternion3State {

  @type("number")
  x: number;
  @type("number")
  y: number;
  @type("number")
  z: number;
  @type("number")
  w: number;

  constructor(x: number, y: number, z: number, w: number) {
    super()
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
  //this wont update entire object state but just the individual properties
  copyFrom(q: serverStateSpec.Quaternion3State) {
    this.x = q.x
    this.y = q.y
    this.z = q.z
    this.w = q.w
  }
}
export class Vector3State extends Schema implements serverStateSpec.Vector3State {

  @type("number")
  x: number;
  @type("number")
  y: number;
  @type("number")
  z: number;

  constructor(x: number, y: number, z: number) {
    super()
    this.x = x
    this.y = y
    this.z = z
  }
  //this wont update entire object state but just the individual properties
  copyFrom(vec3: serverStateSpec.Vector3State) {
    this.x = vec3.x
    this.y = vec3.y
    this.z = vec3.z
  }
}

export class TeamMemberState extends Schema implements serverStateSpec.TeamMemberState {
  @type("string")
  playerId: string = "id.of.player.here"
  @type("string")
  teamId: string = "id.of.team.here"
  @type("number")
  position: number
  
  //link to player state data
  _player:PlayerState
  _team: TeamState
}

export class PlayerButtonState extends Schema implements serverStateSpec.PlayerButtonState {
  @type("boolean")
  forward: boolean
  @type("boolean")
  backward: boolean
  @type("boolean")
  left: boolean
  @type("boolean")
  right: boolean
  @type("boolean")
  shoot: boolean

  copyFrom(buttons: serverStateSpec.PlayerButtonState) {
    if (!buttons) return

    if (buttons.forward !== undefined) this.forward = buttons.forward
    if (buttons.backward !== undefined) this.backward = buttons.backward
    if (buttons.shoot !== undefined) this.shoot = buttons.shoot
  }
}


export class HealthDataState extends Schema implements serverStateSpec.ItemHealthDataState {
  @type("number")
  current:number=-1
  @type("number")
  max:number=-1
  @type("number")
  lastDamageTime:number=-1 //use for a damage cool down?
  @type("string")
  lastDamageDesc:string=""//describes the damage
  @type("string")
  lastDamageFrom:string=""//player id/session id / environment
  @type("number")
  lastDamageAmount:number=-1//how much
  @type("number")
  serverTime: number = -1

  constructor(){
    super()
    //this.updateServerTime()
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }
  copyFrom(args: serverStateSpec.HealthDataState,now:number):void {
    if(!args) return
    
    this.current = args.current
    this.max = args.max

    this.updateServerTime(now)
  }
}

export class ItemHealthDataState extends HealthDataState implements serverStateSpec.ItemHealthDataState {
  
}

export class PlayerHealthDataState extends HealthDataState implements serverStateSpec.PlayerHealthDataState {
 
}

export class PlayerStatsKillDataState extends Schema implements serverStateSpec.PlayerStatsKillDataState {
  @type("string")
  playerIdAffected: string;
  @type("string")
  playerIdCredited: string;
  @type("number")
  time: number;
  type: "direct" | "indirect";
}

export class PlayerStatsState extends Schema implements serverStateSpec.PlayerStatsDataState {
 
  //@type("number")
  //kills:number=-1
  @type({array: PlayerStatsKillDataState})
  kills:ArraySchema<serverStateSpec.PlayerStatsKillDataState>=new ArraySchema<serverStateSpec.PlayerStatsKillDataState>()
  @type({array: PlayerStatsKillDataState})
  deaths:ArraySchema<serverStateSpec.PlayerStatsKillDataState>=new ArraySchema<serverStateSpec.PlayerStatsKillDataState>()
  @type({array: PlayerStatsKillDataState})
  hitsGiven:ArraySchema<serverStateSpec.PlayerStatsKillDataState>=new ArraySchema<serverStateSpec.PlayerStatsKillDataState>()
  @type("number")
  shotsFired:number=0
  @type("number")
  damageGiven:number=0

  //has stats indicating they participated
  hasActivePlayerStats():boolean{
    return this.shotsFired >= CONFIG.BATTLE_MIN_SHOTS_TO_CONSIDER_ACTIVE// || this.shotsFired > 0
  }
  addFrom(statsData: serverStateSpec.PlayerStatsDataState) {
    this.damageGiven += statsData.damageGiven
    this.shotsFired += statsData.shotsFired

    this.kills.push( ...statsData.kills )
    this.deaths.push( ...statsData.deaths )
    this.hitsGiven.push( ...statsData.hitsGiven )
  }
}


export class PlayerBattleDataState extends Schema implements serverStateSpec.PlayerBattleDataState {
 
  @type(Vector3State)
  worldPosition: Vector3State = new Vector3State(0, 0, 0)
  /*
  @type(Vector3State)
  closestProjectedPoint: Vector3State = new Vector3State(0, 0, 0)

  @type(Vector3State)
  worldPosition: Vector3State = new Vector3State(0, 0, 0)

  @type("number")
  closestPointID: number = -1

  @type("number")
  closestSegmentID: number = -1

  @type("number")
  closestSegmentPercent: number = 0

  @type("number")
  closestSegmentDistance: number

  @type("number")
  currentSpeed: number = 0
  */
  @type(Quaternion3State)
  worldMoveDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type(Quaternion3State)
  shootDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type(Quaternion3State)
  cameraDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type("number")
  endTime: number

  @type("number")
  enrollTime: number

  @type("string")
  teamId: string

  //@type(TeamMemberState)
  //teamRef: TeamMemberState

  //@type("boolean")
  //isDrifting: boolean

  @type("number")
  serverTime: number = -1

  @type("number")
  lap: number = 1

  @type("number")
  racePosition: number

  @type(["number"])
  lapTimes = new ArraySchema<number>();

  @type("number")
  lastKnownServerTime: number = -1

  @type("number")
  lastKnownClientTime: number = -1
  
  //used for debugging right now
  _racePositionScoreUsed:number = -1
  _teamRef: TeamState
  _stayedTillTheEnd:boolean = false
  
  //lastKnownLap: number = -1
  //lastKnownSegment: number = -1
  //needed for start of race, racers start off behind 0, need to know when they cross the start line
  //visitedSegment0: boolean = false
  //lastLapStartTime: number

  constructor() {
    super()

    //this.updateServerTime()
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }

  copyFrom(data: serverStateSpec.PlayerBattleDataState,now:number) {
    if (!data) return

   
    if (data.teamId !== undefined) this.teamId = data.teamId
    if (data.worldPosition !== undefined) this.worldPosition = new Vector3State(data.worldPosition.x, data.worldPosition.y, data.worldPosition.z)
    if (data.cameraDirection !== undefined) this.cameraDirection = new Quaternion3State(data.cameraDirection.x, data.cameraDirection.y, data.cameraDirection.z, data.cameraDirection.w)
    if (data.shootDirection !== undefined) this.shootDirection = new Quaternion3State(data.shootDirection.x, data.shootDirection.y, data.shootDirection.z, data.shootDirection.w)
    if (data.worldMoveDirection !== undefined) this.worldMoveDirection = new Quaternion3State(data.worldMoveDirection.x, data.worldMoveDirection.y, data.worldMoveDirection.z, data.worldMoveDirection.w)
    if (data.lastKnownServerTime !== undefined) this.lastKnownServerTime = data.lastKnownServerTime
    if (data.lastKnownClientTime !== undefined) this.lastKnownClientTime = data.lastKnownClientTime
    
    //TODO can these be inferred/calculated from player
    // closestSegmentID? keep track of last segment id when flips over its a lap?
    if (data.lap !== undefined) this.lap = data.lap
    //when lap flips over to race.maxLaps? 
    //computing server side if(data.endTime !== undefined) this.endTime = data.endTime
    //computing server side if(data.racePosition !== undefined) this.racePosition = data.racePosition

    this.updateServerTime(now)
    //console.log("copy from ",data.closestProjectedPoint,this.racingData.closestProjectedPoint.z)
  }

  hasFinishedBattle() {
    return (this.endTime !== undefined && this.endTime > 0)
  }
  /*
  hasStayedTillEnd(): boolean {
    //check if 
    throw new Error("Method not implemented.");
  }*/

}
function vector3CopyFrom(src: serverStateSpec.Vector3State, dest: serverStateSpec.Vector3State) {
  if(src && dest){
    dest.x = src.x
    dest.y = src.y
    dest.z = src.z
  }else if(dest){
    dest.x = undefined
    dest.y = undefined
    dest.z = undefined
  }
}

//data we do not want visible client side
export type PlayerServerSideData = {
  playFabData: {
    id: string
    sessionTicket: string
  }
  //sessionId:string
  //endGameResult?: PlayFabHelper.GameEndResultType
}

export class PlayerUserDataState extends Schema implements serverStateSpec.PlayerUserDataState {

  @type("string")
  name: string = "Anonymous"

  @type("string")
  userId: string


  //@type("string")
  //snapshotFace128:string //use AvatarTexture

  //START non shared vars

  updateName(name: string) {
    this.name = name
  }
  updateUserId(id: string) {
    this.userId = id
  }
}
export class PlayerState extends Schema implements serverStateSpec.PlayerState {
  @type("string")
  id: string

  @type("string")
  type: "combatant"|"spectator"

  @type("string")
  connStatus: serverStateSpec.PlayerConnectionStatus = "unknown"

  @type(PlayerUserDataState)
  userData: PlayerUserDataState = new PlayerUserDataState()

  @type(PlayerBattleDataState)
  battleData: PlayerBattleDataState = new PlayerBattleDataState()

  @type(PlayerHealthDataState)
  healthData: PlayerHealthDataState = new PlayerHealthDataState()

  @type(PlayerStatsState)
  statsData: PlayerStatsState = new PlayerStatsState()

  @type(PlayerButtonState)
  buttons: PlayerButtonState = new PlayerButtonState()

  @type("string")
  sessionId: string //should be safe to share

  //START non shared vars

  userPrivateData?: PlayerServerSideData


  /**
   * update will do an inplace update and trigger individual updates under raceData
   * @param data 
   */
  updateBattleData(data: serverStateSpec.PlayerBattleDataState,now:number) {
    this.battleData.copyFrom(data,now)
  }
  /**
   * set will replace entire object with new one and trigger a single update on raceData object
   * @param data 
   * @returns 
   */
  setBattleData(data: serverStateSpec.PlayerBattleDataState,now:number) {
    if (!data) return

    const tmp = new PlayerBattleDataState()
    tmp.copyFrom(data,now)

    //preserve things that are server side only
    tmp.endTime = this.battleData.endTime
    tmp.racePosition = this.battleData.racePosition
    tmp.enrollTime = this.battleData.enrollTime

    tmp._teamRef = this.battleData._teamRef
    tmp.teamId = this.battleData.teamId

    tmp.updateServerTime(now)
    this.battleData = tmp
  }

  /**
   * update will do an inplace update and trigger individual updates under buttons
   * @param buttons 
   */
  updateButtons(buttons: serverStateSpec.PlayerButtonState) {
    this.buttons.copyFrom(buttons)
  }
  /**
   * set will replace entire object with new one and trigger a single update on buttons object
   * @param buttons 
   * @returns 
   */
  setButtons(buttons: serverStateSpec.PlayerButtonState) {
    if (!buttons) return

    const tmp = new PlayerButtonState()
    tmp.copyFrom(buttons)

    this.buttons = tmp
  }
}

/*
export class ClockState extends Schema implements serverStateSpec.ClockState{
  @type("number")
  currentTime:number=-1
}*/


export class TrackFeaturePositionState extends Schema implements serverStateSpec.ITrackFeaturePosition {
  @type(Vector3State)
  position?:Vector3State//optional, if set its the exact spot
  @type(Quaternion3State)
  rotation?:Quaternion3State//optional, if set its the exact rotation
  

  constructor(){//(args: serverStateSpec.TrackFeaturePositionConstructorArgs) {
    super()

    //this.copyFrom(args)    
  }
  copyFrom(args: serverStateSpec.TrackFeaturePositionConstructorArgs) {
    if(!args) return
    
    vector3CopyFrom(args.position,this.position)
    //qu
  }
}
export class TrackFeatureState extends Schema implements serverStateSpec.ITrackFeatureState {
  @type("string")
  name: string

  @type(TrackFeaturePositionState)
  position: TrackFeaturePositionState = new TrackFeaturePositionState()
  //triggerSize?:Vector3
  //shape:TrackFeatureShape

  @type("string")
  type: serverStateSpec.TrackFeatureType

  @type("number")
  activateTime?: number

  @type("number")
  lastTouchTime?: number

  @type(ItemHealthDataState)
  health: ItemHealthDataState = new ItemHealthDataState()

  @type("number")
  serverTime: number = -1

  //FIXME need colyseus state version of this!
  constructor(args: serverStateSpec.TrackFeatureStateConstructorArgs,now:number) {
    super()

    this.name = args.name
    //this.position = args.position
    this.type = args.type
    this.activateTime = args.activateTime
    this.position.copyFrom(args.position)
    this.health.copyFrom(args.health,now)
    //if(args.offset) this.offset = args.offset
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }
}

export class LevelDataState extends Schema implements serverStateSpec.LevelDataState {

  @type("string")
  id: string
  @type("string")
  name: string
  //status:RaceStatus

  //theme:Theme
  //@type([ TrackFeatureState ])
  //trackFeatures = new ArraySchema<TrackFeatureState>();
  @type({ map: TrackFeatureState })
  trackFeatures = new MapSchema<TrackFeatureState>();

  @type("number")
  maxLaps: number //move to track data or is max laps race data?

  //trackPath: serverStateSpec.Vector3State[]

  copyFrom(retval: serverStateSpec.LevelDataState,now:number) {
    this.id = retval.id
    this.name = retval.name
    
    this.trackFeatures.clear()

    if(retval.trackFeatures){
      retval.trackFeatures.forEach( (value:serverStateSpec.ITrackFeatureState)=>{
        const trackFeat = value//retval.localtrackFeatures[p]
        const stateTrackFeat = new TrackFeatureState( trackFeat,now )
        
        console.log("stateTrackFeat.type",stateTrackFeat.type)
        
        stateTrackFeat.position.copyFrom( trackFeat.position )
        stateTrackFeat.health.copyFrom( trackFeat.health,now )

        //const val:serverStateSpec.ITrackFeatureState=stateTrackFeat

        this.trackFeatures.set( stateTrackFeat.name, stateTrackFeat )
      } )
    }
    if(retval.localTrackFeatures){
      for(const p in retval.localTrackFeatures){
        const trackFeat = retval.localTrackFeatures[p]
        //trackFeat.heatlh
        const args: serverStateSpec.TrackFeatureStateConstructorArgs = {
          name:trackFeat.name,
          position:trackFeat.position,
          type: trackFeat.type,
          activateTime: trackFeat.activateTime,
          health:trackFeat.health,
          serverTime: Date.now()
        }
        const stateTrackFeat = new TrackFeatureState( args,now )
        stateTrackFeat.updateServerTime(now)
        //console.log("stateTrackFeat.type",stateTrackFeat.type)
        
        stateTrackFeat.position.copyFrom( trackFeat.position )
        this.trackFeatures.set( stateTrackFeat.name, stateTrackFeat )
      } 
    }

    this.maxLaps = retval.maxLaps
    //this.trackPath = retval.trackPath
  }

  copyTo(retval: serverStateSpec.LevelDataState) {
    retval.id = this.id
    retval.name = this.name
    //retval.trackFeatures = this.trackFeatures
    retval.maxLaps = this.maxLaps
    //retval.trackPath = this.trackPath
  }
}

export class BattleState extends Schema implements serverStateSpec.BattleState {

  @type("string")
  id: string = ""


  @type("string")
  name: string = "Untitled Race"

  @type("string")
  status: serverStateSpec.BattleStatus = "not-started"

  @type("number")
  time: number = -1

  @type("number")
  startTime: number = -1

  @type("number")
  timeLimit: number = -1

  @type("number")
  endTime: number = -1

  @type("number")
  endTimeActual: number = -1

  @type("number")
  serverTime: number = -1

  @type("number")
  maxLaps: number = CONFIG.RACE_MAX_LAPS_DEFAULT//FIXME - HARDCODED FOR NOW 

  savedPlayerStats:boolean = false

  constructor() {
    super()

    //this.updateServerTime()
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }
  hasBattleStarted() {
    return this.status !== undefined && this.status === 'started' //(this.startTime !== undefined && this.startTime > 0 && this.startTime <= Date.now())
  }
  isBattleOver() {
    return this.status !== undefined && this.status === 'ended' //(this.startTime !== undefined && this.startTime > 0 && this.startTime <= Date.now())
  }
}


export class TeamState extends Schema implements serverStateSpec.TeamState {
  
  @type("boolean")
  open: boolean = true

  @type("string")
  id: string = "team.id.here"

  @type("string")
  name: string = "Team Name Here"

  //TODO add score here?
  @type("number")
  score: number = 0

  @type("number")
  gamePosition = 0

  @type("number")
  serverTime: number = -1

  @type("number")
  maxPlayers: number = -1

  @type("number")
  minPlayers: number = -1
  
  @type({ map: TeamMemberState })
  members:MapSchema<serverStateSpec.TeamMemberState>=new MapSchema<serverStateSpec.TeamMemberState>();

  _playFabId:string
  _statsData: PlayerStatsState = new PlayerStatsState()
  
  constructor(id:string,name:string) {
    super()

    this.id = id
    this.name = name

    //this.updateServerTime()
  }

  addPlayer(player:PlayerState){
    //for back reference
    player.battleData.teamId = this.id

    const teamPlayerState = new TeamMemberState();
    teamPlayerState._player = player
    teamPlayerState._team = this
    teamPlayerState.playerId = player.sessionId
    teamPlayerState.teamId = this.id
    teamPlayerState.position = this.members.size

    //is this safe? 
    player.battleData._teamRef = this //cyclical?

    this.members.set(player.sessionId,teamPlayerState)
  }

  removePlayer(player:PlayerState){
    player.battleData.teamId = undefined
    player.battleData._teamRef = undefined

    console.log("TeamState",this.id,"removePlayer",this.members.size,player.id,this.members.has(player.id))
    if(this.members.has(player.id)) this.members.delete(player.id)
  }
  
  //if any of the players finished the battle, so did the team
  hasFinishedBattle(): boolean {
    let retVal = false
    this.members.forEach(
      (val:serverStateSpec.TeamMemberState)=>{
          if((val._player.battleData as PlayerBattleDataState).hasFinishedBattle()){
            retVal = true;
          }
      })

    console.log("TeamState",this.id,"hasFinishedBattle",this.members.size,"retVal",retVal)
    return retVal
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }
}

export class EnrollmentState extends Schema implements serverStateSpec.EnrollmentState {

  @type("boolean")
  open: boolean = true

  @type("number")
  startTime: number = -1

  @type("number")
  endTime: number = -1

  @type("number")
  serverTime: number = -1

  @type("number")
  maxPlayers: number = -1

  @type("number")
  minPlayers: number = -1
  
  @type({ map: TeamState })
  teams:MapSchema<serverStateSpec.TeamState>=new MapSchema<serverStateSpec.TeamState>();

  @type( TeamState )
  spectators:TeamState=new TeamState("spectator","Spectator")

  constructor() {
    super()

    //this.updateServerTime()
  }

  addPlayer(player:PlayerState,team:TeamState){
    //TODO add checks to make sure on other teams
    team.addPlayer(player)
  }

  updateServerTime(now:number) {
    this.serverTime = now
  }

  removePlayer(player:PlayerState){
    this.teams.forEach((tm:serverStateSpec.TeamState)=>{

      (tm as TeamState).removePlayer(player)
    })
    this.spectators.removePlayer(player)
  }
}


export class BattleRoomState extends Schema implements serverStateSpec.BattleRoomState {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>();

  @type(BattleState)
  battleData = new BattleState()

  @type(LevelDataState)
  levelData = new LevelDataState()

  @type(EnrollmentState)
  enrollment = new EnrollmentState()

  something = "This attribute won't be sent to the client-side";

  createPlayer(sessionId: string): PlayerState {
    const player = new PlayerState()
    player.id = sessionId //syncing these, can we get rid of player id?
    player.sessionId = sessionId
    this.players.set(sessionId, player);

    //FIXME not thread safe, good enough??
    player.battleData.racePosition = this.players.size
    player.battleData.enrollTime = Date.now()

    return player
  }

  removePlayer(player:PlayerState):boolean{
    if(player === undefined){
      //warning
      return false
    }
    console.log("BattleRoomState","removePlayer",this.players.size,player.id,this.players.has(player.id))
    const result = this.players.delete(player.id);
    //remove from teams
    this.enrollment.removePlayer(player)

    return result;
  }

}