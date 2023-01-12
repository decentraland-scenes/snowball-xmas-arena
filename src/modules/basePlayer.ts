import { CONFIG } from "src/config"
import { CommonResources } from "src/resources/common"
import { MovingAverage } from "src/utils/movingAverage"
import { teamColor } from "./teamColors"
import * as clientState from "src/snowball-fight/connection/state/client-state-spec";
import { SOUND_POOL_MGR } from "src/resources/sounds";
import { blueMarker, lowerBodyBlueShape, lowerBodyRedShape, redMarker, upperBodyBlueShape, upperBodyRedShape } from "./avatarResources";
import { FrostUIType } from "./frostedUISystem";
import { UpdateType } from "src/types/types";
import { REGISTRY } from "src/registry";

export class AvatarAnimatorConfig{

  lowerAnimator : Animator;
  upperAnimator : Animator;

  lowerBodyIdleClip : AnimationState;
  lowerBodyRunClip : AnimationState;
  lowerBodyWalkClip : AnimationState;
  upperBodyIdleClip : AnimationState;
  upperBodyRunClip : AnimationState;
  upperBodyWalkClip : AnimationState;
  throwClip : AnimationState;

  private selectedLowerClip : AnimationState;

  constructor(color : teamColor){
    this.lowerAnimator = new Animator();
    this.upperAnimator = new Animator();

    this.lowerBodyIdleClip = new AnimationState("Idle_LowerBody");
    this.lowerBodyRunClip = new AnimationState("Run_LowerBody");
    this.lowerBodyWalkClip = new AnimationState("Walk_LowerBody");


    if(color === teamColor.RED)
    {//Santa/Moonman
      this.upperBodyIdleClip = new AnimationState("Idle_UpperBody_Santa");
      this.upperBodyRunClip = new AnimationState("Run_UpperBody_Santa");
      this.upperBodyWalkClip = new AnimationState("Walk_UpperBody_Santa");
      this.throwClip = new AnimationState("Snowball_Throw_UpperBody_Santa");
    }
    else
    {//Krampus
      this.upperBodyIdleClip = new AnimationState("Idle_UpperBody");
      this.upperBodyRunClip = new AnimationState("Run_UpperBody");
      this.upperBodyWalkClip = new AnimationState("Walk_UpperBody");
      this.throwClip = new AnimationState("Snowball_Throw_UpperBody");
    }
    //this.lowerBodyRunClip.speed = 1.2;
    this.lowerBodyRunClip.playing = true;

    this.lowerAnimator.addClip(this.lowerBodyIdleClip);
    this.lowerAnimator.addClip(this.lowerBodyRunClip);
    this.lowerAnimator.addClip(this.lowerBodyWalkClip);

    this.upperAnimator.addClip(this.upperBodyIdleClip);
    this.upperAnimator.addClip(this.upperBodyRunClip);
    this.upperAnimator.addClip(this.upperBodyWalkClip);
    this.upperAnimator.addClip(this.throwClip);
  }

}

export class BasePlayer {
    id: string
    userId:string
    collider:Entity
    colorMarker:Entity
  
    entities:Entity[] = []
  
    health:number
    healthMax:number
    name: string
    color:teamColor = teamColor.NEUTRAL
  

    avatarLowerBody:Entity
    avatarUpperBodyRoot:Entity
    avatarUpperBodyMesh:Entity
    lowerBodyAnimator:Animator
    upperBodyAnimator:Animator
    //clipRun:AnimationState
    //clipIdle:AnimationState
    
    protected _blueAnimator : AvatarAnimatorConfig;
    protected _redAnimator : AvatarAnimatorConfig;
    protected _selectedAnimator : AvatarAnimatorConfig;
    clipRun:AnimationState//animation clip
    clipIdle:AnimationState//animation clip
    
    isBackwards:boolean = false
    isIdle:boolean = true
    isWalking:boolean = false


    serverState: clientState.PlayerState;
    sessionId:string
    latencyAvgMv: MovingAverage = new MovingAverage(CONFIG.LATENCY_AVERAGE_WINDOW_SIZE);
    latencyAvg: number;
    latencyLast: number;
    lastKnowServerTime: number;
    lastKnownClientTime: number;
  
    avatarTexture?:AvatarTexture
  
    teamPosition:number = 0 //position in team, for now using it for unique placement
    moveDir:Vector3 = Vector3.Forward()
    lookDir:Vector3 = Vector3.Forward()
    prevPosition:Vector3 = new Vector3(0,0,0)     
    feetPos:Vector3 
    horizontalRotation:Quaternion = Quaternion.Euler(0,0,0)
    avatarSwapEnabled:boolean
  

    protected _redMarker : GLTFShape;
    protected _blueMarker : GLTFShape;
    
