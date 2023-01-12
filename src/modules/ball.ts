
import { ExplosionInfo, Explosion, splatSpawner } from './explosion'
import * as mySounds from './sounds'
import { teamColor } from './teamColors'
import { Room } from 'colyseus.js'
import { OtherCollider } from "./otherPlayer"
import { PredefinedEmote, triggerEmote } from '@decentraland/RestrictedActions'
import { REGISTRY } from 'src/registry'
import { iceGrid } from './iceGrid'
import { SelfCollider } from 'src/components/components'
import * as serverStateSpec from 'src/snowball-fight/connection/state/server-state-spec'
import { GAME_STATE } from 'src/state'
import { fireCampController, FireCampInfo } from 'src/tactics/fireCamp'
import { snowTrenchController, SnowTrenchInfo } from 'src/tactics/snowTrench'
import { BallType } from 'src/types/types'
import { SOUND_POOL_MGR } from 'src/resources/sounds'
import { FrostUIType } from './frostedUISystem'
import { CONFIG } from 'src/config'
//import * as sfx from "src/og-decentrally/modules/resources/sounds";

//preload dummy
const ballShape = new GLTFShape('models/snowball.glb')

//export function initBalls(){
  let dummyBall = new Entity()
  dummyBall.addComponent(new Transform({
    //RACE CONDITION!!!
    //position: new Vector3(REGISTRY.player.cam.feetPosition.x, -1, REGISTRY.player.cam.feetPosition.z)
    position: new Vector3(1, -1, 1)
  }))
  dummyBall.addComponent( ballShape)
  engine.addEntity(dummyBall)
//}

const VECTOR_UP = Vector3.Up()
const VECTOR_DOWN = Vector3.Down()

let ballCounter = 0
export class Ball {
  
  id:string
  rayCastId:number
  gravity: number = 5
  active: boolean = false
  ballRadius: number = 0.2
  moveVector: Vector3 = Vector3.Zero()
  currentSpeed: number = 0
  maxSpeed: number = 10
  resistance: number = 0.98
  throwForce: number = 1
  maxForce: number = 1.0
  throwForceBase: number = 0.1  
  damage:number = 0
  maxDamage:number = 5
  type:BallType
  ballEntity: Entity    
  ballShape: GLTFShape
  throwSound: AudioSource
  hitSound: AudioSource
  bounceEmitter: Entity
  kickID: number = 0
  ownBall: boolean = true
  room: Room
  teamColor: teamColor = teamColor.BLUE
  myBall: boolean = false
  //physicsCollider:PhysicsBallCollider

  constructor(room: Room, _teamColor: teamColor, _myBall: boolean, _type:BallType) {
    this.teamColor = _teamColor
    this.room = room
    this.myBall = _myBall
    this.type = _type

    //for now unique cast id per ball
    this.rayCastId = ballCounter++
    this.id = "ball."+this.rayCastId

    this.ballShape = ballShape
    this.ballEntity = new Entity()
    this.bounceEmitter = new Entity()

    //this.moveVector = new Vector3(0,0,0)

    this.ballEntity.addComponent(this.ballShape)
    this.ballEntity.addComponent(
      new Transform({
        position: new Vector3(8, 8, 8),

        rotation: Quaternion.Euler(0, 180, 0),
        scale: new Vector3(1, 1, 1),
      })
    )

    this.throwSound = new AudioSource(mySounds.clipThrow)
    this.hitSound = new AudioSource(mySounds.clipHit)
    this.ballEntity.addComponent(this.throwSound)

    this.bounceEmitter.addComponent(
      new Transform({ position: new Vector3(0, 0, 0) })
    )
    this.bounceEmitter.addComponent(this.hitSound)
    this.bounceEmitter.setParent(this.ballEntity)
    engine.addEntity(this.ballEntity)

    this.active = true
  
  }
  createDamagePayload(): serverStateSpec.AlterHealthDataState {
    return {
      amount: this.damage,
      playerIdFrom: this.myBall ? REGISTRY.player.sessionId : "unknown",
      desc:"hit by ball",
      playerIdTo: "tbd",
      time: REGISTRY.getGameTime()
    }
  }
  throwBallPlayer(pos: Vector3, dir: Vector3, force: float) {
    //log("pos: " + pos + ", dir: " + dir + ", force: " + force)
    REGISTRY.player.PlayThrowAnimation();
    this.ownBall = true
    const ballTransform = this.ballEntity.getComponent(Transform)

    ballTransform.position.copyFrom(pos)

    this.moveVector = dir.multiplyByFloats(force, force, force)
    this.throwSound.playOnce()
    this.active = true
    this.damage = Math.floor(force)
    if(this.room !== undefined){
      const throwData:serverStateSpec.BallThrowData = { pos: pos, dir: dir, force: force, type:'normal',teamColor:this.teamColor,id:"",playerIdFrom: REGISTRY.player.sessionId}
      this.room.send('throwBall', throwData)
    }else{
      log("no room to send: throwBall")
    }

  }

