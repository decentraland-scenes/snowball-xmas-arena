
import { OtherPlayer } from "./otherPlayer";
import { getUserData } from "@decentraland/Identity";
import { teamColor } from "./teamColors";
import { GAME_STATE } from "src/state";


const CLASSNAME = "EnemyManager"
//TODO-DCL-MERGE-WITH 
//import { EnemyData, ENEMY_MGR } from "src/og-decentrally/modules/playerManager";
export class EnemyManager {
    others:OtherPlayer[]
    
    constructor(){
        this.others = []
    }

    addEnemy(id:string):OtherPlayer{
        let enemy = new OtherPlayer(id)
        this.others.push(enemy)

        log(CLASSNAME,"ENEMY ADDED " + enemy.id)

       return enemy
    }
    removeAll(){
        log(CLASSNAME,"removeAll","ENTRY","removeEnemy",this.others.length)
        //mutation issue

        //make copy of list to avoid mutating list
        const listToRemove:OtherPlayer[] = []
        listToRemove.push(...this.others)
        
        for(const p in listToRemove){
            this._removeEnemy( listToRemove[p] )
        }
        
        if(this.others.length > 0){
            log(CLASSNAME,"removeAll","WARNING - why not 0 ? removeAll","ENEMY remove all ",this.others.length)    
        }

        log(CLASSNAME,"removeAll","EXIT",this.others.length)
    }
    _removeEnemy(enemy:OtherPlayer){
        log(CLASSNAME,"_removeEnemy",enemy)

        //remove reguardless
        if(enemy !== undefined){
            enemy.removeFromEngine()
            enemy.reset()
        }else{
            log(CLASSNAME,"_removeEnemy","enemy was null, could not remove",enemy)
        }

        const index = this.others.indexOf(enemy, 0);

        if (index > -1) {
            this.others.splice(index, 1);
        }else{
            log(CLASSNAME,"_removeEnemy","remove could not find enemy to remove from list!",index,enemy)
        }
    }
    removeEnemy(id:string){
        log(CLASSNAME,"ENEMY removed " , id)
        let enemy = this.getEnemyByID(id)

        this._removeEnemy(enemy)
        
        log(CLASSNAME,"ENEMY removed EXIT", id,"new count",this.others.length)
    }
    getEnemyByID(_id:string):OtherPlayer{

        //log("GETTING ENEMY ID: " + _id )
        let result = this.others.filter(x => (x.id === _id))[0]
        //log(this.others)
        //log("RESULT: " + result)
       
        return result
    }
    setEnemyColor(_id:string, color:teamColor){

        log(CLASSNAME,"ENEMIES: " +  this.others.length)

        for(let i=0; i< this.others.length; i++){
            log(CLASSNAME,"ENEM_" + i + ": " +  this.others[i].id)
        }
        let enemy = this.getEnemyByID(_id)

        log(CLASSNAME,"SETTING COLOR: " + _id + ", " +  enemy )

        if(enemy != null){
            enemy.setColor(color)
            
        }
    }
    updatePlayerPos(_id:string, posX:number, posY:number, posZ:number, rotX:number, rotY:number, rotZ:number, rotW:number){

        let enemy = this.getEnemyByID(_id)
        if(enemy != null){
            enemy.updatePos(posX, posY, posZ, rotX, rotY, rotZ, rotW)            
        }
        else{
            log(CLASSNAME,"ENEMY WITH THIS ID NOT FOUND")
        }
        
    }

    
}


//TODO-DCL-MERGE-WITH 
//import { SnowballEnemyUpdateSystem, SnowballEnemyMarkerSystem } from "../snowballEnemies";
//import { EnemyData, ENEMY_MGR } from "src/og-decentrally/modules/playerManager";
export class EnemyUpdateSystem {
    enemyManagerRef:EnemyManager

    constructor(EnemyManagerRef:EnemyManager){
        this.enemyManagerRef = EnemyManagerRef
    }
 
    update(dt:number){
        if(GAME_STATE.gameConnected !== "connected"){
            return;
        }
        for(let enemy of this.enemyManagerRef.others){
           // const transform = enemy.avatar.getComponent(Transform)

           // transform.position = Vector3.Lerp(transform.position, enemy.targetTransform.position, 4*dt)
          //  transform.rotation = Quaternion.Slerp(transform.rotation, enemy.targetTransform.rotation, 4 * dt)

         enemy.updateAvatar(dt)
            
        }
    }
}