    constructor(){


      this.colorMarker = new Entity()
      this.colorMarker.addComponent(
        new Transform({
          position: new Vector3(0, 0, 0),
        })
      )
      
      

      //New
      this._blueAnimator = new AvatarAnimatorConfig(teamColor.BLUE)
      this._redAnimator = new AvatarAnimatorConfig(teamColor.RED)

      this.lowerBodyAnimator = this._blueAnimator.lowerAnimator
      this.upperBodyAnimator = this._blueAnimator.upperAnimator
      
      //this.avatarLowerBody.addComponent( this.lowerBodyAnimator)
      this._selectedAnimator = this._blueAnimator;
      this.clipIdle = this._blueAnimator.lowerBodyIdleClip;
      this.clipRun = this._blueAnimator.lowerBodyRunClip;


      this._blueMarker = blueMarker
      this._redMarker = redMarker  



      //LOWER BODY
      this.avatarLowerBody = new Entity()
      this.avatarLowerBody.addComponent(new Transform({
          position: new Vector3(0,-1.7,0),
          scale: new Vector3(1,1,1),          
      }))
      this.avatarLowerBody.addComponent(lowerBodyBlueShape)
      engine.addEntity(this.avatarLowerBody)
      this.avatarLowerBody.addComponent( this.lowerBodyAnimator)

      // UPPER BODY ROOT PIVOT
      this.avatarUpperBodyRoot = new Entity()
      this.avatarUpperBodyRoot.addComponent(new Transform({
          position: new Vector3(0,-1.0,0),
          scale: new Vector3(1, 1, 1)
      }))
      engine.addEntity( this.avatarUpperBodyRoot)

      // UPPER BODY MESH
      this.avatarUpperBodyMesh = new Entity()
      this.avatarUpperBodyMesh.addComponent(new Transform({
          position: new Vector3(-0.2,-.5, -0.4),
          scale: new Vector3(1,1,1),
          rotation: Quaternion.Euler(-20,200,0)
      }))
      this.avatarUpperBodyMesh.addComponent(upperBodyBlueShape)
      this.avatarUpperBodyMesh.addComponent(this.upperBodyAnimator)
      this.avatarUpperBodyMesh.setParent(this.avatarUpperBodyRoot)
      
    }

    playerHitFeedback(updateType:UpdateType){
      //no-up, implement different per local player vs enemy player, implement there
    }
  
    playerDieFeedback(updateType:UpdateType){
      const METHOD_NAME = "playerDieFeedback"

      const battleActive = REGISTRY.SCENE_MGR.snowballArena.isArenaActive
      if(!battleActive){
        log(METHOD_NAME,"ignored, arena not active so now allowed to take damange","battleActive",battleActive)
        return;
      }

      SOUND_POOL_MGR.playerDie.playOnce(this.collider)
    }

    updateHealth(current: number, max: number,updateType:UpdateType) {
      const oldHealth = this.health

      const healthGoingDown = oldHealth > current
      log("updateHealth","oldHealth",oldHealth,"current",current,"healthGoingDown",healthGoingDown,"updateType",updateType)

      if(oldHealth>0 && this.health <= 0){
          //died
          this.playerDieFeedback(updateType)
          SOUND_POOL_MGR.playerDie.playOnce(this.collider)
      }else if( oldHealth>0 && this.health > 0 && healthGoingDown ){
          //just hit
          this.playerHitFeedback(updateType)
      }
      //this.checkHealth()
      
      this.health = current
      this.healthMax = max
    }
    reset(){
      this.userId = undefined
      this.feetPos = undefined
      this.teamPosition = undefined
      this.sessionId = undefined
    }
  
