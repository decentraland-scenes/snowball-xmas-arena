import { triggerEmote, PredefinedEmote } from '@decentraland/RestrictedActions'
import { Room } from 'colyseus.js'
import * as gameUI from 'src/modules/ui'
import { Ball, BallManager } from './ball'
import { EnemyManager } from './enemyManager'
import { teamColor } from './teamColors'
import { updateAmmo, DisplayCursorMessage } from './ui'
import * as ui from './ui'
import { MovingAverage } from 'src/utils/movingAverage'
import { CONFIG } from 'src/config'
import { CommonResources } from 'src/resources/common'
import * as utils from "@dcl/ecs-scene-utils"

import { REGISTRY } from 'src/registry'
import { SelfCollider } from 'src/components/components'
import { getUserData, UserData } from '@decentraland/Identity'
import { AvatarAnimatorConfig, BasePlayer } from './basePlayer'
import { BallType, UpdateType } from 'src/types/types'
import { adjustLevelThemByCameraMode, SOUND_POOL_MGR } from 'src/resources/sounds'
import { FrostedUISystem, FrostUIType } from './frostedUISystem'
import { Game2DUI } from 'src/modules/ui/index'
import { lowerBodyBlueShape, lowerBodyRedShape, upperBodyBlueShape, upperBodyRedShape } from './avatarResources'




export class Player extends BasePlayer{
  
  
  ballManager: BallManager
  enemyManager: EnemyManager
  cam: Camera
  cameraMode:number = 0
  //start move
  //avatarLowerBody:Entity
  //avatarUpperBodyRoot:Entity
  //avatarUpperBodyMesh:Entity
  //lowerBodyAnimator:Animator//animator
  //end move //start move
  
  
  isWalking:boolean = false
  throwForce: number = 1
  maxForce: number = 3
  throwForceBase: number = 0.1  
  increasForceMode:boolean = false
  throwIncreaseSpeed:number = 1
  //testDummy: Entity
  //dummyAnimator: Animator
  //clipThrow: AnimationState
  //clipHit: AnimationState
  ammo: number = 0
  ammoPoweredUp: BallType[] = []
  maxAmmo: number = CONFIG.SNOWBALL_MAX_AMOUNT
  ammoSys: AmmoTimerSystem
  matchStarted: boolean = false
 

  //roomConnected: boolean = false
  //room: Room
  physicsCastParcel: PhysicsCast
  isInSnowPickupZone: boolean = false
  canCollectAmmo: boolean = true
  canThrowAmmo: boolean = true

  inCooldown: boolean = false

  hitUISystem:FrostedUISystem
  isMovementControlled : boolean = false;


  constructor(color: teamColor) {
    super()
    
    this.physicsCastParcel = PhysicsCast.instance

    this.fillPowerUp(this.ammoPoweredUp,0,this.maxAmmo,'empty')

    this.id = '0x0'
    this.cam = Camera.instance
    this.collider = new Entity()
    this.collider.addComponent(
      new Transform({
        position: new Vector3(0, 0, 0),
      })
    )
    

    this.collider.addComponent(new SelfCollider())
    engine.addEntity(this.collider)
    this.collider.setParent(Attachable.AVATAR)

    engine.addEntity(this.colorMarker)
    this.colorMarker.setParent(Attachable.AVATAR)

    this.feetPos = this.cam.feetPosition

    this.setInSnowPickupZone( false )

    this.ammoSys = new AmmoTimerSystem(this)
    engine.addSystem(this.ammoSys)

    //LOWER BODY    
    this.avatarLowerBody.setParent(Attachable.FIRST_PERSON_CAMERA)

    // UPPER BODY ROOT PIVOT
    this.avatarUpperBodyRoot.addComponentOrReplace(new Transform({
        position: new Vector3(0,-.5,0),
        scale: new Vector3(1, 1, 1)
    }))
    this.avatarUpperBodyRoot.addComponent(new Billboard())
    
    // UPPER BODY MESH
    this.avatarUpperBodyMesh.addComponentOrReplace(new Transform({
        position: new Vector3(-0.2,-1, -0.4),
        scale: new Vector3(1,1,1),
        rotation: Quaternion.Euler(-20,200,0)
    }))
    this.avatarUpperBodyRoot.setParent(Attachable.FIRST_PERSON_CAMERA)
    //shotgun.setParent(this.selfAvatarUpperBodyMesh)

     

  

    //make sure to register entities in hierarchy top order first, parents first, children second
    this.entities.push(this.collider)
    this.entities.push(this.avatarUpperBodyRoot)
    this.entities.push(this.avatarLowerBody)
    this.entities.push(this.avatarUpperBodyMesh)

    //animator
    /*Old
    this.lowerBodyAnimator = new Animator()
    this.clipRun = new AnimationState("Run")
    this.clipIdle = new AnimationState("Idle")

    this.selfAvatarLowerBody.addComponent( this.lowerBodyAnimator)
    this.lowerBodyAnimator.addClip(this.clipRun)
    this.lowerBodyAnimator.addClip(this.clipIdle)

    this.clipRun.speed = 1.2
    this.clipRun.playing = true       
    */

    this.setColor(color, false)
 
    this.setAvatarSwapEnabled(false);

    this.hitUISystem = new FrostedUISystem()
  }

