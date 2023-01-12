import * as ui from '@dcl/ui-scene-utils'

import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config'
import { colyseusReConnect,  joinLobby, joinNewRoom, joinOrCreateRoom, leave } from 'src/connection/connect-flow'
//import { RacingScene } from '../scene/race'
import { Game_2DUI } from 'src/modules/ui/index'
import { GAME_STATE } from 'src/state'
//import { player, scene } from '../scene'
import {  logout, refreshUserData, resetLoginState } from 'src/login/login-flow'
import { REGISTRY } from 'src/registry'
//import { LeaderBoardManager } from '../scene/menu'
import { getAndSetUserData, getUserDataFromLocal } from 'src/utils/userData'
import * as serverStateSpec from 'src/snowball-fight/connection/state/server-state-spec'
import { teamColor } from 'src/modules/teamColors'
import { FrostUIType } from 'src/modules/frostedUISystem'
import { SnowBallLeaderboard } from 'src/modules/leaderboard'
import { isPlayerInArenaUI } from 'src/modules/ui'
import { RewardType } from 'src/types/types'
import * as levelResources from 'src/modules/level'
import { determinIfGameLive, makeGameLive } from 'src/goLiveChecks'




const textFont = new Font(Fonts.SansSerif)
 
const canvas = ui.canvas


const buttonPosSTART = -350
let buttonPosCounter = buttonPosSTART
let buttonPosY = -50//350
const buttomWidth = 121
const changeButtomWidth = 120
const changeButtomHeight = 16
 
const WORLD_MOVE_DIR_RIGHT = Quaternion.Euler(0,90,0)//right
const WORLD_MOVE_DIR_FWD = Quaternion.Euler(0,0,0)//forward
const WORLD_MOVE_DIR_BKWD = Quaternion.Euler(180,0,180)//backwards
 const WORLD_MOVE_DIR_LEFT = Quaternion.Euler(0,270,0)//left



