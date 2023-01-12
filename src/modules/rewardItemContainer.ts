import * as ui from '@dcl/ui-scene-utils'
import { ChainId, ClaimCodes, ClaimState, ClaimUiType, DispenserPos, ItemData } from 'src/claiming-dropin/claiming/claimTypes'
import { checkIfPlayerHasAnyWearableByUrn, ClaimTokenRequest, ClaimTokenResult, ClaimUI, HandleClaimTokenCallbacks } from 'src/claiming-dropin/claiming/loot'
import { customResolveSourceImageSize } from 'src/claiming-dropin/claiming/utils'
import { CommonResources } from 'src/resources/common'

let outlineTexture = new Texture("textures/rewards/BaseRewards.png")
let barTexture = new Texture("textures/rewards/bar.png")

let getItemTexture = new Texture("textures/rewards/Get.png")
let greenCircleTexture = new Texture("textures/rewards/GreenSphere.png")
let greenSquareTexture = new Texture("textures/rewards/Greensquare.png")

let greenCheckTexture = new Texture("textures/rewards/TIk.png")

const defaultRewardIcon = new Texture("textures/anonymous-player.png")

const claimCallbacks:HandleClaimTokenCallbacks = {
    onOpenUI:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on open",type,claimResult)
    },
    
    onAcknowledge:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on ack",type,claimResult)
        if(claimResult && claimResult.success){
            const data: ItemData = claimResult.json.data[0]

            /*if(
                testForPortableXP(data)
                || (CONFIG.CLAIM_TESTING_ENABLED && testForWearable(data,WearableEnum.PANTS_ADDRESS))
                ){
                openTutorialPrompt()
            }*/
        }
    },
    onCloseUI:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on close",type,claimResult)

        const hasClaimConfig = claimResult && claimResult.requestArgs && claimResult.requestArgs.claimConfig
        /*switch(type){
            case ClaimUiType.YOU_ALREADY_HAVE_IT:
                if(
                    hasClaimConfig 
                    && ( claimResult?.requestArgs?.claimConfig?.refId == ClaimConfig.campaign.dcl_artweek_px.refId )
                    ){
                    openTutorialPrompt()
                }
            break;
        }*/
    }
} 

function createDummyItemData(urn?:string):ItemData{
    return {
        id: "",
        user: "",
        campaign_id: "",
        status: ClaimState.SUCCESS,
        transaction_hash: "",
        transaction_id: "",
        token: "",
        value: "",
        created_at: "",
        updated_at: "",
        from_referral: null,
        block_number: null,
        claim_id:  null,
        target: "",
        payload:  null,
        expires_at:  null,
        signature:  null,
        airdrop_type: "",
        group:  null,
        priority: "",
        campaign_key: "",
        assigned_at: "",
        image: urn,
        chain_id: ChainId.ETHEREUM_MAINNET
    }
}
export class RewardItemContainer{

    container:UIContainerRect
    check:UIImage
    itemImage:UIImage
    finishedCircle:UIImage
    finishCheck:UIImage
    getItem:UIImage
    redeemStart:UIImage
    redeembar:UIImage
    redeemEnd:UIImage
    amount:UIText
    dispenserPos:DispenserPos
    stat:string
    hasReward:boolean = false

    total:number
    redeemed:number = 0
    increments:number

    //claimUI:ClaimUI
    claimUI:ClaimUI|undefined
    claimCallbacks!:HandleClaimTokenCallbacks
    claimTokenReady:boolean = false
    claimInformedPending:boolean = false
    claimTokenResult:ClaimTokenResult|undefined

    customGetCount?:()=>number|undefined
 
