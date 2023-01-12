import { DataChange, Room, RoomAvailable } from "colyseus.js";
import { GAME_STATE } from "src/state";
import * as clientState from "src/snowball-fight/connection/state/client-state-spec";
import * as serverState from "src/snowball-fight/connection/state/server-state-spec";
import * as serverStateSpec from "src/snowball-fight/connection/state/server-state-spec";
import * as gameUI from 'src/modules/ui'

//import * as SceneData from "src/og-decentrally/modules/scene";
//import * as gameUI from "../ui/index";
import * as utils from "@dcl/ecs-scene-utils";
//import { Enemy, ENEMY_MGR } from "src/og-decentrally/modules/playerManager";
import { isNull, notNull, realDistance } from "src/utils/utilities";
import * as ui from "@dcl/ui-scene-utils";
import { Game_2DUI } from "src/modules/ui/index";

import { PlayerRankingsType, sortPlayersByPosition } from "./state-data-utils";
//import { Projectile } from "src/og-decentrally/modules/projectiles";
//import { LevelDataState, TrackFeaturePosition } from "src/og-decentrally/modules/connection/state/server-state-spec";
//import { levelManager } from "src/og-decentrally/tracks/levelManager";
//import { Constants } from "src/og-decentrally/modules/resources/globals";
//import { ColyseusCallbacksCollection, ColyseusCollection } from './state/client-colyseus-ext'
import { IntervalUtil } from "src/utils/interval-util";
import { CONFIG } from "src/config";
//import { TrackFeature, TrackFeatureConstructorArgs } from "src/og-decentrally/modules/trackFeatures";
//import { LeaderBoardManager } from "src/og-decentrally/modules/scene/menu";
//import { SOUND_POOL_MGR } from "src/og-decentrally/modules/resources/sounds";
//import { fetchRefreshPlayerCombinedInfo } from "src/og-decentrally/login/login-flow";

import { teamColor } from 'src/modules/teamColors'
import { EnemyManager, EnemyUpdateSystem } from "src/modules/enemyManager";
import { BallManager } from "src/modules/ball";
import { Cone } from "src/chooseTeam";
import { SendPlayerDataSystem } from "src/modules/sendPosSystem";

import { REGISTRY } from "src/registry";
import { setGameTimeLeft, setGameTimeLeftActive } from "src/modules/countDownSystem";
//import { room } from "src/connection";
import { OtherPlayer } from "src/modules/otherPlayer";
import { iceGrid } from "src/modules/iceGrid";
import { snowTrenchController } from "src/tactics/snowTrench";
import { fireCampController } from "src/tactics/fireCamp";
import { powerupController } from "src/tactics/powerUpSpawner";
import { fetchRefreshPlayerCombinedInfo, refreshUserData } from "src/login/login-flow";
import { LeaderBoardManager } from "../leaderboards/menu";
import { SOUND_POOL_MGR } from "src/resources/sounds";
import { GetPlayerCombinedInfoResult } from "src/playfab_sdk/playfab.types";


let allRooms: RoomAvailable[] = [];
//let allPlayers:PlayerState[]=[]

//tracer function
//i need a way to sync server and client time, for now using this to later revisit
function getSharedTimeNow() {
  return Date.now();
}

function getEnemySpawnCount(player: {sessionId:string}) {
  const addLagTestCarForAllPlayers = true;
  const retVal =
    CONFIG.DEBUGGING_LAG_TESTING_ENABLED &&
    (addLagTestCarForAllPlayers || player.sessionId === GAME_STATE.gameRoom.sessionId)
      ? 2
      : 1;
 
  return retVal;
}

function updatePlayerHealth(
  room: Room<clientState.BattleRoomState>,
  player: clientState.PlayerState,
  healthData: serverStateSpec.PlayerHealthDataState
) {
  if (player.sessionId == REGISTRY.player.sessionId) {
    //const healthData = room.state.players.get(player.sessionId).healthData
    //Game_2DUI.setHealthBar(healthData.current / healthData.max);


    REGISTRY.player.updateHealth(healthData.current,healthData.max,'server')
    //Game_2DUI.updateLapTime("-",REGISTRY.player.health,REGISTRY.player.healthMax)
    Game_2DUI.updateGamePosition(REGISTRY.player.health,REGISTRY.player.healthMax)
    gameUI.updateHealthUI(REGISTRY.player.health,REGISTRY.player.healthMax)
  }
  //not part of same if statement for lag testing, player gets an enemy version of themself
  if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
    const enemySpawnCount = getEnemySpawnCount(player);
    for (let i = 0; i < enemySpawnCount; i++) {
      const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
      //ENEMY_MGR.removePlayer(sessionId);
      const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)
      if(notNull(enemy)){
        enemy.updateHealth(healthData.current,healthData.max,'server')
      }else{
        log("updatePlayerHealth","enemy was null, unable to update!",enemy,player)
      }
    }
  }
}
function updatePlayerBattleData(battleData: clientState.PlayerBattleDataState) {

  REGISTRY.player.updateLatency(battleData.lastKnownClientTime, battleData.serverTime);

}

