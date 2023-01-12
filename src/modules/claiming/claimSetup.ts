import { CONFIG, initConfig } from "src/config"

import { sharedClaimBgTexture } from "src/claiming-dropin/claiming/claimResources"
import { createDispeners } from "src/claiming-dropin/claiming/dispensers"
import { ClaimConfig, initClaimConfig } from "src/claiming-dropin/claiming/loot-config"
import { campaignData, initCampaignData, initDispenserScheduler, startDispenserScheduler } from "src/claiming-dropin/claiming/schedule/scheduleSetup"
import { customResolveSourceImageSize, lookUpDispenserDefByRefId } from "src/claiming-dropin/claiming/utils"
import { DispenserPos } from "src/claiming-dropin/claiming/claimTypes"

 
initConfig()

//SETUP DISPENERS AND SCHEDULE

//make changes/add more if you want here, otherwise will use what is in there
//MAKE SURE YOUR KEY IS IN THERE
function extendCampaignData(){ 
  
  //fetch or otherwise modify if needed here
   

}
 
export function initDispenserPositions(){
  const METHOD_NAME ="initDispenserPositions"

  const camps = [ClaimConfig.campaign.PLAY_GAMES,
    ClaimConfig.campaign.WINNING_TEAM,
    ClaimConfig.campaign.WINNING_TEAM_RED,
    ClaimConfig.campaign.WINNING_TEAM_BLUE,
    ClaimConfig.campaign.RANK_TOP3,
    ClaimConfig.campaign.RANK1,
    ClaimConfig.campaign.HIT_RATIO,
    ClaimConfig.campaign.PLAY_DAYS,
  ]
  
  for(const p in camps){
    const dispId = camps[p]// as any//getDispenerConfigById(camps[p])
    if(dispId === undefined){
      log(METHOD_NAME,"could not find",camps[p],dispId)
      continue
    }
    //log(METHOD_NAME,"found",camps[p],dispId)
    CONFIG.DISPENSER_POSITIONS.push(
      {    
        //name to match campaign ref if you want scheduler to work
        name: dispId.refId, //clickable object
        model: 'boxshape' ,  //put model path when we have one 
        claimConfig: dispId,
        claimData:{claimServer: ClaimConfig.rewardsServer , campaign:dispId.campaign,campaign_key:dispId.campaignKeys.key1},
        dispenserUI:{
            boothModel:'src/claiming-dropin/models/poap/POAP_dispenser.glb',boothModelButton:'src/claiming-dropin/models/poap/POAP_button.glb'
            ,hoverText:"Claim" }, 
        wearableUrnsToCheck: dispId.wearableUrnsToCheck,
        claimUIConfig: {bgTexture:sharedClaimBgTexture,claimServer:ClaimConfig.rewardsServer,resolveSourceImageSize:customResolveSourceImageSize},
        transform: {position: new Vector3(-2,-1,-1),scale:new Vector3(1.2,1.2,1.2)  ,rotation:Quaternion.Euler(0,135,0) 
      }
    })  
  }
  
  
}

export function getDispenerConfigById(id:string){
  const METHOD_NAME = "getDispenerConfigById"
  let retVal:DispenserPos|undefined = lookUpDispenserDefByRefId(id,CONFIG.DISPENSER_POSITIONS)
  log(METHOD_NAME,"for id",id,"returning",retVal)
  return retVal
}

export function initSceneClaiming(){

  initClaimConfig()
  initCampaignData() 
  extendCampaignData()
  const dispenserScheduler = initDispenserScheduler()
  createDispeners(CONFIG.DISPENSER_POSITIONS, dispenserScheduler.campaignSchedule)
  startDispenserScheduler()

}
