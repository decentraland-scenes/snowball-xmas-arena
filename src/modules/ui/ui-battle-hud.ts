//import { scene, player } from "../scene";
import * as ui from "@dcl/ui-scene-utils";
import * as utils from "@dcl/ecs-scene-utils";
import resources, { setSection } from "src/dcl-scene-ui-workaround/resources";
import { ImageSection } from "node_modules/@dcl/ui-scene-utils/dist/utils/types";
import { REGISTRY } from "../../registry";
import { SOUND_POOL_MGR } from "../../resources/sounds";
import { CommonResources } from "src/resources/common";
//let uiAtlasTexture = new Texture('textures/ui_atlas.png', {samplingMode: 1})

import { setGameTimeLeft, setGameTimeLeftActive } from "src/modules/countDownSystem";



function createButton(
  parent: UIShape,
  theme: Texture,
  selection: ImageSection,
  text: string,
  fontSize: number,
  fontColor: Color4,
  onClick: () => void
) { 
  let img = new UIImage(parent, theme)//CommonResources.RESOURCES.textures.customAtlas.texture);
  
  img.isPointerBlocker = true;
  setSection(img, selection);

  const lbl = new UIText(img);

  lbl.value = text;
  lbl.hTextAlign = "center";
  lbl.vTextAlign = "center";
  lbl.fontSize = fontSize;
  lbl.font = ui.SFFont;
  lbl.color = fontColor;
  lbl.isPointerBlocker = false;

  img.onClick = new OnClick(() => {
    onClick();
  });

  return img;
}

const SHIFT_Y = -120;


let topRightLobbyContainer:UIContainerRect


let topRightBattleContainer:UIContainerRect

//START POSITION//START POSITION//START POSITION
//START POSITION//START POSITION//START POSITION
//
let topRightPositionCounter:UIContainerRect
let positionTitle:UIText
let positionText:UIText





let topRightLapCounter = new UIContainerRect(topRightBattleContainer);
topRightLapCounter.height = "25%";
topRightLapCounter.positionY = 30; //+ SHIFT_Y
topRightLapCounter.hAlign = "center";
topRightLapCounter.vAlign = "center";
topRightLapCounter.width = "100%";
//topRightLapCounter.positionY = 10
//topRightLapCounter.color = Color4.Blue() //Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")

log("LOADINGUI BATTLE-HUD")
let topRightLobbyTimesContainer:UIContainerRect
let topRightTimesContainer:UIContainerRect
//topRightTimesContainer.color = Color4.Black()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")
let topRightTotalTimeCounter:UIContainerRect
//topRightTotalTimeCounter.color = Color4.Teal()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")


let topRightLapTimesCounter:UIContainerRect




const BATTLE_STARTING_FONT_COLOR = Color4.White();
const BATTLE_STARTING_FONT_HEADER = new Font(Fonts.SansSerif_Bold);
const BATTLE_STARTING_FONT_LABEL = new Font(Fonts.SansSerif);
const BATTLE_STARTING_FONT_VALUE = new Font(Fonts.SansSerif_Bold);
const BATTLE_STARTING_FONT_SIZE = 28;
const BATTLE_STARTING_ROW_2_Y = -15//-25;
const BATTLE_STARTING_ROW_3_Y = -40;

let centerBattleStartingContainer:UIContainerRect
let battleStartingText:UIText
let battleCountRedTeamLabel:UIText
let battleCountBlueTeamLabel:UIText

/*
let battleCount = new UIText(centerbattleStartingContainer);
battleCount.value = "3/8";
battleCount.isPointerBlocker = false;
battleCount.vTextAlign = "center";
battleCount.hTextAlign = "center";
battleCount.paddingTop = 15;
battleCount.fontSize = BATTLE_STARTING_FONT_SIZE;
battleCount.color = BATTLE_STARTING_FONT_COLOR;
battleCount.positionY = BATTLE_STARTING_ROW_2_Y;
battleCount.positionX = -50;
battleCount.font = BATTLE_STARTING_FONT_VALUE;*/




let battleCountdownText:UIText
let battleCountdown:UIText
let battleCountRed:UIText
let battleCountBlue:UIText
let minToStartText:UIText