let lastKnowServerTime = -1;

//TODO move to utils
function getUUIDs(entity: IEntity[]): string[] {
  const arr: string[] = new Array();
  for (const p in entity) {
    const ent = entity[p];
    if (ent) {
      arr.push(ent.uuid);
    }
  }
  return arr;
}
function updateBattleData(battleData: clientState.BattleState) {
  //log("updateBattleData", battleData, SceneData.player.lap + " / " + battleData.maxLaps);

  //TODO use local game clock instead
  //time:number
  //gameUI.updateGameTime(battleData.time)

  switch (battleData.status) {
    case "not-started":
      setGameTimeLeft( battleData.timeLimit )
      //Game_2DUI.updateLapCounter(SceneData.player.lap, battleData.maxLaps);
      log("updateBattleData.GAME_STATE.battleData", GAME_STATE.battleData);
      
      break;
    case "starting":
      
      setGameTimeLeft( battleData.timeLimit )
      //prevent these things from getting clean up
       
      //Constants.SCENE_MGR.changeToSnowballArena();
      log("battleData.timeLimit",battleData.timeLimit)

      
      //GAME_STATE.battleData.maxLaps = battleData.maxLaps
      //GAME_STATE.battleData.name = battleData.name
      //Game_2DUI.updateLapCounter(SceneData.player.lap, battleData.maxLaps);

      REGISTRY.SCENE_MGR.snowballArena.battleAboutToStart()
      
      //SceneData.player.updateLatency( battleData.,battleData.serverTime )

      const offset = 0.9; //add .9 seconds for server lag etc so countdown is clean and smooth
      //if reaches min
        
      const timeTillStartSeconds = (battleData.startTime - battleData.serverTime) / 1000;
      Game_2DUI.updateBattleStarting(Math.floor(timeTillStartSeconds) + 1);

      //Constants.SCENE_MGR.snowballArenaScene.startingBattle();

      GAME_STATE.battleData.startTime = Date.now() + (battleData.startTime - battleData.serverTime);
      
      //incase its open, close it
      //Constants.Game_2DUI.gameToStartHidePrompts();

      //start at 3 seconds
      /*if(timeTillStartSeconds == 3){
                SOUND_POOL_MGR.gameCountdown.playOnce()
            }else{
                //need to figure out how to start it
            }*/
      break;
    case "started":
      //DCL-INTEGRATE:game started
      
      setGameTimeLeft( battleData.endTime - battleData.startTime )

      REGISTRY.SCENE_MGR.snowballArena.startBattle()

      
      break;
    case "ended":
      //DCL-INTEGRATE:game over
      
      if (GAME_STATE.gameRoom) {
        const pVal = GAME_STATE.gameRoom.state.players.get(REGISTRY.player.sessionId);
        if (pVal) updatePlayerBattleData(pVal.battleData as clientState.PlayerBattleDataState);
      }

      REGISTRY.SCENE_MGR.snowballArena.endBattle()
      
      break;
  } 
} 
function updatePlayerData(player:clientState.PlayerState){
  REGISTRY.player.sessionId = player.sessionId;
  REGISTRY.player.serverState = player
  REGISTRY.player.setColor(  player.battleData.teamId === CONFIG.TEAM_BLUE_ID ? teamColor.BLUE : teamColor.RED )
  REGISTRY.player.name = player.userData.name
  
}
function updateTrackFeature(trackFeat: clientState.ITrackFeatureState) {
  const METHOD_NAME = "updateTrackFeature"
  switch(trackFeat.type){
    case 'ice-tile':
      const tile = iceGrid.getBlockById(trackFeat.name)
      if(tile !== undefined){
        //tile.health = 
        if(tile.visible && trackFeat.health.current <= 0 ){
          log(METHOD_NAME,"set destroy time",tile.id)
          tile.destoryTime = trackFeat.lastTouchTime
          tile.activateTime = trackFeat.activateTime
        }
        tile.updateHealth(trackFeat.health.current)
      }else{
        log(METHOD_NAME,"WARNING","could not find feature to update",trackFeat.type,trackFeat.name)
      }
      break;
    case 'fireplace':
      //TODO
      const fire = fireCampController.getFireById(trackFeat.name)
      if(fire !== undefined){
        fire.fireCampState = trackFeat.health.current
        fire.checkFireState()
      }else{
        log(METHOD_NAME,"WARNING","could not find feature to update",trackFeat.type,trackFeat.name)
      }
      break;
    case 'trench':
      const trench = snowTrenchController.getTrenchById(trackFeat.name)
      if(trench !== undefined){
        trench.health = trackFeat.health.current
        trench.checkHealth()
      }else{
        log(METHOD_NAME,"WARNING","could not find feature to update",trackFeat.type,trackFeat.name)
      }
      break;
    case 'powerup':
        const powerup = powerupController.getPowerup(trackFeat.name)
        if(powerup !== undefined){
          powerup.activateTime = trackFeat.activateTime
          powerup.pickupTime = trackFeat.lastTouchTime
          //powerup.last = trackFeat.health.current
          powerup.checkState()
        }else{
          log(METHOD_NAME,"WARNING","could not find feature to update",trackFeat.type,trackFeat.name)
        }
        break;
    default:
      log(METHOD_NAME,"WARNING","unrecognized feature to update",trackFeat.type,trackFeat.name)
  }
}


