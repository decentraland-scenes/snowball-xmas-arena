import { Room } from "colyseus.js";
import { PlayerRankingsType } from "src/snowball-fight/connection/state-data-utils";
import * as clientSpec from "src/snowball-fight/connection/state/client-state-spec";

//workaround to fix cyclical deps
export interface IGame2DUI {
  hideAll(): void;
  reset(): void;
  formatTime(timeSeconds: number, fractionDigits?: number): string;

  updateLeaderboard(title: string, playerNames: PlayerRankingsType[]): void;

  isLeaderboardVisible(): boolean;
  showLeaderboard(visible: boolean): void;

  openHowToPlayPrompt(onOK?:()=>void): void;
  hideHowToPlayPrompt(): void;
  
  gameToStartHidePrompts(): void;

  updateGameResultRows(gameRoom: Room<clientSpec.BattleRoomState>): void;
  isGameResultsPromptVisible(): void;
  toggleGameResultsPrompt(visible: boolean): void;
  showLoginErrorPrompt(title: string | undefined, desc: string | undefined): void;
  showErrorPrompt(title: string | undefined, desc: string | undefined): void;
}
