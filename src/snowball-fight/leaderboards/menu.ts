
import { CommonResources } from "src/resources/common";
import { MenuButton, NumberCallback } from "./button";
import { LevelMenuItem } from "./menuItem";
import { VerticalScrollMenu } from "./verticalScrollMenu";

import { CONFIG } from "src/config";
import { GetLeaderboardResult, GetPlayerCombinedInfoResultPayload, StatisticValue } from "src/playfab_sdk/playfab.types";
import * as PlayFabSDK from 'src/playfab_sdk/index';
import { GAME_STATE } from "src/state";
//import { Game_2DUI } from "src/ui/index";


let leaderboardShape = new GLTFShape('models/menu/menu_bg.glb')

let playerNameAvailable = false

export class Leaderboard {
  
  defaultWidth:number = 8
  leaderScale:number = 1.475
  aspectRatio:number = 4/6
  paddingPercent:number = 0.75
  listPaddingLeft:number = 1.9  
  scorePaddingLeft:number = 6.6
  leaderBoardWidth:number = this.defaultWidth * this.paddingPercent * this.leaderScale
  leaderBoardHeight:number = this.leaderBoardWidth * this.aspectRatio
  leaderBoardPadding:number = 0.5
  leaderFontSize:number = 10
  topFontSize:number = 11
  rowHeight:number = this.leaderBoardHeight/10
  textZ:number = -0.17
  tabPaddingLeft:number = 0
  tabButtonSpacing:number = -0.75
  leaderboardRoot:Entity
  leaderboard:Entity
  leaderboardBG:Entity
  weeklyButton:MenuButton
  allTimeButton:MenuButton
  levelButtons:MenuButton[]
  tabButtons:MenuButton[] = []
  topTenUsers:Entity[] = []
  currentUser:Entity
  currentUserScore:Entity
  topTenScores:Entity[] = []
  topTenRankNumbers:Entity[] = []
  titleEntry:Entity
  subTitleEntry:Entity
  levelsMenuRoot:Entity
  levelsMenu:VerticalScrollMenu
  type:LeaderBoardItmConstants
  title:string
    