function updateEnemyData(room:Room<any>,enemy:OtherPlayer,player:clientState.PlayerState){
  if(isNull(enemy)){
    log("updateEnemyData","enemy was null, unable to update!",enemy,player)
    return;
  }
  enemy.setUserId( player.userData.userId )
  enemy.setName( player.userData.name )
  enemy.setColor( player.battleData.teamId === CONFIG.TEAM_BLUE_ID ? teamColor.BLUE : teamColor.RED )

  if(player.connStatus === 'lost connection' || player.connStatus === 'disconnected'){
    if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
      const enemySpawnCount = getEnemySpawnCount(player);
      for (let i = 0; i < enemySpawnCount; i++) {
        const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
        //TODO ADD PREDICTION VERSION IN HERE
        const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)
        if(notNull(enemy)){
          REGISTRY.player.enemyManager.removeEnemy( player.sessionId )
        }else{
          log("updateEnemyData","enemy was null, unable to update!",enemy,player)
        }
        //enemy.teamPosition = member.position
      }
    }
  }
}
function updateGameStartPos() {
  if (!GAME_STATE.battleData.started && !GAME_STATE.battleData.ended) {
    
  }
}
function updateTeamScores(){
  const blueTeam = GAME_STATE.gameRoom.state.enrollment.teams.get(CONFIG.TEAM_BLUE_ID)
  const redTeam = GAME_STATE.gameRoom.state.enrollment.teams.get(CONFIG.TEAM_RED_ID)
  
  gameUI.updateUIScores(blueTeam.score,redTeam.score)
}
function updateEnrollment(enrollment: clientState.EnrollmentState) {
  log("updateEnrollment", enrollment, Math.round((enrollment.endTime - enrollment.serverTime) / 1000));

  updateGameStartPos();

  GAME_STATE.battleData.maxPlayers = enrollment.maxPlayers;
  
  


  //loop teams sum it up
  let totPlayers = 0 
  let totMaxPlayers = 0 
  let minTotalPlayer = 0 
  enrollment.teams.forEach((teamState:clientState.TeamState)=>{
    //const teamState:clientState.TeamState = enrollment.teams[p]
    totPlayers += teamState.members !== undefined ? teamState.members.size : 0
    totMaxPlayers += teamState.maxPlayers
    minTotalPlayer += teamState.minPlayers
  })
  GAME_STATE.battleData.maxTotalTeamPlayers = totMaxPlayers  
  GAME_STATE.battleData.totalPlayers = totPlayers  
  GAME_STATE.battleData.minTotalTeamPlayers = minTotalPlayer//TODO enrollment.mi;

  if (enrollment.open) {
    //DCL-INTEGRATE:enrolling started, game not started
    Game_2DUI.showGameStartMsg(true);

    if(totPlayers >= minTotalPlayer ){
      let clockCounter = Math.round((enrollment.endTime - enrollment.serverTime) / 1000)
      log("updateEnrollment","set clock",clockCounter,"totPlayers",totPlayers,"minTotalPlayer",minTotalPlayer)
      Game_2DUI.updateGameStartWaiting(clockCounter);
    }else{
      //kill counter
      log("updateEnrollment","kill counter","totPlayers",totPlayers,"minTotalPlayer",minTotalPlayer)
      Game_2DUI.updateGameStartWaiting(0);
      gameUI.setGameTimeValue( "--:--" )  
    }
  } else {
    //DCL-INTEGRATE:enrolling ended, game about to start
    Game_2DUI.showGameStartMsg(false);
  }
}

