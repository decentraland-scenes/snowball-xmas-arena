import * as utils from '@dcl/ecs-scene-utils'
import { movePlayerTo } from "@decentraland/RestrictedActions";
import { CONFIG, initConfig } from "src/config";
import { joinOrCreateRoom } from "src/connection/connect-flow";
import { disconnect } from "src/connection/connection";
import { teamColor } from "src/modules/teamColors";
import { REGISTRY } from "src/registry";
import { GAME_STATE } from "src/state";
import { ScenePOI, SceneVector3Type } from "src/types/types";
import { BattleDataOptions } from "./connection/state/server-state-spec";
import * as gameUI from 'src/modules/ui'
import * as ui from "@dcl/ui-scene-utils";
import { Game_2DUI } from "src/modules/ui/index";
import { setGameTimeLeftActive } from "src/modules/countDownSystem";
import { iceGrid } from "src/modules/iceGrid";
import * as serverStateSpec from "src/snowball-fight/connection/state/server-state-spec";
import { hideGameResultsPrompt } from "src/ui/ui-battle-prompts";
import { BallManager } from "src/modules/ball";
import { EnemyUpdateSystem } from "src/modules/enemyManager";
import { SendPlayerDataSystem } from "src/modules/sendPosSystem";
import { Room } from "colyseus.js";
import * as clientState from "src/snowball-fight/connection/state/client-state-spec";
import { BattleData } from "src/modules/battleData";
import { getWinningTeam } from "./connection/state-data-utils";
import * as sfx from "src/resources/sounds";
import { LevelMenuItem } from "./leaderboards/menuItem";
import { CommonResources } from "src/resources/common";
import { Leaderboard, LeaderBoardItmConstants, LeaderBoardItmType, LeaderBoardManager } from "./leaderboards/menu";
import { CountdownBanner, CountdownTimerSystem } from 'src/modules/countdown';


function createLeaderboardLbl(statLbl:string,statTimeLbl:string){
  return statLbl + " ("+statTimeLbl+")"
}


const RESELECT_COOLDOWN = 1000;

const LEADERBOARD_SCORE_NUM_DECIMAL_POINTS = 0
//https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
const LEADBOARD_SCORE_TIME_SCALAR = 1//-1 * 1/1000

export class Lobby{

  rootEntity:Entity
  leaderboardManager = new LeaderBoardManager

  level0:Leaderboard
  //level1:Leaderboard
  //level0b:Leaderboard
  //level1b:Leaderboard
  leaderboards:Leaderboard[]

  inLobby:boolean

  init(){
    this.rootEntity = new Entity()
    engine.addEntity(this.rootEntity)
    this.rootEntity.addComponent(new Transform({
      position: new Vector3(0,0,0)
    }))

  
    const leaderboardManager = this.leaderboardManager = new LeaderBoardManager()

    this.spawnLeaderboards(leaderboardManager);

  }

