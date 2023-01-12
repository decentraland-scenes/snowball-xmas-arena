
import { teamColor } from "./teamColors";


let nameBGBlueRightShape = new GLTFShape('models/name_BG_blue_right.glb')
let nameBGBlueLeftShape = new GLTFShape('models/name_BG_blue_left.glb')
let nameBGBlueMidShape = new GLTFShape('models/name_BG_blue_mid.glb')

let nameBGRedRightShape = new GLTFShape('models/name_BG_red_right.glb')
let nameBGRedLeftShape = new GLTFShape('models/name_BG_red_left.glb')
let nameBGRedMidShape = new GLTFShape('models/name_BG_red_mid.glb')


export class NameTag extends Entity {
    public markerID:number = 0
    public nameText:TextShape = null
    public team:teamColor
   
    public nameBGMid:Entity
    public nameBGLeft:Entity
    public nameBGRight:Entity


  
    // Allow each room to specify a unique look and feel
    constructor(      
      transform: TranformConstructorArgs,
      nameTag: string,
      team:teamColor,      
      //sound: AudioClip
    ) {
      super()     

      this.team = team
      
      this.nameText = new TextShape(nameTag)       
      this.nameText.fontSize = 4       
      
      this.addComponent(new Transform(transform))     

      let markerTextRoot = new Entity()      
      let markerTextBG = new Entity()      
      let markerBadgeNumber = new Entity()      
      let markerBadgeNumberText = new TextShape()      
      let markerBadgeBG = new Entity()      
      this.nameBGMid = new Entity()      
      this.nameBGLeft= new Entity()      
      this.nameBGRight = new Entity()      

      
      this.nameText.color = Color3.White()
      this.nameText.outlineColor = Color3.White()
      this.nameText.outlineWidth = 0.1

      if(this.team == teamColor.RED){        
        this.nameBGMid.addComponent(nameBGRedMidShape)
        this.nameBGLeft.addComponent(nameBGRedLeftShape)   
        this.nameBGRight.addComponent(nameBGRedRightShape)   
        
      }else{          
        this.nameBGMid.addComponent(nameBGBlueMidShape)
        this.nameBGLeft.addComponent(nameBGBlueLeftShape)   
        this.nameBGRight.addComponent(nameBGBlueRightShape)   
      }

      
      this.nameBGMid.addComponent(new Transform({
        position: new Vector3(0,0,0.1), 
        scale: new Vector3(nameTag.length*0.27,1,1)}))
      this.nameBGMid.setParent(markerTextRoot)

      this.nameBGLeft.addComponent(new Transform({
        position: new Vector3(-1*nameTag.length*0.27/2,0,0.1), 
        scale: new Vector3(1,1,1)}))
      this.nameBGLeft.setParent(markerTextRoot)

      this.nameBGRight.addComponent(new Transform({
        position: new Vector3(nameTag.length*0.27/2,0,0.1), 
        scale: new Vector3(1,1,1)}))
      this.nameBGRight.setParent(markerTextRoot)     
   

      markerTextRoot.addComponent(new Transform({position: new Vector3(0,4.0,0)}))
      markerTextRoot.addComponent(this.nameText)
      markerTextRoot.addComponent(new Billboard(true,true,false))
      markerTextRoot.setParent(this)
    
        engine.addEntity(this)
    } 
    
   
    public setName(_name:string): void {              
      if(this.nameText.value != _name){
        this.nameText.value = _name 
        this.nameBGMid.getComponent(Transform).scale.x = _name.length * 0.27
        this.nameBGLeft.getComponent(Transform).position.x = -1* _name.length * 0.27 / 2
        this.nameBGRight.getComponent(Transform).position.x = _name.length * 0.27 / 2
      }
   
    }  

    public setColor(color:teamColor): void {              
      if(color == teamColor.RED){        
        this.nameBGMid.addComponentOrReplace(nameBGRedMidShape)
        this.nameBGLeft.addComponentOrReplace(nameBGRedLeftShape)   
        this.nameBGRight.addComponentOrReplace(nameBGRedRightShape)   
        
      }else{          
        this.nameBGMid.addComponentOrReplace(nameBGBlueMidShape)
        this.nameBGLeft.addComponentOrReplace(nameBGBlueLeftShape)   
        this.nameBGRight.addComponentOrReplace(nameBGBlueRightShape)   
      }
      

    }  
       
        
    resetMarker(){    
      this.setName("Player " + (this.markerID + 1))      
    }


  }

  