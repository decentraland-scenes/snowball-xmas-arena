import * as ui from '@dcl/ui-scene-utils'
import { IntervalUtil } from 'src/utils/interval-util'
import * as utils from '@dcl/ecs-scene-utils';

let hitUI = new Texture("textures/hit.png")
let deathUI = new Texture("textures/FROSTED_2.png")//FROSTED.png //"textures/death.png"

export enum FrostUIType {
    PLAYER_HIT = 'playerhit',
    PLAYER_DEATH = 'playerdeath'
}

let deathTimerEntity = new Entity()
engine.addEntity(deathTimerEntity)

export class FrostedUISystem{

    default = 5 
    timer = 0
    factor = 0
    updateInterval:IntervalUtil
    
    death:UIImage
    hit:UIImage
    splat:UIImage

    hitMessage:UIText
    deathMessage:UIText
    message:UIText

    constructor(){
        this.hit = new UIImage(ui.canvas, hitUI)
        this.hit.isPointerBlocker = false
        this.hit.hAlign = "center"
        this.hit.vAlign = "center"
        this.hit.height = "100%"
        this.hit.width = "100%"
        this.hit.sourceHeight =556
        this.hit.sourceWidth = 1273
        this.hit.sourceTop = 0
        this.hit.sourceLeft = 0
        this.hit.visible = false 

        this.death = new UIImage(ui.canvas, deathUI)
        this.death.isPointerBlocker = false
        this.death.hAlign = "center"
        this.death.vAlign = "center"
        
        //FROSTED.png is 1792 , 921
        if(deathUI.src.indexOf("FROST")>-1){
            this.death.height = "125%"
            this.death.width = "125%"
            this.death.sourceHeight = 921
            this.death.sourceWidth = 1792
        }else{
            this.death.height = "125%"
            this.death.width = "125%"
            this.death.sourceHeight = 1862
            this.death.sourceWidth = 3600
        }
        this.death.sourceTop = 0
        this.death.sourceLeft = 0
        this.death.visible = false

        this.updateInterval  = new IntervalUtil(1000/10); 


        const hitMessage = new UIText(ui.canvas) //messageBackground
        hitMessage.isPointerBlocker = false
        hitMessage.vAlign = 'center'
        hitMessage.hAlign = 'center'
        hitMessage.hTextAlign = 'center'
        hitMessage.vTextAlign = 'center'
        hitMessage.font = ui.SFFont
        hitMessage.fontSize = 60
        hitMessage.color = new Color4(0, 0, 0, 1)
        hitMessage.visible = false
        hitMessage.positionY = 80

        this.hitMessage = hitMessage
        
        const deathMessage = new UIText(ui.canvas) //messageBackground
        deathMessage.isPointerBlocker = false
        deathMessage.vAlign = 'center'
        deathMessage.hAlign = 'center'
        deathMessage.hTextAlign = 'center'
        deathMessage.vTextAlign = 'center'
        deathMessage.font = ui.SFFont
        deathMessage.fontSize = 60
        deathMessage.color = new Color4(0, 0, 0, 1)
        deathMessage.visible = false
        if(deathUI.src.indexOf("FROST")>-1){
            deathMessage.positionY = -150
        }else{
            deathMessage.positionY = 80
        }

        this.deathMessage = deathMessage

        
    }

    update(dt:number){
        if(this.timer > 0){
            this.timer -= dt
            if(this.updateInterval.update(dt)){
                //log("FrostedUISystem","update",this.timer,this.updateInterval.elapsedTime)  
                this.splat.opacity = (this.timer * this.factor) / 10
            }
        }
        else{
            this.splat.visible = false
            //this.message.visible = false
            engine.removeSystem(this)
            this.timer = 0
        }
    }

    showUI(uiType:FrostUIType, msg:string, duration?:number){
        log("FrostedUISystem",uiType,msg,duration)  
        this.factor = 10 / duration ? duration : this.default

        this.updateInterval.reset()

        this.timer = duration

        
 
        switch(uiType){
            case FrostUIType.PLAYER_DEATH:
                //this.hitMessage.visible = false
                this.hit.visible = false
                this.splat = this.death
                this.message = this.deathMessage

                if (duration != -1) {
                    deathTimerEntity.addComponentOrReplace(
                        new utils.Delay(duration ? duration*1000 : 3*1000, () => {
                            this.deathMessage.visible = false
                        })
                    )
                }
    
            break;

            case FrostUIType.PLAYER_HIT:
                //this.deathMessage.visible = false
                this.death.visible = false
                this.splat = this.hit
                this.message = undefined //this.hitMessage

                /*if (duration != -1) {
                    deathTimerEntity.addComponentOrReplace(
                        new utils.Delay(duration ? duration : 3, () => {
                            this.deathMessage.visible = false
                        })
                    )
                }*/
                break;
        }
        
        if(this.message !== undefined){
            log("FrostedUISystem","show message",msg)  
            this.message.visible = true
            this.setMessage(msg)
        }
        
        

        this.splat.visible = true 
        engine.addSystem(this)
    }
    setMessage(msg:string){
        const message = this.message

        message.value = msg

        //log("FrostedUISystem","show message",this.message)  

        message.color = Color4.White()//color ? color : Color4.Yellow()

        message.fontSize = 40//size ? size : 50
        message.font = ui.SFHeavyFont

        message.outlineColor = Color4.Black()

        message.outlineWidth = .1//bordersOff ? 0 : 0.1

        //message.width = value.length * message.fontSize
        message.adaptWidth = false
        message.textWrapping = true
        message.width = 900
    }
    // showHit(duration?:number){
    //     this.factor = 10 / duration ? duration : this.default
    //     this.timer = duration

    //     this.splat = this.hit
    //     this.splat.visible = true
    //     engine.addSystem(this)
    // }

    // showDeath(duration?:number){
    //     this.factor = 10 / duration ? duration : this.default
    //     this.timer = duration

    //     this.splat = this.death
    //     this.splat.visible = true
    //     engine.addSystem(this)
    // }
}