  reset(){
    const METHOD_NAME = "reset"
    log(METHOD_NAME,"ENTRY")

  }

  
  refreshLevelLeaderboardStats(options?:{reloadSelected:boolean,thisStat?:string,defaultStat?:string,levelId?:string}){
    log("refreshLevelLeaderboardStats",options)
    for(const p in this.leaderboards){
      const board = this.leaderboards[p]
 
      const boardStat = board.type;

      if(options && options.levelId && options.levelId != boardStat.id){
        log("refreshLevelLeaderboardStats","skipping board did not match",options.levelId)
        continue;
      }

      const selectedItm = board.getSelectedMenuItem()

      let menuItem: LevelMenuItem

      let stat:string = undefined
 
      let usedSelectedItem = false
      if(options){
        if(options.thisStat){
          stat = options.thisStat
        }

        if(options.reloadSelected == true && selectedItm && selectedItm instanceof LevelMenuItem){
          if(selectedItm.type != 'play' ){
            //assume has full value already
            stat = selectedItm.type
            usedSelectedItem = true
            menuItem = selectedItm
          }else{
            //fallback
            log("refreshLevelLeaderboardStats","fallback to default as ",selectedItm.type,"was selected")
            stat = selectedItm.type
          }
        }

        //if still null use default stat
        if(!stat){
          stat = options.defaultStat
        }
      }

      if(!usedSelectedItem){
        //TODO must select item
      }
      
      /*if(stat){
        stat = boardStat 
      }*/

      if(stat){
        log("refreshLevelLeaderboardStats","loading",stat,"for",board.type,"for menu",menuItem,"stat",stat)
        if(menuItem && menuItem.updateWearablesMenu){
          menuItem.updateWearablesMenu()
        }else{

          //FIXME this lookup is ugly
          /*let lbl = stat
          for(let p in LEADERBOARD_ITEM_REGISTRY){
            log("refreshLevelLeaderboardStats checking",stat,p) 
            if( stat.indexOf(p) >= 0){ 
              lbl = createLeaderboardLbl(LEADERBOARD_ITEM_REGISTRY[p].type.label,LEADERBOARD_ITEM_REGISTRY[p].frequency.label)
            }
          }*/
          this.leaderboardManager.updateBoardWithLoaderBoardId(board, board.title, stat,LEADBOARD_SCORE_TIME_SCALAR,LEADERBOARD_SCORE_NUM_DECIMAL_POINTS) //divide to get seconds
        }
      }else{
        //default
        log("refreshLevelLeaderboardStats","no stats to load",stat,"for",board.type)
      }

      //this.leaderboardManager.updateBoardWithLoaderBoardId(board,statToLoad,LEADBOARD_SCORE_TIME_SCALAR,LEADERBOARD_SCORE_NUM_DECIMAL_POINTS) //divide to get seconds
      
    }
    //this.leaderboardManager.updateBoardWithLoaderBoardId(board,statToLoad,-1 * 1/1000,NUM_DECIMAL_POINTS) //divide to get seconds
  }
 
  blockingEntities:Entity[] = []

  addCountDownToBoards(countdownSystem:CountdownTimerSystem,val:boolean){
    log("addCountDownToBoards",val)
    if(!val){
      log("addCountDownToBoards","no counters needed",val)
      for(const p in this.blockingEntities){
        engine.removeEntity(this.blockingEntities[p])
      }
      this.blockingEntities = []
      return
    }
    const eventTime1 = CONFIG.GAME_ACTIVE_TIME

    //removing old ones
    if(countdownSystem !== undefined && countdownSystem.countdownBanners !== undefined)
    for(const p in countdownSystem.countdownBanners){
      countdownSystem.countdownBanners[p].removeText()
    }
    //REGISTRY.SCENE_MGR.lobby.addCountDownToBoards( countdownSystem, false )

    const frameShape = CommonResources.RESOURCES.models.instances.countdownFrame
    const blockShape = new BoxShape()
    
    for(const p in this.leaderboards){
      const leader = this.leaderboards[p]
      const tf = leader.leaderboardRoot.getComponent(Transform)

      const pos = tf.position.clone()

      pos.add(new Vector3(1,0,1))


      const entitBlock = new Entity()
      entitBlock.addComponent( blockShape );
      entitBlock.addComponent(new Transform({
        position: new Vector3(0,0,0),
        rotation: Quaternion.Euler(90,0,0), 
        scale: new Vector3(9,.5,5)
      }))
      entitBlock.setParent(leader.leaderboardRoot) 
      entitBlock.addComponent(CommonResources.RESOURCES.materials.transparent)
      this.blockingEntities.push(entitBlock)
 
      
      countdownSystem.addCounter(
        new CountdownBanner(
            "Snowball Arena",
            eventTime1
            , new Transform({
                position: new Vector3(0,0,-.3),
                //rotation: tf.rotation.clone(),
                scale: new Vector3(0.4,0.4,0.4)
            })
            ,frameShape
            ,new Transform({
                  position: new Vector3(0,0,0), 
                  //rotation: tf.rotation.clone(), 
                  scale: new Vector3(1.2,1.2,1.2)
              })
            ,leader.leaderboardRoot
            ,()=>{
              engine.removeEntity(entitBlock)
            }
        )
    )
    }
  }

