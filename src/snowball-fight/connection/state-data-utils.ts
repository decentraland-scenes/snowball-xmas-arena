import { GAME_STATE } from 'src/state';
import * as serverState from 'src/snowball-fight/connection/state/server-state-spec'
import * as clientState from 'src/snowball-fight/connection/state/client-state-spec'

import { CONFIG } from 'src/config';
import { isNull } from 'src/utils/utilities';
import { teamColor } from 'src/modules/teamColors';

export type PlayerRankingsType={
  gamePosition:number
  //totalProgre:number
  name:string
  id:string
  isPlayer:boolean
  endTime:number
  health:number
  healthMax:number
  score:number
  team:teamColor
  connStatus:serverState.PlayerConnectionStatus
}
export function inGameFormatPlayerName(val:clientState.PlayerState):string{
  let name = val.userData.name
  if(addYOUToName(val)){
      name += "(you)"
  }
  if(val.connStatus !== 'connected'){
      name += "("+val.connStatus+")"
  }
  return name
}

function addYOUToName(val:clientState.PlayerState){
  return val.sessionId == GAME_STATE.getBattleRoom().sessionId && val.userData.name.indexOf("#") > 0
}

export function afterGameFormatPlayerName(val:clientState.PlayerState):string{
  let name = val.userData.name
  if(addYOUToName(val)){
      name += "(you)"
  }
  
  if(!val.battleData.endTime){
    if(val.connStatus !== 'connected'){
        name += "("+val.connStatus+")"
    }
  }
  return name
}

export function sortTeams(teamsRanked:serverState.TeamState[]){
  teamsRanked.sort((a:clientState.TeamState,b:clientState.TeamState)=>{
    return a.gamePosition - b.gamePosition
  })
}
export function toSortedTeams(state:serverState.BattleRoomState):serverState.TeamState[]{
  const teamsRanked:serverState.TeamState[] = []
  state.enrollment.teams.forEach((team: serverState.TeamState) => {
    teamsRanked.push(team)
  }) 
  sortTeams(teamsRanked)
  return teamsRanked
}
export function getWinningTeam(state:serverState.BattleRoomState):serverState.TeamState[]{
  
  const winner:serverState.TeamState[] = []
  const teamsRanked:serverState.TeamState[] = toSortedTeams(state)
  let topScore = teamsRanked.length > 0 ? teamsRanked[0].score : 0
  if(teamsRanked.length > 0){
    winner.push(teamsRanked[0])
  }
  let counter = 0

  log("getWinningTeam ",topScore,teamsRanked)

  for(const p in teamsRanked){
    const teamState:serverState.TeamState = teamsRanked[p]
    counter ++
    //already added, skip
    if(counter == 1){
      continue;
    }
    //totPlayers += teamState.members.length
    //totMaxPlayers += teamState.maxPlayers
    if(teamState.score == topScore){
      winner.push(teamState)
    }else{
      break;
    }
  }

  log("getWinningTeam RETURN",winner)
  return winner
}

export function sortPlayersByPosition(players:clientState.PlayerMapState,nameFormatter?:(val:clientState.PlayerState)=>string){
  const playerData:PlayerRankingsType[] = []
   
  if(isNull(players)){
    return playerData;
  }

  players.forEach(
      (val:clientState.PlayerState)=>{
        const isPlayer = false
          let name = nameFormatter ? nameFormatter(val) : inGameFormatPlayerName(val)
          
          //const closestSegId = (val.racingData.closestSegmentID !== undefined) ? val.racingData.closestSegmentID: 0
          //const percentOfSeg = (val.racingData.closestSegmentPercent !== undefined) ? val.racingData.closestSegmentPercent: 0
          //const lap = (val.racingData.lap !== undefined) ? val.racingData.lap: 0
          const racePosition = (val.battleData.racePosition !== undefined) ? val.battleData.racePosition: 99
          const color:teamColor = val.battleData.teamId == CONFIG.TEAM_BLUE_ID ? teamColor.BLUE : teamColor.RED
          //playerData.push( {id:val.sessionId,name:name,totalProgress: (lap + 1) * closestSegId + percentOfSeg })
          playerData.push( {id:val.sessionId,name:name,gamePosition: racePosition,isPlayer:isPlayer
              ,endTime:val.battleData.endTime
              ,connStatus:val.connStatus
              ,health:val.healthData.current
              ,healthMax:val.healthData.max 
              ,score: val.statsData.kills.length
              ,team:color })
      }
  )

  

  const playerDataRanked = playerData.sort((n1,n2) => {
    if(n1.gamePosition === undefined) return 1
    if(n2.gamePosition === undefined) return -1
    return n1.gamePosition < n2.gamePosition ? -1 : 1
  });

  return playerDataRanked
}