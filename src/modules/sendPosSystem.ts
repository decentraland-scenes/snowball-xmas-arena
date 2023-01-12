import { CONFIG } from "src/config"
//import { PlayerRaceDataState } from "src/og-decentrally/modules/connection/state/server-state-spec"
import { IntervalUtil } from "src/utils/interval-util"
import { GAME_STATE } from "src/state"
import { PlayerBattleDataState } from "src/snowball-fight/connection/state/server-state-spec"
import { Player } from "./player"
//import { Player, player } from "./player"

const updatePlayerGameDataInterval = new IntervalUtil(CONFIG.SEND_GAME_DATA_FREQ_MILLIS)

 
const gameData:PlayerBattleDataState={ 
	//carScenePosition      : {x: 0,y: 0,z: 0},
	//closestProjectedPoint : {x: 0,y: 0,z: 0},
	endTime               : 0,
	//closestPointID        : 0,
	//closestSegmentID      : 0,
	//closestSegmentPercent : 0,
	//closestSegmentDistance: 0,
	//currentSpeed          : 0,
	shootDirection        : {x: 0,y: 0,z: 0,w: 0},
	cameraDirection       : {x: 0,y: 0,z: 0,w: 0}, //THIS
	worldPosition         : {x: 0,y: 0,z: 0}, //THIS
	teamId            : undefined,
	serverTime            : -1, //THIS
	racePosition          : -1,
	lap                   : -1,
	worldMoveDirection    : {x: 0,y: 0,z: 0,w: 0},
	lastKnownServerTime   : -1, //THIS
	lastKnownClientTime   : -1, //THIS
	enrollTime: -1
}


export class SendPlayerDataSystem {
    
    playerRef:Player
  
  
    constructor(_player:Player){
      this.playerRef = _player
    }
     update(dt: number) {
      
        if(updatePlayerGameDataInterval.update(dt)){
		
			if(GAME_STATE.gameConnected !== "connected"){
				return;
			}
			//{id: this.playerRef.id, pos: this.playerRef.cam.feetPosition , rot:this.playerRef.getHorizontalRotation()}

			const now = Date.now()
			//const lastKnowPos = new Vector3(racingData.worldPosition.x,racingData.worldPosition.y,racingData.worldPosition.z)
			//const delta = now-racingData.lastKnownClientTime
			
			gameData.worldPosition.x = this.playerRef.cam.feetPosition.x
			gameData.worldPosition.y = this.playerRef.cam.feetPosition.y
			gameData.worldPosition.z = this.playerRef.cam.feetPosition.z
			
			gameData.cameraDirection = this.playerRef.getHorizontalRotation()

			gameData.lastKnownServerTime = this.playerRef.lastKnowServerTime
				gameData.lastKnownClientTime = now//snaphot for when sent
		
	
			//this.playerRef.room?.send('playerPos',{id: this.playerRef.id, pos: this.playerRef.cam.feetPosition , rot:this.playerRef.getHorizontalRotation()})
			GAME_STATE.gameRoom.send("player.battleData.update",gameData)
			
          //log("SENDING POS")
        }
      }  
  }
