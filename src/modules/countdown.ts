

export class CountdownBanner{
    host:Entity
    frame:Entity
    titleEnt:Entity
    hourEnt:Entity
    hourText:TextShape
    eventName:string
    eventStartTime:number
    callback:()=>void

    constructor(eventName:string,eventStartTime:number,baseTransform:Transform,frameShape?:GLTFShape,frameTransform?:Transform,parent?:Entity,callback?:()=>void){
        this.eventName = eventName
        this.eventStartTime = eventStartTime
        this.callback = callback

        const host = this.host = new Entity()
        if(parent !== undefined){
            host.setParent(parent)
        }

        host.addComponent(//new Transform({
            //position: new Vector3(baseX, baseY, baseZ),
            //scale: new Vector3(1, 1, 1)
        //}))
        baseTransform)

        const frame = this.frame = new Entity()
        if(frameShape !== undefined) frame.addComponent(frameShape)
        if( frameTransform !== undefined){
            frame.addComponent( frameTransform )
        }else{
            frame.addComponent(new Transform({
                position: new Vector3(0, 0, 0),
                scale: new Vector3(1, 1, 1)
            }))
        }
        frame.setParent(host)
        
        const titleEnt = this.titleEnt = new Entity()
        const titleText = new TextShape(this.eventName + " will go live in")
        titleText.fontSize = 10
        titleText.color = Color3.White()//new Color3(123 / 400, 84 / 400, 183 / 400) //Color3.White()
        titleEnt.addComponent(new Transform({
            position: new Vector3(0, .975, 0)
        }))
        titleEnt.addComponent(titleText)
        titleEnt.setParent(host)

        const hourEnt = this.hourEnt = new Entity()
        const hourText = this.hourText = new TextShape("--")
        hourText.fontSize = 20
        hourText.color = Color3.White()//new Color3(123 / 600, 84 / 600, 183 / 600) //Color3.White()

        hourEnt.addComponent(new Transform({
            position: new Vector3(0, textY, 0)
        }))
        hourEnt.addComponent(hourText)
        hourEnt.setParent(host)
    }

    updateText(text:string){
        this.hourText.value = text
    }


    updateCounterTransform(baseTransform:Transform){
        this.host.getComponent(Transform).position.copyFrom( baseTransform.position );
    }

    removeText() {
        if(this.host.alive) engine.removeEntity(this.host)
        if(this.titleEnt.alive) engine.removeEntity(this.titleEnt)
        if(this.hourEnt.alive) engine.removeEntity(this.hourEnt)
        if(this.frame.alive) engine.removeEntity(this.frame)
    }
    notifyEnd(){
        if(this.callback!==undefined) this.callback()
    }

    addToEngine(){
        engine.addEntity(this.host)
        engine.addEntity(this.frame)
        engine.addEntity(this.hourEnt)
        engine.addEntity(this.titleEnt)
    }
    getSecondsTillEvent(){
        let now = Math.floor(Date.now())
        let totalSecond = this.eventStartTime - now

        return totalSecond/1000;
    }
}


  //const textX = -.6
  const textY = -.6

export class CountdownTimerSystem {
    refreshRate: number = 0.5
    count: number = 0
    rotate: boolean = false
    countdownBanners:CountdownBanner[] = []

    constructor() {
        
        
    }
    addCounter(countdownBanner:CountdownBanner){
        this.countdownBanners.push(countdownBanner)

        let totalSecond = countdownBanner.getSecondsTillEvent()

        if (totalSecond > 0) {
            log("countdown will count down from :)",totalSecond)
            engine.addSystem(this)

            countdownBanner.addToEngine()
        }else{
            log("countdown has passed, do nothing :)",totalSecond)
        }
    }
    update(dt: number) {
        
        this.count += dt
 
        if (this.count > this.refreshRate) {
            
            let activeCounter = 0
            for(const p in this.countdownBanners){
                const countDownInst = this.countdownBanners[p]
                this.count = 0

                //let now = Math.floor(Date.now() )
                let totalSecond = countDownInst.getSecondsTillEvent()

                //log("countdown.update will count down from :)",totalSecond)

                if (totalSecond < 0) {
                    countDownInst.removeText()   
                    countDownInst.notifyEnd()
                }else{
                    activeCounter++
                }

                let hours = Math.floor(totalSecond / 3600) 
                let second_remain = totalSecond % 3600
                let mins = Math.floor(second_remain / 60)
                let secs = Math.floor(second_remain % 60)

                countDownInst.updateText(  digitFormat2Digit(hours) + ":" + digitFormat2Digit(mins) + ":" + digitFormat2Digit(secs) )

                //log(totalSecond, now, eventTime)
                //log("DIFF: ", digitFormat2Digit(hours), digitFormat2Digit(mins), digitFormat2Digit(secs))

            }
            if(activeCounter <= 0){
                log("countdown.no more counters, removing system")
                engine.removeSystem(this)
            }
        }
    }
}

function digitFormat2Digit(val: number) {
    if (val > 9) {
        return val.toString()
    }
    else {
        return "0" + val.toString()
    }
}

/*
Input.instance.subscribe('BUTTON_DOWN', ActionButton.PRIMARY, false, (e) => {
    log(Camera.instance.position)
})
*/ 