  private spawnLeaderboards(leaderboardManager: LeaderBoardManager) { 


    const wall1BaseX = 64.7//20.4
    const wall1Z = 15.4//20.4
    const wallY = 3

    const wall2BaseX = 64.7//20.4
    const wall2Z = 76+5//20.4
    //const wallY = 3
    const boardHeight = 7

    const wall1Spacing = 10
 
    
    //const levelMEGA = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, "mega menu", LeaderBoardItmConstants.MEGA_MENU, new Vector3(wall1BaseX-10,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    const levelMEGATEAM = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, "Team Stats", LeaderBoardItmConstants.MEGA_MENU_TEAM, new Vector3(wall1BaseX+(wall1Spacing*1),wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    const levelMEGAPERSONAL_SCORE = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.label, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE, new Vector3(wall1BaseX+(wall1Spacing*2),wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    
    const levelMEGATEAM2 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, "Team Stats", LeaderBoardItmConstants.MEGA_MENU_TEAM, new Vector3(wall2BaseX+(wall1Spacing*1),wallY,wall2Z), Quaternion.Euler(0,180,0), 1.4);
    const levelMEGAPERSONAL_SCORE2 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.label, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE, new Vector3(wall2BaseX+(wall1Spacing*2),wallY,wall2Z), Quaternion.Euler(0,180,0), 1.4);
    

    const wall3BaseX = 145.2//20.4
    const wall3Z = 39+3//20.4
    const wall3Spacing = 9


    const wall4BaseX = 15-.3//20.4
    const wall4Z = 42//20.4

    const levelMEGATEAM3 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, "Team Stats", LeaderBoardItmConstants.MEGA_MENU_TEAM, new Vector3(wall3BaseX,wallY,wall3Z), Quaternion.Euler(0,90+180,0), 1.4);
    const levelMEGAPERSONAL_SCORE3 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.label, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE, new Vector3(wall3BaseX,wallY,wall3Z+wall3Spacing), Quaternion.Euler(0,90+180,0), 1.4);

    
    const levelMEGATEAM4 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, "Team Stats", LeaderBoardItmConstants.MEGA_MENU_TEAM, new Vector3(wall4BaseX,wallY,wall4Z), Quaternion.Euler(0,90,0), 1.4);
    const levelMEGAPERSONAL_SCORE4 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.label, LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE, new Vector3(wall4BaseX,wallY,wall4Z+wall3Spacing), Quaternion.Euler(0,90,0), 1.4);

    const teamMenus:Leaderboard[] = [
      levelMEGATEAM,levelMEGATEAM2,levelMEGATEAM3,levelMEGATEAM3
    ]
    //const levelMEGAPERSONAL_PLACED = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MEGA_MENU_PLAYER_PLACED.label, LeaderBoardItmConstants.MEGA_MENU_PLAYER_PLACED, new Vector3(63+30,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    
    /*const level0 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME.label, LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME, new Vector3(63,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    const level1 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.MOST_FRAGS.label, LeaderBoardItmConstants.MOST_FRAGS, new Vector3(73,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    const level2 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.RANK_TOP3.label, LeaderBoardItmConstants.RANK_TOP3, new Vector3(83,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    const level3 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.GAMES_PLAYED.label, LeaderBoardItmConstants.GAMES_PLAYED, new Vector3(93,wallY,wall1Z), Quaternion.Euler(0,0,0), 1.4);
    */
    //false so can have all on same side for easier testing
    /*const otherSide = false
    //other side
    const level4 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.TEAM_MOST_FRAGS.label, LeaderBoardItmConstants.TEAM_MOST_FRAGS, new Vector3(68,otherSide?wallY:wallY+boardHeight,otherSide?76:wall1Z), Quaternion.Euler(0,otherSide?180:0,0), 1.4);
    const level5 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.TEAM_MOST_FRAGS_IN_ONE_GAME.label, LeaderBoardItmConstants.TEAM_MOST_FRAGS_IN_ONE_GAME, new Vector3(90+5,otherSide?wallY:wallY+boardHeight,otherSide?76:wall1Z), Quaternion.Euler(0,otherSide?180:0,0), 1.4);
    const level6 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.TEAM_GAMES_WON.label, LeaderBoardItmConstants.TEAM_GAMES_WON, new Vector3(90-5,otherSide?wallY:wallY+boardHeight,otherSide?76:wall1Z), Quaternion.Euler(0,otherSide?180:0,0), 1.4);
    const level7 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, LeaderBoardItmConstants.TEAM_MOST_FRAGS_IN_ONE_GAME.label, LeaderBoardItmConstants.TEAM_GAMES_WON, new Vector3(90,5,76), Quaternion.Euler(0,180,0), 1.4);
*/

    //const level1 = this.level1 = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[1].name, levelManager.levels[1].id, SceneData.menuPositions[1].position, SceneData.menuPositions[1].rotation, 1.4);
    //const level0b = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[0].name, levelManager.levels[0].id, SceneData.menuPositions[2].position, SceneData.menuPositions[2].rotation, 1.4);
    //const level1b = this.level1b = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[1].name, levelManager.levels[1].id, SceneData.menuPositions[3].position, SceneData.menuPositions[3].rotation, 1.4);

    //log("to add levelManager.levels ", levelManager.levels);

    
    const boards = this.leaderboards = [ 
      levelMEGATEAM,levelMEGAPERSONAL_SCORE
      ,levelMEGATEAM2,levelMEGAPERSONAL_SCORE2
      ,levelMEGATEAM3,levelMEGAPERSONAL_SCORE3 
      ,levelMEGATEAM4,levelMEGAPERSONAL_SCORE4 
    ]
      //, level1, level0b, level1b];
    
    

    for (const p in boards) {
      const board = boards[p];

      const stat = board.type;

      
      board.addMenuItem(
        new LevelMenuItem(
          {
            scale: new Vector3(1, 1, 1),
          },
          CommonResources.RESOURCES.textures.roundedSquareAlpha.texture,
          "Play",
          "play",
          () => {
            //small delay
            //TODO - start connecting sooner???
             
            utils.setTimeout(300, () => {
              REGISTRY.SCENE_MGR.goArena()
            });
            //deselect
          },
          {
            reSelectCoolDown: RESELECT_COOLDOWN
          }
        )
      );
      const stats = []
      if(
        stat.id==LeaderBoardItmConstants.MEGA_MENU.id
        ||stat.id==LeaderBoardItmConstants.MEGA_MENU_PLAYER.id
        ||stat.id==LeaderBoardItmConstants.MEGA_MENU_PLAYER_PLACED.id
        ||stat.id==LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.id
        ||stat.id==LeaderBoardItmConstants.MEGA_MENU_TEAM.id
        ||stat.id==LeaderBoardItmConstants.MEGA_MENU_TEAM.id
        ){

        let stats=[]
        switch(stat.id){
          case LeaderBoardItmConstants.MEGA_MENU.id:
            stats=[
              LeaderBoardItmConstants.TEAM_GAMES_PLAYED,
              LeaderBoardItmConstants.TEAM_GAMES_WON,
              LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME,
              LeaderBoardItmConstants.MOST_FRAGS,
              LeaderBoardItmConstants.RANK_1,
              LeaderBoardItmConstants.RANK_TOP3,
              LeaderBoardItmConstants.GAMES_PLAYED
            ]
            break;
          case LeaderBoardItmConstants.MEGA_MENU_PLAYER.id:
            stats=[
              LeaderBoardItmConstants.MOST_FRAGS,
              LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME,
              LeaderBoardItmConstants.GAMES_PLAYED,
              LeaderBoardItmConstants.RANK_TOP3,
              LeaderBoardItmConstants.RANK_1
            ]
            break;
          case LeaderBoardItmConstants.MEGA_MENU_PLAYER_PLACED.id:
            stats=[
              LeaderBoardItmConstants.RANK_TOP3,
              LeaderBoardItmConstants.RANK_1
            ]
            break;
          case LeaderBoardItmConstants.MEGA_MENU_PLAYER_SCORE.id:
            stats=[
              LeaderBoardItmConstants.MOST_FRAGS,
              //LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME,
            ]
            break;
          case LeaderBoardItmConstants.MEGA_MENU_TEAM.id:
            stats=[
              LeaderBoardItmConstants.TEAM_GAMES_WON,
              // LeaderBoardItmConstants.TEAM_GAMES_PLAYED
            ]
            break;
        }
        
        for(const p in stats){
          this.addBoardMenu(board,stats[p])
        }
      }else{
        
        this.addBoardMenu(board,stat)
        
      }
      //for (const j in stats) {
        
      //}

      board.hideRows();
    }
  }
  addBoardMenu(board:Leaderboard,statObj:LeaderBoardItmConstants){
    let statsTime: LeaderBoardItmType[] = [
      LeaderBoardItmConstants.FREQUENCY_DAILY, 
      LeaderBoardItmConstants.FREQUENCY_WEEKLY, 
      LeaderBoardItmConstants.FREQUENCY_ALL_TIME ];

    const stat = statObj.id

    switch(stat){
      case LeaderBoardItmConstants.MOST_FRAGS.id:
      case LeaderBoardItmConstants.RANK_TOP3.id:
      case LeaderBoardItmConstants.MOST_FRAGS_IN_ONE_GAME.id:
    
        statsTime= [ 
          //LeaderBoardItmConstants.FREQUENCY_HOURLY, 
          LeaderBoardItmConstants.FREQUENCY_DAILY, 
          LeaderBoardItmConstants.FREQUENCY_WEEKLY,
          LeaderBoardItmConstants.FREQUENCY_ALL_TIME
        ];
    }
     
    for (const q in statsTime) {

      const statPostfix = statsTime[q].id;//stats[j].id + "_" + statsTime[q].id;
      const statToLoad = stat + "_" + statPostfix;
      const menuItmLabl = 
        statObj.label +"\n"+
        statsTime[q].label//createLeaderboardLbl(stats[j].label, statsTime[q].label);
      

      board.addMenuItem(
        new LevelMenuItem(
          {
            scale: new Vector3(1, 1, 1),
          },
          CommonResources.RESOURCES.textures.roundedSquareAlpha.texture,
          menuItmLabl,
          statToLoad,
          () => {
            log("levelManager.clicked",board.title, "load leaderboard", statToLoad);

            //https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
            this.leaderboardManager.updateBoardWithLoaderBoardId(board, menuItmLabl, statToLoad, LEADBOARD_SCORE_TIME_SCALAR, LEADERBOARD_SCORE_NUM_DECIMAL_POINTS); //divide to get seconds
          },
          {
            reSelectCoolDown: RESELECT_COOLDOWN
          }
        )
      );
    }
  }
  isPlayerInLobby(){
    return this.inLobby
  }

  enterLobby(){
    sfx.playLevelTheme('lobby')

    REGISTRY.player.setColor(teamColor.NEUTRAL)
    gameUI.isPlayerInArenaUI(false)

    gameUI.showHealthBar(false) 
    gameUI.setGameTimeValue("--:--")

    this.inLobby = true
  }

  exitLobby(){
    const METHOD_NAME = "exitLobby"
    log(METHOD_NAME,"ENTRY")

    this.reset()

    //WORKAROUND, must explicity set playing false
    //if playOnce is called, on add to scene (again, it plays again)
    sfx.stopAllSources("lobby.onHide.allMenuAudioSources",sfx.allMenuAudioSources)

    this.inLobby = false

  }
  
  
}
