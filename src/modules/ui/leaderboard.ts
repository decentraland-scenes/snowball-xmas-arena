import * as ui from "@dcl/ui-scene-utils";
import { REGISTRY } from "src/registry";
import { PlayerRankingsType } from "src/snowball-fight/connection/state-data-utils";

const uiCanvas = ui.canvas;

const leaderboardBackground = new UIContainerRect(uiCanvas);
leaderboardBackground.visible = false
leaderboardBackground.alignmentUsesSize = true;
leaderboardBackground.positionX = "-38%";
leaderboardBackground.positionY = "-15%";
leaderboardBackground.width = 200;
leaderboardBackground.height = 200;
leaderboardBackground.color = Color4.Black();
leaderboardBackground.opacity = 0.5;

uiCanvas.positionX = 0;

let leaderboard: UIText = new UIText(uiCanvas);
leaderboard.visible = false
leaderboard.positionX = "-38%";
leaderboard.positionY = "-8%";
leaderboard.paddingLeft = 4;
leaderboard.fontSize = 12;
leaderboard.width = 200;
leaderboard.height = 210;
leaderboard.hTextAlign = "left";
leaderboard.vAlign = "center";
leaderboard.color = Color4.White();

const USE_NEW_LEADERBOARD = true

export function updateLeaderboard(title: string, playerDataRanked: PlayerRankingsType[]) {
  //log("updateLeaderboard ENTRY",title,playerDataRanked)
  if(!USE_NEW_LEADERBOARD){
    const names: string[] = [];
    let counter = 1;
    for (const p in playerDataRanked) {
      const pd = playerDataRanked[p];
      names.push(counter + ": " + pd.name +"("+pd.team+")" + "(" + pd.health+"/"+pd.healthMax + ")"+"(" + pd.score + ")");

      counter++;
    }
    //counter + ": " + pd.name +"("+pd.team+")" + "(" + pd.health + ")"

    while (names.length < 10) {
      names.push("");
    }
    const playerNames = names.filter((_, i) => i < 10);
    const newVal = title + `:\n\n${playerNames.join("\n")}`;


    
    //small performance gain, only set when value changes 
    if (leaderboard.value != newVal) {
      leaderboard.value = newVal;
    } else {
      //dont update
      //log("updateLeaderboard noop")
    }
  }else{
    REGISTRY.SCENE_MGR.leaderboard.updateLeaderboard( playerDataRanked )
  }
}

export function isLeaderboardVisible() {
  if(!USE_NEW_LEADERBOARD){
    return leaderboardBackground.visible;
  }else{
    if(REGISTRY.SCENE_MGR !== undefined && REGISTRY.SCENE_MGR.leaderboard !== undefined){
      return REGISTRY.SCENE_MGR.leaderboard.leaderboardBG.visible
    }else{
      return false;
    }
  }
}
export function showLeaderboard(visible: boolean) {
  if(!USE_NEW_LEADERBOARD){
    leaderboardBackground.visible = visible;
    leaderboard.visible = visible;
  }else{
    if(REGISTRY.SCENE_MGR !== undefined && REGISTRY.SCENE_MGR.leaderboard !== undefined){
      REGISTRY.SCENE_MGR.leaderboard.showLeaderboard(visible)
    }
  }
}