export async function onSnowballFightConnect(room: Room) {
  GAME_STATE.setGameRoom(room);

  GAME_STATE.setGameConnected("connected");

  if (room.name.indexOf("lobby") > -1) {
    //FIXME need to share common on lobby connect logic!!!
    onLobbyConnect(room);
  } else {
    onLevelConnect(room);
  }
}

export function onDisconnect(room: Room, code?: number) {
  //ENEMY_MGR.removeAllPlayers();

  //room.removeAllListeners()

  GAME_STATE.setGameConnected("disconnected");

  Game_2DUI.updateLeaderboard("Disconnected", []);
}

function updateLevelData(levelData: clientState.LevelDataState) {
  //TODO level rules go here? like boost amounts ??? or make a updateCarData one?
  //TODO manipulate the level data
  /*const lvl = levelManager.getCurrentLevel();

  GAME_STATE.battleData.id = levelData.id;

  lvl.maxLaps = levelData.maxLaps;
  if (levelData.name) {
    lvl.name = levelData.name;
    GAME_STATE.battleData.name = levelData.name;
  }

  
  //set values specific to this level
  //the challenge is i want gameData to override level data
  GAME_STATE.battleData.maxLaps = levelData.maxLaps;
  */
}

let lastStateChangeTime = Date.now();

const updateLoaderboardCounter = new IntervalUtil(CONFIG.GAME_RANK_SORT_FREQ_MILLIS, "abs-time");

export function updateLeaderboard(room: Room<clientState.BattleRoomState>) {
  //log("updateLeaderboard")
  //throttle this if written to fast, maybe shift it to a system?
  if (!updateLoaderboardCounter.update()) {
    //log("updateLeaderboard. skipped")
    return;
  }
  //debugger
  //(room.state.players).stats
  if (!room || !room.state) {
    Game_2DUI.updateLeaderboard("Players", []);
    return;
  }

  const playerDataRanked = sortPlayersByPosition(room.state.players);

  

  const blueTeam = room.state.enrollment.teams.get(CONFIG.TEAM_RED_ID)
  const redTeam = room.state.enrollment.teams.get(CONFIG.TEAM_BLUE_ID)
  
  Game_2DUI.updateGameCount(blueTeam.members.size+redTeam.members.size, GAME_STATE.battleData.maxPlayers, GAME_STATE.battleData.minTotalTeamPlayers);
  Game_2DUI.updateGameCountB(blueTeam.members.size, blueTeam.maxPlayers,blueTeam.minPlayers);
  Game_2DUI.updateGameCountR(redTeam.members.size, redTeam.maxPlayers,redTeam.minPlayers);
  Game_2DUI.updateGameCountMin(GAME_STATE.battleData.totalPlayers,GAME_STATE.battleData.minTotalTeamPlayers,redTeam.minPlayers);
  

  //debugger
  Game_2DUI.updateLeaderboard("Players", playerDataRanked);
}