const canvas = ui.canvas;

export function initLegacyUI(){
  log("LOADINGUI GAME-HUD.init called")
  
   topRightLobbyContainer = new UIContainerRect(canvas);
  topRightLobbyContainer.visible = false
  topRightLobbyContainer.positionY = SHIFT_Y;
  topRightLobbyContainer.positionX = -90;
  topRightLobbyContainer.height = "33%";
  topRightLobbyContainer.hAlign = "right";
  topRightLobbyContainer.vAlign = "top";
  topRightLobbyContainer.width = "10%";
  topRightLobbyContainer.color = Color4.FromHexString("#00000088");


   topRightBattleContainer = new UIContainerRect(canvas);
  topRightBattleContainer.visible = false
  topRightBattleContainer.positionY = SHIFT_Y;
  topRightBattleContainer.positionX = -90;
  topRightBattleContainer.height = "33%";
  topRightBattleContainer.hAlign = "right";
  topRightBattleContainer.vAlign = "top";
  topRightBattleContainer.width = "10%";
  topRightBattleContainer.color = Color4.FromHexString("#00000088");

  //START POSITION//START POSITION//START POSITION
  //START POSITION//START POSITION//START POSITION
  //
   topRightPositionCounter = new UIContainerRect(topRightBattleContainer);
  topRightPositionCounter.height = "25%";
  topRightPositionCounter.hAlign = "center";
  topRightPositionCounter.vAlign = "top";
  topRightPositionCounter.width = "100%";
  //topRightPositionCounter.color = Color4.Green()//Color4.FromHexString("#ffff088")

   positionTitle = new UIText(topRightPositionCounter);
  positionTitle.value = "Health ";
  positionTitle.isPointerBlocker = false;
  positionTitle.vTextAlign = "top";
  positionTitle.hTextAlign = "center";
  positionTitle.vAlign = "top";
  positionTitle.fontSize = 14;
  positionTitle.positionX = "-10";

   positionText = new UIText(topRightPositionCounter);
  positionText.value = "1 / 3";
  positionText.isPointerBlocker = false;
  positionText.paddingTop = 10;
  positionText.vTextAlign = "center";
  positionText.hTextAlign = "center";
  positionText.fontSize = 28;
  positionText.positionX = "-10";





    topRightLapCounter = new UIContainerRect(topRightBattleContainer);
  topRightLapCounter.height = "25%";
  topRightLapCounter.positionY = 30; //+ SHIFT_Y
  topRightLapCounter.hAlign = "center";
  topRightLapCounter.vAlign = "center";
  topRightLapCounter.width = "100%";
  //topRightLapCounter.positionY = 10
  //topRightLapCounter.color = Color4.Blue() //Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")
  /*
  let lapTitle = new UIText(topRightLapCounter);
  lapTitle.value = "Lap: ";
  lapTitle.isPointerBlocker = false;
  lapTitle.vTextAlign = "top";
  lapTitle.hTextAlign = "center";
  lapTitle.vAlign = "top";
  lapTitle.fontSize = 14;
  lapTitle.positionX = "-10";

  let lapText = new UIText(topRightLapCounter);
  lapText.value = "1 / 3";
  lapText.isPointerBlocker = false;
  lapText.paddingTop = 10;
  lapText.vTextAlign = "center";
  lapText.hTextAlign = "center";
  lapText.fontSize = 28;
  lapText.positionX = "-10";
  */

  
   topRightLobbyTimesContainer = new UIContainerRect(topRightLobbyContainer);
  topRightLobbyTimesContainer.positionY = 10; //+ SHIFT_Y
  topRightLobbyTimesContainer.height = "50%";
  topRightLobbyTimesContainer.hAlign = "center";
  topRightLobbyTimesContainer.vAlign = "bottom";
  topRightLobbyTimesContainer.width = "100%";

   topRightTimesContainer = new UIContainerRect(topRightBattleContainer);
  topRightTimesContainer.positionY = 10; //+ SHIFT_Y
  topRightTimesContainer.height = "50%";
  topRightTimesContainer.hAlign = "center";
  topRightTimesContainer.vAlign = "bottom";
  topRightTimesContainer.width = "100%";
  //topRightTimesContainer.color = Color4.Black()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")

   topRightTotalTimeCounter = new UIContainerRect(topRightTimesContainer);
  topRightTotalTimeCounter.height = "40%";
  topRightTotalTimeCounter.hAlign = "center";
  topRightTotalTimeCounter.vAlign = "top";
  topRightTotalTimeCounter.width = "100%";
  //topRightTotalTimeCounter.color = Color4.Teal()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")
  


   topRightLapTimesCounter = new UIContainerRect(topRightTimesContainer);
  topRightLapTimesCounter.height = "60%";
  topRightLapTimesCounter.hAlign = "center";
  topRightLapTimesCounter.vAlign = "bottom";
  topRightLapTimesCounter.width = "100%";
  topRightLapTimesCounter.positionX = "-10";




   centerBattleStartingContainer = new UIContainerRect(canvas);
  centerBattleStartingContainer.visible = false;
  centerBattleStartingContainer.height = 110;
  centerBattleStartingContainer.hAlign = "center";
  centerBattleStartingContainer.vAlign = "top";
  //centerbattleStartingContainer.positionY = -10;
  centerBattleStartingContainer.width = 450;
  centerBattleStartingContainer.color = Color4.Gray();

  
   battleStartingText = new UIText(centerBattleStartingContainer);
  battleStartingText.value = "Waiting for players to join";
  battleStartingText.isPointerBlocker = false;
  battleStartingText.vTextAlign = "center";
  battleStartingText.hTextAlign = "center";
  battleStartingText.paddingTop = 0;
  battleStartingText.fontSize = 26;
  battleStartingText.positionY = 20;
  battleStartingText.color = BATTLE_STARTING_FONT_COLOR;
  battleStartingText.font = BATTLE_STARTING_FONT_HEADER;

   battleCountRedTeamLabel = new UIText(centerBattleStartingContainer);
  battleCountRedTeamLabel.value = "Red Team";
  battleCountRedTeamLabel.isPointerBlocker = false;
  battleCountRedTeamLabel.vTextAlign = "center";
  battleCountRedTeamLabel.hTextAlign = "center";
  battleCountRedTeamLabel.paddingTop = 5;
  battleCountRedTeamLabel.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountRedTeamLabel.color = BATTLE_STARTING_FONT_COLOR;
  battleCountRedTeamLabel.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountRedTeamLabel.positionX = -150;
  battleCountRedTeamLabel.font = BATTLE_STARTING_FONT_LABEL;


   battleCountBlueTeamLabel = new UIText(centerBattleStartingContainer);
  battleCountBlueTeamLabel.value = "Blue Team";
  battleCountBlueTeamLabel.isPointerBlocker = false;
  battleCountBlueTeamLabel.vTextAlign = "center";
  battleCountBlueTeamLabel.hTextAlign = "center";
  battleCountBlueTeamLabel.paddingTop = 5;
  battleCountBlueTeamLabel.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountBlueTeamLabel.color = BATTLE_STARTING_FONT_COLOR;
  battleCountBlueTeamLabel.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountBlueTeamLabel.positionX = 150/2;
  battleCountBlueTeamLabel.font = BATTLE_STARTING_FONT_LABEL;

   battleCountRed = new UIText(centerBattleStartingContainer);
  battleCountRed.value = "3/8";
  battleCountRed.isPointerBlocker = false;
  battleCountRed.vTextAlign = "center";
  battleCountRed.hTextAlign = "center";
  battleCountRed.paddingTop = 5;
  battleCountRed.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountRed.color = BATTLE_STARTING_FONT_COLOR;
  battleCountRed.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountRed.positionX = -50;
  battleCountRed.font = BATTLE_STARTING_FONT_VALUE;


   battleCountBlue = new UIText(centerBattleStartingContainer);
  battleCountBlue.value = "3/8";
  battleCountBlue.isPointerBlocker = false;
  battleCountBlue.vTextAlign = "center";
  battleCountBlue.hTextAlign = "center";
  battleCountBlue.paddingTop = 5;
  battleCountBlue.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountBlue.color = BATTLE_STARTING_FONT_COLOR;
  battleCountBlue.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountBlue.positionX = 180;
  battleCountBlue.font = BATTLE_STARTING_FONT_VALUE;
  


  minToStartText = new UIText(centerBattleStartingContainer);
  minToStartText.value = "min to start";
  minToStartText.isPointerBlocker = false;
  minToStartText.vTextAlign = "center";
  minToStartText.hTextAlign = "center";
  minToStartText.paddingTop = 3;
  minToStartText.fontSize = 12//BATTLE_STARTING_FONT_SIZE;
  minToStartText.color = BATTLE_STARTING_FONT_COLOR;
  minToStartText.positionY = BATTLE_STARTING_ROW_3_Y;
  minToStartText.positionX = 0//180;
  minToStartText.font = BATTLE_STARTING_FONT_VALUE;

 



  battleCountdownText = new UIText(centerBattleStartingContainer);
  battleCountdownText.value = ""//"Time Left"; //"Starting in "
  battleCountdownText.isPointerBlocker = false;
  battleCountdownText.vTextAlign = "center";
  battleCountdownText.hTextAlign = "center";
  battleCountdownText.paddingTop = 5;
  battleCountdownText.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountdownText.color = BATTLE_STARTING_FONT_COLOR;
  battleCountdownText.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountdownText.positionX = 70;
  battleCountdownText.font = BATTLE_STARTING_FONT_LABEL;


  battleCountdown = new UIText(centerBattleStartingContainer);
  battleCountdown.value = "3";
  battleCountdown.isPointerBlocker = false;
  battleCountdown.vTextAlign = "center";
  battleCountdown.hTextAlign = "center";
  battleCountdown.paddingTop = 5;
  battleCountdown.fontSize = BATTLE_STARTING_FONT_SIZE;
  battleCountdown.color = BATTLE_STARTING_FONT_COLOR;
  battleCountdown.positionY = BATTLE_STARTING_ROW_2_Y;
  battleCountdown.positionX = 60////170;
  battleCountdown.font = BATTLE_STARTING_FONT_VALUE;


}
 
