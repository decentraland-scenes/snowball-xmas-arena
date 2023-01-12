//import { TutorialModal } from "src/carousel"
//import { TutorialModal } from "src/claiming-dropin//carousel"
import { dispenserInstRecord, dispenserRefIdInstRecord, TRANSPARENT_MATERIAL } from "src/claiming-dropin/claiming/claimResources"
//import { RESOURCES } from "src/claiming-dropin/resources"
import { Dispenser } from "../booth/dispenser"
import { checkIfPlayerHasAnyWearableByUrn, ClaimTokenRequest, ClaimTokenResult, ClaimUI, HandleClaimTokenCallbacks } from "../claiming/loot"
import { ClaimConfig,  WearableEnum, WearableEnumInst } from "../claiming/loot-config"
import { ChainId, ClaimCodes, ClaimDataInst, ClaimState, ClaimUIConfig, ClaimUiType, DispenserPos, ItemData } from "./claimTypes"
import { CampaignSchedule } from "./schedule/claimSchedule"
import { CONFIG } from "src/config"
import { customResolveSourceImageSize, testForPortableXP, testForWearable } from "./utils"
import { sharedClaimBgTexture } from "src/claiming-dropin/claiming/claimResources"


/*
doki
mastercard
dcl_wearables - metaverse_pride_2021
thalia
original_penguin  
gm_studios
teleperformance
*/



const boxShape = new BoxShape()
boxShape.isPointerBlocker = true
boxShape.withCollisions = false
 
const dispHeight = .5
const dispZ = 45.5
/*
const tutorialPrompt = new TutorialModal()
tutorialPrompt.init()
tutorialPrompt.hide()*/

function openTutorialPrompt(){
    //tutorialPrompt.show()
}
 
//MOVED TO src/config.ts
/*
const dispenserPositions:DispenserPos[] = [
    {    
        name:"dcl_artweek_px", //clickable object
        model: 'boxshape' ,  //put model path when we have one 
        claimConfig: ClaimConfig.campaign.dcl_artweek_px,
        claimData:{claimServer: ClaimConfig.rewardsServer , campaign:ClaimConfig.campaign.dcl_artweek_px.campaign,campaign_key:ClaimConfig.campaign.dcl_artweek_px.campaignKeys.key1},
        dispenserUI:{
            boothModel:'models/poap/POAP_dispenser.glb',boothModelButton:'models/poap/POAP_button.glb'
            ,hoverText:"Claim Audio Guide" }, 
        wearableUrnsToCheck: ClaimConfig.campaign.dcl_artweek_px.wearableUrnsToCheck,
        claimUIConfig: {bgTexture:teleperformanceBG,claimServer:ClaimConfig.rewardsServer,resolveSourceImageSize:customResolveSourceImageSize},
        transform: {position: new Vector3(14.95+.2,2.3,dispZ-.2),scale:new Vector3(1.2,1.2,1.2)  ,rotation:Quaternion.Euler(0,135,0) }
    }, 
    {   
        name:"dcl_artweek", //clickable object
        model: 'dispenser' ,  //put model path when we have one
        claimConfig: ClaimConfig.campaign.dcl_artweek,
        claimData:{claimServer: ClaimConfig.rewardsServer , campaign:ClaimConfig.campaign.dcl_artweek.campaign,campaign_key:ClaimConfig.campaign.dcl_artweek.campaignKeys.key1},
        dispenserUI:{
            boothModel:'models/poap/Wearable_Dispenser_WelcomeArea.glb',boothModelButton:'models/poap/Wearable_Button_WelcomeArea.glb'
            ,hoverText:"Claim Wearable" }, 
        wearableUrnsToCheck: ClaimConfig.campaign.dcl_artweek.wearableUrnsToCheck,
        claimUIConfig: {bgTexture:teleperformanceBG,claimServer:ClaimConfig.rewardsServer,resolveSourceImageSize:customResolveSourceImageSize},
        transform: {position: new Vector3(49.3,dispHeight,dispZ) ,rotation:Quaternion.Euler(0,225,0) }
    }, 
] */

  