    constructor(parent:UIContainerRect, yOffset:number, items:number, title:string, rewardImage:string,stat:string,dispenserPos:DispenserPos){
        this.total = items
        this.increments = Math.floor(220 / this.total)
        this.dispenserPos = dispenserPos
        this.stat = stat

        log("RewardItemContainer","constructor","stat",stat,"dispenserPos",dispenserPos)

        let imageSize = 512
        if(dispenserPos !== undefined){
            this.claimUI = new ClaimUI(dispenserPos.claimUIConfig,dispenserPos.claimConfig)
            this.claimCallbacks = claimCallbacks

            if(dispenserPos.claimConfig.wearableUrnsToCheck !== undefined && dispenserPos.claimConfig.wearableUrnsToCheck.length > 0){
                imageSize = customResolveSourceImageSize(createDummyItemData(dispenserPos.claimConfig.wearableUrnsToCheck[0]))
            }
        }

        this.container = new UIContainerRect(parent)
        this.container.width = 479
        this.container.height = 79
        this.container.hAlign = "center"
        this.container.vAlign = "top"
        this.container.positionY = yOffset

        let bg = new UIContainerRect(this.container)
        bg.hAlign = "center"
        bg.vAlign = "center"
        bg.width = 475
        bg.height = 75
        bg.color = Color4.Blue()

        let outline = new UIImage(this.container, outlineTexture)
        outline.sourceTop = 0
        outline.sourceLeft =0
        outline.sourceHeight = 136
        outline.sourceWidth = 958
        outline.width = 479
        outline.height = 79

        let header = new UIText(this.container)
        header.value = title
        header.vAlign = "top"
        header.hAlign = "left"
        header.vTextAlign= "center"
        header.hTextAlign = "left"
        header.fontSize = 12
        header.positionX = 20

        let bar = new UIImage(this.container, barTexture)
        bar.vAlign = "center"
        bar.sourceTop = 0
        bar.sourceLeft =0
        bar.sourceHeight = 40
        bar.sourceWidth = 564
        bar.width = 282
        bar.height = 20
        bar.hAlign = "left"
        bar.positionX = 20
        bar.positionY = -10

        this.redeemStart = new UIImage(this.container, greenCircleTexture)
        this.redeemStart.vAlign = "center"
        this.redeemStart.sourceTop = 0
        this.redeemStart.sourceLeft =0
        this.redeemStart.sourceHeight = 20
        this.redeemStart.sourceWidth = 20
        this.redeemStart.width = 19
        this.redeemStart.height = 19
        this.redeemStart.hAlign = "left"
        this.redeemStart.positionX = 19
        this.redeemStart.positionY = -10
        this.redeemStart.visible = false

        this.redeembar = new UIImage(this.container, greenSquareTexture)
        this.redeembar.vAlign = "center"
        this.redeembar.sourceTop = 0
        this.redeembar.sourceLeft =0
        this.redeembar.sourceHeight = 20
        this.redeembar.sourceWidth = 20
        this.redeembar.width = 0
        this.redeembar.height = 19
        this.redeembar.hAlign = "left"
        this.redeembar.positionX = 30
        this.redeembar.positionY = -10
        this.redeembar.visible = false

        this.amount = new UIText(this.container)
        this.amount.hAlign = "center"
        this.amount.value = "" + this.redeemed + "/" + this.total
        this.amount.vAlign = "center"
        this.amount.hTextAlign = 'center'
        this.amount.positionX = -92
        this.amount.positionY = 8

        const IMAGE_SHIFT_X = -10

        let shadow = new UIContainerRect(this.container)
        shadow.hAlign = "right"
        shadow.vAlign = "center"
        shadow.width = 52
        shadow.height = 54
        shadow.color = Color4.Black()
        shadow.opacity = .7
        shadow.positionX = -7 + IMAGE_SHIFT_X
        shadow.positionY = -2

        const imgTexture = rewardImage !== undefined && rewardImage.length > 0 ? new Texture(rewardImage) : defaultRewardIcon
        this.itemImage = new UIImage(this.container, imgTexture)
        this.itemImage.width = 50
        this.itemImage.height = 50
        this.itemImage.sourceHeight = imageSize
        this.itemImage.sourceWidth = imageSize
        this.itemImage.hAlign = "right"
        this.itemImage.vAlign = "center"
        this.itemImage.positionX = -10 + IMAGE_SHIFT_X


        this.finishedCircle = new UIImage(this.container, greenCircleTexture)
        this.finishedCircle.sourceTop = 0
        this.finishedCircle.sourceLeft = 0
        this.finishedCircle.sourceHeight = 20
        this.finishedCircle.sourceWidth = 20
        this.finishedCircle.width = 20
        this.finishedCircle.height = 20
        this.finishedCircle.hAlign = "center"
        this.finishedCircle.vAlign = "center" 
        this.finishedCircle.positionX = 55
        this.finishedCircle.positionY = -10
        this.finishedCircle.visible = false

        this.finishCheck = new UIImage(this.container, greenCheckTexture)
        this.finishCheck.sourceTop = 0
        this.finishCheck.sourceLeft = 0
        this.finishCheck.sourceHeight = 136
        this.finishCheck.sourceWidth = 165
        this.finishCheck.width = 46
        this.finishCheck.height = 38
        this.finishCheck.hAlign = "center"
        this.finishCheck.vAlign = "center"
        this.finishCheck.positionX = 55
        this.finishCheck.positionY = -10
        this.finishCheck.visible = false

        this.getItem = new UIImage(this.container, getItemTexture)
        this.getItem.sourceTop = 0
        this.getItem.sourceLeft = 0
        this.getItem.sourceHeight = 60
        this.getItem.sourceWidth = 63
        this.getItem.width = 21
        this.getItem.height = 19
        this.getItem.hAlign = "right"
        this.getItem.vAlign = "center"
        this.getItem.positionX = -8
        this.getItem.positionY = 20
        this.getItem.visible = false
    }

    incrementReward(){
        this.redeemed++
        this.updateUI()
    }

    updateDisplayAmount(){
        this.amount.value = "" + this.redeemed + "/" + this.total
    }

    setReward(amount:number){
        this.redeemed = amount
        this.updateUI()
    }