export function updateGamePosition(pos: number, total: number) {
  const newVal = pos + " / " + total;
  //small performance gain, only set when value changes
  if (positionText.value != newVal) {
    positionText.value = newVal;
  } else {
    //log("updateGamePosition noop")
  }
}

//START LAP COUNTER//LAP COUNTER//LAP COUNTER
//START LAP COUNTER//LAP COUNTER//LAP COUNTER
//

export function showLobbyTopRight(val:boolean){
  //disabled
  log("showLobbyTopRight to show old lobby ui disabled. TODO remove code")
  topRightLobbyContainer.visible = false
}

export function setLapCounter(text: string) {
  //lapText.value = text;
}
export function showLapCounter(val: boolean) {
  log("showLapCounter to show health disabled. TODO remove code")
  topRightBattleContainer.visible = false;
}


//
//END LAP COUNTER//LAP COUNTER//LAP COUNTER

//START WAITING TO START//START WAITING TO START
//START WAITING TO START//START WAITING TO START
//

export function updateBattleCount(cnt: number, max: number,minToStart:number) {
  //battleCount.value = cnt + " / " + max;
}

export function updateBattleCountR(cnt: number, max: number,minToStart:number) {
  battleCountRed.value = cnt + " / " + max;
}

export function updateBattleCountB(cntB: number, maxB: number,minToStart:number) {
  battleCountBlue.value = cntB + " / " + maxB;
}