  setColor(_teamColor: teamColor, force? : boolean) {
    const METHOD_NAME = "setColor"
    //log(METHOD_NAME,this.userId,_teamColor,"this.collider.alive",this.collider.alive,this.collider.hasComponent("engine.shape") ? this.collider.getComponent("engine.shape"):null)
    if(!force && this.color == _teamColor){
      return;
    }
    log("//. Set Color [",this.color," -> ",_teamColor,"], isForced:",force)
    //workaround.  for some reason addComponentOrReplace
    //is not updating the entity animator, add remove from engine solved this
    //alternative is to remove animator first, then add
    //this.setAvatarSwapEnabled(false)
    //this.setAvatarSwapEnabled(true)
    if(this.avatarLowerBody.hasComponent(Animator))this.avatarLowerBody.removeComponent(Animator);
    if(this.avatarUpperBodyMesh.hasComponent(Animator))this.avatarUpperBodyMesh.removeComponent(Animator);
    if(this.avatarUpperBodyMesh.hasComponent(GLTFShape))this.avatarUpperBodyMesh.removeComponent(GLTFShape);
    if(this.avatarLowerBody.hasComponent(GLTFShape))this.avatarLowerBody.removeComponent(GLTFShape);
 
    switch (_teamColor) {
      case teamColor.RED: {
        this.color = teamColor.RED
        
        this.colorMarker.addComponentOrReplace(
          this._redMarker
          ).isPointerBlocker = false
        this.avatarUpperBodyMesh.addComponentOrReplace(upperBodyRedShape)
        this.avatarLowerBody.addComponentOrReplace(lowerBodyRedShape)
        this.swapAnimators(this._redAnimator)
        break
      }
      case teamColor.BLUE: {
        this.color = teamColor.BLUE
        
        this.colorMarker.addComponentOrReplace(
          this._blueMarker
        ).isPointerBlocker = false
        this.avatarUpperBodyMesh.addComponentOrReplace(upperBodyBlueShape)
        this.avatarLowerBody.addComponentOrReplace(lowerBodyBlueShape)
        this.swapAnimators(this._blueAnimator)
        break
      }
    }
  }
  protected swapAnimators(configTarget : AvatarAnimatorConfig){
    this._selectedAnimator = configTarget;
    this.lowerBodyAnimator = configTarget.lowerAnimator;
    this.upperBodyAnimator = configTarget.upperAnimator;
    this.clipIdle = configTarget.lowerBodyIdleClip;
    this.clipRun = configTarget.lowerBodyRunClip;
    this.avatarLowerBody.addComponentOrReplace(this.lowerBodyAnimator);
    this.avatarUpperBodyMesh.addComponentOrReplace(this.upperBodyAnimator);
  }
  public setAvatarSwapEnabled(enable : boolean) {
    if(enable){
      if(!this.avatarLowerBody.alive) engine.addEntity(this.avatarLowerBody);
      if(!this.avatarUpperBodyMesh.alive) engine.addEntity(this.avatarUpperBodyMesh);
      if(!this.collider.alive) engine.addEntity(this.collider);
      if(!this.colorMarker.alive) engine.addEntity(this.colorMarker);
    }else{
      if(this.avatarLowerBody.alive) engine.removeEntity(this.avatarLowerBody);
      if(this.avatarUpperBodyMesh.alive) engine.removeEntity(this.avatarUpperBodyMesh);
      if(this.collider.alive) engine.removeEntity(this.collider);
      if(this.colorMarker.alive) engine.removeEntity(this.colorMarker);
    }
    this.avatarSwapEnabled = enable
  }
  setUserId(userId:string){
    this.userId = userId
      //FIXME, not working for non web3 locally?? is it just local issue or broke for all web3?
      let myAvatarTexture = new AvatarTexture(userId)
      const myMaterial = new Material()
      myMaterial.albedoTexture = myAvatarTexture
      myMaterial.alphaTexture = CommonResources.RESOURCES.textures.transparent.texture
      myMaterial.alphaTest=1
      //markerFace.addComponent(myMaterial)

      //markerFace.setParent(shapeEnt)

      //player.entities.markerFace = markerFace
      this.avatarTexture = myAvatarTexture

  }
  setId(id:string){
    this.id = id
  }
    
  protected setIdleAnimation(setPlay : boolean){
    if(setPlay){
      if(!this._inThrowAnimation){
        this._selectedAnimator.upperBodyIdleClip.looping = true;
        this._selectedAnimator.upperBodyIdleClip.play();
      }

      this._selectedAnimator.lowerBodyIdleClip.looping = true;
      this._selectedAnimator.lowerBodyIdleClip.play();
    }else{
      this._selectedAnimator.upperBodyIdleClip.stop();
      this._selectedAnimator.lowerBodyIdleClip.stop();
    }
  }

  protected setRunAnimation(setPlay : boolean, isReverse : boolean = false){
    if(setPlay){
      if(!this._inThrowAnimation){
      this._selectedAnimator.upperBodyRunClip.looping = true;
      this._selectedAnimator.upperBodyRunClip.play();
      }

      this._selectedAnimator.lowerBodyRunClip.looping = true;
      this._selectedAnimator.lowerBodyRunClip.speed = isReverse ? -1 : 1;
      this._selectedAnimator.lowerBodyRunClip.play();
    }else{
      this._selectedAnimator.upperBodyRunClip.stop();
      this._selectedAnimator.lowerBodyRunClip.stop();
    }
  }
  protected setWalkAnimation(setPlay : boolean, isReverse : boolean = false){
    if(setPlay){
      if(!this._inThrowAnimation){
        this._selectedAnimator.upperBodyWalkClip.looping = true;
        this._selectedAnimator.upperBodyWalkClip.play();
      }

      this._selectedAnimator.lowerBodyWalkClip.looping = true;
      this._selectedAnimator.lowerBodyWalkClip.speed = isReverse ? -1 : 1;
      this._selectedAnimator.lowerBodyWalkClip.play();
    }else{
      this._selectedAnimator.upperBodyWalkClip.stop();
      this._selectedAnimator.lowerBodyWalkClip.stop();
    }
  }

  protected _inThrowAnimation : boolean = false;
  protected _throwAnimationDuration : number = CONFIG.SNOWBALL_COOLDOWN_SECONDS;//.35 tested value
  protected _elapsedTime : number = 0; 

  PlayThrowAnimation() { 
    log("PlayThrowAnimation",this.id,"Throw Animation")
    this._elapsedTime = 0;
    this._inThrowAnimation = true;
    this._selectedAnimator.throwClip.looping = false;
    this._selectedAnimator.throwClip.play(true);
  }

  protected ResetThrowAnimation(dt : number){
    if(!this._inThrowAnimation) return;
    this._elapsedTime += dt;
    if(this._elapsedTime >= this._throwAnimationDuration){
      this._inThrowAnimation = false;
      this._elapsedTime = 0;
    }
  }
}