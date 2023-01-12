import * as ui from '@dcl/ui-scene-utils'
import { afterGameFormatPlayerName, getWinningTeam, sortPlayersByPosition, sortTeams } from 'src/snowball-fight/connection/state-data-utils';

//import { ENEMY_MGR } from 'src/modules/playerManager';
import { GAME_STATE } from '../state';
import * as utilities from "src/utils/utilities";
import { REGISTRY } from 'src/registry';
import { CommonResources } from 'src/resources/common';
import { CONFIG } from 'src/config';
import resources, { setSection } from 'src/dcl-scene-ui-workaround/resources';
import * as clientState from "src/snowball-fight/connection/state/client-state-spec";
import * as serverState from "src/snowball-fight/connection/state/server-state-spec";
import { teamColor } from 'src/modules/teamColors';
import { Room } from 'colyseus.js';
//import { player as REGISTRY.player } from 'src/modules/player';
//import { setPlayerDriving} from "./car";

//const Constants.SCENE_MGR = Constants.Constants.SCENE_MGR

const canvas = ui.canvas

let PROMPT_WIDTH = 450
let OK_PROMPT_HEIGHT = 350
let PROMPT_HEIGHT = 300


const PROMPT_OFFSET_X = 0;//80//move it away from communications box as cant click thru it
const PROMPT_OFFSET_Y = 40
const MAIN_CONTENT_START_Y = 180
let PROMPT_TITLE_HEIGHT = 100 
let OK_PROMPT_TITLE_HEIGHT = 160 
let PROMPT_TEXT_HEIGHT = 100 
const PROMPT_TITLE_COLOR = Color4.White()
const BUTTON_HEIGHT = 60
const BUTTON_POS_Y =  -40 //-180

let buttonPosY = BUTTON_POS_Y
const buttonHeight = BUTTON_HEIGHT

const UI_REPLACE_TEXTURE_WITH_SINGLETON = true;
const customAtlas = CommonResources.RESOURCES.textures.customAtlas

//START END GAME MESSAGE//START END GAME MESSAGE
//START END GAME MESSAGE//START END GAME MESSAGE

PROMPT_WIDTH = 350
PROMPT_HEIGHT = 200
PROMPT_TITLE_HEIGHT = 80 
//const BUTTON_POS_Y =  -40 //-180

buttonPosY = BUTTON_POS_Y + 35//- 30

export const gameEndedPrompt = new ui.CustomPrompt(customAtlas.texture.src,PROMPT_WIDTH,PROMPT_HEIGHT)
if( UI_REPLACE_TEXTURE_WITH_SINGLETON ) gameEndedPrompt.background.source = customAtlas.texture//workaround to try to save textures
setSection(gameEndedPrompt.background, resources.backgrounds.promptBackground)
setSection(gameEndedPrompt.closeIcon, resources.icons.closeD)

gameEndedPrompt.addText("Battle Has Ended", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  

const endGameResultReason = gameEndedPrompt.addText("End Reason Here", 0, 20 ,PROMPT_TITLE_COLOR,20)  

gameEndedPrompt.addButton(
  'Results',
  0,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    //Constants.SCENE_MGR.goLobby(true)
    showGameEnded(false)
    openGameResultsPrompt()
  },
  ui.ButtonStyles.E
)

gameEndedPrompt.hide()

export function isGameEndedVisible(){
  return gameEndedPrompt.background.visible
}

export function openGameEndedPrompt(){
  gameEndedPrompt.show()
  gameEndedPrompt.closeIcon.visible=false
}
export function hideGameEndedPrompt(){
  gameEndedPrompt.hide()
}
export function showGameEnded(visible:boolean){
  if(visible){
    openGameEndedPrompt()
  }else{
    hideGameEndedPrompt()
  }
}

export function setGameEndReasonText(text:string){
  endGameResultReason.text.value = text
}

//START END GAME LEADERBOARD//START END GAME LEADERBOARD
//START END GAME LEADERBOARD//START END GAME LEADERBOARD


PROMPT_WIDTH = 450
OK_PROMPT_HEIGHT = 350
PROMPT_HEIGHT = 300

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 160 
PROMPT_TEXT_HEIGHT = 100 

buttonPosY = BUTTON_POS_Y

PROMPT_WIDTH = 500
PROMPT_HEIGHT = 560
PROMPT_TITLE_HEIGHT = 270 

buttonPosY = BUTTON_POS_Y - 130

const DEFAULT_FONT_SIZE = 15



