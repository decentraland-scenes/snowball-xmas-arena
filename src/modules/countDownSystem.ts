import { CONFIG } from "src/config"
//import { PlayerRaceDataState } from "src/og-decentrally/modules/connection/state/server-state-spec"
import { IntervalUtil } from "src/utils/interval-util"
import { GAME_STATE } from "src/state"

//import { Player, player } from "./player"
import * as gameUI from 'src/modules/ui'

const updateCountDownInterval = new IntervalUtil(500)


export class CountDownSystem implements ISystem{
    
	enabled:boolean = false
    timeInSeconds:number = 0
  
    constructor(){
      //this.playerRef = _player
    }
     update(dt: number) {
		if(!this.enabled) return;
		
		if(GAME_STATE.gameConnected !== "connected"){
			gameUI.updateGameTime( 0 )
			return;
		} 
		this.timeInSeconds -= dt

		//log("this.timeInSeconds",this.timeInSeconds,dt)
		
        if(updateCountDownInterval.update(dt)){
			
			gameUI.updateGameTime( this.timeInSeconds )
			
          //log("SENDING POS")
        }
      }  
  }


const countDownSystem = new CountDownSystem();
engine.addSystem(countDownSystem)

export function setGameTimeLeft(_timeInMS:number){
	countDownSystem.timeInSeconds = _timeInMS / 1000
	gameUI.updateGameTime( countDownSystem.timeInSeconds )
}
export function setGameTimeLeftActive(val:boolean){
	//countDownSystem.
	countDownSystem.enabled = val
} 