  constructor(parent:Entity,title:string,type:LeaderBoardItmConstants,position: Vector3, rotation: Quaternion, scaleInit:number){

    this.type = type
    this.title = title
    this.leaderScale = scaleInit    
    this.aspectRatio = 4/6
    this.paddingPercent  = 0.5
    this.leaderBoardWidth = this.defaultWidth * this.paddingPercent * this.leaderScale
    this.leaderBoardHeight = this.leaderBoardWidth * this.aspectRatio
    this.leaderBoardPadding = 0.5
    this.leaderFontSize = Math.floor(2.5 * scaleInit)
    this.topFontSize = 3 * scaleInit
    this.rowHeight = 0.4
    this.textZ = -0.17

    this.levelButtons = []
    
    this.leaderboardRoot = new Entity()
    this.leaderboardRoot.setParent(parent)
    this.leaderboardRoot.addComponent (new Transform({
      position: new Vector3 (position.x, position.y, position.z),
      rotation: rotation  
    }))


    this.leaderboard = new Entity()
    this.leaderboard.addComponent (new Transform({
      position: new Vector3 (- this.leaderBoardWidth/2, this.leaderBoardHeight/2, 0),
      rotation: Quaternion.Euler(0,0,0),
      

    }))
    this.leaderboard.setParent(this.leaderboardRoot)

    this.leaderboardBG = new Entity()
    this.leaderboardBG.addComponent (new Transform({
      position: new Vector3(0, 0, 0), 
      scale: new Vector3(this.leaderScale, this.leaderScale, 1)}))
      this.leaderboardBG.addComponent(leaderboardShape)
      this.leaderboardBG.setParent(this.leaderboardRoot)

 


    let titleEntry = this.titleEntry = new Entity()
    this.titleEntry.addComponent (new Transform({
      //position: new Vector3(0, 3, this.textZ  -0.05), 
      position: new Vector3(-1, 3, this.textZ  -0.05), 
      scale: new Vector3(this.leaderScale, this.leaderScale, 1)}))
    this.titleEntry.setParent(this.leaderboardRoot)

    let titeTextShape = new TextShape("-")
  
    let fontSize = this.leaderFontSize

    titeTextShape.fontSize = fontSize
    titeTextShape.hTextAlign = 'left'
    titeTextShape.vTextAlign = 'top'
    titeTextShape.value = title

    titleEntry.addComponent(titeTextShape)  

    

    let subTitleEntry = this.subTitleEntry = new Entity()
    this.subTitleEntry.addComponent (new Transform({
      //position: new Vector3(0, 3, this.textZ  -0.05), 
      position: new Vector3(0, 2.32, this.textZ  -0.05), 
      scale: new Vector3(this.leaderScale, this.leaderScale, 1)}))
    this.subTitleEntry.setParent(this.leaderboardRoot)

    let subtiteTextShape = new TextShape("-")
  
    //let fontSize = this.leaderFontSize

    subtiteTextShape.fontSize = fontSize
    subtiteTextShape.hTextAlign = 'left'
    subtiteTextShape.vTextAlign = 'top'
    subtiteTextShape.value = ""

    subTitleEntry.addComponent(subtiteTextShape)  

    const usersToShow = type === LeaderBoardItmConstants.MEGA_MENU_TEAM ? 2 : 8
      for(let i=0; i<usersToShow; i++){
        this.addPlayerEntry()
      }

    const currentUserArr = this.addPlayerEntry(false)
    
    currentUserArr[2].getComponent(TextShape).value = '' //remove rank for current player value/score
    this.currentUser = currentUserArr[0] 
    this.currentUserScore = currentUserArr[1]
    
    // Buttons for leaderboard  Level switching  

    //  this.weeklyButton = new MenuButton("Tournament\nWeek", new Vector3(-this.leaderBoardWidth/2/this.leaderScale + this.tabPaddingLeft, this.leaderBoardHeight/2/this.leaderScale +0.3,0), Materials.UIYellownMaterial, this.OnWeeklyTabPress, 60)  
   // this.allTimeButton = new MenuButton("All Time", new Vector3(-this.leaderBoardWidth/2/this.leaderScale + this.tabPaddingLeft ,this.leaderBoardHeight/2/this.leaderScale -0.7,0), Materials.UIDarkGraynMaterial, this.OnAllTimeTabPress, 60)  
      
    //this.addLevelButton("Track 01", Materials.UIYellownMaterial, this.TriggerLevelButton)
   //this.addLevelButton("Track 02", Materials.UIDarkGraynMaterial, this.TriggerLevelButton)

    this.spawnLeaderboard() 
    
    let _transform:TranformConstructorArgs = {
      position: new Vector3(-2.5,1.5,-0.17),
      
    }

    this.levelsMenuRoot = new Entity(); 
    const collectionsMenu = this.levelsMenu = new VerticalScrollMenu(
      {
          position: new Vector3(0, 0, 0),
          scale: new Vector3(2, 2, 2),
      },
      0.4,
      6,//  5  
      "Top " + usersToShow
      );
      this.levelsMenuRoot.addComponent(
        new Transform({
            position: _transform.position,
            rotation: _transform.rotation,
            scale: _transform.scale,
        })
    );
    collectionsMenu.setParent(this.levelsMenuRoot);  
    this.levelsMenuRoot.setParent(this.leaderboardRoot)
    //engine.addEntity(this.levelsMenuRoot);
    /*
    for(let i=0; i< 1; i++){
      this.addMenuItem(new LevelMenuItem(
      {
        scale: new Vector3(1, 1, 1),
      },
      resource.roundedSquareAlpha,
      ("Track " + i),     
      ()=>{ log("levelManager.clicked default track")}
          
    ))
    }*/
      
  }//end constructor  