function updateDebugButtonUI(testButton:ui.CustomPromptButton){
  if(changeButtomWidth>0) testButton.image.width = changeButtomWidth
  if(changeButtomHeight>0) testButton.image.height = changeButtomHeight
  testButton.label.fontSize -= 5
}
function boolShortNameOnOff(val:boolean){
  if(val) return "On"
  return "Off"
}
export async function createDebugUIButtons(){
  if(!CONFIG.TEST_CONTROLS_ENABLE){
    log("debug buttons disabled")
    return
  }
  log("debug buttons")

  await getAndSetUserData();
  let wallet = getUserDataFromLocal()?.publicKey;
  if (wallet) wallet = wallet.toLowerCase();
  let allowed = false;
  for (const p in CONFIG.ADMIN_WALLETS) {
    if (CONFIG.ADMIN_WALLETS[p] == "any") {
      allowed = true;
      break;
    }
    if (wallet == CONFIG.ADMIN_WALLETS[p]?.toLowerCase()) {
      allowed = true;
      break;
    }
  }

  log("allowed.debug.racing ", allowed, wallet);
  if (!allowed) return;

  let testButton:ui.CustomPromptButton = null
  
  const testControlsToggle = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  
  testControlsToggle.background.positionY = 350
  //testControls.background.visible = false
  testControlsToggle.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
   

  
  const testControls = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  
  const enableDisableToggle = testButton = testControlsToggle.addButton(
    'testTools.1:'+boolShortNameOnOff(!CONFIG.TEST_CONTROLS_DEFAULT_EXPANDED),
    buttonPosCounter,
    buttonPosY,
    () => { 
      log("enableDisableToggle " + testControls.background.visible)
      if(testControls.background.visible){
        testControls.hide()
        testControls.closeIcon.visible = testControls.background.visible
      }else{
        testControls.show()
        testControls.closeIcon.visible = testControls.background.visible
      }
      enableDisableToggle.label.value='testTools:'+boolShortNameOnOff(!testControls.background.visible)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(enableDisableToggle)
  
  buttonPosCounter += buttomWidth
    
  if(CONFIG.TEST_CONTROLS_DEFAULT_EXPANDED){
    testControls.show()
  }else{
    testControls.hide()
  }
    
  
  testControls.background.positionY = 350  
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  
  testControls.background.positionY = 350
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  




  testButton = testControls.addButton(
    'Reset:Battle',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.snowballArena.resetBattleArena()
    
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
  


  const tglBaseMap = testButton = testControls.addButton(
    'TGL:BaseMap',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      const newVal = !levelResources.level.alive
      if(newVal){
        engine.addEntity(levelResources.level)
      }else{
        engine.removeEntity(levelResources.level)
      }
      tglBaseMap.label.value = "TGL:tglBaseMap:"+!newVal 
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column


  const tglFence = testButton = testControls.addButton(
    'TGL:Fence',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      const newVal = !levelResources.fence.alive
      if(newVal){
        engine.addEntity(levelResources.fence)
      }else{
        engine.removeEntity(levelResources.fence)
      }
      tglFence.label.value = "TGL:Fence:"+!newVal 
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
    
  const tglArena = testButton = testControls.addButton(
    'TGL:Trees',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      const newVal = !levelResources.sharedTreeEntity.alive
      if(newVal){
        engine.addEntity(levelResources.sharedTreeEntity)
      }else{
        engine.removeEntity(levelResources.sharedTreeEntity)
      }
      tglArena.label.value = "TGL:Trees:"+!newVal 
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
  

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

  
  testButton = testControls.addButton(
    'Leave(T)',
    buttonPosCounter,
    buttonPosY,
    () => { 
      leave(true)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'Leave(F)',
    buttonPosCounter,
    buttonPosY,
    () => { 
      leave(false)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
   
  
  testButton = testControls.addButton(
    'ReConnnect',
    buttonPosCounter,
    buttonPosY,
    () => { 
      colyseusReConnect()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'NewRoom',
    buttonPosCounter,
    buttonPosY,
    () => { 
      joinNewRoom()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'JoinRoom',
    buttonPosCounter,
    buttonPosY,
    () => { 
      joinOrCreateRoom(CONFIG.GAME_SNOWBALL_ROOM_NAME)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  
  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART



testButton = testControls.addButton(
  'ReLoginFlow',
  buttonPosCounter,
  buttonPosY,
  () => { 
    resetLoginState()
    GAME_STATE.playerState.requestDoLoginFlow()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)
buttonPosCounter += buttomWidth //next column


testButton = testControls.addButton(
  'Logout',
  buttonPosCounter,
  buttonPosY,
  () => { 
    logout()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)

buttonPosCounter += buttomWidth //next column

testButton = testControls.addButton(
  'ReLoginPlafab',
  buttonPosCounter,
  buttonPosY,
  () => { 
    GAME_STATE.setLoginSuccess(false)
    GAME_STATE.playerState.loginFlowState='customid-success'
    REGISTRY.doLoginFlow()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)

buttonPosCounter += buttomWidth //next column


testButton = testControls.addButton(
  'RefreshUsrData',
  buttonPosCounter,
  buttonPosY,
  () => { 
    refreshUserData()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)
buttonPosCounter += buttomWidth //next column



testButton = testControls.addButton(
  'ForceLive',
  buttonPosCounter,
  buttonPosY,
  () => { 
    CONFIG.GAME_ACTIVE_TIME = Date.now() + 3000
    determinIfGameLive()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)
buttonPosCounter += buttomWidth //next column


  
  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

   


  testButton = testControls.addButton(
    'TGL:GO',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.showGo( !Game_2DUI.isGoVisible() )
    },
    ui.ButtonStyles.RED
  )  
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'TGL:WaitingToStart',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.updateGameStartWaiting(30)
      Game_2DUI.showGameStartMsg( !Game_2DUI.isGameStartMsgVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'TGL:GameEnded',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.setGameEndReasonText("time" + Date.now())
      Game_2DUI.showGameEnded( !Game_2DUI.isGameEndedVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'TGL:RaceResults',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.toggleGameResultsPrompt( !Game_2DUI.isGameResultsPromptVisible() ) //must call before update
      Game_2DUI.updateGameResultRows( GAME_STATE.getBattleRoom() ) //call after show
      
    },
    ui.ButtonStyles.RED 
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  
  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART


  testButton = testControls.addButton(
    'MV:Spawn',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.snowballArena.movePlayerToStartPointInArena()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
   
  buttonPosCounter += buttomWidth //next column
   

  testButton = testControls.addButton(
    'MV:ReSpawn',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.snowballArena.movePlayerToRespawnPointInArena()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton( 
    'GiveHealth',
    buttonPosCounter,
    buttonPosY,
    () => { 
      const giveHealth: serverStateSpec.PlayerRecieveHealthDataState={
        amount:1,
        time: Date.now(),
        desc:"healed by ball",
        playerIdFrom: "firePlace",
        playerIdTo: REGISTRY.player.sessionId,
        position: REGISTRY.player.cam.position
      }
      if(GAME_STATE.gameRoom !== undefined ){
        GAME_STATE.gameRoom.send('giveHealth', giveHealth )
      }else{
        log("no room to send: giveHealth")
      }
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  
  testButton = testControls.addButton(
    'GiveDamage',
    buttonPosCounter,
    buttonPosY,
    () => {  
      const giveHealth: serverStateSpec.PlayerGiveDamageDataState={
        amount:1,
        time: Date.now(),
        desc:"hit by ball",
        playerIdFrom: "ball",
        playerIdTo: REGISTRY.player.sessionId,
        position: REGISTRY.player.cam.position
      }
      if(GAME_STATE.gameRoom !== undefined ){
        GAME_STATE.gameRoom.send('enemyHit', giveHealth )
      }else{
        log("no room to send: enemyHit")
      }
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART


  testButton = testControls.addButton(
    'Join:Battle',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.snowballArena.initArena(true)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
   
  testButton = testControls.addButton(
    'Go:Battle',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.goArena()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Go:Lobby',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.goLobby()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  testButton = testControls.addButton(
    'Rfsh:Leaderboards',
    buttonPosCounter,
    buttonPosY,
    () => { 
      //Constants.SCENE_MGR.lobbyScene.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX})
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  

  testButton = testControls.addButton(
    'Go:Origin',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.snowballArena.movePlayerHere(new Vector3(0,0,0),CONFIG.centerGround)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART


  const testSwapBtn =  testButton = testControls.addButton(
    'TglAvatarSwap',
    buttonPosCounter,
    buttonPosY,
    () => { 
      const newVal = !REGISTRY.player.avatarSwapEnabled
      testSwapBtn.label.value="TglAvatarSwap:"+!newVal
      REGISTRY.player.setAvatarSwapEnabled( newVal )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
   
  testButton = testControls.addButton(
    'Ch:Krumpus',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.player.setColor(teamColor.BLUE)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Ch:Santa',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.player.setColor(teamColor.RED)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

    //NEW ROW//NEW ROW
    buttonPosY -= changeButtomHeight + 2
    buttonPosCounter = buttonPosSTART
  
  testButton = testControls.addButton(
    'PlayerHitUI',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.player.hitUISystem.showUI(FrostUIType.PLAYER_HIT, "", 3)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'PlayerDeathUI',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.player.hitUISystem.showUI(FrostUIType.PLAYER_DEATH, "by PLAYERNAME HERE \nWarm up and get back out there!", 8)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'TGL:Lderbrd',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.leaderboard.showLeaderboard( !REGISTRY.Game_2DUI.isLeaderboardVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Fke:Lderbrd',
    buttonPosCounter,
    buttonPosY,
    () => { 
      REGISTRY.SCENE_MGR.leaderboard.useFakeLeaderboard()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'Tgl:Menu:Area',
    buttonPosCounter,
    buttonPosY,
    () => { 
    
    isPlayerInArenaUI(true)

    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  testButton = testControls.addButton(
    'Tgl:Menu:Lobby',
    buttonPosCounter,
    buttonPosY,
    () => { 
      
      isPlayerInArenaUI(false)

    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Tgl:Menu:Lobby',
    buttonPosCounter,
    buttonPosY,
    () => { 
      //do menu toggle here
      //
      //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
      //

    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

      //NEW ROW//NEW ROW
      buttonPosY -= changeButtomHeight + 2
      buttonPosCounter = buttonPosSTART

      testButton = testControls.addButton(
        'Tgl:Rwd:Play',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.updateReward(RewardType.play)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column

      testButton = testControls.addButton(
        'Tgl:Rwd:Win',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.updateReward(RewardType.team)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column

      testButton = testControls.addButton(
        'Tgl:Rwd:Top3',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.updateReward(RewardType.top3)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column

      testButton = testControls.addButton(
        'Tgl:Rwd:Top1',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.updateReward(RewardType.top1)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column

      testButton = testControls.addButton(
        'Tgl:Rwd:Ratio',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.updateReward(RewardType.ratio)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column
  
      testButton = testControls.addButton(
        'Set:Rwd:Ratio5',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.setReward(RewardType.ratio, 6)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column

      testButton = testControls.addButton(
        'Set:Rwd:Top1',
        buttonPosCounter,
        buttonPosY,
        () => { 
          //do menu toggle here
          //
          //BLA - TODO UPDATE MENU-OPTIONS FOR LOBBY
          //
          REGISTRY.rewardPrompt.setReward(RewardType.top1, 1)
        },
        ui.ButtonStyles.RED
      )
      updateDebugButtonUI(testButton)
      
      buttonPosCounter += buttomWidth //next column
  


    //NEW ROW//NEW ROW
    buttonPosY -= changeButtomHeight + 2
    buttonPosCounter = buttonPosSTART

    
    testButton = testControls.addButton(
      'Add:balls',
      buttonPosCounter,
      buttonPosY,
      () => { 
        REGISTRY.player.incAmmo(1)
      },
      ui.ButtonStyles.RED
    )
    updateDebugButtonUI(testButton)
    
    buttonPosCounter += buttomWidth //next column

    testButton = testControls.addButton(
      'Set:balls:3',
      buttonPosCounter,
      buttonPosY,
      () => { 
        REGISTRY.player.setAmmo(3)
      },
      ui.ButtonStyles.RED
    )
    updateDebugButtonUI(testButton)
    
    buttonPosCounter += buttomWidth //next column

    testButton = testControls.addButton(
      'Set:balls:10',
      buttonPosCounter,
      buttonPosY,
      () => { 
        REGISTRY.player.setAmmo(10)
      },
      ui.ButtonStyles.RED
    )
    updateDebugButtonUI(testButton)
    
    buttonPosCounter += buttomWidth //next column
    
} 
 