    showClaimPrompt(){
        const METHOD_NAME = "showClaimPrompt"
     
        log(METHOD_NAME,"ENTRY","this.claimTokenReady","this.claimInformedPending",this.claimInformedPending,this.claimTokenReady,"this.claimTokenResult",this.claimTokenResult)
        const host = this
        
        //const pointerEnt = this.glassesCollider
    
        if(this.claimTokenReady){
          
          //host.opened = true
    
          const claimSuccess = (this.claimTokenResult !== undefined) ? this.claimTokenResult.isClaimJsonSuccess() : false
          log(METHOD_NAME,'handleClaimJson success:' + claimSuccess,this.claimTokenResult)
    
          try{ 
            //320233-313689 
            //saving ~6k of polygons + some materials. remove once engine happy
            if(this.claimUI !== undefined && this.claimTokenResult !== undefined){
              if (claimSuccess){
                //if(this.glasses.alive) engine.removeEntity(this.glasses);
    
                //pointerEnt.removeComponent(OnPointerDown)
                this.hasReward = true
                this.updateUIHasItemAlready()
              }
              //this.claimUI.openClaimInProgress()
              this.claimUI.handleClaimJson( this.claimTokenResult, this.claimCallbacks )
              
              //this.hide()
            }else{
              //show some basic message???
              log(METHOD_NAME,"ERROR claimUI or  claimTokenResult null unable to handle json" )
            } 
            //do after claim completes? // double check it from wearable server?
            // quest.makeProgress(QUEST_OPEN_PRESENT)
            //quest.complete(QUEST_OPEN_PRESENT)
            // updateProgression('w1')
          }catch(e){
            log(METHOD_NAME,"failed to complete quest " + e,e)
            //prevent infinite loop
            //host.removeComponent(utils.Delay)
            throw e;
          }
        }else if(this.claimUI !== undefined){
          log(METHOD_NAME,"still loading....")
          //still loading
          this.claimUI.openClaimInProgress()
          this.claimUI.claimInformedPending = true
          //host.addCompon
        }else{
          log(METHOD_NAME,"claimUI missing but not ready yet")
          //this.claimUI.claimInformedPending = true
        }
          //quest.close() 
      
    }
    updateUI(){
        log("updateUI",this.stat,this.redeemed,this.total)
        //if(this.redeemed <= this.total){ //why woudl we  not update if greater than total?
        
        if(this.redeemed > 0){
            this.redeemStart.visible = true
            this.redeembar.visible = true
        }
        else{
            this.redeemStart.visible = false
            this.redeembar.visible = false
        }


            if(this.redeemed >= this.total){
                this.finishCheck.visible = true
                this.finishedCircle.visible = true
                this.getItem.visible = true
                this.getItem.onClick = new OnPointerDown(async ()=>{
                    const h = this.dispenserPos
                    
                    const claimUI = this.claimUI
                    //help with message, know if out of stock or wait till next day
                    //claimUI.campaignSchedule = dispenserSchedule
                    log('get item clicked')
                    if(claimUI && claimUI.lastUI && claimUI.lastUI.background.visible){
                        log("prevent clicking till modal closed claim")    
                        return;
                    }
                    
                    log("doing " , h.name,claimUI)
                    //show example of working directly with ClaimTokenRequest 

                    const hasWearable = claimUI.claimConfig?.wearableUrnsToCheck !== undefined ? await checkIfPlayerHasAnyWearableByUrn(
                        //ClaimConfig.campaign.dcl_artweek_px.wearableUrnsToCheck
                        claimUI.claimConfig?.wearableUrnsToCheck
                        //ClaimConfig.campaign.mvfw.wearableUrnsToCheck
                        ) : false
                    
                    
                    
                   
                    if(hasWearable){
                        const claimResult=new ClaimTokenResult()
                        claimResult.requestArgs = {...h.claimData}
                        claimResult.requestArgs.claimConfig = h.claimConfig
                        claimResult.claimCode = ClaimCodes.ALREADY_HAVE_IT
                        
                        //claimResult.claimCode = ClaimCodes.ALREADY_HAVE_IT
                        this.claimTokenReady = true
                        
                        if(!this.hasReward) this.hasReward = hasWearable

                        //giving it to giftbox when claiming now
                        this.claimTokenResult = claimResult

                        
                        claimUI.openYouHaveAlready(claimResult,this.claimCallbacks)
                    }else{
                        const claimReq = new ClaimTokenRequest( h.claimData )
                
                        //if(!this.claimUI.claimInformedPending){
                            this.claimUI.openClaimInProgress()
                            this.claimUI.claimInformedPending = true
                        //}

                        const claimResult = await claimReq.claimToken()

                        log("claim result",claimResult.success)

                        claimUI.setClaimUIConfig( h.claimUIConfig )

                        
                        this.claimTokenReady = true
                        //giving it to giftbox when claiming now
                        this.claimTokenResult = claimResult

                        if(this.claimUI.claimInformedPending){
                            this.claimUI.claimInformedPending = false
                            this.showClaimPrompt()
                        }
                    }
                })
            } 
            this.redeembar.width = 30 + (Math.min(this.redeemed,this.total) * this.increments)
            this.updateDisplayAmount()
        //}
    }

    updateUIHasItemAlready() {
        //throw new Error('Method not implemented.')
    }
    
}