function onLevelConnect(room: Room<clientState.BattleRoomState>) {
  //initLevelData(room.state.levelData)
 
  //start fresh

  REGISTRY.SCENE_MGR.snowballArena.onConnect( room )

  room.onMessage("inGameMsg", (data) => {
    log("room.msg.inGameMsg", data);
    if (data !== undefined && data.msg === undefined) {
      GAME_STATE.notifyInGameMsg(data);
      ui.displayAnnouncement(data, 8, Color4.White(), 60);
    }else{
      //if (message !== undefined && message.msg === undefined) {
        GAME_STATE.notifyInGameMsg(data.msg);
        ui.displayAnnouncement(data.msg, data.duration !== undefined ? data.duration : 8, Color4.White(), 60);
      //}
    }
 
    //ui.displayAnnouncement(`${highestPlayer.name} wins!`, 8, Color4.White(), 60);
    //ui.displayAnnouncement(message, 8, Color4.White(), 60);
    //GAME_STATE.setGameEndResultMsg()
  });
  
  room.onMessage('throwBall', (data:serverStateSpec.BallThrowData) => {
    log("onMessage.throwBall", data);
    const myBall = REGISTRY.player.sessionId == data.id
    if (myBall) {
      log("onMessage.throwBall","thrown by you, skipping")
      return;
    }
    log('SERVER: BALLTHROW : ' + data.teamColor)
    let color = data.teamColor == CONFIG.TEAM_BLUE_ID ? teamColor.BLUE : teamColor.RED
    REGISTRY.player.ballManager
      .spawnBall(color, myBall, data.type)
      .throwBallOther(
        new Vector3(data.pos.x, data.pos.y, data.pos.z),
        new Vector3(data.dir.x, data.dir.y, data.dir.z),
        data.force 
      )
      
      const throwSessionId = data.playerIdFrom
      //not part of same if statement for lag testing, player gets an enemy version of themself
      if (throwSessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        const enemySpawnCount = getEnemySpawnCount({sessionId:throwSessionId});
        for (let i = 0; i < enemySpawnCount; i++) {
          const sessionId = i == 0 ? throwSessionId : throwSessionId + "-" + i;
          const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)
          if(notNull(enemy)){
            //enemy.teamPosition = member.position
            //TODO trigger throw from player????
            enemy.PlayThrowAnimation() 
          }else{
            log("onMessage.throwBall","enemy was null, unable to update!",enemy,REGISTRY.player)
          }
        }
      }
  })
 
  room.onMessage("player.death", (data:serverStateSpec.PlayerGiveDamageDataState) => {
    log("onMessage.player.death", data);
    
    if (data.playerIdTo == room.sessionId) {
      log("onMessage.player.death","you died, respawn ")
      //ui.displayAnnouncement("you died")
      REGISTRY.SCENE_MGR.snowballArena.thisPlayerDeath(data)
    }else{
      //ui.displayAnnouncement("someone else died")
      log("onMessage.player.death","someone died")
      //data.playerIdFrom use this to find who did the kill
      const killedSessionId = data.playerIdTo
      //not part of same if statement for lag testing, player gets an enemy version of themself
      if (killedSessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        const enemySpawnCount = getEnemySpawnCount({sessionId:killedSessionId});
        for (let i = 0; i < enemySpawnCount; i++) {
          const sessionId = i == 0 ? killedSessionId : killedSessionId + "-" + i;
          //ENEMY_MGR.removePlayer(sessionId);
          const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)

          if(data.playerIdFrom == room.sessionId){
            //this player killed them
            //tag:TODO-PLACE-AUDIO
            SOUND_POOL_MGR.destructibleBreakSound.playOnce()
          }
          //play death
          //enemy.updateHealth(healthData.current,healthData.max)
        }
      }
    }
  })

  room.onMessage("ended.roomAboutToDisconnect", (data) => {
    log("onMessage.ended.roomAboutToDisconnect", data);

    //do end of battel stuff here. stats and what not will have been saved

    //this is not called as much, maybe cuz clients disconnect themself??
    
    //ui.displayAnnouncement("onMessage.ended.roomAboutToDisconnect TODO")

    //allRooms = rooms;
    //update_full_list();
    //clear then out
    utils.setTimeout(CONFIG.GAME_LEADEBOARD_END_GAME_RELOAD_DELAY_MILLIS, () => { 
        log("onMessage.ended.roomAboutToDisconnect calling fetchRefreshPlayerCombinedInfo",)
        REGISTRY.SCENE_MGR.lobby.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX})
        refreshUserData()
    });

    log("Received ended.roomAboutToDisconnect");
  });

  room.onMessage("showError", (data) => {
    log("onMessage.showError", data);
    //allRooms = rooms;
    //update_full_list();
    //clear then out
    Game_2DUI.showErrorPrompt(data.title, data.message);
    log("Received onMessage.showError");
  });

  //NO LONGER A THING, USING STATE
  /*
    room.onMessage("setup.initLevelData", (data:LevelDataState) => {
        log("onMessage.setup.initLevelData",data)
        //allRooms = rooms;
        //update_full_list();

        log("Received ended.initLevelData",data);

        initLevelData(data)

    });*/

  room.onStateChange((state: clientState.BattleRoomState) => {
    const now = Date.now();
    //reports when anything in state changes
    //log("level state.onStateChange:", (now-lastStateChangeTime),"ms");
    lastStateChangeTime = Date.now();
  });

  room.state.listen("battleData", (battleData: clientState.BattleState) => {
    log("room.state.listen.battleData", battleData);
    updateBattleData(battleData);
  });
  room.state.battleData.onChange = (changes: DataChange<any>[]) => {
    log("room.state.battleData.onChange", changes);
    updateBattleData(room.state.battleData);
  };

  room.state.listen("levelData", (levelData: clientState.LevelDataState) => {
    log("room.state.levelData.listen", levelData);
    updateLevelData(room.state.levelData);
 
    //if (!levelData.trackFeatures.onAdd) {
      //for some reason null at the beginning
      levelData.trackFeatures.onAdd = (trackFeat: clientState.ITrackFeatureState, sessionId: string) => {
        log("room.state.levelData.trackFeatures.onAdd", trackFeat.name, trackFeat);
        
        trackFeat.onChange = (changes: DataChange<any>[]) => {
          //log("room.state.levelData.trackFeatures.trackFeat.onChange", trackFeat.name, trackFeat);
          updateTrackFeature(trackFeat)
        };
        trackFeat.listen("health", (levelData: clientState.LevelDataState) => {
          //log("room.state.levelData.trackFeatures.trackFeat.listen.health", trackFeat.name, trackFeat);
          updateTrackFeature(trackFeat)
        }) 
        trackFeat.health.onChange = (changes: DataChange<any>[]) => {
          //log("room.state.levelData.trackFeatures.trackFeat.health.onChange", trackFeat.name, trackFeat);
          updateTrackFeature(trackFeat)
        }
      };
    //}
  });
  room.state.levelData.onChange = (changes: DataChange<any>[]) => {
    log("room.state.levelData.onChange", changes);
    
  };
  /*room.state.levelData.trackFeatures.onChange = (inst:any, sessionId: any)=>{
        log("room.state.levelData.trackFeatures.onChange",inst)
    }*/
  //room.state.levelData.localtrackFeatures.onCh
  room.state.enrollment.onChange = (changes: DataChange<any>[]) => {
    log("room.state.enrollment.onChange", changes);
    

    updateEnrollment(room.state.enrollment);
  };
  room.state.listen("enrollment", (enrollment: clientState.EnrollmentState) => {
    log("room.state.listen.enrollment", enrollment);

    updateEnrollment(enrollment);

    room.state.enrollment.teams.onAdd = (team: clientState.TeamState, sessionId: string) => {
      log("room.state.enrollment.teams.onAdd", team);
      //
      team.onChange = (changes: DataChange<any>[]) => {
        log("team.onChange", team.id);
        updateTeamScores()
      };
      team.listen("score", (val: number) => {
        log("team.listen.score", team.id,val);
        updateTeamScores()
      })
      team.members.onAdd = (member: clientState.TeamMemberState, sessionId: string) => {
        log("team.members.onChange", team.id,member.playerId);
        if (REGISTRY.player.sessionId == room.sessionId) {
          REGISTRY.player.teamPosition = member.position
        }

        if (REGISTRY.player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
          //log("room.state.players.onAdd","adding enemy from ",player.battleData.teamId,"team")
          const enemySpawnCount = getEnemySpawnCount(REGISTRY.player);
          for (let i = 0; i < enemySpawnCount; i++) {
            const sessionId = i == 0 ? REGISTRY.player.sessionId : REGISTRY.player.sessionId + "-" + i;
            //TODO ADD PREDICTION VERSION IN HERE
            const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)
            if(notNull(enemy)){
              enemy.teamPosition = member.position
            }else{
              log("team.members.onChange","enemy was null, unable to update!",enemy,REGISTRY.player)
            }
          }
        }
      };
    }
  });

  

  room.state.players.onAdd = (player: clientState.PlayerState, sessionId: string) => {
    log("room.state.players.onAdd", player);
    //const playerCallbacks:PlayerInst = (player as PlayerInst)

    //player.battleData.carScenePosition

    if (player.sessionId == room.sessionId) {
      log("room.state.players.onAdd","adding YOU on ",player.battleData.teamId,"team")
      updatePlayerData(player)
    }
    //not part of same if statement for lag testing, player gets an enemy version of themself
    if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
      log("room.state.players.onAdd","adding enemy from ",player.battleData.teamId,"team")
      const enemySpawnCount = getEnemySpawnCount(player);
      for (let i = 0; i < enemySpawnCount; i++) {
        const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
        //TODO ADD PREDICTION VERSION IN HERE
        const enemy = REGISTRY.player.enemyManager.addEnemy(sessionId)

        updateEnemyData(room,enemy,player)
      }
    }


    //if full properties change
    player.onChange = (changes: DataChange<any>[]) => {
      //log("player.onChange",changes)
      if (player.sessionId == room.sessionId) {
        //update local player
        updatePlayerData(player)
      }
      //not part of same if statement for lag testing, player gets an enemy version of themself
      if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        //log("room.state.players.onAdd","adding enemy from ",player.battleData.teamId,"team")
        const enemySpawnCount = getEnemySpawnCount(player);
        for (let i = 0; i < enemySpawnCount; i++) {
          const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
          //TODO ADD PREDICTION VERSION IN HERE
          const enemy = REGISTRY.player.enemyManager.getEnemyByID(sessionId)
          
          if(notNull(enemy)){
            updateEnemyData(room,enemy,player)
          }else{
            log("player.onChange","enemy was null, unable to update!",enemy,player)
          }
          
        }
      }
    };


    //const playerState:PlayerState = (player as PlayerInst)
    updateLeaderboard(room);

    /*
        player.buttons.listen("forward", (forward: boolean) => {
            log("player.listen.buttons.forward",player.userData.name,forward,scene.player.MOVE_FORWARD)

            if(player.sessionId == scene.player.sessionId){
                //scene.player.MOVE_FORWARD = forward
            }else{
                const enemy = ENEMY_MGR.getPlayerByID(player.sessionId)
                if(enemy ){
                    enemy.state.MOVE_FORWARD = forward
                }
            }
            //refreshLeaderboard();
        }); */

    //listens to changes to healthData object reference
    player.listen("healthData", (healthData: clientState.PlayerHealthDataState) => {
      log("player.listen.healthData", healthData);
      //healthData.lastDamageFrom

      updatePlayerHealth(room, player, healthData);
    });
    player.healthData.listen("current", (val: any) => {
      log("player.healthData.listen.current", val);
      updatePlayerHealth(room, player, room.state.players.get(player.sessionId).healthData);
    });
    //listens to individual property changes
    player.healthData.onChange = (changes: DataChange<any>[]) => {
      log("player.healthData.onChange", changes);
      updatePlayerHealth(room, player, room.state.players.get(player.sessionId).healthData);
    };

    //listens to changes to healthData object reference
    player.listen("statsData", (statsData: clientState.PlayerStatsDataState) => {
      log("player.listen.statsData", statsData);

      if (!player.statsData.kills.onAdd) {
        player.statsData.kills.onAdd = (kill: clientState.PlayerStatsKillDataState, sessionId: string) => {
          log("player.statsData.kills.onAdd", kill);
          //current player
          if (player.sessionId == REGISTRY.player.sessionId) {
            
          }
        };
      }
      //healthData.lastDamageFrom
    });

    //listens to individual property changes
    player.healthData.onChange = (changes: DataChange<any>[]) => {
      log("player.statsData.onChange", changes);
      
      //updateGameData(room.state.battleData)
    };

    player.listen("buttons", (buttons: clientState.PlayerButtonState) => {
      //log("player.listen.buttons",buttons)

      if (player.sessionId == REGISTRY.player.sessionId) {
        //scene.player.MOVE_FORWARD = forward
      }
      //not part of same if statement for lag testing, player gets an enemy version of themself
      if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        const enemySpawnCount = getEnemySpawnCount(player);
        for (let i = 0; i < enemySpawnCount; i++) {
          const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
          const enemy = undefined//ENEMY_MGR.getPlayerByID(sessionId);
          if (enemy) {
            //do enemy stuff
          //}
            enemy.state.shoot_btn_down = buttons.shoot;
            //enemy.state. = buttons.shoot
          }
        }
      }
      //refreshLeaderboard();
    });
    player.battleData.listen("teamId", (carModelId: string) => {
      //log("player.battleData.listen.carModelId", carModelId);

      if (player.sessionId != REGISTRY.player.sessionId) {
        /*const enemy = ENEMY_MGR.getPlayerByID(player.sessionId);
        if (enemy) {
          enemy.updateCarModelById(carModelId, "snowball");
        }*/
      }
      //refreshLeaderboard();
    });

    player.listen("battleData", (battleData: clientState.PlayerBattleDataState) => {
      //scene.player.closestPointID
      if (player.sessionId == REGISTRY.player.sessionId) {
        //scene.player.serverState = player
        updatePlayerBattleData(battleData);
      }
      if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        const enemySpawnCount = getEnemySpawnCount(player);
        for (let i = 0; i < enemySpawnCount; i++) {
          const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
          //not part of same if statement for lag testing, player gets an enemy version of themself
          //do player update stuff
          REGISTRY.player.enemyManager.updatePlayerPos(
            sessionId,
            battleData.worldPosition.x,
            battleData.worldPosition.y,
            battleData.worldPosition.z,
            battleData.cameraDirection.x,
            battleData.cameraDirection.y,
            battleData.cameraDirection.z,
            battleData.cameraDirection.w
          )
        }
      }
      updateLeaderboard(room);
    });
    player.userData.listen("name", (name: string) => {
      if (player.sessionId == REGISTRY.player.sessionId) {
        //scene.player.serverState = player
      }
      //not part of same if statement for lag testing, player gets an enemy version of themself
      if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
        //const enemy = ENEMY_MGR.getPlayerByID(player.sessionId);
        //enemy.setName(name);
      }
    });
  };

  // when a player leaves, remove it from the leaderboard.
  room.state.players.onRemove = (player: clientState.PlayerState, key: any) => {
    log("room.state.player.onRemove");
    //allPlayers = allPlayers.filter((player) => instance.id !== player.id);

    if (player.sessionId == REGISTRY.player.sessionId) {
      //SceneData.player.battleServerState = undefined;

      REGISTRY.player.serverState = undefined
    }
    //not part of same if statement for lag testing, player gets an enemy version of themself
    if (player.sessionId != room.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED) {
      const enemySpawnCount = getEnemySpawnCount(player);
      for (let i = 0; i < enemySpawnCount; i++) {
        const sessionId = i == 0 ? player.sessionId : player.sessionId + "-" + i;
        //ENEMY_MGR.removePlayer(sessionId);
        REGISTRY.player.enemyManager.removeEnemy(sessionId)
      }
    }

    updateLeaderboard(room);
  };

  room.onLeave(() => {
    //allPlayers = [];
    //update_full_list();
    log("Bye, bye!");
  });

  room.onLeave((code) => {
    log("onLeave, code =>", code);
  });
}

