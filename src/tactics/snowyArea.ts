import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config'
import { displayMakeSnowballInstructions } from 'src/modules/ui'
import { REGISTRY } from 'src/registry'


export class SnowyArea extends Entity
{
    constructor(triggerPosition: Vector3, triggerScale: Vector3)
    {
        super()
        engine.addEntity(this)

        if(CONFIG.DEBUGGING_TRIGGER_SNOWAREA_DUMMY_OBJ_ENABLED){
            const debugEnt = new Entity()
            debugEnt.setParent(this)
            //debugEnt.addComponent(new GLTFShape("models/Test/snowPileDig.glb")).withCollisions = true
             
            const visibleScale = triggerScale.clone()
            //visibleScale.
            
            const visiblePos = triggerPosition.clone()
            visiblePos.y = -.5
            //debugEnt.addComponent(new Transform({scale: visibleScale}))
    
            debugEnt.addComponent(new BoxShape()).withCollisions=false
            debugEnt.addComponent(new Transform({position: visiblePos, scale: visibleScale}))//Just for previs (map will hae the snow in those positions)
        }
        let triggerShape = new utils.TriggerBoxShape(triggerScale, triggerPosition)
        this.addComponent(new utils.TriggerComponent(triggerShape, {
            onCameraEnter: () =>{
                REGISTRY.player.setInSnowPickupZone( true )
            }, 
            onCameraExit: () => {
                REGISTRY.player.setInSnowPickupZone( false )
            },
            enableDebug: CONFIG.DEBUGGING_TRIGGER_SNOWAREA_ENABLED
        }
        ))
    }
}