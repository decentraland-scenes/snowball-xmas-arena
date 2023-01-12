import { CONFIG } from 'src/config'
import { Game_2DUI } from 'src/modules/ui/index'
import { REGISTRY } from 'src/registry'
import { realDistance } from 'src/utils/utilities'
import { movePlayerTo } from "@decentraland/RestrictedActions";
import { ISceneManager } from './sceneManagerInterface'
import { SnowballArena } from './snowballScene'
import { Lobby } from './lobbyScene';
import { SnowBallLeaderboard } from 'src/modules/leaderboard';
import * as ui from "@dcl/ui-scene-utils";
import { toggleScoreContainer } from 'src/modules/ui';
//import { SceneManager } from './sceneManager'
//import { SceneVector3Type, SpawnPoint } from './types'
//import * as gameUI from "../ui/index";

export class SceneManager implements ISceneManager{

  static instance:SceneManager
 
  static getInstance(){
    if(!SceneManager.instance || SceneManager.instance === undefined){
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance
  } 

  //lobbyScene:LobbyScene
  snowballArena:SnowballArena
  lobby:Lobby
  leaderboard: SnowBallLeaderboard;
  //playerLocationBeforeRace:Vector3

  goArena(force?:boolean){
    
    const METHOD_NAME = "goArena"
    if(!CONFIG.IS_GAME_LIVE){
      log(METHOD_NAME,"CONFIG.IS_GAME_LIVE is off, dont show menu","force",force,"IS_GAME_LIVE",CONFIG.IS_GAME_LIVE)
      ui.displayAnnouncement(CONFIG.GAME_NOT_ACTIVE_MSG)
      return
    }
    REGISTRY.doLoginFlow(
        {
          onSuccess:()=>{ 
            const alreadyBattling = this.snowballArena.isArenaActive
            
            //-3 for player height with padding if standing on stuff
            
            this.capturePlayerLobbyPosition()

            if( (force === undefined || !force ) && alreadyBattling ){
              log(METHOD_NAME,"already battling")
              //run these anyway just in case state got messed up
              //this.changeToScene(this.racingScene)
              //this.snowballArena.resetBattleArena()
              //this.snowballArena.endBattle()
              //this.snowballArena.initArena(force)
              //this.snowballArena.movePlayerToStartPointInArena()
            }else{
              if(!REGISTRY.showedHowToPlayAlready){
                REGISTRY.Game_2DUI.openHowToPlayPrompt(
                  ()=>{
                    REGISTRY.SCENE_MGR.goArena()
                  }
                )
              }else{
                
                if(!alreadyBattling){
                  log(METHOD_NAME,"alreadyBattling",alreadyBattling)
                  //this.changeToScene(this.racingScene)
                  //this.snowballArena.movePlayerToStartPointInArena()
                  this.snowballArena.initArena(force)
                }else{
                  log(METHOD_NAME,"already battling","alreadyBattling",alreadyBattling) 
                }
              }
            }
          }
        }
      )
  } 
  goLobby(force?:boolean){
    const forceGo = force !== undefined && force
 
      if(!forceGo && this.snowballArena.isArenaActive){
        //log("gameUI.openEndGameConfirmPrompt",gameUI)
        Game_2DUI.openEndGameConfirmPrompt() 
      }else{
        this.snowballArena.exitArena()
        this.lobby.enterLobby()
      }
    
  }

  capturePlayerLobbyPosition(){
    if( !this.snowballArena.isPlayerInArena() ){
      const playerLocationBeforeRace = new Vector3().copyFrom( Camera.instance.feetPosition )

      //also check distance from center which is not a place to be spawned

      /*const centerIgnoreHeight = new Vector3().copyFrom(CONFIG.centerGround)
      
      centerIgnoreHeight.y = this.playerLocationBeforeRace.y
      const distFromCenter = realDistance(this.playerLocationBeforeRace,centerIgnoreHeight)
      log("goArena check dist from center",this.playerLocationBeforeRace,distFromCenter)
      const minDistance = 8
      if(distFromCenter < minDistance){
        //how did they start a game from in side the tower?
        //TODO have predefined spawn spots?
        this.playerLocationBeforeRace.x += (minDistance-this.playerLocationBeforeRace.x)
        this.playerLocationBeforeRace.y += 1 //to avoid spawning inside something
        log("goArena move out from center",this.playerLocationBeforeRace,distFromCenter)
      }*/
      this.snowballArena.playerLocationBeforeRace = playerLocationBeforeRace

    }else{
      log("capturePlayerLobbyPosition","goArena playerLocationBeforeRace player in arena so dont capture")
      //see if has value, if missing for some reason pick a safe respawn point
      //this.playerLocationBeforeRace
    }
  }
}

//export const SCENE_MGR = new RaceSceneManager();
export function initSceneMgr(){
  REGISTRY.SCENE_MGR = SceneManager.getInstance()
  REGISTRY.SCENE_MGR.snowballArena = new SnowballArena()
  REGISTRY.SCENE_MGR.lobby = new Lobby()
  REGISTRY.SCENE_MGR.lobby.init()
  REGISTRY.SCENE_MGR.snowballArena.init()
  REGISTRY.SCENE_MGR.lobby.enterLobby()
  REGISTRY.SCENE_MGR.leaderboard = new SnowBallLeaderboard()
}
 