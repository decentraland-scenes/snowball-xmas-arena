//import { REGISTRY } from "src/registry";

import { movePlayerTo } from "@decentraland/RestrictedActions";
import { CONFIG, initConfig } from "src/config";
import { joinOrCreateRoom, joinOrCreateRoomAsync } from "src/connection/connect-flow";
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
import { notNull } from "src/utils/utilities";
import { FrostUIType } from "src/modules/frostedUISystem";
import * as utils from '@dcl/ecs-scene-utils';
import { refreshUserData } from "src/login/login-flow";
import { LeaderBoardManager } from "./leaderboards/menu";

export class SnowballArena{
 
  //ballManager:BallManager, player has the ball manager
  private _isPlayerInArena : boolean = false;
  isArenaActive: boolean = false;
  playerLocationBeforeRace:Vector3

  blueLevelSpawnPoints:Vector3[] = [new Vector3(46,15,60), new Vector3(46,15,52), new Vector3(46,15,44), new Vector3(46,15,36), new Vector3(46,15,28),]
  redLevelSpawnPoints:Vector3[] = [new Vector3(114,15,60), new Vector3(114,15,52), new Vector3(114,15,44), new Vector3(114,15,36), new Vector3(114,15,28),]

  //death respawn points
  blueReSpawnPoints:Vector3[] = [new Vector3(22,2.5,57), new Vector3(22,2.5,50), new Vector3(28,2.5,50), new Vector3(22,2.5,35), new Vector3(28,2.5,35),]
  redReSpawnPoints:Vector3[] = [new Vector3(138,2.5,57), new Vector3(138,2.5,50), new Vector3(131,2.5,50), new Vector3(138,2.5,35), new Vector3(131,2.5,35),]

  enemyUpdateSystem:EnemyUpdateSystem
  sendPlayerDataSystem:SendPlayerDataSystem
 