function uiDimToNumber(val: number | string): number {
  if (typeof val === "string") {
    return parseInt(val.substr(0, val.length - 2));
  } else {
    return val;
  }
}
function updateCloseBtnPosition(prompt: ui.CustomPrompt) {
  prompt.closeIcon.positionX = uiDimToNumber(prompt.background.width as number) / 2 - 30;
  prompt.closeIcon.positionY = uiDimToNumber(prompt.background.height as number) / 2 - 30;
}
function updateForCustomAtlas(prompt: ui.CustomPrompt) {
  if( UI_REPLACE_TEXTURE_WITH_SINGLETON ) prompt.background.source = customAtlas.texture; //workaround to try to save textures
  setSection(prompt.background, resources.backgrounds.promptBackground);
  prompt.closeIcon.source = CommonResources.RESOURCES.textures.closeMenuIconButton.texture
  setSection(prompt.closeIcon,CommonResources.RESOURCES.textures.closeMenuIconButton.size)
  updateCloseBtnPosition(prompt);
}

const gameResultsPrompt = new ui.CustomPrompt(customAtlas.texture.src,PROMPT_WIDTH,PROMPT_HEIGHT)
updateForCustomAtlas(gameResultsPrompt)


const gameResultsPromptTitle = gameResultsPrompt.addText("Level Name Results", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  

//const gameResultsTEAMPromptTitle = gameResultsPrompt.addText("Winning Team: ", -25, PROMPT_TITLE_HEIGHT - 30 ,PROMPT_TITLE_COLOR,20)  
//const gameResultsTEAMResult = gameResultsPrompt.addText("TIE", 70, PROMPT_TITLE_HEIGHT - 30 ,PROMPT_TITLE_COLOR,20)  

type PlayerResultsRow2DUI={
  position?:ui.CustomPromptText
  icon?:ui.CustomPromptIcon
  teamIcon?:ui.CustomPromptIcon
  name?:ui.CustomPromptText
  score?:ui.CustomPromptText
} 


const iconHeight = 24 
const imageRowYPad = 0
const imageBreakerPad = -6
const resultRows:PlayerResultsRow2DUI[]=[]
let rowStartPosY = 230
let rowPosY = 0
 
 
const lineBreakTexture = CommonResources.RESOURCES.textures.snowballWhite.texture// new Texture("textures/road_orm.png")
//const lineBreakTexture = new Texture("textures/road_orm.png")
const defaultPlayerIcon = new Texture("textures/anonymous-player.png")
//const defaultTeamBlueIcon = new Texture("textures/team-blue-player.png")
//const defaultTeamReadIcon = new Texture("textures/team-red-player.png")
const lineBreakTextureSource:any = {
                sourceHeight:20,sourceWidth:20, //want the white of the snowball
                sourceTop:1228 + 80,sourceLeft:1270+80}//{sourceHeight:128,sourceWidth:128}
const avatarTextureSource = {sourceHeight:256,sourceWidth:256}

const BASE_ROW = 4
const FONT_COLOR = Color4.White()
for(let x=0;x<(CONFIG.TEAM_MAX_PER_TEAM * 2) + 3;x++){
  const row:PlayerResultsRow2DUI = {}

  row.position = gameResultsPrompt.addText(x+1+"", -150, rowStartPosY + rowPosY,FONT_COLOR)

  row.icon = gameResultsPrompt.addIcon(defaultPlayerIcon.src, -100 + 20 , rowStartPosY + rowPosY - (iconHeight/2) - imageRowYPad,iconHeight,iconHeight,avatarTextureSource)
  row.icon.image.source = defaultPlayerIcon

  row.teamIcon = gameResultsPrompt.addIcon(defaultPlayerIcon.src, -100 - 20 , rowStartPosY + rowPosY - (iconHeight/2) - imageRowYPad,iconHeight,iconHeight,avatarTextureSource)
  row.teamIcon.image.source = CommonResources.RESOURCES.textures.portraitBlueTeam.texture

  row.name = gameResultsPrompt.addText("player name " + x, 20, rowStartPosY + rowPosY,FONT_COLOR)
 
  row.score = gameResultsPrompt.addText( Math.floor(Math.random()*10)+"", 150, rowStartPosY + rowPosY,FONT_COLOR)

  //new row???
  if(x!==0){
    const lineBreaker = gameResultsPrompt.addIcon(lineBreakTexture.src, 0, rowStartPosY + rowPosY - imageBreakerPad,400,2,lineBreakTextureSource)
    lineBreaker.image.source = lineBreakTexture
  }
  if(BASE_ROW > 0 && (BASE_ROW-1) == x){
    rowPosY -= 10  
  }
  resultRows.push( row )

  rowPosY -= 33
}

//resultRows.reverse()

//new row???
const lineBreaker = gameResultsPrompt.addIcon(lineBreakTexture.src, 0, rowStartPosY + rowPosY - imageBreakerPad,400,2,lineBreakTextureSource)
lineBreaker.image.source = lineBreakTexture


gameResultsPrompt.hide()

gameResultsPrompt.addButton(
  'Return to Lobby',
  -100,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    REGISTRY.SCENE_MGR.goLobby(true)
    hideGameResultsPrompt()
  },
  ui.ButtonStyles.ROUNDWHITE
)


