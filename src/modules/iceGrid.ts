import * as utils from '@dcl/ecs-scene-utils'
import { scene } from "./sceneData";
import { movePlayerTo } from '@decentraland/RestrictedActions'
import { GAME_STATE } from "src/state";
import * as serverStateSpec from "src/snowball-fight/connection/state/server-state-spec";
import { REGISTRY } from "src/registry";
import { isNull } from "src/utils/utilities";
import { CONFIG } from 'src/config';
import { SOUND_POOL_MGR } from 'src/resources/sounds';

/*const respawner = new Entity()
respawner.addComponent(new BoxShape())
respawner.addComponent(new Transform({ position: new Vector3(28, 2, 28) }))
respawner.addComponent(
  new OnPointerDown(
    (e) => {
      movePlayerTo({ x: 40, y: 12, z: 28 }, { x: 96, y: 12, z: 64 })
    },
    { hoverText: "Teleport Up" }
  )
)

engine.addEntity(respawner)*/

const tileShape = new GLTFShape("models/ice_platform.glb")

class Block {
    blockShape:GLTFShape =  tileShape
    row:number
    col:number
    centerPos:Vector3
    abovePos:Vector3
    hidePos:Vector3
    sizeX:number
    sizeZ:number    
    entity:Entity    
    health:number
    maxHealth:number = 3
    id:string
   

    visible:boolean = false
    activateTime:number=Number.MAX_VALUE
    respownTime:number = CONFIG.TILE_RESPAWN_TIME
    destoryTime:number = 0

    constructor(_id:string,_row:number, _col:number, _centerPos:Vector3, _abovePos:Vector3, _sizeX:number, _sizeZ:number){
        this.id = _id
        this.row = _row
        this.col = _col
        this.centerPos = _centerPos
        this.abovePos = _abovePos
        this.sizeX = _sizeX
        this.sizeZ = _sizeZ

        
        this.entity = new Entity(this.id)
        this.entity.addComponent(this.blockShape)      
        //this.entity.addComponent(SOUNDS.woodExplodeSource)
        this.entity.addComponent(new Transform({
            position: new Vector3(this.centerPos.x, this.centerPos.y, this.centerPos.z),
            scale: new Vector3(this.sizeX,this.sizeX,this.sizeZ),
            rotation: Quaternion.Euler(0,Math.floor(Math.random()*3)*90, 0)
        }))

       
        engine.addEntity(this.entity)
        
        this.reset()

    }

    updateHealth(val:number){
        //log("updateHealth",this.id,"new",val,"current:",this.health)
        const oldHealth = this.health
        this.health = val

        if(oldHealth>0 && this.health <= 0){
            this.destoryTime = REGISTRY.getGameTime()
            this.scheduleShow()
        }

        //log(METHOD_NAME,this.id,"ENTRY",this.health)
        if(oldHealth >= 1 && this.health < 1){
            //here so hide does not have a sound side affect
            SOUND_POOL_MGR.destructibleBreakSound.playOnce(this.entity)
            log("dioBreakSound")
        }
        this.checkHealth()
    }
    checkHealth(){
        const METHOD_NAME = "checkHealth"
        //log(METHOD_NAME,this.id,"ENTRY",this.health)
        if(this.health < 1){
            this.hide()
        }else{
            /*SOUND_POOL_MGR.destructibleHitSound.playOnce(this.entity)
            log("dioHitSound")*/
            this.show()
        }
    }

    hit(damage:serverStateSpec.AlterHealthDataState){
        log("block hit",this.id,"damage",damage,"this.health",this.health) 

        /*SOUND_POOL_MGR.destructibleHitSound.playOnce(this.entity)
        log("dioHitSound")*/

        damage.respawnTime = this.respownTime
        damage.playerIdTo = this.id
        //if fired by me
        if(!isNull(GAME_STATE.gameRoom) && damage.playerIdFrom === REGISTRY.player.sessionId){
            //send it to others
            GAME_STATE.gameRoom.send("levelData.trackFeature.adjustHealth",damage)
        }
       
        this.updateHealth( this.health - damage.amount )
    }
    hide(){
        if(!this.visible) {
            //log(this.id,"already hidden skipping")
            return;
        }


        //this.hidden = true
        const hidePos = -20
        const tf = this.entity.getComponent(Transform)
        if(tf.position.y != hidePos){
            tf.position.y = hidePos
        }
        this.visible = false
        this.scheduleShow()
    }