  playerHitFeedback(updateType:UpdateType){
    const METHOD_NAME = "playerHitFeedback"

    const battleActive = REGISTRY.SCENE_MGR.snowballArena.isArenaActive
    if(!battleActive){
      log(METHOD_NAME,"ignored, arena not active so now allowed to take damange","battleActive",battleActive)
      return;
    }

    //TODO need to decide if here OR
    //player.updateHealth is where the UI feedback should go?  here is immeidate
    //the other will have a delay till server says it
    if(CONFIG.ACTIVATE_PLAYER_HIT_UPDATE_TYPE === updateType){ 
      log(METHOD_NAME,"actvated, update types match CONFIG.ACTIVATE_PLAYER_HIT_UPDATE_TYPE",CONFIG.ACTIVATE_PLAYER_HIT_UPDATE_TYPE,updateType,"battleActive",battleActive,"health",this.health)
      SOUND_POOL_MGR.playerHit.playOnce()
      if(this.hitUISystem !== undefined) this.hitUISystem.showUI(FrostUIType.PLAYER_HIT, "", 3)
    }else{
      log(METHOD_NAME,"ignored, update types dont match CONFIG.ACTIVATE_PLAYER_HIT_UPDATE_TYPE",CONFIG.ACTIVATE_PLAYER_HIT_UPDATE_TYPE,updateType,"battleActive",battleActive,"health",this.health)
    }
  } 
  
  setInSnowPickupZone(val: boolean) {
    this.isInSnowPickupZone = val
    if(CONFIG.SNOWBALL_AUTO_COLLECT_ENABLED){
      if(val){
        this.collectAmmo()
      }else{
        this.stopCollectAmmo()
      }
    }
    ui.displayMakeSnowballInstructions(val)
  }
  incAmmo(ammount: number) {
    log("incAmmo",ammount)
    //debugger
    this.fillPowerUp(this.ammoPoweredUp,this.ammo,ammount,'normal' )
    this.ammo += ammount
    //this.fillPowerUp(this.ammoPoweredUp,this.ammo,'normal')
    updateAmmo(this.ammo, this.maxAmmo,this.ammoPoweredUp)
  }
  setAmmo(ammo: number) {
    this.fillPowerUp(this.ammoPoweredUp,this.ammo,ammo-this.ammo,'normal' )
    this.ammo = ammo
    //this.fillPowerUp(this.ammoPoweredUp,this.ammo,'normal')
    updateAmmo(this.ammo, this.maxAmmo,this.ammoPoweredUp)
  }
  //http://www.zrzahid.com/moving-average-of-last-n-numbers-in-a-stream/
  //https://shareablecode.com/snippets/moving-average-from-data-stream-c-solution-leetcode-Gmzm-7sjZ
  //https://www.toni-develops.com/2022/04/12/moving-average-from-data-stream/?utm_source=rss&utm_medium=rss&utm_campaign=moving-average-from-data-stream
  updateLatency(clientTime: number, serverTime: number) {
    if (this.lastKnownClientTime > 0) {
      //TODO take a weight average as seeing it cycle, 0 should not be possible
      /*
      index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0 0
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.3604 360.4
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.2125 212.5
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.13090000000000002 130.9
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.1751 175.1
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.1802 180.2
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0 0
      */
      //should we add in + CONFIG.SEND_RACE_DATA_FREQ_MILLIS?

      this.latencyLast = Math.max(
        clientTime - this.lastKnownClientTime + CONFIG.LATENCY_MISC_FACTOR,
        CONFIG.SEND_GAME_DATA_FREQ_MILLIS
      ); //times 2 for round trip??
      this.latencyAvgMv.add(this.latencyLast);
      this.latencyAvg = this.latencyAvgMv.average;
    }
    this.lastKnownClientTime = clientTime;
    this.lastKnowServerTime = serverTime;
  }