gameResultsPrompt.addButton(
  'Play Again',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('battle again')
    REGISTRY.SCENE_MGR.goArena(true)
    hideGameResultsPrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)
/*
gameResultsPrompt.addButton(
  'Cancel',
  -100,
  buttonPosY - buttonHeight,
  () => {
    log('No')
    //startGamePrompt.hide()
    hideQuitGameConfirmPrompt()
    ///showPickerPrompt()
  },
  //ui.ButtonStyles.F
)
*/

function hidePlayerResultRow(row:PlayerResultsRow2DUI){
  row.name.hide()
  row.score.hide()
  row.icon.hide()
  row.teamIcon.hide()
  row.position.hide()
}
function shiftPlayerResultRow(row:PlayerResultsRow2DUI,amount:number){
  /*row.name.text.positionY -= amount
  row.score.hide()
  row.icon.hide()
  row.position.hide()*/
}
function updateRowColor(row: PlayerResultsRow2DUI, team: teamColor|string) {
  /*let color = Color4.Blue()
  if(team == teamColor.RED){
    color = Color4.Red()
  }
  row.name.text.color = color
  row.score.text.color = color*/
  //TODO new row color marker


  if(team == teamColor.RED){
    setSection(row.teamIcon.image,CommonResources.RESOURCES.textures.portraitRedTeam.size)
  }else{
    setSection(row.teamIcon.image,CommonResources.RESOURCES.textures.portraitBlueTeam.size)
  }

  //row.icon.text.color = color
  //row.position.text.color = color
}
export function updateGameResultRows(gameRoom:Room<clientState.BattleRoomState>){
  log("updateGameResultRows ENTRY",[gameRoom])
  const state: clientState.BattleRoomState = gameRoom.state
  const playerDataRanked = sortPlayersByPosition(state?.players,afterGameFormatPlayerName)
  log("updateGameResultRows",playerDataRanked)
  const roomNames:string[] = []

  const BASE_ROW = 4

  if(BASE_ROW > 0){
    hidePlayerResultRow(resultRows[0] )
    resultRows[0].name.show()
    //resultRows[BASE_ROW-1].name.show()
    resultRows[0].name.text.value = "Team Results"
    //15 is ui default
    resultRows[0].name.text.fontSize = DEFAULT_FONT_SIZE + 3

    hidePlayerResultRow(resultRows[BASE_ROW-1] )
    shiftPlayerResultRow(resultRows[BASE_ROW-1], -10 )
    resultRows[BASE_ROW-1].name.show()
    //resultRows[BASE_ROW-1].name.show()
    
    resultRows[BASE_ROW-1].name.text.value = "Individual Results"
    //15 is ui default
    resultRows[BASE_ROW-1].name.text.fontSize = DEFAULT_FONT_SIZE + 3
  }

  let counter = 0
  //let topTeam = "tie"
  //let topScore = -1
  let winningTeam = getWinningTeam(state)
  const teamsTied = winningTeam.length > 1

  const blueTeam = state.enrollment.teams.get(CONFIG.TEAM_BLUE_ID)
  const redTeam = state.enrollment.teams.get(CONFIG.TEAM_RED_ID)
  const teamsRanked:serverState.TeamState[] = [blueTeam,redTeam]
  sortTeams(teamsRanked)
  counter = 1
  for(const p in teamsRanked){
    const pd = teamsRanked[p]
    const row = resultRows[counter]

    row.name.text.value = pd.name
    if(!teamsTied && counter == 1){
      row.name.text.value += " WINNERS!!!"
    }else if(teamsTied){
      row.name.text.value += " DRAW"
    }

    //check for TIE? 
    row.position.text.value = counter +""
    row.score.text.value = pd.score +""

    updateRowColor(row,pd.id)

    counter++
  }

  counter = 0
  for(const p in playerDataRanked){
      const pd = playerDataRanked[p]
      const row = resultRows[BASE_ROW + counter]
      const player = REGISTRY.player.enemyManager.getEnemyByID(pd.id)
      const playerServerState = state.players.get(pd.id)

      updateRowColor(row,pd.team)

      row.name.text.value = pd.name

      //check for TIE? 
      row.position.text.value = pd.gamePosition + ""//counter + 1 +""

      if(pd.score !== undefined){
        row.score.text.value = pd.score+""//utilities.formatTime( (pd.endTime - state.battleData.startTime)/1000 )
      }else{
        row.score.text.value =  "-"
      }

      if(pd.id == gameRoom.sessionId){
        //log("using player avatar texture",scene.player.avatarTexture)
        row.icon.image.source = REGISTRY.player.avatarTexture
        //row.icon.image.source
      }else if(player && player && player.avatarTexture){
        //log("using enemy player avatar texture",player.avatarTexture)
        row.icon.image.source = player.avatarTexture
      }else{
        row.icon.image.source = defaultPlayerIcon
      }

      //roomNames.push( counter + ": " + pd.name )

      counter++
  } 
  for(let x=counter;x<resultRows.length;x++){
    //log("updateGameResultRows calling hide on row ",x)
    hidePlayerResultRow(resultRows[BASE_ROW + x] )
  }

  

  //return resultRows;
  //resultRows
}
export function openGameResultsPrompt(){
    let text = "Snowball Battle"
    if(GAME_STATE.battleData !== undefined ){
      text = text
    }

    gameResultsPromptTitle.text.value = text
    gameResultsPrompt.show()
    gameResultsPrompt.closeIcon.visible=false
    if(utilities.notNull(GAME_STATE.getBattleRoom())) {
      REGISTRY.Game_2DUI.updateGameResultRows( GAME_STATE.getBattleRoom() ) //call after show
    }else{
      
    }
}
export function hideGameResultsPrompt(){
  gameResultsPrompt.hide()
}