export function updateBattleCountMin(curCount:number,minTotalPerTeam:number,minPerTeamToStart:number){
  let msg = ""
  if(curCount<minTotalPerTeam){
    msg = "Need a minimum of "+ minPerTeamToStart + " players per team to start the match."
    minToStartText.color = Color4.Red()
  }else{
    msg = "Minimum of "+ minPerTeamToStart + " players per team reached.  Match will start shortly."
    minToStartText.color = Color4.White()
  }
  if(minToStartText.value !== msg){
    minToStartText.value = msg
  }
}

const countdownTimer = new Entity();
engine.addEntity(countdownTimer);

let _enableCoundDownSound = false;

export function stopCountdownTimer() {
  if (countdownTimer.hasComponent(utils.Interval)) {
    countdownTimer.removeComponent(utils.Interval);
  }
}
function startRefreshTimer(startAt: number, callback: (val: number) => void) {
  log("startRefreshTimer ",startAt)
  engine.addEntity(countdownTimer);
  //need it this high so the counter is right and not laggy
  countdownTimer.addComponentOrReplace(
    //new utils.Delay(50, () => { //why was delay here??? pretty sure its wrong
    new utils.Interval(50, () => {

      let distance = startAt - Date.now();

      if (distance <= 0) {
        log("countdown is over");
        engine.removeEntity(countdownTimer);
      } else {
        callback(Math.round(distance / 1000));
      }
    })
  );
}