  addMenuItem(menuItem:LevelMenuItem){
    this.levelsMenu.addMenuItem( menuItem )
  }
  getSelectedMenuItem(){
    for(let itm of this.levelsMenu.items){
      if(itm.selected){
        return itm;
      }
    }
  }
  addPlayerEntry(addToGrid?:boolean){
      const i = this.topTenUsers.length
      //log("addPlayerEntry",i,this.type)
    //for(let i=0; i<10; i++){
      let userEntry = new Entity()
      let scoreEntry = new Entity()
      let rankNumber = new Entity()
      let userText = new TextShape("-")
      let scoreText = new TextShape("0")
      let rankNumberText = new TextShape((i+1) + ".")
    
      let fontSize = this.leaderFontSize

      if(i == 0){
        fontSize = this.topFontSize
      }else{
        fontSize = this.leaderFontSize
      }

      userText.fontSize = fontSize
      userText.hTextAlign = 'left'
      userText.vTextAlign = 'top'
    
      scoreText.fontSize = fontSize 
      scoreText.hTextAlign = 'right'  
      scoreText.vTextAlign = 'top'
    
      rankNumberText.fontSize = fontSize
      rankNumberText.hTextAlign = 'right'
      rankNumberText.vTextAlign = 'top'
      
    
      userEntry.addComponent(new Transform())  
      userEntry.addComponent(userText)  
    
      scoreEntry.addComponent(new Transform())  
      scoreEntry.addComponent(scoreText)
    
      rankNumber.addComponent(new Transform())  
      rankNumber.addComponent(rankNumberText)
    
      userEntry.setParent(this.leaderboard)
      scoreEntry.setParent(this.leaderboard)
      rankNumber.setParent(this.leaderboard)
      
      if(addToGrid === undefined || addToGrid){
        this.topTenUsers.push(userEntry)
        this.topTenScores.push(scoreEntry)
        this.topTenRankNumbers.push(rankNumber)
      }
    //} 
    return [userEntry,scoreEntry,rankNumber]
  }
  addLevelButton(title:string, mat:Material, callback:NumberCallback){

    let button = new MenuButton(
        title, 
        new Vector3(
            -this.leaderBoardWidth/2/this.leaderScale + this.tabPaddingLeft, 
            this.leaderBoardHeight/2/this.leaderScale + this.levelButtons.length * this.tabButtonSpacing,
            -0.2), 
        mat, 
        callback,
        this.levelButtons.length,
        60)  
    this.levelButtons.push(button)
    button.setButtonParent(this.leaderboardBG)    
    
  }

  TriggerLevelButton(id:number):number{

    return id
  }
  OnWeeklyTabPress(){    
   //getTopTenFromPlayFab("WeeklyHighscore")
  }

  OnAllTimeTabPress(){   
    //getTopTenFromPlayFab("SingleRoundScore")
  }

  spawnLeaderboard(){  
  
    engine.addEntity(this.leaderboardRoot)
  
    let shift = 0

    
    let i = 0
    for(i = 0; i< this.topTenRankNumbers.length; i++){

      if(i >=1 ){
        shift =  this.rowHeight * 0.1 * 1
      }else{
        shift = 0
      }
      this.topTenRankNumbers[i].getComponent(Transform).position =   new Vector3( this.listPaddingLeft, -shift - i * this.rowHeight, this.textZ)
      this.topTenUsers[i].getComponent(Transform).position =   new Vector3(this.listPaddingLeft + 0.15, -shift - i * this.rowHeight, this.textZ)
      this.topTenScores[i].getComponent(Transform).position =  new Vector3( this.scorePaddingLeft, -shift- i * this.rowHeight, this.textZ)
      this.topTenUsers[i].getComponent(TextShape).value =  ("-" )
  
      engine.addEntity(this.topTenUsers[i])
      engine.addEntity(this.topTenScores[i])    
      engine.addEntity(this.topTenRankNumbers[i])    
    } 

    i++
    if(i >=1 ){
      shift =  this.rowHeight * 0.1 * 1
    }else{
      shift = 0
    }

    //this.currentUser.getComponent(Transform).position =   new Vector3( this.listPaddingLeft, -shift - i * this.rowHeight, this.textZ)
    this.currentUser.getComponent(Transform).position =   new Vector3(this.listPaddingLeft + 0.15, -shift - i * this.rowHeight, this.textZ)
    this.currentUserScore.getComponent(Transform).position =  new Vector3( this.scorePaddingLeft, -shift- i * this.rowHeight, this.textZ)

    engine.addEntity(this.currentUser)
    engine.addEntity(this.currentUserScore)
    
    
  }

