import * as utils from '@dcl/ecs-scene-utils';
import { getCurrentRealm, isPreviewMode } from '@decentraland/EnvironmentAPI'
//import { connect } from './connection'


import { Room } from 'colyseus.js'
import { GAME_STATE } from './state'
import { initRegistry, REGISTRY } from './registry'
import { CONFIG, initConfig } from './config'
import * as gameUI from 'src/modules/ui'
import { CountdownBanner, CountdownTimerSystem } from './modules/countdown';
import { CommonResources } from './resources/common';
import { comingSoon } from './modules/level';



const countdownSystem = new CountdownTimerSystem()
export function determinIfGameLive(){
  log("determinIfGameLive","makeGameLive")
  let eventTime1 = CONFIG.GAME_ACTIVE_TIME
  const live = eventTime1-(Date.now()) <= 0 //it is now live
  log("makeGameLive",new Date(eventTime1),eventTime1-(Date.now()),"live",live)

  makeGameLive( live )

  

  //40, 6, 8
  const baseX = 40
  const baseY = 6
  const baseZ = 8


  if(!live){
    countdownSystem.addCounter(
        new CountdownBanner(
            "Snowball Fight",
            eventTime1
            , new Transform({
                position: CONFIG.center.clone(),
                rotation: Quaternion.Euler(0,-90,0),
                scale: new Vector3(0.3,0.3,0.3)
            })
            ,CommonResources.RESOURCES.models.instances.countdownFrame
            ,new Transform({
              position: new Vector3(0,0,0), 
              //rotation: tf.rotation.clone(), 
              scale: new Vector3(1.2,1,1.2)
            }),
            undefined
            ,()=>{
              determinIfGameLive()
            }
        )
    )
    REGISTRY.SCENE_MGR.lobby.addCountDownToBoards( countdownSystem, !live )
  }


  
  if(!live){
    log("determinIfGameLive","makeGameLive","countdown added")
    engine.addSystem( countdownSystem )
  }else{
    log("determinIfGameLive","makeGameLive","countdown removed")
    engine.removeSystem(countdownSystem)
  }

}
export function makeGameLive(val:boolean){
  log("makeGameLive",val)
  CONFIG.IS_GAME_LIVE = val

  if(val){
    //pop menu immediatly so its clear they are not in game
    //TODO consider only popping first time???
    gameUI.createButtonsBaseOnScene(true,'lobby')
    if(comingSoon.alive) engine.removeEntity(comingSoon)


    if(countdownSystem !== undefined && countdownSystem.countdownBanners !== undefined)
    for(const p in countdownSystem.countdownBanners){
      countdownSystem.countdownBanners[p].removeText()
    }
    REGISTRY.SCENE_MGR.lobby.addCountDownToBoards( countdownSystem, false )
  }else{
    //game off
    //pop menu immediatly so its clear they are not in game
    //TODO consider only popping first time???
    gameUI.createButtonsBaseOnScene(false,'lobby')
    gameUI.showGameMenu(false)
    gameUI.showArenaGameUI(false)

    if(!comingSoon.alive) engine.addEntity(comingSoon)

  }
}