export function toggleGameResultsPrompt(val:boolean){
  if(val){
    openGameResultsPrompt()
  }else{
    hideGameResultsPrompt()
  }
}

export function isGameResultsPromptVisible(){
  return gameResultsPrompt.background.visible
}


//
//END END GAME LEADERBOARD//START END GAME LEADERBOARD

//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT
//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT



PROMPT_WIDTH = 450
OK_PROMPT_HEIGHT = 350
PROMPT_HEIGHT = 300

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 160 
PROMPT_TEXT_HEIGHT = 100 

buttonPosY = BUTTON_POS_Y 

export const quitGameConfirmPrompt = new ui.CustomPrompt(customAtlas.texture.src,PROMPT_WIDTH,PROMPT_HEIGHT)
updateForCustomAtlas(quitGameConfirmPrompt)
//setSection(quitGameConfirmPrompt.background, resources.backgrounds.promptBackground);

quitGameConfirmPrompt.addText("End Current Game\n No progress will be saved.", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  

 
quitGameConfirmPrompt.hide()

quitGameConfirmPrompt.addButton(
  'End Game',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    REGISTRY.SCENE_MGR.goLobby(true)
    hideQuitGameConfirmPrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)

quitGameConfirmPrompt.addButton(
  'Cancel',
  -100,
  buttonPosY - buttonHeight,
  () => {
    log('No')
    //startGamePrompt.hide()
    hideQuitGameConfirmPrompt()
    ///showPickerPrompt()
  },
  //ui.ButtonStyles.F
)


export function openQuitGameConfirmPrompt(){
    quitGameConfirmPrompt.show()
}
export function hideQuitGameConfirmPrompt(){
    quitGameConfirmPrompt.hide()
}

//
//END GAME CONFIRM PROMPT//END GAME CONFIRM PROMPT


//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT
//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 200//160 
const HOW_TO_PLAY_PROMPT_TITLE_HEIGHT = 430 
PROMPT_TEXT_HEIGHT = 40//20//100 

buttonPosY = BUTTON_POS_Y

PROMPT_WIDTH = 500
PROMPT_HEIGHT = 550
PROMPT_TITLE_HEIGHT = 250 

buttonPosY = -80//BUTTON_POS_Y 
  

export const howToPlayPrompt = new ui.CustomPrompt(customAtlas.texture.src,PROMPT_WIDTH,HOW_TO_PLAY_PROMPT_TITLE_HEIGHT)
updateForCustomAtlas(howToPlayPrompt)

//MAKE LOOK BETTER, for now using default 
howToPlayPrompt.background.source = CommonResources.RESOURCES.textures.howToPlay1.texture//CommonResources.RESOURCES.textures.iceDialogBG.texture
setSection(howToPlayPrompt.background,CommonResources.RESOURCES.textures.howToPlay1.size)


//
const howToPlayWidth = 300
const howToPlayTitle = howToPlayPrompt.addIcon( CommonResources.RESOURCES.textures.howToPlayTitle.texture.src,0,200
  ,howToPlayWidth,howToPlayWidth/4 //width height roughly a 4x1 ratio
  ,CommonResources.RESOURCES.textures.howToPlayTitle.size )
howToPlayTitle.image.source = CommonResources.RESOURCES.textures.howToPlayTitle.texture
/*
howToPlayPrompt.addText("How To Play", 0, OK_PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,22)  

let instructions = "\nLobby\n is the area outside the area.  Here you can check scores and practice your snowball throwing technique. \n\nArena\nSnowball fight!  Earn points for your team by freezing other players.  Highest score wins at the end wins.  \nMay the best team win! \n\nControls"

let rowY = PROMPT_TEXT_HEIGHT - 20
const rowHeight = 20
const text = howToPlayPrompt.addText(instructions, 0 - 20,  rowY ,PROMPT_TITLE_COLOR,15)  
text.text.width = PROMPT_WIDTH - 30
text.text.height = 80
text.text.textWrapping = true

rowY-=rowHeight
rowY-=rowHeight
rowY-=rowHeight
howToPlayPrompt.addText("Stand in snowy areas to make snowballs", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("Aim + Click - Throws a snowball", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("Hold Click - Power Throw (more damange)", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("Stand near fire to warm up (reclaim health)", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
 */

//howToPlayPrompt.hide()

let howToPlayOK:()=>void

const howToPlayNextButton =  howToPlayPrompt.addButton(
  'Next -->',
  0,//100,
  buttonPosY - 20 - buttonHeight,
  () => { 
    howToPlayPrompt.background.source = CommonResources.RESOURCES.textures.howToPlay2.texture//CommonResources.RESOURCES.textures.iceDialogBG.texture
    setSection(howToPlayPrompt.background,CommonResources.RESOURCES.textures.howToPlay2.size)


    howToPlayNextButton.hide()
    howToPlayGotItButton.show()
  },
  ui.ButtonStyles.E
)


const howToPlayGotItButton =  howToPlayPrompt.addButton(
  'Got It!',
  0,//100,
  buttonPosY - 20 - buttonHeight,
  () => { 
    if(!REGISTRY.showedHowToPlayAlready){
      REGISTRY.showedHowToPlayAlready = true
    } 
    if(howToPlayOK !== undefined){
      howToPlayOK()
    }
    hideHowToPlayPrompt()
  },
  ui.ButtonStyles.E
)

//howToPlayPrompt.hide()

export function openHowToPlayPrompt(onOK?:()=>void){
  howToPlayOK = onOK
  howToPlayPrompt.show()
  howToPlayNextButton.show()
  howToPlayGotItButton.hide()
  
  howToPlayPrompt.background.source = CommonResources.RESOURCES.textures.howToPlay1.texture//CommonResources.RESOURCES.textures.iceDialogBG.texture
  setSection(howToPlayPrompt.background,CommonResources.RESOURCES.textures.howToPlay1.size)
}
export function hideHowToPlayPrompt(){
  howToPlayPrompt.hide()
}

//
//END GAME CONFIRM PROMPT//END GAME CONFIRM PROMPT


//MAKE LAST SO ITS ONTOP

//START LOGIN ERROR PROMPT//START LOGIN ERROR PROMPT
//START LOGIN ERROR PROMPT//START LOGIN ERROR PROMPT

export const loginErrorPrompt = new ui.OptionPrompt(
  'An Error Occured',
  'Error',
  () => {
      loginErrorPrompt.close()
  },
  () => {
      loginErrorPrompt.hide()
      GAME_STATE.playerState.requestDoLoginFlow()
  },
  'Cancel',
  'Try Again', true
)

loginErrorPrompt.hide()


export const errorPrompt = new ui.OkPrompt(
  'An Error Occured',
  ()=>{

  }
)

errorPrompt.hide()


//END LOGIN ERROR PROMPT//END LOGIN ERROR PROMPT







//START REWARDS PROMPT
//moved to game.ts so can control when its instantiated
//export const rewardPrompt = new RewardsPrompt()
//REGISTRY.rewardPrompt = rewardPrompt
//END REWARDS PROMPT-