function onLobbyConnect(lobby: Room) {
  function update_full_list() {
    //debugger
    const roomNames: string[] = [];
    for (const p in allRooms) {
      roomNames.push(JSON.stringify({ clients: allRooms[p].clients, roomId: allRooms[p].roomId }));
    }
    //debugger
    Game_2DUI.updateLeaderboard("Rooms", []);
  }

  lobby.onStateChange((state) => {
    log("Custom lobby state:", state);
  });

  lobby.onMessage("rooms", (rooms) => {
    log("onMessage.rooms", rooms);
    allRooms = rooms;
    update_full_list();

    log("Received full list of rooms:", allRooms);
  });

  lobby.onMessage("+", ([roomId, room]) => {
    log("onMessage.room.+", roomId, room);
    let roomIndex = -1;
    let counter = 0;
    for (const p in allRooms) {
      if (allRooms[p].roomId == roomId) {
        roomIndex = counter;
        break;
      }
      counter++;
    }
    if (roomIndex !== -1) {
      allRooms[roomIndex] = room;
    } else {
      allRooms.push(room);
    }
    update_full_list();
  });

  lobby.onMessage("-", (roomId) => {
    log("onMessage.room.-", roomId);
    allRooms = allRooms.filter((room) => room.roomId !== roomId);

    update_full_list();
  });

  lobby.onLeave(() => {
    allRooms = [];
    //update_full_list();
    log("Bye, bye!");
  });

  lobby.onLeave((code) => {
    log("onLeave, code =>", code);
  });
}

const ZERO_Q = new Quaternion(0, 0, 0, 0);