  fillPowerUp(ammoPoweredUp: BallType[],offset:number, amount: number, powerup: BallType) {
    const offsetAmount = offset+amount
    log("fillPowerUp",ammoPoweredUp,offset,amount,powerup,"offset+amount",offsetAmount)
    
    if(amount >= 0){
      for(let x=offset;x<offsetAmount;x++){
        //log("xxx",ammoPoweredUp.length ,x)
        if(ammoPoweredUp.length > x){
          ammoPoweredUp[x] = powerup
        }else{
          ammoPoweredUp.push(powerup)
        }
      }
    }else{
      //easest way to do FIFO right now
      //FIXME switch to linked list/queue so can more easily append,prepend
      ammoPoweredUp.splice(offsetAmount)//,Math.abs(amount))
    }
  }

  setEnablePowerUp(powerup:BallType,val: boolean, amount:number, duration: number) {
      if(val){
        //reset and fill new
        //this.ammoPoweredUp = []

        this.ammo = Math.max(this.ammo,amount) //increment ammo if need be
        //debugger
        this.fillPowerUp(this.ammoPoweredUp,0,this.ammo,powerup)
        
      }else{
        //reset yellow to normal
        this.fillPowerUp(this.ammoPoweredUp,0,this.ammo,'normal' )
      }
      updateAmmo(this.ammo, this.maxAmmo,this.ammoPoweredUp)
  }
  addBallManager(ballManager: BallManager) {
    this.ballManager = ballManager
  }
  addEnemyManager(_enemyManager: EnemyManager) {
    this.enemyManager = _enemyManager
  }
  useAmmo() {
    //if (this.roomConnected) {
      //this.ammoPoweredUp[this.ammo]='empty'
      this.ammo -= 1
      //easest way to do FIFO right now
      //FIXME switch to linked list/queue so can more easily append,prepend
      this.ammoPoweredUp.shift()

      if (this.ammo <= 0) {
        this.ammo = 0
        //this.ammoPoweredUp = []
        this.fillPowerUp( this.ammoPoweredUp,0,this.maxAmmo,'empty' )
        //this.handBall.getComponent(Transform).scale.setAll(0)
      }
      this.inCooldown = true
      updateAmmo(this.ammo, this.maxAmmo,this.ammoPoweredUp)
    //}
  }

