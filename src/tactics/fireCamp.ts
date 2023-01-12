import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config'
import { clipFireBurning } from 'src/modules/sounds'
import { displayFireInstructions } from 'src/modules/ui'
import { REGISTRY } from 'src/registry'
import { CommonResources } from 'src/resources/common'
import * as serverStateSpec from 'src/snowball-fight/connection/state/server-state-spec'
import { GAME_STATE } from 'src/state'
import { isNull } from 'src/utils/utilities'

@Component("FireCampInfo")
export class FireCampInfo { 
    id: string

    constructor(_id:string){
        this.id = _id 
    } 
}

export class FireCamp extends Entity
{
    id: string

    fireNoiseEmitter:Entity
    fireNoiseClip: AudioSource

    inside = false 

    initialTimeToRecieveHealth = 1500
    timeTorecieveHelth = 1500
    timeEncrease = 1000

    fireCampState = 3

    constructor(modelPosition: Vector3, triggerOfsettPosition: Vector3, triggerScale: Vector3, _id: string){
        super(_id)
        engine.addEntity(this)

        this.id = _id
        this.addComponent(new FireCampInfo(this.id))

        //this.addComponent(new GLTFShape("models/Test/fireCampTest.glb")).withCollisions = true
        this.addComponent(new Transform({position: modelPosition}))

        this.fireNoiseEmitter = new Entity()
        this.fireNoiseEmitter.addComponent(new Transform())
        engine.addEntity(this.fireNoiseEmitter)
        this.fireNoiseEmitter.setParent(this)

        this.fireNoiseClip = new AudioSource(clipFireBurning)
        this.fireNoiseClip.loop = true
        this.fireNoiseClip.volume = 1
        this.fireNoiseEmitter.addComponent(this.fireNoiseClip)
        this.fireNoiseClip.playOnce()

        if(CONFIG.DEBUGGING_TRIGGER_FIRE_DUMMY_OBJ_ENABLED){
            const debugEnt = new Entity()
            engine.addEntity(debugEnt)
            //debugEnt.setParent(this)
            
            const visibleScale = triggerScale.clone()
            visibleScale.y = 1.4
              
            const visiblePos = modelPosition.clone()
            visiblePos.y = -.5
            //debugEnt.addComponent(new Transform({scale: visibleScale}))
     
            debugEnt.addComponent(CommonResources.RESOURCES.materials.DEBUG_RED)
            debugEnt.addComponent(new BoxShape()).withCollisions=false
            debugEnt.addComponent(new Transform({position: visiblePos, scale: visibleScale}))//Just for previs (map will hae the snow in those positions)
        }
 
        const heatingTriggerShape = new utils.TriggerBoxShape(triggerScale, triggerOfsettPosition)
        this.addComponent(
            new utils.TriggerComponent(heatingTriggerShape, 
                {
                    onCameraEnter: () =>{
                        this.inside = true
                        //log("You exit the fire trigger area")

                        this.addComponent(
                            new utils.Interval(this.timeTorecieveHelth, () => 
                            {
                                //log("interval is running")
                                if(this.inside)
                                {
                                    this.sendHealth()
                                }
                            })
                        )
                        displayFireInstructions(true)
                    },

                    onCameraExit: () =>
                    {
                        this.inside = false

                        if(this.hasComponent(utils.Interval)){
                            const preaviousInterval = this.getComponent(utils.Interval)
                            this.removeComponent(preaviousInterval)
                        }
                        //log("You exit the fire trigger area")
                        displayFireInstructions(false)
                    },
                    enableDebug: CONFIG.DEBUGGING_TRIGGER_FIRE_ENABLED
                } 
                
            )
        )
    }

    sendHealth() {
        const giveHealth: serverStateSpec.PlayerRecieveHealthDataState={
            amount:1,
            time: Date.now(),
            desc:"healed by "+this.id,
            playerIdFrom: this.id,
            playerIdTo: REGISTRY.player.sessionId,
            position: REGISTRY.player.cam.position 
        }
        if( !isNull(GAME_STATE.gameRoom) ){
            GAME_STATE.gameRoom.send('giveHealth', giveHealth )
        }else{
            log("no room to send: giveHealth")
        }
    }
    
    hit(damage: serverStateSpec.AlterHealthDataState){
        log("fireCamp hit",this.id,"damage",this.fireCampState)
        
        this.fireCampState =- damage

        damage.playerIdTo = this.id

        if(!isNull(GAME_STATE.gameRoom) && damage.playerIdFrom === REGISTRY.player.sessionId){
            //send it to others
            GAME_STATE.gameRoom.send("levelData.trackFeature.adjustHealth", damage)
        }
       
        this.checkFireState()
    }

    checkFireState()
    {
        if(this.fireCampState >= 0)
        {
            this.timeTorecieveHelth = this.timeTorecieveHelth + this.timeEncrease

            log("The fireCamp state is at:" + this.fireCampState + "You need:" + this.timeTorecieveHelth + "millisec to restore your helth" )
        }
        else{
            log("The fire is no longer affected by snowballs")
            this.hideFlame()
        }
    }

    hideFlame(){

    }
    reset(){
        this.timeTorecieveHelth = this.initialTimeToRecieveHealth
    }
}


class FireCampController 
{
    fireCampsMap:Record<string, FireCamp> = {}

    constructor(){
        const fireModelPosition_LD = new Vector3(50, 2, 70)
        const fireModelPosition_LU = new Vector3(111, 2, 70)
        const fireTriggerOfsetPosition_L = new Vector3(0, 0, 2)
        const fireTriggerScale_L = new Vector3(16, 6, 11)

        const fireModelPosition_CD = new Vector3(35, 2, 47)
        const fireModelPosition_CU = new Vector3(125, 2, 47)
        const fireTriggerOfsetPosition_C = new Vector3(0, 0, 1.5)
        const fireTriggerScale_C = new Vector3(14, 6, 14)

        const fireCamp_LD = new FireCamp(fireModelPosition_LD, fireTriggerOfsetPosition_L, fireTriggerScale_L, "fireplace.0")
        const fireCamp_LU = new FireCamp(fireModelPosition_LU, fireTriggerOfsetPosition_L, fireTriggerScale_L, "fireplace.1")
        const fireCamp_CD = new FireCamp(fireModelPosition_CD, fireTriggerOfsetPosition_C, fireTriggerScale_C, "fireplace.2")
        const fireCamp_CU = new FireCamp(fireModelPosition_CU, fireTriggerOfsetPosition_C, fireTriggerScale_C, "fireplace.3")

        this.fireCampsMap[fireCamp_LD.id] = fireCamp_LD
        this.fireCampsMap[fireCamp_LU.id] = fireCamp_LU
        this.fireCampsMap[fireCamp_CD.id] = fireCamp_CD
        this.fireCampsMap[fireCamp_CU.id] = fireCamp_CU
    }

    getFireById(id:string){
        return this.fireCampsMap[id]
    }

    updateFireState(id: string, damage: serverStateSpec.AlterHealthDataState)
    {
        let fireCamp = this.fireCampsMap[id]

        damage.amount = 1

        fireCamp.hit(damage)
    }
}

export let fireCampController = new FireCampController()