const claimCallbacks:HandleClaimTokenCallbacks = {
    onOpenUI:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on open",type,claimResult)
    },
    
    onAcknowledge:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on ack",type,claimResult)
        if(claimResult && claimResult.success){
            const data: ItemData = claimResult.json.data[0]

            if(
                testForPortableXP(data)
                || (CONFIG.CLAIM_TESTING_ENABLED && testForWearable(data,WearableEnum.PANTS_ADDRESS))
                ){
                openTutorialPrompt()
            }
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

function storeInst(inst:ClaimDataInst){
    dispenserInstRecord[inst.dispData.name] = inst
    if(dispenserRefIdInstRecord[inst.dispData.claimConfig.refId] === undefined){
        dispenserRefIdInstRecord[inst.dispData.claimConfig.refId] = []
    }
    dispenserRefIdInstRecord[inst.dispData.claimConfig.refId].push(inst)
}


function makeImage(urn: string): string {
    let retVal = "" 
    //if(play5games !== undefined && play5games.claimConfig.wearableUrnsToCheck.length > 0){
    //  let urn = play5games.claimConfig.wearableUrnsToCheck[0]
      retVal = "https://peer-lb.decentraland.org/lambdas/collections/contents/"+urn+"/thumbnail"
    //}
    log("makeImage",retVal)
    return retVal
  }

function createDummyResponse(wearable:WearableEnumInst):any{
    return {
        ok:true,
        data:[{
            id: "",
            user: "",
            campaign_id: "",
            status: ClaimState.SUCCESS,
            transaction_hash: "",
            transaction_id: "",
            token: wearable.name,
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
            image: makeImage(wearable.urn),
            chain_id: ChainId.ETHEREUM_MAINNET
            }
        ]
    }
}


export function createDispeners(dispenserPositions:DispenserPos[],dispenserSchedule?:CampaignSchedule){
    const METHOD_NAME = "createDispeners"
    log(METHOD_NAME,"ENTRY",dispenserPositions)
    let lastClaimResult:ClaimTokenResult
    
    if(CONFIG.CLAIM_TESTING_ENABLED){
        const claimUIConfig:ClaimUIConfig = {bgTexture:sharedClaimBgTexture,claimServer:ClaimConfig.rewardsServer,resolveSourceImageSize:customResolveSourceImageSize}
        const claimUIDefault = new ClaimUI( claimUIConfig )
      
        
        //help with message, know if out of stock or wait till next day
        claimUIDefault.campaignSchedule = dispenserSchedule

        const claimUI = claimUIDefault

        const outOfStockObjTest = new Entity("out-of-stock-test")
        engine.addEntity(outOfStockObjTest)
        outOfStockObjTest.addComponent(new Transform({position:new Vector3(1,3,1)}))
        outOfStockObjTest.addComponent(new BoxShape())
        outOfStockObjTest.addComponent(new OnPointerDown( async ()=>{
                    if(claimUI && claimUI.lastUI && claimUI.lastUI.background.visible){
                        log("prevent clicking till modal closed claim")    
                        return;
                    }
                    log("doing ",outOfStockObjTest.name)
                    //show example of working directly with ClaimTokenRequest 

                    const testClaimTokenResult:ClaimTokenResult= new ClaimTokenResult()
                    testClaimTokenResult.claimCode=ClaimCodes.CLAIM_IN_PROGRESS,
                    testClaimTokenResult.json= createDummyResponse( WearableEnum.PLAY_GAMES ),
                    testClaimTokenResult.success= true,
                    testClaimTokenResult.exception= undefined

                    claimUI.handleClaimJson(testClaimTokenResult)
                    
                    claimUI.openOutOfStockPrompt(new ClaimTokenResult(),claimCallbacks)
                    
                    claimUI.nothingHere()
                    claimUI.openYouHaveAlready()
                    claimUI.openClaimInProgress()
                    claimUI.openRequiresWeb3(new ClaimTokenResult(),claimCallbacks)
                    claimUI.openNotOnMap(new ClaimTokenResult(),claimCallbacks)

                },{hoverText: "test all claim UIs"})
            )
            /*
                        const tutorialTest = new Entity("tutorial-test")
                    engine.addEntity(tutorialTest)
                    tutorialTest.addComponent(new Transform({position:new Vector3(4,1,15)}))
                    tutorialTest.addComponent(new BoxShape())
                    tutorialTest.addComponent(new OnPointerDown( async ()=>{
                                if(claimUI && claimUI.lastUI && claimUI.lastUI.background.visible){
                                    log("prevent clicking till modal closed claim")    
                                    return;
                                }
                                log("doing ",tutorialTest.name)
                                //show example of working directly with ClaimTokenRequest 

                                openTutorialPrompt()
                            },{hoverText: "tutorial-test"})
                        )
            */

    }
    
    //TODO MUST PLACE OR MAKE CLICKABLE THE gm_studios object

    //const dispenserPositions = CONFIG.DISPENSER_POSITIONS
     
    for(const p  in dispenserPositions){
        const h = dispenserPositions[p]
        
        if(CONFIG.CLAIM_TESTING_ENABLED){
            h.dispenserUI.hoverText += " ("+h.name+")"
        }

        if(h.transform.position.x < 0){
            log(METHOD_NAME,"skipping creating since positions are negative",h)
            continue
        }
        
        //START BOOTHS
 
        if(h.model == "dispenser"){
            const booth = new Dispenser(
            h.name,
            h.transform,
            h.claimData,
            h.dispenserUI,
            h.wearableUrnsToCheck,
            h.claimUIConfig//_Background_Dispenser
            ,h.claimConfig
            ) 

            //help with message, know if out of stock or wait till next day
            booth.claimUI.campaignSchedule = dispenserSchedule

            storeInst({ dispData:h,entity:booth })
        }else if(h.model == "parachute"){  
            log(METHOD_NAME,"MODEL TYPE IS parachute crate not creating now")
        }else{

            const claimUI = new ClaimUI(h.claimUIConfig,h.claimConfig)
            //help with message, know if out of stock or wait till next day
            claimUI.campaignSchedule = dispenserSchedule
     
            const objectDispenser = new Entity(h.name)
            engine.addEntity(objectDispenser)

            storeInst( { dispData:h,entity:objectDispenser })

            objectDispenser.addComponent(new Transform( h.transform ))
            if(h.model == "boxshape"){
                objectDispenser.addComponent(new BoxShape())
            }else if( h.model instanceof GLTFShape  ){
                log("adding cliamable",h.name,h.model.src)
                objectDispenser.addComponent(h.model)   
            }else if( h.model instanceof Shape  ){
                log("adding cliamable",h.name)
                objectDispenser.addComponent(h.model)   
            }else{
                objectDispenser.addComponent(new GLTFShape(h.model))
            }
            //objectDispenser.addComponent(TRANSPARENT_MATERIAL)
            objectDispenser.addComponent(new OnPointerDown( async ()=>{
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
                            
                            claimUI.openYouHaveAlready(claimResult,claimCallbacks)
                        }else{
                            const claimReq = new ClaimTokenRequest( h.claimData )
                    
                            const claimResult = await claimReq.claimToken()

                            log("claim result",claimResult.success)

                            claimUI.setClaimUIConfig( h.claimUIConfig )

                            claimUI.handleClaimJson( claimResult, claimCallbacks )
                        }
                    },{hoverText: h.dispenserUI.hoverText})  
                )

        }


        //END BOOTHS
    }
}