export function isGameStartMsgVisible() {
  return centerBattleStartingContainer.visible;
}
export function showGameStartMsg(visible: boolean) {
  centerBattleStartingContainer.visible = visible;
  if (!visible) stopCountdownTimer();
}
export function enableCoundDownSound(val: boolean) {
  _enableCoundDownSound = val;
}
export function setGameStartCountdown(val: number) {
  const newVal = val + "";
  
  if (battleCountdown.value != newVal) {
    battleCountdown.value = newVal;
    setGameTimeLeft( val*1000 )  
    if (_enableCoundDownSound) {
      if (val <= 3 && val != 0) {
        SOUND_POOL_MGR.gameCountDownBeep.playOnce();
      } else if (val == 0) {
        SOUND_POOL_MGR.gameStart.playOnce();
      }
      log("setGameStartCountdown.play sound for ", newVal);
    }
    //log("setGameStartCountdown  change",newVal)
  } else {
    //log("setGameStartCountdown no change",newVal)
  }

  //start a timer
}

export function updateGameStartWaiting(counter: number) {
  enableCoundDownSound(false);
  battleStartingText.value = "Waiting for players to join";
  battleCountdownText.value = "";

  centerBattleStartingContainer.color = Color4.FromHexString("#808080ee"); //Color4.Gray()

  battleCountRedTeamLabel.visible  =true
  battleCountBlueTeamLabel.visible  =true
  battleCountBlue.visible = true
  battleCountRed.visible = true
  minToStartText.visible = true
  battleCountdownText.positionX = 70;
  battleCountdown.visible = false

  startRefreshTimer(Date.now() + counter * 1000, setGameStartCountdown);
}
export function updateBattleStarting(counter: number) {
  enableCoundDownSound(true);
  battleStartingText.value = "Game about to begin";
  battleCountdownText.value = "Starting in";

  battleCountdownText.positionX = -30;

  battleCountdown.visible = true
  battleCountRedTeamLabel.visible  =false
  battleCountBlueTeamLabel.visible  =false
  battleCountBlue.visible = false
  battleCountRed.visible = false
  minToStartText.visible = false

  centerBattleStartingContainer.color = Color4.FromHexString("#228b22ee");

  setGameStartCountdown(counter);
  startRefreshTimer(Date.now() + counter * 1000, setGameStartCountdown);
}
//
//END WAITING TO START//END WAITING TO START

//START GO POPUP//START GO POPUP//START GO POPUP
//START GO POPUP//START GO POPUP//START GO POPUP
//
let centerGoContainer = new UIContainerRect(canvas);
centerGoContainer.visible = false;
centerGoContainer.height = "8%";
centerGoContainer.hAlign = "center";
centerGoContainer.vAlign = "top";
centerGoContainer.width = "20%";
centerGoContainer.color = Color4.FromHexString("#00ab66ee"); //Color4.Green()

let goText = new UIText(centerGoContainer);
goText.value = "GO!!!!";
goText.isPointerBlocker = false;
goText.vTextAlign = "center";
goText.hTextAlign = "center";
goText.paddingTop = 0;
goText.fontSize = 28;
goText.font = new Font(Fonts.SansSerif_Bold);

export function isGoVisible() {
  return centerGoContainer.visible;
}
export function showGo(visible: boolean, duration?: number) {
  centerGoContainer.visible = visible;
  if (duration)
    utils.setTimeout(duration, () => {
      centerGoContainer.visible = false;
    });
}

//
//END GO POPUP//END GO POPUP//END GO POPUP