  init(){
    //player has the ball manager
    //this.ballManager = new BallManager(100, undefined)
    this.enemyUpdateSystem = new EnemyUpdateSystem(REGISTRY.player.enemyManager)
    this.sendPlayerDataSystem = new SendPlayerDataSystem(REGISTRY.player)
 
  }
  resetBattleArenaEntities(){
    const METHOD_NAME = "resetBattleArenaEntities"
    log(METHOD_NAME,"ENTRY")

    iceGrid.resetAllBlocks()
  }
  removeEnemies(){
    //clear out enemies
    if(REGISTRY.player.enemyManager !== undefined) REGISTRY.player.enemyManager.removeAll()
  }
  resetBattleArena(){
    const METHOD_NAME = "resetBattleArena"
    log(METHOD_NAME,"ENTRY")

    this.isArenaActive = false

    //GAME_STATE.reset
    Game_2DUI.showGameStartMsg(false); 
    hideGameResultsPrompt()
    gameUI.showGameMenu(false)
    Game_2DUI.showGameEnded(false)
    Game_2DUI.showLapCounter(false)
    Game_2DUI.showLobbyTopRight(false)
    gameUI.showLobbyMessage(false)
    gameUI.showArenaGameUI(false)
    gameUI.toggleScoreContainer(false)

    gameUI.showHealthBar(false) 
    Game_2DUI.showLeaderboard(false) 
    

    //all should be closed, hedging bets here
    REGISTRY.setDialogBoxOpen("resetBattleArena",false)

    setGameTimeLeftActive( false )
    
    this.removeEnemies()

    this.resetBattleArenaEntities()
  }
  initArena(force: boolean) {
    const METHOD_NAME = "initArena"
    log(METHOD_NAME,"ENTRY",force)
    
    Game_2DUI.showLobbyTopRight(false)
    this.resetBattleArena() 

    const battleDataOptions:BattleDataOptions={
      levelId:"",
      //timeLimit: 10
      //customRoomId:undefined,
      //maxPlayers
    }
    const connectOptions:any = {
      battleDataOptions: battleDataOptions,
      env: CONFIG.ENV,
      titleId: CONFIG.PLAYFAB_TITLEID,
      playerType: "combatant",
      "battleDataOptions.levelId": battleDataOptions.levelId,
      "battleDataOptions.maxPlayers": battleDataOptions.maxPlayers,
      "battleDataOptions.customRoomId": battleDataOptions.customRoomId,
      "battleDataOptions.timeLimit": battleDataOptions.timeLimit
    };

    connectOptions.playFabData = {
      titleId: CONFIG.PLAYFAB_TITLEID,
      id: GAME_STATE.playerState.playFabLoginResult?.PlayFabId,
      sessionTicket: GAME_STATE.playerState.playFabLoginResult?.SessionTicket
    }; 

    const roomName = CONFIG.GAME_SNOWBALL_ROOM_NAME
    joinOrCreateRoomAsync( roomName,connectOptions )

    //snow these now so have ability to quit

    gameUI.showArenaGameUI(true)
    Game_2DUI.showLapCounter(true)
    gameUI.toggleScoreContainer(true)

    gameUI.createButtonsBaseOnScene(false,'arena')
    
    gameUI.isPlayerInArenaUI(true)

  }
  onConnect(room: Room<clientState.BattleRoomState>) {
    GAME_STATE.gameRoom = room;
    Game_2DUI.showLeaderboard(true) 

    GAME_STATE.battleData = new BattleData()
    //REGISTRY.player.addBallManager(new BallManager(100, room)) //create player comes with ball manager
    //player.addBallManager( REGISTRY.SCENE_MGR.snowballArena.ballManager )
    //REGISTRY.SCENE_MGR.snowballArena.ballManager.room = room
    REGISTRY.player.ballManager.room = room //update room
    //REGISTRY.player.setRoom(room) 

    gameUI.adjustPlayQuitButton('arena')

    this.sendPlayerDataSystem.playerRef = REGISTRY.player
    this.enemyUpdateSystem.enemyManagerRef = REGISTRY.player.enemyManager

    engine.addSystem(this.enemyUpdateSystem)
    engine.addSystem(this.sendPlayerDataSystem) 
  }
  exitBattle(){
    const METHOD_NAME = "exitBattle"
    log(METHOD_NAME,"ENTRY")

    this.resetBattleArena()

    gameUI.updateGameTime(0)
    Game_2DUI.showLobbyTopRight(true)

    disconnect(true)

    this.isArenaActive = false
  }
  exitArena(moveToLobby?:boolean){
    const METHOD_NAME = "exitArena"
    log(METHOD_NAME,"ENTRY")

    this.exitBattle()

    //log("//. Quit Game")
    this.SetAvatarInArena(false) //Quit Game

    if(moveToLobby === undefined || moveToLobby == true){
      const cameraLook = CONFIG.centerGround.clone()
      cameraLook.y = 8
      if(this.playerLocationBeforeRace !== undefined){
        const position = new Vector3( this.playerLocationBeforeRace.x,this.playerLocationBeforeRace.y,this.playerLocationBeforeRace.z )
        
        this.movePlayerHere(position,cameraLook)
      }else{
        this.movePlayerHere(pickRandomPoint(CONFIG.DEFAULT_LOBBY_SPAWN_POINT_RANGE),cameraLook)
      }
    }
    gameUI.createButtonsBaseOnScene(false,'lobby')


    //WORKAROUND, must explicity set playing false
    //if playOnce is called, on add to scene (again, it plays again)
    sfx.stopAllSources("race.onHide.raceSoundAudioSources",sfx.raceSoundAudioSources)
    sfx.stopAllSources("race.onHide.raceThemeSoundAudioSources",sfx.raceThemeSoundAudioSources)
  }
  isPlayerInArena():boolean {
    //const playerPos = Camera.instance.feetPosition
    
    //using arena active as decision for now
    //return this.isArenaActive; 
    //log("//. Is Player In Arena: ",this._isPlayerInArena)
    return this._isPlayerInArena;
  }
  thisPlayerDeath(data?:serverStateSpec.PlayerGiveDamageDataState) {
    const METHOD_NAME = "thisPlayerDeath"
    log(METHOD_NAME,"ENTRY",data)
 
    if(data !== undefined){
      const enemy = REGISTRY.player.enemyManager.getEnemyByID( data.playerIdFrom )
      let msg = ""
      if(notNull(enemy)){
        //msg = "You were frozen by \n" +  enemy.name + "\n Warm up and get back out there!"
        msg = "by " +  enemy.name + "\n Warm up and get back out there!"
        //ui.displayAnnouncement(msg,4,Color4.Blue(),50)
      }else{
        //msg = "You were frozen \nWarm up and get back out there!"
        msg = " \nWarm up and get back out there!"
        //ui.displayAnnouncement(msg,4,Color4.Blue(),50)
        log(METHOD_NAME,"cannot find originating player",data,enemy)
      }
      if(REGISTRY.player.hitUISystem !== undefined) REGISTRY.player.hitUISystem.showUI(FrostUIType.PLAYER_DEATH, msg, 3)
    }

    sfx.SOUND_POOL_MGR.playerDie.playOnce()

    //restock them with some balls
    REGISTRY.player.setAmmo( 3 )

    this.movePlayerToRespawnPointInArena()

  }
  movePlayerToRespawnPointInArena() {
    const METHOD_NAME ="movePlayerToRespawnPointInArena"
    log(METHOD_NAME,"player.teamPosition",REGISTRY.player.id,REGISTRY.player.sessionId,REGISTRY.player.color,REGISTRY.player.teamPosition)
    let spawnPoint:Vector3
    //TODO pick spawn locations per team color and height
    if(REGISTRY.player.color === teamColor.BLUE){
      spawnPoint = this.blueReSpawnPoints[ REGISTRY.player.teamPosition ]
    }else{
      //red
      spawnPoint = this.redReSpawnPoints[ REGISTRY.player.teamPosition ]
    }
    let position:Vector3 =spawnPoint
    let cameraLook:Vector3 = CONFIG.centerGround

    this.movePlayerHere(position,cameraLook)

  }
  movePlayerToStartPointInArena() {
    const METHOD_NAME ="movePlayerToStartPointInArena"
    log(METHOD_NAME,"player.teamPosition",REGISTRY.player.id,REGISTRY.player.sessionId,REGISTRY.player.color,REGISTRY.player.teamPosition)
    let spawnPoint:Vector3
    //TODO pick spawn locations per team color and height
    if(REGISTRY.player.color === teamColor.BLUE){
      spawnPoint = this.blueLevelSpawnPoints[ REGISTRY.player.teamPosition ]
    }else{
      //red
      spawnPoint = this.redLevelSpawnPoints[ REGISTRY.player.teamPosition ]
    }
    let position:Vector3 =spawnPoint
    let cameraLook:Vector3 = CONFIG.centerGround

    this.movePlayerHere(position,cameraLook)

    this.isArenaActive = true
  }

