//import { scene, player } from "../scene";
import * as ui from "@dcl/ui-scene-utils";
//import { setPlayerDriving} from "./car";
import * as leaderboard from "src/modules/ui/leaderboard";
import * as gameHud from "src/modules/ui/ui-battle-hud";
import * as racePrompts from "src/ui/ui-battle-prompts";
import * as clientSpec from "src/snowball-fight/connection/state/client-state-spec";
import * as utilities from "../../utils/utilities";

import { REGISTRY } from "../../registry";
import { IGame2DUI } from "./iGame2DUI";
import { PlayerRankingsType } from "src/snowball-fight/connection/state-data-utils";
import { Room } from "colyseus.js";

export const canvas = ui.canvas;

/**
 * created this as a workaround as was getting errors with imports however
 * this centralized class i think is the right way to go long term
 * just unfortunate must proxy the calls
 */
export class Game2DUI implements IGame2DUI {
  hideAll() {
    this.showLeaderboard(false);
    
    this.showGo(false);
    this.showGameStartMsg(false);
    this.showLapCounter(false);
    this.showGameEnded(false);
    this.raceExitHidePrompts();
  }
  reset() {
    
    this.updateLeaderboard("", []);
    this.setGameEndReasonText("");
    this.updateGamePosition(1, 1);
    this.updateGameCount(1, 1,1);
    this.updateGameCountR(1, 1,1);
    this.updateGameCountB(1, 1,1);
  }
  formatTime(timeSeconds: number, fractionDigits: number = 1): string {
    return utilities.formatTime(timeSeconds, fractionDigits);
  }
  updateLeaderboard(title: string, playerNames: PlayerRankingsType[]) {
    leaderboard.updateLeaderboard(title, playerNames);
  }

  isLeaderboardVisible() {
    return leaderboard.isLeaderboardVisible();
  }
  showLeaderboard(visible: boolean) {
    leaderboard.showLeaderboard(visible);
  }

  isGameStartMsgVisible() {
    return gameHud.isGameStartMsgVisible();
  }
  showGameStartMsg(visible: boolean) {
    gameHud.showGameStartMsg(visible);
  }
  updateGameStartWaiting(counter: number) {
    gameHud.updateGameStartWaiting(counter);
  }
  updateBattleStarting(counter: number) {
    gameHud.updateBattleStarting(counter);
  }
  setGameStartCountdown(val: number) {
    gameHud.setGameStartCountdown(val);
  }

  isGameEndedVisible() {
    return false//racePrompts.isRaceEndedVisible();
  }
  showGameEnded(visible: boolean) {
    racePrompts.showGameEnded(visible);
  }
  setGameEndReasonText(text: string) {
    racePrompts.setGameEndReasonText(text);
  }

  isGoVisible() {
    return gameHud.isGoVisible();
  }
  showGo(visible: boolean, duration?: number) {
    gameHud.showGo(visible, duration);
  }

  openEndGameConfirmPrompt() {
    racePrompts.openQuitGameConfirmPrompt();
  }
  hideEndGameConfirmPrompt() {
    racePrompts.hideQuitGameConfirmPrompt();
  }

  openHowToPlayPrompt(onOK?:()=>void) {
    racePrompts.openHowToPlayPrompt(onOK);
  }
  hideHowToPlayPrompt() {
    racePrompts.hideHowToPlayPrompt();
  }


  showLapCounter(val: boolean) {
    gameHud.showLapCounter(val);
  }

  updateGamePosition(pos: number, total: number) {
    gameHud.updateGamePosition(pos, total);
  }

  updateGameCount(cnt: number, max: number,minToStart:number) {
    //TODO OPTIMIZE ME
    //TODO manage if changed then update. otherwise do nothing
    gameHud.updateBattleCount(cnt, max,minToStart);
  }

  updateGameCountR(cnt: number, max: number,minToStart:number) {
    //TODO OPTIMIZE ME
    //TODO manage if changed then update. otherwise do nothing
    gameHud.updateBattleCountR(cnt, max,minToStart);
  }

  updateGameCountB(cnt: number, max: number,minToStart:number) {
    //TODO OPTIMIZE ME
    //TODO manage if changed then update. otherwise do nothing
    gameHud.updateBattleCountB(cnt, max,minToStart);
  }

  updateGameCountMin(curCount:number,minTotalPerTeam:number,minPerTeamToStart:number){
    gameHud.updateBattleCountMin(curCount,minTotalPerTeam,minPerTeamToStart);
  }

  showLobbyTopRight(val:boolean){
    gameHud.showLobbyTopRight(val)
  }

  updateGameResultRows(gameRoom:Room<clientSpec.BattleRoomState>) {
    racePrompts.updateGameResultRows(gameRoom);
  }
  isGameResultsPromptVisible() {
    return false;//racePrompts.isRaceResultsPromptVisible();
  }
  toggleGameResultsPrompt(visible: boolean) {
    racePrompts.toggleGameResultsPrompt(visible);
  }

  gameToStartHidePrompts(): void {
    racePrompts.hideHowToPlayPrompt();
  }
  raceExitHidePrompts(): void {
    //hide race related prompts if still open
    this.hideEndGameConfirmPrompt();
    this.hideHowToPlayPrompt();
  }

  showLoginErrorPrompt(title: string | undefined, desc: string | undefined) {
    racePrompts.loginErrorPrompt.text.value = desc ? desc : "Unexpected Error";
    racePrompts.loginErrorPrompt.show();
    //must manaully make visible after show call? why?
    racePrompts.loginErrorPrompt.title.visible = true;
  }
  showErrorPrompt(title: string | undefined, desc: string | undefined) {
    racePrompts.errorPrompt.text.value = desc ? desc : "Unexpected Error";
    racePrompts.errorPrompt.show();
    //must manaully make visible after show call? why?
    //racePrompts.errorPrompt.title.visible = true
  }
}

export const Game_2DUI = new Game2DUI();
REGISTRY.Game_2DUI = Game_2DUI;