    scheduleShow(){
        const METHOD_NAME = "scheduleShow"
        //log(METHOD_NAME,this.id,"ENTRY")
        if(!CONFIG.TILE_ENABLE_RESPAWN){
            log(METHOD_NAME,this.id,"respawn disabled CONFIG.TILE_ENABLE_RESPAWN",CONFIG.TILE_ENABLE_RESPAWN)
            return;
        }
        this.activateTime = this.destoryTime + this.respownTime

        //just let server do it???
        //removing timer as wont help as consition to be visible is health. need server to restore health
        if(GAME_STATE.gameConnected !== 'connected'){
            log(METHOD_NAME,this.id,"not connected scheduling restore locally")
            //onlly when not connnected will we restore it client side
            this.entity.addComponentOrReplace(new utils.Delay( this.activateTime - REGISTRY.getGameTime() , () => 
            {
                this.health = this.maxHealth
                //hack would be to set health here
                this.show()
            }))
        }

    }
    show(){
        const METHOD_NAME = "show"
        //log(METHOD_NAME,this.id,"ENTRY")
        if(this.visible) {
            //log(this.id,"already visible skipping")
            return;
        }
        this.visible = true    
        const tf = this.entity.getComponent(Transform)
        if(tf.position.y != this.centerPos.y){
            tf.position.y = this.centerPos.y
        }
    }
    reset(){  
        const METHOD_NAME = "reset"
        //log(METHOD_NAME,this.id,"ENTRY")

        if(this.entity.hasComponent(utils.Delay)) this.entity.removeComponent( utils.Delay )
        this.health = this.maxHealth//
        this.show()

    }
}


class IceGrid {
    blocks:Block[] = []
    blocksMap:Record<string,Block> = {} //for easy lookup

    sizeX:number 
    sizeZ:number  
    blocksX:number 
    blocksZ:number 
    blockSizeX:number 
    blockSizeZ:number 
    blockCount:number 
    groundLevel:number 
     

    center:Vector3 

    constructor(){
        this.sizeX = 74
        this.sizeZ = 38       
    
        this.blocksX = 12
        this.blocksZ = 6
    
        this.blockSizeX = this.sizeX / this.blocksX
        this.blockSizeZ = this.sizeZ / this.blocksZ
    
        this.blockCount = this.blocksX * this.blocksZ
        this.groundLevel = 10
           
    
        this.center=  new Vector3(scene.center.x , this.groundLevel, scene.center.z - 4.5)

        this.initBlocks()
    }

    initBlocks(){
        let counter=0
        for(let i=0; i< this.blocksX; i++){
            for(let j=0; j< this.blocksZ; j++){ 
                const block = new Block(
                    //id synced with server and client, do not change without also updating server and client
                    "ice-tile."+counter+"."+(i+","+j),
                    i,
                    j, 
                    new Vector3((this.blockSizeX/2 + i*this.blockSizeX) + this.center.x-this.sizeX/2, this.groundLevel, (this.blockSizeZ/2 + j*this.blockSizeZ) + this.center.z-this.sizeZ/2 ),
                    new Vector3((this.blockSizeX/2 + i*this.blockSizeX) + this.center.x-this.sizeX/2, this.groundLevel, (this.blockSizeZ/2 + j*this.blockSizeZ) + this.center.z-this.sizeZ/2 ),
                    this.blockSizeX*1,//0.99,
                    this.blockSizeZ*1//0.99
                    )
                //block.idx = this.blocks.length
                this.blocks.push(block)
                this.blocksMap[block.id] = block

                counter++
            }
        }
    }
    getBlockById(id:string){
        return this.blocksMap[id]
    }
    getBlock(_x:number, _z:number):Block{

        if(_x < 0 || _z < 0 || _x >= this.blocksX || _z >= this.blocksZ){
            log("no block exists with coordinates: x: " + _x + " z: " + _z )
            return null
        }
        return this.blocks[_x * this.blocksZ + _z]
    }

    hideAllBlocks(){
        for(let i=0; i< this.blocks.length; i++){
            this.blocks[i].hide()
            
        }
        //SOUNDS.woodExplodeSource.playOnce()
    }

    resetAllBlocks(){
        for(let i=0; i< this.blocks.length; i++){
            this.blocks[i].reset()        
        }   
    }

    hitBlock(_xCoord:number, _zCoord:number, _damage:serverStateSpec.AlterHealthDataState){

        let gridCoordX = Math.floor((_xCoord - this.center.x + this.sizeX/2) / this.blockSizeX)
        let gridCoordZ = Math.floor((_zCoord - this.center.z + this.sizeZ/2) / this.blockSizeZ)

        log("X COORD: " + gridCoordX)
        log("Z COORD: " + gridCoordZ)

        let block = this.getBlock(gridCoordX, gridCoordZ)
        
        if(block){
            block.hit(_damage)
        }
        else{
            log("BLOCK NOT FOUND")
        }



    }
}

export let iceGrid = new IceGrid()
 