  movePlayerHere(position:Vector3,cameraLook:Vector3){
    movePlayerTo(position,cameraLook).then(
      ()=>{
        log(REGISTRY.player.id,REGISTRY.player.sessionId,"player move to scene " , "@",position, " complete")
        //resolve()
        
      }
    ).catch(
      (reason:any)=>{
        log(REGISTRY.player.id,REGISTRY.player.sessionId,"player move to scene "  , "@",position, " FAILED",reason)
        //reject(reason)
      }
    )
  }

  battleAboutToStart(){
    const METHOD_NAME = "battleAboutToStart"
    log(METHOD_NAME,"ENTRY")

    REGISTRY.player.ControlMovement();
    this.resetBattleArenaEntities()


    REGISTRY.SCENE_MGR.lobby.exitLobby()

    //restock them with some balls to start
    REGISTRY.player.setAmmo( REGISTRY.player.maxAmmo )

    REGISTRY.SCENE_MGR.snowballArena.movePlayerToStartPointInArena()
    this.UpdatePlayersColors();

    this.SetAvatarInArena(true);//Start Game

    gameUI.showHealthBar(true) 
    Game_2DUI.showGameStartMsg(true); 

    sfx.playLevelTheme('arena')

    //WHAT DOES THIS DO??, removed
    //sfx.SOUND_POOL_MGR.mainMusic.playOnce()
    
  }
  startBattle(){
    const METHOD_NAME = "startBattle"
    log(METHOD_NAME,"ENTRY")
    
    REGISTRY.player.ReleaseMovement();

    sfx.SOUND_POOL_MGR.gameStart.playOnce()

    this.isArenaActive = true

    Game_2DUI.showGameStartMsg(false)
    

    log('MATCH STARTED')
    gameUI.showArenaGameUI(true)
    gameUI.resetUIScores()
    gameUI.HideCursorMessage()
    gameUI.DisplayCursorMessage('GAME STARTED!', 'GO GO GO', 2)
    setGameTimeLeftActive( true )
    REGISTRY.player.matchStarted = true
  }

  endBattle(){
    const METHOD_NAME = "endBattle"
    log(METHOD_NAME,"ENTRY")

    const state = GAME_STATE.getBattleRoom().state

    
    let winningTeam = getWinningTeam(state)
    const teamsTied = winningTeam.length > 1
    let reason = teamsTied ? "DRAW!\n" : "Team " + winningTeam[0].name + " WIN!\n"//GAME_STATE.battleData.winningTeam.name + "Team WON!\n"
    reason += "You Placed:" + REGISTRY.player.serverState.battleData.racePosition
    Game_2DUI.setGameEndReasonText(
      reason
      )
      
    Game_2DUI.showGameEnded( true )
    setGameTimeLeftActive( false )
    //openGameResultsPrompt()


    engine.removeSystem(this.enemyUpdateSystem)
    engine.removeSystem(this.sendPlayerDataSystem)

    setGameTimeLeftActive( false )
    REGISTRY.player.matchStarted = false

    
    //this.resetBattleArena()
    this.isArenaActive = false

    //this.broadcast("ended.roomAboutToDisconnect"); was not being sent so need to use this for now
    //worst case fetch double the stats
    utils.setTimeout(CONFIG.GAME_LEADEBOARD_END_GAME_RELOAD_DELAY_MILLIS, () => {  
      log("endBattle calling refreshUserData fetchRefreshPlayerCombinedInfo",)
      REGISTRY.SCENE_MGR.lobby.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX})
      refreshUserData()
    });

    disconnect(true)
    //this.exitArena()
    //REGISTRY.SCENE_MGR.goLobby()
  }

  private SetAvatarInArena(state : boolean){
      this._isPlayerInArena = state;
      REGISTRY.player.setAvatarSwapEnabled(state);
      REGISTRY.player.enemyManager.others.forEach(enemy => {
        enemy.setAvatarSwapEnabled(state);
      });
  }
  private UpdatePlayersColors(){
    //log("//. Reset SetColor Call")
    REGISTRY.player.setColor(REGISTRY.player.color, true);
    REGISTRY.player.enemyManager.others.forEach(enemy => {
      enemy.setColor(enemy.color, true);
    });
  }
}


function pickRandomPoint(poi: ScenePOI): Vector3 {
  //TODO randomize based on range
  const point = poi.position.randomVector3()
  return point
}