  setColor(_teamColor: teamColor, force? : boolean) {
    const prevColor = this.color
    super.setColor(_teamColor, force)
    
    if(!force && prevColor == _teamColor){
      return;
    }
    //log("player.setTeamColor.setAmmoContainerColor",_teamColor)
    gameUI.setTeamColor(_teamColor)
    //maybe keep this only here
    //this.collider.addComponentOrReplace(
    //      this._blueMarker
    //  ).isPointerBlocker = false
    
  } 
  getHorizontalRotation(): Quaternion {
    return Quaternion.FromToRotation(
      Vector3.Forward(),
      Vector3.Forward().rotate(this.cam.rotation).multiplyByFloats(1, 0, 1)
    )
  }
  collectAmmo() {

    if (this.isInSnowPickupZone) {
      

      this.ammoSys.isActive = true       
      if(!CONFIG.SNOWBALL_AUTO_COLLECT_ENABLED) triggerEmote({ predefined: 'crafting' as any })
    }
    else{
      DisplayCursorMessage("CRAFTING NOT ALLOWED HERE", "USE SNOWY AREAS", 2)
    }

  }
  stopCollectAmmo() {
    if(this.ammoSys){
      this.ammoSys.isActive = false
    }
  }
  checkDefaultParcel() {
    let result = false
    //this.setInSnowPickupZone( true )

  }
  setWalking(isWalking:boolean){
    this.isWalking = isWalking
  }
  hideAvatar(){
    this.avatarUpperBodyMesh.getComponent(Transform).scale.setAll(0)
  }
  showAvatar(){
    this.avatarUpperBodyMesh.getComponent(Transform).scale.setAll(1)
  }
  // UPDATE UPPER AND LOWER BODY + ANIMATIONS BASED ON CAM/MOVEMENT DIRECTION
  updateAvatar(dt : number){
    this.feetPos =  this.cam.feetPosition
    this.moveDir =  this.feetPos.subtract( this.prevPosition)
    this.lookDir = Vector3.Forward().rotate( this.cam.rotation).multiplyByFloats(1,0,1).normalize()        
    this.horizontalRotation = Quaternion.FromToRotation(Vector3.Forward(),  this.lookDir)
    
    this.ResetThrowAnimation(dt);

    if(Vector3.Dot( this.moveDir,  this.lookDir) < -0.05 ){
      this.isBackwards = true
      //log("Player running Backward: " + player.isBackwards)
    }
    else{
      this.isBackwards = false
      //log("Player running Forward: " + player.isBackwards)
    }

    if(Vector3.DistanceSquared( this.prevPosition,  this.feetPos) < 0.001){
      //player.isBackwards = false
      this.isIdle = true
    }
    else{
      this.isIdle = false
    }

    this.prevPosition.copyFrom(this.feetPos)

    if( this.isIdle){
      this.setIdleAnimation(true);
      this.setRunAnimation(false);
      this.setRunAnimation(false);
    }
    else{
      this.setIdleAnimation(false);
      this.setRunAnimation(!this.isWalking, this.isBackwards);
      this.setWalkAnimation(this.isWalking, this.isBackwards);

      if( this.isBackwards){
        this.avatarLowerBody.getComponent(Transform).rotation = Quaternion.Euler(0,180,0)
      }else{
        this.avatarLowerBody.getComponent(Transform).rotation = Quaternion.Euler(0,0,0)
      }

    }
  }

  public ControlMovement(){
    this.isMovementControlled = true;
  }
  public ReleaseMovement(){
    this.isMovementControlled = false;
  }
}

class AmmoTimerSystem {
  isActive: boolean = false
  elapsed: number = 0
  cooldown: number = 1

  playerRef: Player

  constructor(_player: Player) {
    this.playerRef = _player
  }

  update(dt: number) {
    if (this.isActive) {
      if (this.elapsed < this.cooldown) {
        this.elapsed += dt
      } 
      else {
        if (this.playerRef.isInSnowPickupZone) {
          if (this.playerRef.ammo < this.playerRef.maxAmmo) {
            if(this.playerRef.ammo<=0){
              ui.HideCursorMessage()
            }
            this.playerRef.incAmmo(1)
           // log('AMMO: ' + this.playerRef.ammo + '/' + this.playerRef.maxAmmo)
            
          }
        }
        this.elapsed = 0
        if(CONFIG.SNOWBALL_TRIGGER_EMOTES_ENABLED) triggerEmote({ predefined: 'crafting' as any })
      }
    }
  }
}

//export let player = new Player(teamColor.BLUE)

export class SnowballCooldownSystem {
  elapsed: number = 0
  cooldown: number = CONFIG.SNOWBALL_COOLDOWN_SECONDS

