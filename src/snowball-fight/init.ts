import * as utils from "@dcl/ecs-scene-utils";
import { getUserData, UserData } from "@decentraland/Identity";
import { CONFIG } from "src/config";
//import { RaceData } from "src/og-decentrally/modules/race";
import { REGISTRY } from "src/registry";
//import { player, scene } from "src/og-decentrally/modules/scene";
//import { initLobbyScene } from "src/og-decentrally/modules/scene/lobby";
//import { initRacingScene } from "src/og-decentrally/modules/scene/race";
//import { initSceneMgr } from "src/og-decentrally/modules/scene/raceSceneManager";
//import { Constants.SCENE_MGR } from "src/og-decentrally/modules/scene/raceSceneManager";
import { GAME_STATE } from "src/state";
//import { createDebugUIButtons } from "src/og-decentrally/modules/ui/ui-hud-debugger";
import {
  getAndSetUserData,
  getAndSetUserDataIfNullNoWait,
  getUserDataFromLocal,
} from "src/utils/userData";
//import { levelManager } from "src/og-decentrally/tracks/levelManager";
//import { initSnowballFightScene } from "src/snowball-fight/modules/scene/snowballArena";
//import { TrackData } from "src/og-decentrally/modules/trackPlacement";

//const Constants.SCENE_MGR = Constants.Constants.SCENE_MGR

export async function cacheUserData() {
  try {
    getAndSetUserDataIfNullNoWait();
    log("success getAndSetUserDataIfNullNoWait", getUserDataFromLocal());
  } catch (e) {
    log("failed getAndSetUserDataIfNullNoWait", e);
    //error(e)
  }

  try {
    await getUserData();
    log("success getAndSetUserDataIfNullNoWait.getUserData");
  } catch (e) {
    log("failed getAndSetUserDataIfNullNoWait.getUserData", e);
    //error(e)
  }

  try {
    //DO THIS FIRST so have it going forward
    //load user data
    if (!getUserDataFromLocal()) {
      getAndSetUserData();
      //should we wait? or let the rest process
      log("success getAndSetUserDataIfNullNoWait.xxx", getUserDataFromLocal(), getUserDataFromLocal());
    } else {
      log("success getAndSetUserDataIfNullNoWait.yay", getUserDataFromLocal(), getAndSetUserData());
    }
  } catch (e) {
    log("failed getAndSetUserDataIfNullNoWait.getUserData.boo", e);
    //error(e)
  }

  //DO THIS FIRST so have it going forward
  //load user data
  if (!getUserDataFromLocal()) {
    //should we wait? or let the rest process
    getAndSetUserData();
  }

  //initSceneMgr();

  //TODO trackPath which is current just a curved path
  //do we create a parallel 2d array where index 0 ID == segement id and index 1 array is stuff that may be on there?
  //but need to be able to have overlapping datapoints
  //maybe just array type, start, end point, offset from center? - assumed parralell to track
  //GAME_STATE.trackData = new TrackData();
  //GAME_STATE.trackData.setTrackPath( levelManager.getCurrentLevel().trackPath)
  //TODO level manager should populate these too
  //GAME_STATE.trackData.setCheckPoints()
  //GAME_STATE.trackData.setTrackFeatures() OR GAME_STATE.trackData.addTrackFeature()
  //GAME_STATE.trackData.init(levelManager.getCurrentLevel());

  //GAME_STATE.raceData = new RaceData();

  //addAutoPlayerLoginTrigger()

  //initLobbyScene();
  //initRacingScene();
  //initSnowballFightScene();

  //if to opt
  if (CONFIG.LOAD_MODELS_DURING_SCENE_LOAD_ENABLED) {
    /*Constants.SCENE_MGR.snowballArenaScene.init();

    //Constants.SCENE_MGR.racingScene.init() 
    //FIXME some of the hiding only happens during reset
    //Constants.SCENE_MGR.racingScene.resetRace()
    //official hide
    //Constants.SCENE_MGR.racingScene.hide(true)
    Constants.SCENE_MGR.snowballArenaScene.hide(true);

    Constants.SCENE_MGR.lobbyScene.init();
    Constants.SCENE_MGR.lobbyScene.show();*/
  } 
  log("racing scene init");
  if (CONFIG.TEST_CONTROLS_ENABLE) {
    //load once scene is up
    utils.setTimeout(400, () => {
      try {
        //createDebugUIButtons();
      } catch (e) {
        log("failed to init debug buttons", e);
      }
    });
  } //END OF SHOW TEST BUTTONS

  onSceneReadyObservable.add(() => {
    log("SCENE LOADED");
  });
}

//startSnowballFightArena();