  updateUserHighlight(){
  
    // for(let i=0; i< 10; i++){
    //  // log("checking: " + this.topTenUsers[i].getComponent(TextShape).value)
    //   if(this.topTenUsers[i].getComponent(TextShape).value == player.playername && player.playername != '_0'){        
    //     this.topTenUsers[i].getComponent(TextShape).color = Color3.Yellow()
    //     this.topTenScores[i].getComponent(TextShape).color = Color3.Yellow()
    //     this.topTenRankNumbers[i].getComponent(TextShape).color = Color3.Yellow()       
        
  
    //   } else{
    //     this.topTenUsers[i].getComponent(TextShape).color = Color3.White()
    //     this.topTenScores[i].getComponent(TextShape).color = Color3.White()
    //     this.topTenRankNumbers[i].getComponent(TextShape).color = Color3.White()              
    //   }      
    // }
    
  }
  clearRows() {
    for ( let j = 0; j < this.topTenUsers.length; j++){      
      this.updateRow(j,"","")
    }
  }
  hideRows(){
    for ( let j = 0; j < this.topTenUsers.length; j++){      
      this.setRowVisible(j,false)
    }
    this.setCurrentPlayerStatVisible(false)
  }
  updateAllRows(name:string, score:string){
    for(let i = 0; i< this.topTenRankNumbers.length; i++){
      this.updateRow(i,name,score)
    }
  }
  setRowVisible(index:number,val:boolean){
    this.topTenRankNumbers[index].getComponent(TextShape).visible = val
    this.topTenUsers[index].getComponent(TextShape).visible = val
    this.topTenScores[index].getComponent(TextShape).visible = val
  }
  updateRow(index:number, name:string, score:string){
    if(index >= 0 && index < this.topTenUsers.length){
      this.topTenUsers[index].getComponent(TextShape).value = name
      this.topTenScores[index].getComponent(TextShape).value = score
      this.setRowVisible(index,true)
      this.updateUserHighlight()          
    }
  }
  updateCurrentPlayerStat(name:string,score:string){
    this.setCurrentPlayerStatVisible(true)
    this.currentUser.getComponent(TextShape).value = name
    this.currentUserScore.getComponent(TextShape).value = score
  }
  setCurrentPlayerStatVisible(val:boolean){
    this.currentUser.getComponent(TextShape).visible = val
    this.currentUserScore.getComponent(TextShape).visible = val
  }
}

export type LeaderBoardItmInstType={
  type:LeaderBoardItmType
  frequency:LeaderBoardItmType
}


export type LeaderBoardItmType={
  id:string
  label:string
}

export class LeaderBoardItmConstants{
  
  id:string
  label:string
  
  static MEGA_MENU={id:"mega_menu",label:"Mega Menu"}
  static MEGA_MENU_TEAM={id:"mega_menu_team",label:"Mega Menu Team"}
  static MEGA_MENU_PLAYER={id:"mega_menu_player",label:"Mega Menu Player"}
  static MEGA_MENU_PLAYER_SCORE={id:"mega_menu_player_score",label:"Player Scores"}
  static MEGA_MENU_PLAYER_PLACED={id:"mega_menu_player_place",label:"Player Placed"}
  