  playerRef: Player
  constructor(player:Player){
    this.playerRef = player
  }
  update(dt: number) {
    const player = this.playerRef
    if (player.inCooldown) {
      //log("elapsed: " + cooldownInfo.elapsed)
      if (this.elapsed < this.cooldown) {
        this.elapsed += dt
        //cooldownInfo.inCooldown = true
      } else {
        // log("TIMESUP: " + cooldownInfo.elapsed)
        //log("elapsed: " + cooldownInfo.elapsed)
        this.elapsed = 0
        player.inCooldown = false
      }
    }
  }
}

//engine.addSystem(new SnowballCooldownSystem(player))


export class ForceIncreaseSystem {
  playerRef: Player
  constructor(player:Player){
    this.playerRef = player
  }
  forceResetAtLeastOnce:boolean =false
  update(dt: number) {
    const player = this.playerRef
    if(player.increasForceMode){
      this.forceResetAtLeastOnce = false
      player.throwForce += dt * player.throwIncreaseSpeed
      if(player.throwForce > player.maxForce){
        player.throwForce = player.maxForce
      }
      ui.setThrowForceUI( Math.floor((player.throwForce-1)/(player.maxForce-1) *8))
    }
    else {
      if(!this.forceResetAtLeastOnce || player.throwForce != 1){
        this.forceResetAtLeastOnce = true
        player.throwForce = 1
        ui.setThrowForceUI(0)
      }
    }
  }
}

//engine.addSystem(new ForceIncreaseSystem(player))

class PlayerControllerSystem {

  playerRef: Player

  constructor(_player: Player) {
    this.playerRef = _player
  }
  
  update(dt:number){
    this.playerRef.updateAvatar(dt)
  }
}
//engine.addSystem(new PlayerControllerSystem(player))

export function initPlayer():Player{
  const player = new Player(teamColor.NEUTRAL)

  preloadPlayerModels(new Vector3(1,0,1), new Vector3(2,0,1));

  getUserData().then((user:UserData)=>{
    player.name = user.displayName;
    player.userId = user.userId;
  })

  engine.addSystem(new SnowballCooldownSystem(player))
  engine.addSystem(new ForceIncreaseSystem(player))
  engine.addSystem(new PlayerControllerSystem(player))


  onCameraModeChangedObservable.add(({ cameraMode }) => {
    log("Camera mode changed:", cameraMode)

    if(cameraMode == 0 ){
      player.cameraMode = 0
      player.hideAvatar()
    }
    else{
      player.cameraMode = 1
      player.showAvatar()
    }

    adjustLevelThemByCameraMode()
  })

  REGISTRY.player = player


  //let them throw balls in lobby
  //10 players max, throwing at most 3 before collide?
  REGISTRY.player.addBallManager(new BallManager(10*(3+1), undefined))
  REGISTRY.player.addEnemyManager(new EnemyManager())
   
  return player
}

function preloadPlayerModels(krampusPos : Vector3, santaPos: Vector3){
  let santaUpper = new Entity();
  let santaLower = new Entity();
  santaUpper.addComponentOrReplace(upperBodyRedShape);
  santaLower.addComponentOrReplace(lowerBodyRedShape);

  let krampusUpper = new Entity();
  let krampusLower = new Entity();
  krampusUpper.addComponentOrReplace(upperBodyBlueShape);
  krampusLower.addComponentOrReplace(lowerBodyBlueShape);

  let krampus = new Entity();
  let santa = new Entity();

  krampusUpper.setParent(krampus);
  krampusLower.setParent(krampus);
  
  santaUpper.setParent(santa);
  santaLower.setParent(santa);

  krampus.addComponent(new Transform({
    position : krampusPos,
    scale : new Vector3(0,0,0)
  }));
  santa.addComponent(new Transform({
    position : santaPos,
    scale : new Vector3(0,0,0)
  }));

  krampus.addComponent(new utils.Delay(2000, ()=> {
    if(krampus.alive) engine.removeEntity(krampus);
    if(santa.alive) engine.removeEntity(santa);
  }))

  engine.addEntity(krampus);
  engine.addEntity(santa);
}
