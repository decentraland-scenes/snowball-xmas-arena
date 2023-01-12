import { teamColor } from "./teamColors"
import { BasePlayer } from "./basePlayer"
import { NameTag } from "./nameTag"
import { REGISTRY } from "src/registry"

@Component("OtherCollider")
export class OtherCollider {
    color:teamColor  
    id:string
    
    constructor( _id:string){
        this.color = teamColor.NEUTRAL //will get redefined when join happens
        this.id = _id
    }
    
}

const enemyCollider = new GLTFShape('models/enemy_collider.glb')
export class OtherPlayer extends BasePlayer {
    
    
    avatar:Entity
    nameTag:NameTag
    
    material:Material    
    targetTransform:Transform

    constructor(id:string){
      super()

      this.setId(id)
      this.material = new Material()
      this.collider = new Entity()  
      this.collider.addComponent(new Transform({
          position: new Vector3(0,0,0)
      }))

      this.targetTransform = new Transform()

      this.avatar = new Entity()
      this.avatar.addComponent(new Transform())       
      engine.addEntity(this.avatar)

      //LOWER BODY
      this.avatarLowerBody.addComponentOrReplace(new Transform({
          position: new Vector3(0,0,0),
          scale: new Vector3(1,1,1),
      }))
      //engine.addEntity(this.avatarLowerBody)
      //this.avatarLowerBody.setParent(this.avatar)


      // UPPER BODY ROOT PIVOT 
      this.avatarUpperBodyRoot.addComponentOrReplace(new Transform({
          position: new Vector3(0,0,0),
          scale: new Vector3(1, 1, 1)
      }))   


      // UPPER BODY MESH
      this.avatarUpperBodyMesh.addComponentOrReplace(new Transform({
        //position: new Vector3(0,-0.15, 0.15),
        position: new Vector3(0,-0.05, 0.1),
        scale: new Vector3(1,1,1),
        rotation: Quaternion.Euler(-5,0,0)
      }))
      this.avatarUpperBodyRoot.setParent(this.avatar)
      //shotgun.setParent(this.selfAvatarUpperBodyMesh)
      
        
          
      //this.collider.addComponent(new GLTFShape('models/enemy_general.glb')).isPointerBlocker = true
      //this.collider.addComponent(new BoxShape())
      this.collider.addComponent(new OtherCollider(this.id))
      this.collider.addComponentOrReplace(enemyCollider)
      //this.collider.addComponentOrReplace(new BoxShape()).isPointerBlocker = true
      this.collider.setParent(this.avatar)     
      
      this.colorMarker.setParent(this.avatar) 
        
      //make sure to register entities in hierarchy top order first, parents first, children second
      this.entities.push(this.avatar)
      this.entities.push(this.collider)
      this.entities.push(this.avatarUpperBodyRoot)
      this.entities.push(this.avatarLowerBody)
      this.entities.push(this.avatarUpperBodyMesh)

      this.nameTag = new NameTag(
      new Transform({
        position: new Vector3(0,1,0),
        scale: new Vector3(0.6, 0.6, 0.6)
        }),
      "PLAYER",
      this.color       
      )

      this.nameTag.setParent(this.avatarUpperBodyRoot)  
      this.setAvatarSwapEnabled(false);
    }

    public setAvatarSwapEnabled(enable : boolean) {
      if(enable){  
        if(!this.avatar.alive) engine.addEntity(this.avatar);
      }else{
        if(this.avatar.alive) engine.removeEntity(this.avatar);
      }
      super.setAvatarSwapEnabled(enable)
      this.avatarSwapEnabled = enable
    }

    removeFromEngine() {
      for(const p in this.entities){
        const itm = this.entities[p]
        if(itm.alive) engine.removeEntity(itm)
      }
    }
    removeColliderFromEngine() {
      if(this.collider.alive) engine.removeEntity(this.collider)
    }
    setName(_newName:string){
      this.name = _newName
      this.nameTag.setName(_newName)
    }

    setColor(_teamColor:teamColor, force? : boolean){
      if(!force && this.color === _teamColor){
        return;
      }
      super.setColor(_teamColor, force)

      log(this.id,this.userId,"COLOR TO CHANGE TO: " + _teamColor )
      switch(_teamColor){

          case teamColor.BLUE:{
              //this.color = teamColor.BLUE
              this.material.albedoColor = Color4.Blue()
              this.collider.getComponent(OtherCollider).color = teamColor.BLUE               
              this.nameTag.setColor(teamColor.BLUE)               
              break
          }
          case teamColor.RED:{
              //this.color = teamColor.RED
              this.material.albedoColor = Color4.Red()
              this.collider.getComponent(OtherCollider).color = teamColor.RED               
              this.nameTag.setColor(teamColor.RED)               
              break
          }
      }
    }
    updatePos(posX:number, posY:number, posZ:number, rotX:number, rotY:number, rotZ:number, rotW:number){
        const transform = this.avatar.getComponent(Transform)

        this.targetTransform.position.set(posX, posY, posZ)
        this.targetTransform.rotation.set(rotX, rotY, rotZ, rotW)
        

      
       // this.avatarUpperBodyRoot.getComponent(Transform).rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
       // transform.position.set(posX, posY, posZ)
       // transform.rotation.set(rotX, rotY, rotZ, rotW)
    }

    updateAvatar(dt:number){
        const transform = this.avatar.getComponent(Transform)
        transform.position = Vector3.Lerp(transform.position, this.targetTransform.position, 4*dt)
        transform.rotation = Quaternion.Slerp(transform.rotation, this.targetTransform.rotation, 4*dt)

        this.feetPos =  transform.position
        this.moveDir =  this.feetPos.subtract( this.prevPosition)
        this.lookDir = Vector3.Forward().rotate( transform.rotation).multiplyByFloats(1,0,1).normalize()        
        this.horizontalRotation = Quaternion.FromToRotation(Vector3.Forward(),  this.lookDir)
        
    
        this.avatarLowerBody.getComponent(Transform).position.set(transform.position.x, transform.position.y -0.15, transform.position.z)
        this.avatarLowerBody.getComponent(Transform).rotation = Quaternion.FromToRotation(Vector3.Forward(),  this.moveDir.multiplyByFloats(1,0,1))
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
          // this.clipRun.stop()
          // this.clipIdle.looping = true
          // this.clipIdle.play()     
          this.setIdleAnimation(true);
          this.setRunAnimation(false);
          this.avatarLowerBody.getComponent(Transform).rotation.copyFrom(this.horizontalRotation)
        }
        else{
          // this.clipIdle.stop()
          // this.clipRun.looping = true
          // this.clipRun.play()
          this.setIdleAnimation(false);
          this.setRunAnimation(true, this.isBackwards);
    
          if( this.isBackwards){
            //this.clipRun.speed = -1.0
           //this.avatarLowerBody.getComponent(Transform).rotation = Quaternion.Euler(0,180,0)
           this.avatarLowerBody.getComponent(Transform).rotation = Quaternion.FromToRotation(Vector3.Backward(),   this.moveDir.multiplyByFloats(1,0,1))
          }else{
            //this.clipRun.speed = 1.2
           // this.avatarLowerBody.getComponent(Transform).rotation.copyFrom(this.horizontalRotation)
          }
    
        }
      }
}


