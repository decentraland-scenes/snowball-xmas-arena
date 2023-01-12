import { REGISTRY } from "src/registry"
import { GAME_STATE } from "src/state"
import { isNull } from "src/utils/utilities"
import * as serverStateSpec from "src/snowball-fight/connection/state/server-state-spec";
import { resetLoginState } from "src/login/login-flow";
import { SOUND_POOL_MGR } from "src/resources/sounds";


@Component("SnowTrenchInfo")
export class SnowTrenchInfo{
    id: string

    constructor(_id: string){
        this.id = _id
    }
}

const trenchModel = new GLTFShape("models/iceCube.glb")
export class SnowTrench extends Entity{

    id: string
    modelPos: Vector3
    health = 10


    constructor(_modelPosition: Vector3, _id: string){
        super()
        engine.addEntity(this)

        this.id =_id 
        this.modelPos = _modelPosition

        this.addComponent(new SnowTrenchInfo(this.id))
 
        this.addComponent(trenchModel)//.withCollisions = true 
        //this.addComponent(new BoxShape()).withCollisions = true
        this.addComponent(new Transform({position: _modelPosition, scale: new Vector3(1,1,1)})) //, scale: new Vector3(0.5, 0.5, 0.5)


    }

    hit(damage:serverStateSpec.AlterHealthDataState){
        log("block hit",this.id,"damage",damage,"this.health",this.health)
        this.health -= damage.amount

        SOUND_POOL_MGR.destructibleHitSound.playOnce(this)

        damage.playerIdTo = this.id
        //if fired by me
        if(!isNull(GAME_STATE.gameRoom) && damage.playerIdFrom === REGISTRY.player.sessionId){
            //send it to others
            GAME_STATE.gameRoom.send("levelData.trackFeature.adjustHealth",damage)
        }
       
        this.checkHealth()
    }

    checkHealth()
    {
        if(this.health <= 0){
            //here so that hide does not have a sound side affect
            SOUND_POOL_MGR.destructibleBreakSound.playOnce(this)
            this.hide()
        }
        else{
            this.reset()
        }
    }

    hide(){
        this.getComponent(Transform).position.y = -20

        

    }
    reset(){
        this.getComponent(Transform).position.y = this.modelPos.y
    }

}

class SnowtrenchController{
 
    snowTrenchesMap:Record<string,SnowTrench> = {}

    constructor(){
        const snowTrenchModelPosition_D = new Vector3(74, .65, 32-7)
        const snowTrenchModelPosition_U = new Vector3(86, .65, 32-7)

        let counter = 0
        for(let x=0;x<8;x++){
            
            const snowTrench_D = new SnowTrench(snowTrenchModelPosition_D.clone(), "trench."+counter)
            this.snowTrenchesMap[snowTrench_D.id] = snowTrench_D
            snowTrenchModelPosition_D.z += 2

            counter++
            
            //top
            //const snowTrench_D = new SnowTrench(snowTrenchModelPosition_D.clone(), "trench."+counter)
            //this.snowTrenchesMap[snowTrench_D.id] = snowTrench_D
            //  snowTrenchModelPosition_D.z += 2

        }
        for(let x=0;x<8;x++){
            
            const snowTrench_U = new SnowTrench(snowTrenchModelPosition_U.clone(), "trench."+counter)
            this.snowTrenchesMap[snowTrench_U.id] = snowTrench_U
            snowTrenchModelPosition_U.z += 2
            counter++
        }
        
    }

    getTrenchById(id:string){
        return this.snowTrenchesMap[id]
    }

    UpdateHealth(id: string, damage:serverStateSpec.AlterHealthDataState){

        let snowTrench = this.snowTrenchesMap[id]

        snowTrench.hit(damage)
    }   

    hideAllTrenches(){
        for(const p in this.snowTrenchesMap){
            this.snowTrenchesMap[p].hide()
        }
    }

    resetAllTrenches(){
        for(const p in this.snowTrenchesMap){
            this.snowTrenchesMap[p].reset()
        }
    }
}

export let snowTrenchController = new SnowtrenchController()