  static MOST_FRAGS_IN_ONE_GAME={id:"pl_frags_best",label:"Best Score Single Game"}
  static MOST_FRAGS={id:"pl_frags",label:"High Scorer"}
  static RANK_1={id:"pl_rank_1",label:"Placed First"}
  static RANK_TOP3={id:"pl_rank_top_3",label:"Placed Top 3"}
  static GAMES_PLAYED={id:"pl_games",label:"Games Played"}
  static ON_WINNING_TEAM={id:"pl_team_wins",label:"On Winning Team"}

  static TEAM_MOST_FRAGS_IN_ONE_GAME={id:"tm_frags_best",label:"Team Best Score Single Game"}
  static TEAM_MOST_FRAGS={id:"tm_frags",label:"Team Scores"}
  static TEAM_GAMES_PLAYED={id:"tm_games",label:"Team Games Played"}
  static TEAM_GAMES_WON={id:"tm_team_wins",label:"Team Wins"}

  static FREQUENCY_HOURLY={id:"hour",label:"Hourly"}
  static FREQUENCY_DAILY={id:"day",label:"Daily"}
  static FREQUENCY_WEEKLY={id:"week",label:"Weekly"}
  static FREQUENCY_ALL_TIME={id:"epoch",label:"All Time"}

  static getById(stat: string): LeaderBoardItmConstants {
    return LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME;
  }
}

//export const LEADERBOARD_ITEM_REGISTRY:Record<string,LeaderBoardItmInstType>={}

const stats:LeaderBoardItmType[] = [
  LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME,LeaderBoardItmConstants.MOST_FRAGS
]
const statsTime:LeaderBoardItmType[] = [
  LeaderBoardItmConstants.FREQUENCY_DAILY,LeaderBoardItmConstants.FREQUENCY_WEEKLY
]
/*
for(const j in stats){
  for(const q in statsTime){
    const statPrefix = stats[j].id+"_" + statsTime[q].id
    LEADERBOARD_ITEM_REGISTRY[statPrefix] = {
      type: stats[j],frequency: statsTime[q]
    }
  }
}*/

export class LeaderBoardManager {
  static DEFAULT_STAT_POSTFIX = "totalTime_best_day"
  leaderboards:Leaderboard[] = []

  createLeaderboard(parent:Entity,title:string,type:LeaderBoardItmConstants, position:Vector3, rotation: Quaternion, scale:number):Leaderboard{

    let newLeaderboard = new Leaderboard(parent,title,type,position, rotation, scale)
    
    this.leaderboards.push(newLeaderboard)

    return newLeaderboard
  }