  throwBallOther(pos: Vector3, dir: Vector3, force: float) {
    this.ownBall = false
    const ballTransform = this.ballEntity.getComponent(Transform)

    ballTransform.position.copyFrom(pos)

    this.moveVector = dir.multiplyByFloats(force, force, force)
    this.throwSound.playOnce()
    this.active = true
  }

  setKickID(ID: number) {
    this.kickID = ID
  }

  getBallPos(): Vector3 {
    return this.ballEntity.getComponent(Transform).position
  }

  setBallPosXYZ(x: number, y: number, z: number) {
    this.ballEntity.getComponent(Transform).position = new Vector3(x, y, z)
  }

  setBallPos(pos: Vector3) {
    this.ballEntity.getComponent(Transform).position = pos
  }

  onCollide(_hitPoint: Vector3, _normal: Vector3, _splat:boolean) {
    if (this.active) {
      // this.hitSound.playOnce()
      let explosion = new Explosion(
        _hitPoint,
        Quaternion.FromToRotation(
          Vector3.Up(),
          _normal.rotate(Quaternion.RotationAxis(_normal, Math.random() * 360))
        ),
        _splat
      )
      this.active = false
      this.hide()
    }
  }
  hide() {
    const pos = this.ballEntity.getComponent(Transform).position
    this.setBallPosXYZ(pos.x, -0.3, pos.z)
  }
  sendHit(enemyId: string) {
    const giveDamange: serverStateSpec.PlayerGiveDamageDataState={
      amount: this.damage,
      time: REGISTRY.getGameTime(),
      desc:"hit by ball",
      playerIdFrom: REGISTRY.player.sessionId,
      playerIdTo: enemyId,
      position: REGISTRY.player.cam.position
    }
    if(this.room !== undefined ){
      this.room.send('enemyHit', giveDamange )
    }else{
      log("no room to send: enemyHit")
    }
  }
}

//export const ball = new Ball()
//ADD TO SCENE
export class BallManager {
  balls: Ball[]
  maxCount: number
  ballSystem: BallThrowSystem
  room: Room

  constructor(_ballCount: number, room: Room) {
    this.room = room
    this.balls = []
    this.maxCount = _ballCount
    this.ballSystem = new BallThrowSystem(this)
    engine.addSystem(this.ballSystem)
  }

  spawnBall(_teamColor: teamColor, _myBall: boolean, type:BallType): Ball {
    log('spawning ball is mine: ' + _myBall)
    if (this.balls.length < this.maxCount) {
      let ball = new Ball(this.room, _teamColor, _myBall, type)
      this.balls.push(ball)
      return ball
    } else {
      let instance = this.balls.shift()

      if(instance){
        this.balls.push(instance)
        instance.room = this.room
        instance.teamColor = _teamColor
        instance.myBall = _myBall
        instance.type = type
      }
      else{
        instance = new Ball(this.room, _teamColor, _myBall, type)
        this.balls.push(instance)
      }      
      return instance
    }
  }
}

class BallThrowSystem implements ISystem{
  kickDirection = new Vector3(0, 1, 0)
  kickArrowRotation = new Quaternion()
  physicsCast: PhysicsCast
  ballManager: BallManager

  constructor(_ballManager: BallManager) {
    this.physicsCast = PhysicsCast.instance
    this.ballManager = _ballManager
  }

