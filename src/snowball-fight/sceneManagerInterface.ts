
import { SnowBallLeaderboard } from "src/modules/leaderboard"
import {  SnowballArena } from "src/snowball-fight/snowballScene"
import { Lobby } from "./lobbyScene"
//import { ISceneManager } from "./sceneManager"
//import { SubScene } from "./subScene"

//workaround to break cyclic deps
export interface ISceneManager {//extends ISceneManager{
  //lobbyScene:LobbyScene
  snowballArena:SnowballArena
  lobby:Lobby
  leaderboard:SnowBallLeaderboard

  goArena(force?:boolean):void
  goLobby(force?:boolean):void

}

//export let SCENE_MGR:IRaceSceneManager // = new RaceSceneManager();