  addMenuItemInEveryBoard(menuItem:LevelMenuItem){
    for ( let j = 0; j< this.leaderboards.length; j++){      
      this.leaderboards[j].addMenuItem(
        new LevelMenuItem(
          {
            scale: menuItem._transform.scale ? menuItem._transform.scale.clone() : new Vector3(1, 1, 1)
          },
          CommonResources.RESOURCES.textures.roundedSquareAlpha.texture,
          menuItem.getTitle(),    
          menuItem.type,
          menuItem.updateWearablesMenu,
          menuItem.options
        )
      )
    }
  }
  updateAllUserHighlights(){  
    for ( let j = 0; j< this.leaderboards.length; j++){      
        this.leaderboards[j].updateUserHighlight()
    }
  }
  updateRowInEveryBoard(index:number, name:string, score:string){  
    for ( let j = 0; j < this.leaderboards.length; j++){      
        this.leaderboards[j].updateRow(index, name, score)
    }
  }
  clearAllBoards(){
    for ( let j = 0; j < this.leaderboards.length; j++){      
      this.leaderboards[j].clearRows()
    }
  }
  /*
  updateEveryBoardFromLeaderBoardId(leaderBoardId:string){

    var getLeaderboardArgs: PlayFabServerModels.GetLeaderboardRequest = {
      StatisticName: leaderBoardId,StartPosition: 0,MaxResultsCount: CONFIG.GAME_LEADEBOARD_MAX_RESULTS,
    }
    PlayFabSDK.GetLeaderboard( getLeaderboardArgs
    ).then( (result:GetLeaderboardResult) => {
        log("results",result)

        //zero them out first
        this.clearAllBoards()

        if(result && result.Leaderboard){
          for(let x=0;x < result.Leaderboard.length; x++){
            const itm = result.Leaderboard[x]
            this.updateRowInEveryBoard( x, itm.DisplayName,itm.StatValue.toFixed(0)  )
          }
        }
    })
  }*/
  updateBoardWithLoaderBoardId(leaderboard:Leaderboard,menuItmLabl:string,statId:string,scalar:number,fractionDigits:number){

    leaderboard.subTitleEntry.getComponent(TextShape).value = menuItmLabl.replace("\n"," ")
    
    if(!CONFIG.PLAYFAB_ENABLED){
      leaderboard.updateAllRows( "PlayFab disabled",""  )
      log("updateBoardWithLoaderBoardId","PlayFab disabled, fetching leaderboard data")
      return
    }

    leaderboard.updateAllRows( "Loading...",""  )

    var getLeaderboardArgs: PlayFabServerModels.GetLeaderboardRequest = {
      StatisticName: statId,StartPosition: 0,MaxResultsCount: CONFIG.GAME_LEADEBOARD_MAX_RESULTS,
    }
    PlayFabSDK.GetLeaderboard( getLeaderboardArgs
    ).then( (result:GetLeaderboardResult) => {
        log("updateBoardWithLoaderBoardId","results",result)

        this.updateBoardWithLeaderBoardResults(leaderboard,statId,result,scalar,fractionDigits)
    })
  }
  updateBoardWithLeaderBoardResults(leaderboard:Leaderboard,statToLoad:string,result:GetLeaderboardResult,scalar:number,fractionDigits:number){
    const METHOD_NAME = "updateBoardWithLeaderBoardResults"
    leaderboard.clearRows()

    if(result && result.Leaderboard){
      if(result.Leaderboard.length > 0){
        for(let x=0;x < result.Leaderboard.length; x++){
          const itm = result.Leaderboard[x]
          //leaderboard.updateRow( x, itm.DisplayName, (itm.StatValue*scalar).toFixed(fractionDigits)  )
          leaderboard.updateRow( x, itm.DisplayName, formatValue( itm.StatValue*scalar,fractionDigits )  )
        }
      }else{
        leaderboard.hideRows()
        leaderboard.updateRow( 0, "No stats yet", "-"  )
      }
    }
 
    let playerFabUserInfo:
      | GetPlayerCombinedInfoResultPayload
      | null
      | undefined = GAME_STATE.playerState.playFabUserInfo;
    
    if (playerFabUserInfo) {
      let playerStatics = playerFabUserInfo.PlayerStatistics;
      let playerStat:StatisticValue
      if (playerStatics && playerStatics.length > 0) {
        for (const p in playerStatics) {
          const stat: StatisticValue = playerStatics[p];
          //log("stat ", stat,leaderboard.type);
          if (
            stat.StatisticName == statToLoad
          ) {
            playerStat = stat;
          }
        }
      }else{
        log(METHOD_NAME,"no player stats",playerStat,statToLoad)
      }
      log(METHOD_NAME,"found player stat",playerStat)


      if(playerStat){
        leaderboard.updateCurrentPlayerStat(GAME_STATE.playerState.dclUserData.displayName,formatValue( playerStat.Value*scalar,fractionDigits ))
      }else{
        leaderboard.setCurrentPlayerStatVisible(false)
      }

    }

    //GAME_STATE.playerState.playFabLoginResult.pla
  }
}


function formatValue(StatValue: number, fractionDigits: number): string {
  if(StatValue !== undefined){
    return StatValue.toFixed(fractionDigits)
  }else{
    return "-"
  }
}