  update(dt: number) {
    const METHOD_NAME = "ball.collide.check"
    for (let ball of this.ballManager.balls) {
      if (ball.active) {
        const transform = ball.ballEntity.getComponent(Transform)

        //ball physics
        ball.moveVector.y -= ball.gravity * dt * 0.1

        //ground hit
        if (transform.position.y + ball.moveVector.y <= ball.ballRadius) {
          ball.onCollide(
            new Vector3(transform.position.x, 0.05, transform.position.z),
            VECTOR_UP,
            true
          )
          continue;//no more processing for this ball
        }

        ball.moveVector.scaleInPlace(ball.resistance)
        //ball.moveVector = ball.moveVector.scale( ball.resistance )

        ball.currentSpeed = ball.moveVector.length()
        let nextPosX = transform.position.x + ball.moveVector.x
        let nextPosY = transform.position.y + ball.moveVector.y
        let nextPosZ = transform.position.z + ball.moveVector.z

        //lots of creation waste, cache this?
        let nextPos = new Vector3(nextPosX, nextPosY, nextPosZ)

        //check hitting colliders
        let originPos = new Vector3(
          transform.position.x,
          transform.position.y,
          transform.position.z
        )
        let targetPos = new Vector3(nextPos.x, nextPos.x, nextPos.x)

        let moveVector = transform.position
          .subtract(nextPos)          
        let moveDistance = moveVector.length()
        let rayCastDistance = moveDistance < 1 ? 1 : moveDistance

        // log("raycast distance: " + rayCastDistance)

        //lots of creation waste, cache this?
        let rayBallCollide: Ray = {
          origin: originPos,
          direction: ball.moveVector,
          distance: rayCastDistance,
        }

        
        //if my ball, gets own id
        //if others, use "others id" as cast not as important
        //goal is to reduce too many casts
        //for now this will use 2 ray casts 1 for enemies and 1 for current player
        //not perfect but better than it was
        let rayCastId = CONFIG.SNOWBALL_USE_RAYCAST_ID_PER_BALL ? ball.rayCastId : undefined //ball.myBall ? 1 : 2 
        //log('BallManager',METHOD_NAME,"this.physicsCast.ball.rayCastId",ball.rayCastId)
        this.physicsCast.hitFirst(rayBallCollide, (e) => {
          if (e.didHit ) {
            
            switch (e.entity.meshName){

              case 'player_collider':{


                //FIXME?!?!? your avatar does not have a collider to hit. 
                //do we want to use this as it wil also affect health??? use at health update location???
                //player was hit
                if (engine.entities[e.entity.entityId].hasComponent(SelfCollider)) {
                  //hit by a teammate
                  if (ball.teamColor == REGISTRY.player.color) {
                    log('BallManager',METHOD_NAME,ball.id,'a friendly ' + ball.teamColor + ' ball just hit you', ' ALLOW_FRIENDLY_FIRE',CONFIG.ALLOW_FRIENDLY_FIRE)
                  }
                  //hit by enemy
                  else {
                    log('BallManager',METHOD_NAME,'you were hit by enemy ' + ball.teamColor)
                    let normal = new Vector3(e.hitNormal.x, e.hitNormal.y, e.hitNormal.z )
                    normal.normalize()
                    let hitPoint = new Vector3(e.hitPoint.x, e.hitPoint.y, e.hitPoint.z )
                    ball.onCollide(hitPoint, normal, true) 

                    REGISTRY.player.playerHitFeedback('local')
                  }
                }
                //someone else was hit
                else if (
                  engine.entities[e.entity.entityId].hasComponent(OtherCollider)
                ) {     
                  const otherCollider = engine.entities[e.entity.entityId].getComponent(
                    OtherCollider
                  )
                  //someone was hit                
                    log('BallManager',METHOD_NAME,ball.id,'Other player hit with ' , ball.teamColor ,' ball : ' , otherCollider.color 
                        , ' ALLOW_FRIENDLY_FIRE',CONFIG.ALLOW_FRIENDLY_FIRE)
                    let normal = new Vector3(
                      e.hitNormal.x,
                      e.hitNormal.y,
                      e.hitNormal.z
                    )
                    normal.normalize()
                    let hitPoint = new Vector3(
                      e.hitPoint.x,
                      e.hitPoint.y,
                      e.hitPoint.z
                    
                      )
                    //tag:TODO-PLACE-AUDIO
                    SOUND_POOL_MGR.enemyHitFeedbackSound.playOnce()
                    SOUND_POOL_MGR.enemyHitSound.playOnce(engine.entities[e.entity.entityId])

                    ball.onCollide(hitPoint, normal, false)

                    const friendlyHit = ball.teamColor == otherCollider.color
                    if (friendlyHit) {
                      log('BallManager',METHOD_NAME,ball.id,'you just hit a friendly ' , ball.teamColor , ' ALLOW_FRIENDLY_FIRE',CONFIG.ALLOW_FRIENDLY_FIRE)
                    }
                    if (ball.myBall 
                        && 
                        (
                          (CONFIG.ALLOW_FRIENDLY_FIRE === false && !friendlyHit)
                          || (CONFIG.ALLOW_FRIENDLY_FIRE && friendlyHit)
                        )
                        ) {
                      ball.sendHit(
                        otherCollider.id
                      )
                    }                
                }
                break;
              }
              case 'fireCamp_collider':{
                log('BallManager',METHOD_NAME,ball.id,ball.id,"fireCamp was HIT")
                
                if(engine.entities[e.entity.entityId].hasComponent(FireCampInfo)){
                  let id = engine.entities[e.entity.entityId].getComponent(FireCampInfo).id

                  fireCampController.updateFireState(id, ball.createDamagePayload())

                  //tag:TODO-PLACE-AUDIO
                  //SOUND_POOL_MGR.fireHiss.playOnce(engine.entities[e.entity.entityId])

                  let normal = new Vector3(
                    e.hitNormal.x,
                    e.hitNormal.y,
                    e.hitNormal.z
                  )
                  normal.normalize()
                  let hitPoint = new Vector3(
                    e.hitPoint.x,
                    e.hitPoint.y,
                    e.hitPoint.z
                  )

                  ball.onCollide(hitPoint, normal, false)
                }
                break;
              }
              case 'snowTrench_collider':
              case 'iceCube_collider':
              case 'iceCube_collider.001':
              case 'iceCube_collider.002': 
              case 'iceCube_collider.003':
              case 'iceCube_collider.004':
              case 'iceCube_collider.005':
              {
                log ('BallManager',METHOD_NAME,ball.id,"snowTrench was HIT")

                if(engine.entities[e.entity.entityId].hasComponent(SnowTrenchInfo)){
                  let id = engine.entities[e.entity.entityId].getComponent(SnowTrenchInfo).id

                  snowTrenchController.UpdateHealth(id, ball.createDamagePayload())

                  let normal = new Vector3(
                    e.hitNormal.x,
                    e.hitNormal.y,
                    e.hitNormal.z
                  )
                  normal.normalize()
                  let hitPoint = new Vector3(
                    e.hitPoint.x,
                    e.hitPoint.y,
                    e.hitPoint.z
                  )

                  ball.onCollide(hitPoint, normal, false)
                }
                break;
              }
              case 'ice_platform_collider':{
                log('BallManager',METHOD_NAME,ball.id,"ice platform was HIT")
                let normal = new Vector3(
                  e.hitNormal.x,
                  e.hitNormal.y,
                  e.hitNormal.z
                )
                normal.normalize()
                let hitPoint = new Vector3(
                  e.hitPoint.x,
                  e.hitPoint.y,
                  e.hitPoint.z
                )
                ball.onCollide(hitPoint, normal, false)


                //if(this.)
                const adjustHealth:serverStateSpec.AlterHealthDataState=ball.createDamagePayload()
              
                iceGrid.hitBlock(e.hitPoint.x, e.hitPoint.z, adjustHealth)
                break;
              }

              default : {
                log('BallManager',METHOD_NAME,ball.id,'environment hit with ' , ball.teamColor , ' ball. on' , e.entity.meshName)
                let normal = new Vector3(
                  e.hitNormal.x,
                  e.hitNormal.y,
                  e.hitNormal.z
                )
                normal.normalize()
                let hitPoint = new Vector3(
                  e.hitPoint.x,
                  e.hitPoint.y,
                  e.hitPoint.z
                )
                ball.onCollide(hitPoint, normal, true)
                /*
                if(engine.entities[e.entity.entityId].hasComponent(ReactToBallHit)){
                  engine.entities[e.entity.entityId].getCompenent(ReactToBallHit).onHit( ball, hitPoint )
                }

                myEntity.addComponent(
                  new ReactToBallHit(
                    {
                      onHit:()=>{
                        //do stuff
                      }
                    }
                  )
                )*/
              }
            }            
          }
        },rayCastId)
       

        //move ball
        if (
          ball.currentSpeed < 0.05 &&
          transform.position.y < 2 * ball.ballRadius + 0.1
        ) {
          ball.currentSpeed = 0
          ball.moveVector.setAll(0)
          transform.position.y = ball.ballRadius
        } else {
          let rotateAxis = Vector3.Cross(
            ball.moveVector,
            VECTOR_DOWN
          ).normalize()       

          transform.translate(ball.moveVector)          
          transform.rotate(rotateAxis, 60) 
        }
      }
    }
  }
}

