import * as ui from '@dcl/ui-scene-utils'
import { DispenserPos } from 'src/claiming-dropin/claiming/claimTypes';
import { ClaimConfig } from 'src/claiming-dropin/claiming/loot-config';
import { CONFIG } from 'src/config';
import resources, { setSection } from 'src/dcl-scene-ui-workaround/resources';
import { GetPlayerCombinedInfoResult, GetPlayerCombinedInfoResultPayload, StatisticValue } from 'src/playfab_sdk/playfab.types';
import { CommonResources } from 'src/resources/common';
import { GAME_STATE } from 'src/state';
import { IRewardsPrompt, RewardType } from 'src/types/types';
import { getDispenerConfigById } from './claiming/claimSetup';
import { RewardItemContainer } from './rewardItemContainer';

const customAtlasTexture = CommonResources.RESOURCES.textures.customAtlas.texture
let uiAtlasTexture = CommonResources.RESOURCES.textures.gameAtlas.texture//new Texture('textures/Atlases/atlas_v5.png')
let uiAtlasDialogueTexture = CommonResources.RESOURCES.textures.customAtlas.texture

const XMAS_DAYS_PLAYED = "rewards.xmas2022.daysPlayed"

export class RewardsPrompt implements IRewardsPrompt{
  

  container:UIContainerRect

  items:any ={}
  itemList:RewardItemContainer[]

