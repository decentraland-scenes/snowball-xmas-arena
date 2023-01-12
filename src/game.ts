import * as utils from '@dcl/ecs-scene-utils';
import { getCurrentRealm, isPreviewMode } from '@decentraland/EnvironmentAPI'
//import { connect } from './connection'


import { Room } from 'colyseus.js'
import { GAME_STATE } from './state'
import { initRegistry, REGISTRY } from './registry'
import { CONFIG, initConfig } from './config'
//import { player, scene } from './og-decentrally/modules/scene'
import * as battleConn from 'src/snowball-fight/connection/onConnect';
import { BattleDataOptions } from './snowball-fight/connection/state/server-state-spec';
import { getUserData } from '@decentraland/Identity';

import { createDebugUIButtons } from './ui/ui-hud-debugger';
import { initPlayer } from './modules/player';
import { initModeArea } from './modules/test_environment';
import { initControls } from './modules/controls';
import { isNull } from './utils/utilities';
import { joinOrCreateRoom } from './connection/connect-flow';
import { initSceneMgr } from './snowball-fight/sceneManager';
import { MapSetUp } from './tactics/mapSetUp';
import { initUI, throwForceContainerVisible } from './modules/ui';
import { initLegacyUI } from './modules/ui/ui-battle-hud';
import { bootStrapClaimingDropins } from './claiming-dropin/bootstrapClaiming';
import { initClaimConfig } from './claiming-dropin/claiming/loot-config';
import { initDispenserPositions, initSceneClaiming } from './modules/claiming/claimSetup';
import { RewardsPrompt } from './modules/rewardPrompt';
import { toggleGameResultsPrompt } from './ui/ui-battle-prompts';
import * as gameUI from 'src/modules/ui'
import { CountdownBanner, CountdownTimerSystem } from './modules/countdown';
import { CommonResources } from './resources/common';
import { comingSoon } from './modules/level';
import { determinIfGameLive } from './goLiveChecks';
import { initUserData } from './utils/userData';
import { cacheUserData } from './snowball-fight/init';



initConfig()

function doPlayerMainLogin(){
    
  if(!GAME_STATE.playerState.loginSuccess){
      REGISTRY.doLoginFlow(
          {
            onSuccess:()=>{
              //fetch leaderboards
            }
          }
        )
      //GAME_STATE.playerState.requestDoLoginFlow()
  }else{
      log("onEnterSceneObservable.player already logged in: ", GAME_STATE.playerState.loginSuccess,GAME_STATE.playerState.loginFlowState)
  }
}

//TODO consider login button so dont waist logins on passer-bys
function addAutoPlayerLoginTrigger(){
  //only triggers on enter. does not trigger on local if already in the scene. make a trigger instead so fires when inside?
  onEnterSceneObservable.add((player) => {
      log("onEnterSceneObservable.player entered scene: ", player.userId)
      //if(REGISTRY.player.userId == player.userId){ //can we check this?
      doPlayerMainLogin()
      RemoveDelay();
  })

  const centerEntity = new Entity();
  engine.addEntity(centerEntity)
  centerEntity.addComponent(new Transform({
    position:new Vector3(CONFIG.sizeX/2, 1, CONFIG.sizeZ/2),
    scale: new Vector3(1,.5,1)//scale: new Vector3(CONFIG.sizeX,1,CONFIG.sizeZ)
  }))
  if( CONFIG.DEBUGGING_ENABLED && CONFIG.DEBUGGING_UI_ENABLED ){
      /*centerEntity.addComponent( new BoxShape() )
      centerEntity.addComponent( new OnPointerDown(
          ()=>{},
          { 
              hoverText:"Centered in scene. (Only visible in debug mode)"
          }
      ) )*/
  }

  let triggerBox = new utils.TriggerBoxShape(new Vector3(CONFIG.sizeX,3,CONFIG.sizeZ), new Vector3(0, 1, 0))
  //workaround make a trigger also so fires when in local doing testing
  utils.addOneTimeTrigger(triggerBox, {
      onCameraEnter : () => {
          log("addOneTimeTrigger.onCameraEnter.player entered scene: ", REGISTRY.player.id)
          doPlayerMainLogin() 
      }
  },centerEntity)
}
function addPlayerLeaveSceneTrigger(){
  onLeaveSceneObservable.add(player => {
    if(player.userId !== REGISTRY.player.userId) {
      //log("//. Player Ids are different: "+player.userId+" != "+REGISTRY.player.userId)      
      return;
    }
    if(REGISTRY.player.isMovementControlled){
        //log("//. Player Didn't exist by choice");
        return;
    }
    //log("//. Player Left Scene");
    AddDelay();
  });
} 



const countdownTimer = new Entity();

function RemoveDelay(){
  //log("//. Stop Timer");
  if(countdownTimer.hasComponent(utils.Delay)) countdownTimer.removeComponent(utils.Delay)
}
function AddDelay(){
  //log("//. StartTimer Timer");
  startRefreshTimer(2000, (val)=> {
    //log("//. Timer Action")
    if(GAME_STATE.gameConnected ==='connected'){
      log("disconnecting player who walked off scene")
      REGISTRY.SCENE_MGR.snowballArena.exitBattle();
      REGISTRY.SCENE_MGR.lobby.enterLobby()
      gameUI.createButtonsBaseOnScene(false,'lobby')
    } 

  });
}

function startRefreshTimer(startAt: number, callback: (val: number) => void) {
  if(!countdownTimer.alive) engine.addEntity(countdownTimer);
  countdownTimer.addComponentOrReplace(
    new utils.Delay(startAt, () => {
    //log("//. Invoke Timer");
    callback.call(0, 0);
    })
  );
}

async function init(){
  initConfig()
  initRegistry()
  cacheUserData()
  initPlayer()
  initModeArea()
  initControls()

  bootStrapClaimingDropins()
  initClaimConfig()
  initSceneClaiming()
  initDispenserPositions()

 
  addPlayerLeaveSceneTrigger();

  REGISTRY.setDialogBoxOpen = (id:string,val:boolean)=>{
    log("setDialogBoxOpen",id,val)
    //handle when dialog box open logic
    if(val){//only disabling, renable should be handled by the system
      //also bug where when enabled shows single 1 charge 
      throwForceContainerVisible(!val)
    }
  }

  if(CONFIG.ENABLE_2D_UI) initLegacyUI()//want first so newer ui goes on
   
  if(CONFIG.ENABLE_2D_UI){
    const rewardPrompt = new RewardsPrompt()
    REGISTRY.rewardPrompt = rewardPrompt

    initUI() 
    REGISTRY.Game_2DUI.hideAll() 
  }
  
  
  initSceneMgr()
  addAutoPlayerLoginTrigger()
  
  determinIfGameLive() 
  
  gameUI.setGameTimeValue("--:--")

  REGISTRY.onConnectActions=(room:Room<any>,eventName:string)=>{
      battleConn.onSnowballFightConnect(room)
  }

  createDebugUIButtons()
}
 
init()

MapSetUp()


