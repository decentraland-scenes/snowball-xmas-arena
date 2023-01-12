import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config'
import { displayFireInstructions } from 'src/modules/ui'
import { SOUND_POOL_MGR } from 'src/resources/sounds'
import { REGISTRY } from 'src/registry'
import { CommonResources } from 'src/resources/common'
import * as serverStateSpec from 'src/snowball-fight/connection/state/server-state-spec'
import { GAME_STATE } from 'src/state'
import { isNull } from 'src/utils/utilities'

export class PowerUpSpawner extends Entity
{
    id:string

    visible:boolean = false
    activateTime:number=Number.MAX_VALUE
    respownTime:number = CONFIG.POWER_UP_RESPAWN_TIME
    pickupTime:number = 0

    originalTriggerPos:Vector3

    constructor(id:string,spawnPosition: Vector3)
    {
        super(id)

        this.id = id;
        engine.addEntity(this)

        /*if(CONFIG.DEBUGGING_TRIGGER_POWERUP_DUMMY_OBJ_ENABLED){
            const debugEnt = new Entity()
            engine.addEntity(debugEnt)
            //debugEnt.setParent(this)
            
            const visibleScale = Vector3.One()
            visibleScale.y = 1.4
              
            const visiblePos = spawnPosition.clone()
            visiblePos.y = -.5
            //debugEnt.addComponent(new Transform({scale: visibleScale}))
     
            debugEnt.addComponent(CommonResources.RESOURCES.materials.DEBUG_YELLOW)
            //debugEnt.addComponent(new BoxShape()).withCollisions=false
            debugEnt.addComponent(new Transform({position: visiblePos, scale: visibleScale}))//Just for previs (map will hae the snow in those positions)
        }*/

        this.originalTriggerPos = spawnPosition.clone()

        this.addComponent(new GLTFShape("models/powerup.glb")).withCollisions = false
        this.addComponent(new Transform({position: spawnPosition, scale: new Vector3(2.5, 2.5, 2.5)}))

        const triggerShape = new utils.TriggerBoxShape(new Vector3(2.5,2.5,2.5),new Vector3(0, 3, 0))
 
        this.addComponent(
            new utils.TriggerComponent(triggerShape,
                {
                    onCameraEnter: () =>
                    {
                        this.pickup()
                    },
                    enableDebug: CONFIG.DEBUGGING_TRIGGER_POWERUP_ENABLED
                }
            )
        ) 

        this.show()
    }

    pickup(){
        log(this.id,"pickup")
        this.pickupTime = REGISTRY.getGameTime()
        //augment players ball types
        
        SOUND_POOL_MGR.pickUpSound.playOnce()
        
        //REGISTRY.player.setAmmo(REGISTRY.player.maxAmmo)
        
        //adjust
        REGISTRY.player.setEnablePowerUp('normal',true,REGISTRY.player.maxAmmo,CONFIG.SNOWBALL_POWERUP_DURATION_SECONDS)

        this.hide()
        this.sendPickup()
    }


    sendPickup() 
    {
        const pickup: serverStateSpec.TrackFeatureConstructorArgs={
            name:this.id,
            position:{},
            activateTime: this.activateTime,
            lastTouchTime: this.pickupTime,  
            type:'powerup', 
            health:{current:1,max:1,serverTime:0}
        }
        if( !isNull(GAME_STATE.gameRoom) ){
            GAME_STATE.gameRoom.send('levelData.trackFeature.update', pickup )
        }else{
            log("no room to send: giveHealth")
        }
    }

    checkState()
    {
        if(this.activateTime <= REGISTRY.getGameTime())
        {
            this.show()

            log("The powerup state is at:" + this.activateTime)
        }
        else{
            log("The fire is no longer affected by snowballs")
            this.hide()
        }
    }

    hide(){ 
        if(!this.visible) {
            log(this.id,"already hidden skipping")
            return;
        }

        this.visible = false

        this.getComponent(Transform).scale.setAll(0)

        this.getComponent(Transform).position.y = -100

        this.scheduleShow()
    }

    scheduleShow(){
        this.activateTime = this.pickupTime + this.respownTime
        this.addComponentOrReplace(new utils.Delay( this.activateTime - REGISTRY.getGameTime() , () => 
        {
            this.show()
        }))

    }
    show(){
        if(this.visible) {
            log(this.id,"already visible skipping")
            return;
        }

        this.visible = true
        this.getComponent(Transform).scale.setAll(2.5)

        this.getComponent(Transform).position.copyFrom( this.originalTriggerPos )
        //this.getComponent(utils.TriggerComponent).shape.position.copyFrom( this.originalTriggerPos )
    }
}



@Component("PowerUpInfo")
export class PowerUpInfo { 
    id: string

    constructor(_id:string){
        this.id = _id 
    } 
}




class PowerUpController 
{
    counter = 0
    powerupsMap:Record<string, PowerUpSpawner> = {}

    constructor(){
        
    }

    createPowerUp(position:Vector3){
        const id = "powerup."+this.counter ++ 
        const inst = new PowerUpSpawner(id,position)
        this.powerupsMap[id] = inst
        return inst
    }

    getPowerup(id:string){
        return this.powerupsMap[id]
    }

    pickup(id: string)
    {
        let powerup = this.powerupsMap[id]

        //damage.amount = 1

        powerup.pickup()
    }
}

export let powerupController = new PowerUpController()