  constructor(){

    const base = 0
    const rowHeight = -85
    let counter = 0
 
    this.container = new UIContainerRect(ui.canvas)
    this.container.width = 400
    this.container.height = 500 + Math.abs(rowHeight)
    this.container.positionX = -39
    this.container.positionY = -27 + Math.abs(rowHeight)/2
    this.container.hAlign = "center"
    this.container.vAlign = "center"
    this.container.visible = false

    let background = new UIImage(this.container, uiAtlasDialogueTexture)
    background.height = 464 + Math.abs(rowHeight)
    background.width = 519
    background.sourceHeight = 351
    background.sourceWidth = 416
    background.sourceLeft = 501.5
    background.sourceTop = 12
    background.hAlign = "center"
    background.vAlign = "center"
    background.positionX = -19.5
    background.positionY = 38


    let x = new UIImage(this.container, CommonResources.RESOURCES.textures.closeMenuIconButton.texture)
    setSection(x,CommonResources.RESOURCES.textures.closeMenuIconButton.size)
    x.width = 43
    x.height = 43
    x.vAlign = "top"
    x.hAlign = "right"
    x.positionY = 32
    x.positionX = 117
    x.onClick = new OnPointerDown(()=>{{
      this.hide()
    }})


    const gotItWidth = 150
    let okButton = new UIImage(this.container, CommonResources.RESOURCES.textures.customAtlas.texture)
    setSection(okButton,resources.buttons.buttonE)
    /*gotIt.sourceTop = 2440
    gotIt.sourceLeft =  1010
    gotIt.sourceWidth = 550 
    gotIt.sourceHeight = 170 */

    let okText = new UIText(okButton)
    okText.isPointerBlocker = false
    okText.value = "OK"
    okText.vAlign = "center"
    okText.hAlign = "center"
    okText.vTextAlign= "center"
    okText.hTextAlign = "center"
    okText.fontSize = 20
    okText.positionX = 0

    okButton.width = 150
    okButton.height = 43
    okButton.vAlign = "top"
    okButton.hAlign = "right"
    okButton.positionY = base+(rowHeight*6)
    okButton.positionX = -1 * gotItWidth/2
    okButton.onClick = new OnPointerDown(()=>{{
      this.hide()
    }}) 
    

    const play5games:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.PLAY_GAMES.refId)
    const winningTeam:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.WINNING_TEAM.refId)
    const winningTeamRed:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.WINNING_TEAM_RED.refId)
    const winningTeamBlue:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.WINNING_TEAM_BLUE.refId)
    const rankTop3:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.RANK_TOP3.refId)
    const rankFirst:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.RANK1.refId)
    
    const playDays:DispenserPos = getDispenerConfigById(ClaimConfig.campaign.PLAY_DAYS.refId)

    //log("RewardsPrompt","constructor","DISPENSER_POSITIONS",CONFIG.DISPENSER_POSITIONS,"play5games",play5games)

    const prefix = "rwd_"+"xmas22_"
    const postfix = "_epoch"
    this.items.play = new RewardItemContainer(this.container, base+(rowHeight*counter++), 3, "Play at least 3 games", makeImage(play5games),prefix+"games"+postfix, play5games)
    //this.items.team = new RewardItemContainer(this.container, base+(rowHeight*counter++), 1, "Be On The Winning Team", makeImage(winningTeam),prefix+"team_wins"+postfix,winningTeam)
    this.items.play3DiffDays = new RewardItemContainer(this.container, base+(rowHeight*counter++), 3, "Play 3 Different Days", makeImage(playDays),prefix+"play_3_diff_days"+postfix,playDays)
    this.items.play3DiffDays.customGetCount = ()=>{
      log("getCount customized ",this.items.play3DiffDays.stat)
      //debugger
      //workaround, read user data
      let daysPlayed = []
      if(GAME_STATE.playerState.playFabUserInfo !== undefined){
        const resultsUserReadOnlyData = GAME_STATE.playerState.playFabUserInfo.UserReadOnlyData
        for(const p in resultsUserReadOnlyData){
          const rec = resultsUserReadOnlyData[p]
          log("RewardsPrompt" ,"resultsUserReadOnlyData ","p",p,"rec",rec);
          if(p === XMAS_DAYS_PLAYED && rec.Value !== undefined){
            daysPlayed = JSON.parse(rec.Value)
          }
        }
      } 
      log("getCount customized ",this.items.play3DiffDays.stat,"daysPlayed",daysPlayed)
      return daysPlayed.length
    }
    this.items.winRed = new RewardItemContainer(this.container, base+(rowHeight*counter++), 5, "Win With Red Team", makeImage(winningTeamRed),prefix+"team_wins_red"+postfix,winningTeamRed)
    this.items.winBlue = new RewardItemContainer(this.container, base+(rowHeight*counter++), 5, "Win With Blue Team", makeImage(winningTeamBlue),prefix+"team_wins_blue"+postfix,winningTeamBlue)
    this.items.top3 = new RewardItemContainer(this.container, base+(rowHeight*counter++), 1, "Rank Top 3",makeImage(rankTop3),prefix+"rank_top_3"+postfix,rankTop3)
    this.items.top1 = new RewardItemContainer(this.container, base+(rowHeight*counter++), 1, "Rank 1st", makeImage(rankFirst),prefix+"rank_1"+postfix,rankFirst)
    //this.items.ratio = new RewardItemContainer(this.container, -345, 10, "Hit Ratio Above 25%", makeImage(hitRatio),prefix+"hit_ratio_above_25"+postfix,hitRatio)
     
    this.itemList = [this.items.play,this.items.play3DiffDays,this.items.winRed,this.items.winBlue,this.items.top3,this.items.top1,this.items.ratio]
  } 

  show(){
    this.container.visible = true
  }

  hide(){
    this.container.visible = false
  }

  setReward(reward:RewardType, amount:number){
    this.items[reward].setReward(amount)
  }

  updateReward(reward:RewardType){
    this.items[reward].incrementReward()
  }
  updateRewards(playerFabUserInfo: GetPlayerCombinedInfoResultPayload) {
    
    const METHOD_NAME = "updateRewards"
    log(METHOD_NAME,"ENTRY",playerFabUserInfo)
    if(playerFabUserInfo === undefined){
      log(METHOD_NAME,"playerFabUserInfo is undefined, skipping",playerFabUserInfo)
      return
    }
    let debugPlayerInfo = "??"
    
    if(playerFabUserInfo !== undefined){
       if( playerFabUserInfo.PlayerProfile !== undefined ) {
        debugPlayerInfo = playerFabUserInfo.PlayerProfile.PlayerId + " " + playerFabUserInfo.PlayerProfile.DisplayName
       } else if( playerFabUserInfo.AccountInfo !== undefined && playerFabUserInfo.AccountInfo.TitleInfo !== undefined ) {
        debugPlayerInfo = playerFabUserInfo.AccountInfo.PlayFabId + " " + playerFabUserInfo.AccountInfo.TitleInfo.DisplayName
       }
    }

    //val:GetPlayerCombinedInfoResult
    for(const p in this.itemList){
      const itm = this.itemList[p]
      if(itm === undefined){
        log(METHOD_NAME,p,"was null skipping",itm)
        continue
      }
      let amount = 0
      //find
      let playerStatics = playerFabUserInfo.PlayerStatistics;
      let playerStat:StatisticValue
      if (playerStatics && playerStatics.length > 0) {
        for (const p in playerStatics) {
          const stat: StatisticValue = playerStatics[p];
          //log("stat ", stat,itm.stat);
          if (
            stat.StatisticName == itm.stat
          ) {
            playerStat = stat;
          }
        }
      }else{
        log(METHOD_NAME,"no player stats",debugPlayerInfo,itm.stat,playerStat)
      }
      log(METHOD_NAME,"found player stat",debugPlayerInfo,itm.stat,playerStat)

      
      if(itm.customGetCount !== undefined){
        
        amount = itm.customGetCount()
        log(METHOD_NAME,"using customGetCount",debugPlayerInfo,itm.stat,playerStat,"customGetCount",amount)
      }else if(playerStat !== undefined){
        log(METHOD_NAME,"using playerStat",debugPlayerInfo,itm.stat,playerStat)
        amount = playerStat.Value
      }
 
      itm.setReward( amount )
    }
  }
}

function makeImage(play5games: DispenserPos): string {
  let retVal = "" 
  if(play5games !== undefined && play5games.claimConfig.wearableUrnsToCheck.length > 0){
    let urn = play5games.claimConfig.wearableUrnsToCheck[0]
    retVal = "https://peer-lb.decentraland.org/lambdas/collections/contents/"+urn+"/thumbnail"
  }
  log("makeImage",retVal)
  return retVal
}
