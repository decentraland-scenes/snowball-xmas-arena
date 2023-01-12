import * as ui from '@dcl/ui-scene-utils'
import { CONFIG } from "src/config"
import { setSection } from "src/dcl-scene-ui-workaround/resources"
import { CommonResources } from "src/resources/common"
import { BallType } from "src/types/types"
import { PlayerRankingsType } from 'src/snowball-fight/connection/state-data-utils'
import { teamColor } from 'src/modules/teamColors';
import { REGISTRY } from 'src/registry'
import { MenuButton } from 'src/snowball-fight/leaderboards/button'
import { Lobby } from 'src/snowball-fight/lobbyScene'
import { GAME_STATE } from 'src/state'


log("LOADINGUI SANTA-HUD")

let MatchTimerMessage
let newTopScoresContainer

//BLA SCORE TEXT
let MatchScoreMessageBlue:UIText
let MatchScoreMessageRed:UIText

export function initUI(){
  

  //BLA SCORE
  log("LOADINGUI SANTA-HUD.top-bar") 
  newTopScoresContainer = new UIImage(ui.canvas, uiAtlasTexture)
  newTopScoresContainer.sourceHeight = 367 
  newTopScoresContainer.sourceWidth = 1534
  newTopScoresContainer.height = 122.34 
  newTopScoresContainer.width = 511.34 
  newTopScoresContainer.hAlign = 'center'
  newTopScoresContainer.vAlign = 'top' 
  newTopScoresContainer.positionY = 70
  newTopScoresContainer.visible = false
      //BLA TIME TEXT
   MatchTimerMessage = new UIText(newTopScoresContainer)

    MatchTimerMessage.value = '00:00'
    MatchTimerMessage.fontSize = 23
    MatchTimerMessage.width = '100%'
    MatchTimerMessage.vAlign = 'center'
    MatchTimerMessage.hAlign = 'center'
    MatchTimerMessage.hTextAlign = 'center'
    MatchTimerMessage.vTextAlign = 'center'
    MatchTimerMessage.positionY = 9
    MatchTimerMessage.positionX = 5.5
    MatchTimerMessage.textWrapping = true



  //BLA SCORE TEXT
   MatchScoreMessageBlue = new UIText(newTopScoresContainer)
  MatchScoreMessageBlue.value = '0'
  MatchScoreMessageBlue.fontSize = 30
  MatchScoreMessageBlue.width = '100%'
  MatchScoreMessageBlue.vAlign = 'center'
  MatchScoreMessageBlue.hAlign = 'center'
  MatchScoreMessageBlue.hTextAlign = 'center'
  MatchScoreMessageBlue.vTextAlign = 'left'
  MatchScoreMessageBlue.positionX = 120
  MatchScoreMessageBlue.positionY = 6
  MatchScoreMessageBlue.textWrapping = true

   MatchScoreMessageRed = new UIText(newTopScoresContainer)
  MatchScoreMessageRed.value = '0'
  MatchScoreMessageRed.fontSize = 30
  MatchScoreMessageRed.width = '100%'
  MatchScoreMessageRed.vAlign = 'center'
  MatchScoreMessageRed.hAlign = 'center'
  MatchScoreMessageRed.hTextAlign = 'center'
  MatchScoreMessageRed.vTextAlign = 'right'
  MatchScoreMessageRed.positionX = -115
  MatchScoreMessageRed.positionY = 6
  MatchScoreMessageRed.textWrapping = true
}

 let throwForceTexture = new Texture('textures/kickforce_texture.png', {samplingMode: 1, wrap: 0})
// let uiAtlasTexture = new Texture('textures/ui_atlas.png', {samplingMode: 1})
let uiAtlasTexture = CommonResources.RESOURCES.textures.gameAtlas.texture
 
//Kick force marker
export let throwForceContainer = new UIContainerRect(ui.canvas)
throwForceContainer.height = 64
throwForceContainer.hAlign = 'center'
throwForceContainer.vAlign = 'center'
throwForceContainer.width = 64
throwForceContainer.positionY = "3%" 


export let throwForceImage = new UIImage(throwForceContainer, throwForceTexture)
throwForceImage.width = '40px'
throwForceImage.height = '40px'
throwForceImage.sourceLeft = 0*64
throwForceImage.sourceTop = 0
throwForceImage.sourceWidth = 64
throwForceImage.sourceHeight = 64
throwForceImage.hAlign = 'center'
throwForceImage.vAlign = 'center' 
/*
throwForceImage.onClick = new OnClick(()=>{
  log("throwForceImage clicked")
})*/

//blocks clicking on screen, need to toggle off on where makes sense
export function throwForceContainerVisible(val:boolean){ 
  log("setDialogBoxOpen.throwForceContainerVisible",val)
  throwForceContainer.visible = val
  throwForceImage.visible = val
}

export function setThrowForceUI(_level:number){
  //log("setThrowForceUI",_level)

    let level =  Math.max(0,_level -1)
    if(level > 7){
      level = 7
    }
    
    const newVal = level*64    
    if(throwForceImage.sourceLeft!=newVal){
      log("setThrowForceUI.level changed",level)
      throwForceImage.sourceLeft = newVal
      throwForceContainer.hAlign = 'center'

      if(level <= 0){ 
        throwForceContainerVisible(false)
      // kickforceImage.visible = false
      }
      else{
        throwForceContainerVisible(true)
      // kickforceImage.visible = true
      } 
    }

    
    
}
setThrowForceUI(0)
throwForceContainerVisible(false)//start off



// TOP EDGE - SCORES CONTAINER
let TopScoresContainer = new UIContainerRect(ui.canvas)
TopScoresContainer.height = '8%'
TopScoresContainer.hAlign = 'center'
TopScoresContainer.vAlign = 'top'
TopScoresContainer.width = "30%"
TopScoresContainer.positionY = "5%"
  




export let MatchTimeContainer = new UIContainerRect(TopScoresContainer)
    MatchTimeContainer.visible = true
    MatchTimeContainer.height = 24    
    MatchTimeContainer.hAlign = 'center'
    MatchTimeContainer.vAlign = 'bottom'
    MatchTimeContainer.width = '16%'
    MatchTimeContainer.positionY = 20
    MatchTimeContainer.color = Color4.FromHexString(`#00000088`)

export let lobbyMessage = new UIText(MatchTimeContainer)

    lobbyMessage.value = 'until next match'
    lobbyMessage.fontSize = 12
    lobbyMessage.width = '100%'
    lobbyMessage.vAlign = 'center'
    lobbyMessage.hAlign = 'center'
    lobbyMessage.hTextAlign = 'center'
    lobbyMessage.vTextAlign = 'center'
    lobbyMessage.positionY = '-100%'
    lobbyMessage.textWrapping = false

export function showLobbyMessage(_visible:boolean){
  lobbyMessage.visible = _visible
}      
showLobbyMessage(false)

export function setGameTimeValue(val:string){
  if(MatchTimerMessage.value !== val){
    MatchTimerMessage.value = val
  }
}
export function updateGameTime(_timeInSeconds:number){

    let minutes = Math.floor(Math.floor(_timeInSeconds)/60)
    let seconds = Math.floor(Math.floor(_timeInSeconds)%60)
    let secondsString = seconds.toString()

                               
                if (_timeInSeconds > 10){
                    secondsString = seconds.toString()  
                    MatchTimerMessage.color = Color4.White()                  
                }                
                if (_timeInSeconds < 10){                     
                    MatchTimerMessage.color = Color4.Yellow()                  
                }                
                if(_timeInSeconds < 5){                   
                    MatchTimerMessage.color = Color4.FromHexString("#ff4a35ff")
                    MatchTimerMessage.fontSize = 20
                }
                if (seconds < 10){
                  secondsString = ("0" + secondsString )                 
                } 

                
                const val = ("0" + minutes + ":" + secondsString)

                setGameTimeValue( val )  
                
}


// TOP EDGE - SCORES

// export let TopSnow2 = new UIContainerRect(TopScoresContainer)
// TopSnow2.visible = true
// TopSnow2.height = '75%'    
// TopSnow2.hAlign = 'center'
// TopSnow2.vAlign = 'center'
// TopSnow2.width = '40%'
// TopSnow2.positionY = 40
// TopSnow2.color = Color4.FromHexString(`#ffffffff`)

// export let TopSnow = new UIContainerRect(TopScoresContainer)
// TopSnow.visible = true
// TopSnow.height = '75%'    
// TopSnow.hAlign = 'center'
// TopSnow.vAlign = 'center'
// TopSnow.width = '40%'
// TopSnow.positionY = 34
// TopSnow.color = Color4.FromHexString(`#ccccccff`)

/*

export let MatchScoreContainer = new UIContainerRect(TopScoresContainer)
MatchScoreContainer.visible = true
MatchScoreContainer.height = '75%'    
MatchScoreContainer.hAlign = 'center'
MatchScoreContainer.vAlign = 'center'
MatchScoreContainer.width = '40%'
MatchScoreContainer.positionY = 32
MatchScoreContainer.color = Color4.FromHexString(`#000000ff`)

//BLA UPDATE SCORE

export let ScoreBGRed = new UIContainerRect(MatchScoreContainer)
ScoreBGRed.visible = true
ScoreBGRed.height = '100%'    
ScoreBGRed.hAlign = 'right'
ScoreBGRed.vAlign = 'center'
ScoreBGRed.width = '54%'
ScoreBGRed.color = Color4.FromHexString(`#dd0000ff`)

export let ScoreBGBlue = new UIContainerRect(MatchScoreContainer)
ScoreBGBlue.visible = true
ScoreBGBlue.height = '100%'    
ScoreBGBlue.hAlign = 'left'
ScoreBGBlue.vAlign = 'center'
ScoreBGBlue.width = '54%'
ScoreBGBlue.color = Color4.FromHexString(`#0000ddff`)

export let ScoreSeparatorBG = new UIContainerRect(MatchScoreContainer)
ScoreSeparatorBG.visible = true
ScoreSeparatorBG.height = '100%'    
ScoreSeparatorBG.hAlign = 'center'
ScoreSeparatorBG.vAlign = 'center'
ScoreSeparatorBG.width = '8%'
ScoreSeparatorBG.color = Color4.FromHexString(`#000000ff`)

export let MatchScoreSeparator= new UIText(ScoreSeparatorBG)
MatchScoreSeparator.value = ':'
MatchScoreSeparator.fontSize = 26
MatchScoreSeparator.width = '100%'
MatchScoreSeparator.vAlign = 'center'
MatchScoreSeparator.hAlign = 'center'
MatchScoreSeparator.hTextAlign = 'center'
MatchScoreSeparator.vTextAlign = 'center'
MatchScoreSeparator.positionY = 1
MatchScoreSeparator.textWrapping = true*/


// Bottom EDGE - ROOT  CONTAINER
let BottomContainer = new UIContainerRect(ui.canvas)
BottomContainer.height = '40%'
BottomContainer.hAlign = 'center'
BottomContainer.vAlign = 'bottom'
BottomContainer.width = "30%"
//BottomContainer.color = Color4.FromHexString(`#00000088`)

// export let AmmoSnow = new UIContainerRect(BottomContainer)
// AmmoSnow.visible = true
// AmmoSnow.height = '12%'    
// AmmoSnow.hAlign = 'center'
// AmmoSnow.vAlign = 'bottom'
// AmmoSnow.width = '40%'
// AmmoSnow.positionY = 40
// AmmoSnow.color = Color4.FromHexString(`#ffffffff`)

// export let AmmoSnow2 = new UIContainerRect(BottomContainer)
// AmmoSnow2.visible = true
// AmmoSnow2.height = '12%'    
// AmmoSnow2.hAlign = 'center'
// AmmoSnow2.vAlign = 'bottom'
// AmmoSnow2.width = '40%'
// AmmoSnow2.positionY = 35
// AmmoSnow2.color = Color4.FromHexString(`#ccccccff`)

export let AmmoContainer = new UIContainerRect(BottomContainer)
AmmoContainer.visible = true
AmmoContainer.height = 70.75
AmmoContainer.hAlign = 'center'
AmmoContainer.vAlign = 'bottom'
AmmoContainer.width = 350.5
AmmoContainer.positionY = 32
//AmmoContainer.color = Color4.FromHexString(`#000000ff`)

//BLA AMMO CONTAINER
function setAmmoContainerColor(newAmmoContainerImage:UIImage,color:teamColor){
  //log("setAmmoContainerColor",color)
  if(color == teamColor.BLUE){
    //BLUE
    newAmmoContainerImage.sourceTop = 1930
    newAmmoContainerImage.sourceHeight = 302
    newAmmoContainerImage.sourceWidth = 1400.5
  }else if(color == teamColor.RED){
    //RED
    newAmmoContainerImage.sourceTop = 4344
    newAmmoContainerImage.sourceHeight = 302
    newAmmoContainerImage.sourceWidth = 1400.5
  }else if(color == teamColor.NEUTRAL){
    //GREY
    newAmmoContainerImage.sourceTop = 4042
    newAmmoContainerImage.sourceHeight = 302
    newAmmoContainerImage.sourceWidth = 1400.5 
    log("BLA")
  }
}


export let newAmmoContainerImage = new UIImage(AmmoContainer, uiAtlasTexture)
newAmmoContainerImage.height = '120%'
newAmmoContainerImage.width = '120%'
newAmmoContainerImage.hAlign = "center"
newAmmoContainerImage.vAlign = "bottom"
newAmmoContainerImage.positionY = -52
newAmmoContainerImage.positionX = 70 
newAmmoContainerImage.visible = true
setAmmoContainerColor(newAmmoContainerImage,teamColor.NEUTRAL)
/*
export let newBlueAmmoContainer = new UIImage(ui.canvas, uiAtlasTexture)
newBlueAmmoContainer.sourceTop = 1947
newBlueAmmoContainer.sourceHeight = 302
newBlueAmmoContainer.sourceWidth = 1400
newBlueAmmoContainer.height = 70.75
newBlueAmmoContainer.width = 350.5
newBlueAmmoContainer.hAlign = "center"
newBlueAmmoContainer.vAlign = "bottom"
newBlueAmmoContainer.positionX = 125
newBlueAmmoContainer.positionY = -30
newBlueAmmoContainer.visible = true
*/
/*
export let newAmmoImage = new UIImage(newBlueAmmoContainer,uiAtlasTexture)
newAmmoImage.sourceHeight = 101
newAmmoImage.sourceWidth = 101
newAmmoImage.sourceTop = 1955
newAmmoImage.sourceLeft = 1410 
newAmmoImage.height = 26
newAmmoImage.width = 26
newAmmoImage.positionY = -12.5
newAmmoImage.positionX = 83.5*/

/*
export let AmmoLabel = new UIText(AmmoContainer)
AmmoLabel.value = 'Snowballs:'
AmmoLabel.fontSize = 14
AmmoLabel.width = '50%'
AmmoLabel.vAlign = 'center'
AmmoLabel.hAlign = 'left'
AmmoLabel.hTextAlign = 'center'
AmmoLabel.vTextAlign = 'center'
AmmoLabel.textWrapping = true*/

export let AmmoText = new UIText(AmmoContainer)
AmmoText.value = '0/10'
AmmoText.fontSize = 19
AmmoText.width = '60'
AmmoText.vAlign = 'center'
AmmoText.hAlign = 'right'
AmmoText.hTextAlign = 'center'
AmmoText.vTextAlign = 'center'
AmmoText.textWrapping = true
AmmoText.positionX = 105
AmmoText.positionY = -26.5

//WORK IN PROGRESS
export let AmmoTextBARArr:UIImage[] = []
let xoffset = 6
let width = 34
let offsetAmount = width + 5.8
let amount = 10
let AmmoTextBARSlot 
for(let x = 0;x<10;x++){
  let AmmoTextBAR = new UIImage(AmmoContainer,CommonResources.RESOURCES.textures.snowballEmpty.texture)
  //AmmoTextBAR.
  setSection(AmmoTextBAR,CommonResources.RESOURCES.textures.snowballEmpty.size)
  //AmmoTextBAR.value = 'yy'
  //AmmoTextBAR.fontSize = 10
  //AmmoTextBAR.width = '80%'
  AmmoTextBAR.width = width
  AmmoTextBAR.height = width
  AmmoTextBAR.vAlign = 'center'
  AmmoTextBAR.hAlign = 'right'
  //AmmoTextBAR.hTextAlign = 'center'
  //AmmoTextBAR.vTextAlign = 'center'
  //AmmoTextBAR.textWrapping = true
  AmmoTextBAR.positionY = -60
  AmmoTextBAR.positionX = -(((offsetAmount*amount))/2 + offsetAmount) + xoffset 

  AmmoTextBARArr[x] = AmmoTextBAR


  xoffset += offsetAmount
}

//BLA UPDATE AMMO
export function updateAmmo(_currentAmmo:number, _maxAmmo:number, _ammoPoweredUp:BallType[]){
  //FIFO 
  const currType = _currentAmmo > 0 && 0 > _ammoPoweredUp.length ? _ammoPoweredUp[0] : '??'
  log("updateAmmo","ENTRY",_currentAmmo,_maxAmmo,"_currentAmmoType",currType,"all power ups",_ammoPoweredUp) 

  let str =""
  for(let x=0;x<CONFIG.SNOWBALL_MAX_AMOUNT;x++){
    
    const t = x < _ammoPoweredUp.length ? _ammoPoweredUp[x] : "empty"
    const ui = AmmoTextBARArr[x]
    //log("updateAmmo",x,t)
    if(t == 'normal'){
      //ui.value = "w"
      setSection(ui,CommonResources.RESOURCES.textures.snowballWhite.size)
    }else if(t=='yellow'){
      //ui.value = "y"
      setSection(ui,CommonResources.RESOURCES.textures.snowballYellow.size)
    }else{
      setSection(ui,CommonResources.RESOURCES.textures.snowballEmpty.size)
    }
  }
  //str += "<--"
  AmmoText.value = _currentAmmo + "/" + _maxAmmo
  /*if(currType == 'yellow'){
    AmmoText.color = Color4.Yellow()
  }else{
    AmmoText.color = Color4.White()
  }*/
}
 
export function setTeamColor(color:teamColor){
  //log("setTeamColor.setAmmoContainerColor",color)
  setAmmoContainerColor(newAmmoContainerImage,color)
}

const readyColor = Color4.FromHexString(`#00ff0088`)
const notReadyColor = Color4.FromHexString(`#bb3300bb`)
const blackTranspBG = Color4.FromHexString(`#00000088`)
const activeTextColor = Color4.FromHexString(`#ffffffff`)
const inactiveTextColor = Color4.FromHexString(`#888888ff`)

let serverConnectionCard = new UIContainerRect(BottomContainer)
serverConnectionCard.visible = false
serverConnectionCard.height = '10%'
serverConnectionCard.hAlign = 'center'
serverConnectionCard.vAlign = 'bottom'
serverConnectionCard.width = "100%"
serverConnectionCard.color = Color4.FromHexString(`#00000088`)

let serverTitleBox = new UIContainerRect(serverConnectionCard)
serverTitleBox.height = '100%'
serverTitleBox.hAlign = 'left'
serverTitleBox.vAlign = 'top'
serverTitleBox.width = "50%"

let serverStatusBox = new UIContainerRect(serverConnectionCard)
serverStatusBox.height = '100%'
serverStatusBox.hAlign = 'right'
serverStatusBox.vAlign = 'top'
serverStatusBox.width = "50%"

export const serverTitleText = new UIText(serverTitleBox)
serverTitleText.visible = true
serverTitleText.paddingRight = 5
serverTitleText.value = "Game Server Status :"
serverTitleText.width = '100%'
serverTitleText.height = '100%'
serverTitleText.vAlign = 'center'
serverTitleText.hAlign = 'center'
serverTitleText.hTextAlign = 'right'
serverTitleText.vTextAlign = 'center'
serverTitleText.fontSize = 12
serverTitleText.color = Color4.White()
serverTitleText.outlineColor = Color4.White()
serverTitleText.outlineWidth = 0.2
serverTitleText.shadowColor = Color4.FromHexString('#000000aa')
serverTitleText.shadowOffsetX = -2
serverTitleText.shadowOffsetY = -2

export const serverStatusText = new UIText(serverStatusBox)
serverStatusText.visible = true
serverTitleText.paddingLeft = 5
serverStatusText.value = "WAITING FOR THE NEXT ROUND"
serverStatusText.width = '100%'
serverStatusText.height = '100%'
serverStatusText.vAlign = 'center'
serverStatusText.hAlign = 'center'
serverStatusText.hTextAlign = 'left'
serverStatusText.vTextAlign = 'center'
serverStatusText.fontSize = 12
serverStatusText.color = Color4.Yellow()
serverStatusText.outlineColor = Color4.Yellow()
serverStatusText.outlineWidth = 0.2
serverStatusText.shadowColor = Color4.FromHexString('#000000aa')
serverStatusText.shadowOffsetX = -2
serverStatusText.shadowOffsetY = -2

export function setServerStatusUI(text:string, _color?:Color4) {
    serverConnectionCard.visible = true
    serverStatusText.value = text

    if(_color){
        serverStatusText.color = _color
        serverStatusText.outlineColor = _color
    }
}

export function hideServerStatusUI() {
  serverConnectionCard.visible = false
}


export const CursorMessageContainer = new UIContainerRect(ui.canvas)
CursorMessageContainer.visible = false
CursorMessageContainer.width = '25%'
CursorMessageContainer.height = '10%'
CursorMessageContainer.vAlign = 'center'
CursorMessageContainer.hAlign = 'center'
CursorMessageContainer.positionY= '42%'
CursorMessageContainer.color = Color4.FromHexString(`#000000bb`)

export const CursorMessageTitle = new UIText(CursorMessageContainer)
CursorMessageTitle.value = "TEAMS ARE READY!"
CursorMessageTitle.width = '100%'
CursorMessageTitle.height = '20%'
//CursorMessageTitle.positionY = '30%'
CursorMessageTitle.vAlign = 'top'
CursorMessageTitle.hAlign = 'center'
CursorMessageTitle.hTextAlign = 'center'
CursorMessageTitle.vTextAlign = 'center'
CursorMessageTitle.fontSize = 14
CursorMessageTitle.positionY = -5
CursorMessageTitle.color = Color4.White()

export const CursorMessage = new UIText(CursorMessageContainer)
CursorMessage.value = "5"
CursorMessage.width = '100%'
CursorMessage.height = '30%'
CursorMessage.positionY = '-7%'
CursorMessage.vAlign = 'center'
CursorMessage.hAlign = 'center'
CursorMessage.hTextAlign = 'center'
CursorMessage.vTextAlign = 'center'
CursorMessage.fontSize = 24
CursorMessage.color = Color4.Yellow()
CursorMessage.outlineColor = Color4.Yellow()
CursorMessage.outlineWidth = 0.2

export const serverMessageContainer = new UIContainerRect(ui.canvas)
serverMessageContainer.visible = false
serverMessageContainer.width = '75%'
serverMessageContainer.height = '10%'
serverMessageContainer.vAlign = 'top'
serverMessageContainer.hAlign = 'center'
serverMessageContainer.color = Color4.FromHexString(`#000000bb`)



export const serverMessage = new UIText(serverMessageContainer)
serverMessage.value = "5"
serverMessage.width = '100%'
serverMessage.height = '30%'
serverMessage.positionY = '-5%'
serverMessage.vAlign = 'center'
serverMessage.hAlign = 'center'
serverMessage.hTextAlign = 'center'
serverMessage.vTextAlign = 'center'
serverMessage.fontSize = 20
serverMessage.color = Color4.Yellow()
serverMessage.outlineColor = Color4.Yellow()
serverMessage.outlineWidth = 0.2

export const snowballInstructionContainer = new UIContainerRect(ui.canvas)
snowballInstructionContainer.visible = true
snowballInstructionContainer.width = '22%'
snowballInstructionContainer.height = '6%'
snowballInstructionContainer.vAlign = 'bottom'
snowballInstructionContainer.hAlign = 'center'
snowballInstructionContainer.positionY = '12%'
snowballInstructionContainer.color = Color4.FromHexString(`#00000088`)

export const instructionMessage = new UIText(snowballInstructionContainer)
//set in displayMakeSnowballInstructions()
//instructionMessage.value = `Hold 'F' to make snowballs\n`

instructionMessage.width = '100%'
instructionMessage.height = '30%'
instructionMessage.positionY = '-2%'
instructionMessage.vAlign = 'center'
instructionMessage.hAlign = 'center'
instructionMessage.hTextAlign = 'center'
instructionMessage.vTextAlign = 'center'
instructionMessage.paddingLeft = 12
instructionMessage.fontSize = 12
instructionMessage.color = Color4.Yellow()



export const fireInstructionContainer = new UIContainerRect(ui.canvas)
fireInstructionContainer.visible = true
fireInstructionContainer.width = '22%'
fireInstructionContainer.height = '6%'
fireInstructionContainer.vAlign = 'bottom'
fireInstructionContainer.hAlign = 'center'
fireInstructionContainer.positionY = '12%'
fireInstructionContainer.color = Color4.FromHexString(`#00000088`)

export const fireInstructionMessage = new UIText(fireInstructionContainer)
fireInstructionMessage.value = `Stand near the fire to warm up`

fireInstructionMessage.width = '100%'
fireInstructionMessage.height = '30%'
fireInstructionMessage.positionY = '-2%'
fireInstructionMessage.vAlign = 'center'
fireInstructionMessage.hAlign = 'center'
fireInstructionMessage.hTextAlign = 'center'
fireInstructionMessage.vTextAlign = 'center'
fireInstructionMessage.paddingLeft = 12
fireInstructionMessage.fontSize = 12
fireInstructionMessage.color = Color4.Yellow()


export function displayFireInstructions(display:boolean){
  fireInstructionContainer.visible = display
} 
//default false
displayFireInstructions(false)

export function displayMakeSnowballInstructions(display:boolean){
  let msg =  `In snowball making area\n`
  if(!CONFIG.SNOWBALL_AUTO_COLLECT_ENABLED){
    msg = `Hold 'F' to make snowballs\n`
  }
  if(instructionMessage.value != msg){
    instructionMessage.value = msg
  }
  snowballInstructionContainer.visible = display
} 
//default false
displayMakeSnowballInstructions(false)



export function DisplayCursorMessage(title:string, message:string, timeOut?:number, color?:Color4){
  

  CursorMessage.value = message
  CursorMessageTitle.value = title
  CursorMessageContainer.visible = true

  if(color){
    CursorMessage.color = color
    CursorMessage.outlineColor = color
  }
  else{
    CursorMessage.color = Color4.Yellow()
    CursorMessage.outlineColor = Color4.Yellow()
  }

  if(timeOut){
    if(!cursorTimeoutSys.active){
      //engine.addSystem(cursorTimeoutSys)
      cursorTimeoutSys.startNew(timeOut)
    }
    else{
      //prevent duration from going too high
      cursorTimeoutSys.duration = Math.min(cursorTimeoutSys.duration+timeOut, (timeOut*2))
      log("DisplayCursorMessage","cursorTimeoutSys.duration",cursorTimeoutSys.duration)
    }
  }
    
  
}

export function showArenaGameUI(val:boolean){
  MatchTimeContainer.visible = val
  //MatchScoreContainer.visible = val
  //newTopScoresContainer.visible = val 

}
showArenaGameUI(false)

export function HideCursorMessage(){
    CursorMessage.value = ""
    CursorMessageTitle.value = ""
    CursorMessageContainer.visible = false
    
  }
export function updateUIScores(_team1Score:number, _team2Score:number){
    
    MatchScoreMessageBlue.value = _team1Score.toString()
    MatchScoreMessageRed.value = _team2Score.toString()
}
export function resetUIScores(){
    
    MatchScoreMessageRed.value = ("0")
    MatchScoreMessageBlue.value = ("0")

}


export function DisplayServerMessage( message:string){
    serverMessage.value = message    
    serverMessageContainer.visible = true
    engine.addSystem(new ServerMessageTimeout(3))
  
  }

  
class ServerMessageTimeout{  
    timer = 0
    duration:number = 3
  
    constructor(time?:number){
        if(time){
            this.duration = time
        }
      
    }
    update(dt: number){

      if(this.timer < this.duration){
        this.timer += dt
      }
      else{
        serverMessageContainer.visible = false
        engine.removeSystem(this)
      }
    }
  
  }

class CursorMessageTimeout{  
    timer = 0
    duration:number = 3
    active:boolean = false
  
    constructor(time?:number){
        if(time){
            this.duration = time
        }
      
    }
    update(dt: number){
      if(this.timer < this.duration){
        this.timer += dt
      }
      else{
        HideCursorMessage()
        this.active = false
       // engine.removeSystem(this)
      }
    }

    startNew(time:number){
        this.timer = 0
        this.duration = time
        this.active = true
    }
  
  }

  let cursorTimeoutSys = new CursorMessageTimeout(1)
  engine.addSystem(cursorTimeoutSys)









  
//#region healthBar
//BLA HEALTHBAR


export let healthBarContainer = new UIContainerRect(ui.canvas)
healthBarContainer.width = 76.11
healthBarContainer.height = 290.1
healthBarContainer.positionX = -50
healthBarContainer.positionY = 60
healthBarContainer.vAlign = "top"
healthBarContainer.hAlign = "right"

const healthBar_5 = new UIImage(healthBarContainer, uiAtlasTexture)

healthBar_5.width = 76.11
healthBar_5.height = 290.1
healthBar_5.sourceLeft = 0
healthBar_5.sourceTop = 962.5
healthBar_5.sourceWidth = 253.7 
healthBar_5.sourceHeight = 967
healthBar_5.vAlign = "top"
healthBar_5.hAlign = "right"
healthBar_5.visible = true


const healthBar_4 = new UIImage(healthBarContainer, uiAtlasTexture)

healthBar_4.width = 76.11
healthBar_4.height = 290.1
healthBar_4.sourceLeft = 253.5
healthBar_4.sourceTop = 962.5
healthBar_4.sourceWidth = 253.7 
healthBar_4.sourceHeight = 967
healthBar_4.vAlign = "top"
healthBar_4.hAlign = "right"
healthBar_4.visible = false


const healthBar_3 = new UIImage(healthBarContainer, uiAtlasTexture)

healthBar_3.width = 76.11
healthBar_3.height = 290.1
healthBar_3.sourceLeft = 507.5
healthBar_3.sourceTop = 962.5
healthBar_3.sourceWidth = 253.7 
healthBar_3.sourceHeight = 967
healthBar_3.vAlign = "top"
healthBar_3.hAlign = "right"
healthBar_3.visible = false


const healthBar_2 = new UIImage(healthBarContainer, uiAtlasTexture)

healthBar_2.width = 76.11
healthBar_2.height = 290.1
healthBar_2.sourceLeft = 761
healthBar_2.sourceTop = 962.5
healthBar_2.sourceWidth = 253.7 
healthBar_2.sourceHeight = 967
healthBar_2.vAlign = "top"
healthBar_2.hAlign = "right"
healthBar_2.visible = false


const healthBar_1 = new UIImage(healthBarContainer, uiAtlasTexture)

healthBar_1.width = 76.11
healthBar_1.height = 290.1
healthBar_1.sourceLeft = 1014.5
healthBar_1.sourceTop = 962.5
healthBar_1.sourceWidth = 253.7 
healthBar_1.sourceHeight = 967
healthBar_1.vAlign = "top"
healthBar_1.hAlign = "right"
healthBar_1.visible = false

let healthBarImages: UIImage[] = [healthBar_5, healthBar_4, healthBar_3, healthBar_2, healthBar_1]

export function showHealthBar(val:boolean){
  if(healthBarContainer!==undefined) healthBarContainer.visible = val
}
//BLA UPDATE HEALTH
export function updateHealthUI(health: number, maxHealth: number){
  if(health == 5){
    updateHealthBarImage(0)
      log("healt is = 5")
  }
  else if(health == 4){
    updateHealthBarImage(1)  
      log("healt is = 4")
  }
  else if(health == 3){
    updateHealthBarImage(2)  
      log("healt is = 3")
  }
  else if(health == 2){
    updateHealthBarImage(3)  
      log("healt is = 2")
  }
  else if(health == 1){
    updateHealthBarImage(4)  
      log("healt is = 1")
  }
}

function updateHealthBarImage(helath: number){
  for (let i = 0; i < healthBarImages.length; i++) {
    if(healthBarImages[i].visible) healthBarImages[i].visible = false
  }

  healthBarImages[helath].visible = true
}

//#endregion

//#region MENU
//BLA MENU

let inArena = false

export const menuContainer = new UIImage(ui.canvas, uiAtlasTexture)
menuContainer.height = 446
menuContainer.width = 508  
menuContainer.sourceHeight = 892.1
menuContainer.sourceWidth = 1010 
menuContainer.sourceTop = 2249
menuContainer.sourceLeft = 0
menuContainer.vAlign = "center"
menuContainer.hAlign = "center"
menuContainer.positionX = 0
menuContainer.positionY = 25
menuContainer.visible = false
menuContainer.isPointerBlocker = true

const MENU_BOTTOM_POS_X = -7
const MENU_BOTTOM_POS_Y = -30



export const menuButton = new UIImage(ui.canvas, uiAtlasTexture)
menuButton.height = 67.4
menuButton.width = 178.7 
menuButton.sourceHeight = 199
menuButton.sourceWidth = 536 
menuButton.sourceTop = 2249
menuButton.sourceLeft = 1015.5
menuButton.vAlign = "bottom"
menuButton.hAlign = "right"
menuButton.positionX = MENU_BOTTOM_POS_X
menuButton.positionY = MENU_BOTTOM_POS_Y
menuButton.isPointerBlocker = true
menuButton.onClick = new OnPointerDown(() => {
  log("createButtonsBaseOnScene","GAME_STATE.gameConnected",GAME_STATE.gameConnected)
  if(GAME_STATE.gameConnected ==='connected'){
    createButtonsBaseOnScene(true,'arena')
  }else{
    createButtonsBaseOnScene(true,'lobby')
  }
})

export const closeMenuButton = new UIImage(menuContainer, CommonResources.RESOURCES.textures.closeMenuIconButton.texture)
setSection(closeMenuButton,CommonResources.RESOURCES.textures.closeMenuIconButton.size)
closeMenuButton.height = 60
closeMenuButton.width = 60
closeMenuButton.vAlign = "top"
closeMenuButton.hAlign = "right"
closeMenuButton.positionX = -18
closeMenuButton.positionY = -10
closeMenuButton.isPointerBlocker = true
closeMenuButton.onClick = new OnPointerDown(() => {
  showGameMenu(false) 
})


export const howToPlayButton = new UIImage(menuContainer, uiAtlasTexture)
howToPlayButton.height = 72.65
howToPlayButton.width = 332 
howToPlayButton.sourceHeight = 166.2
howToPlayButton.sourceWidth = 766.5
howToPlayButton.sourceTop = 738
howToPlayButton.sourceLeft = 0
howToPlayButton.vAlign = "center"
howToPlayButton.hAlign = "center"
howToPlayButton.positionX = 0
howToPlayButton.positionY = 75
howToPlayButton.visible = false
howToPlayButton.isPointerBlocker = true
howToPlayButton.onClick = new OnPointerDown(() => {
  showGameMenu(false)
  REGISTRY.Game_2DUI.openHowToPlayPrompt()
})

const playButtonActionOnClick = new OnPointerDown(() => {
  showGameMenu(false)
  REGISTRY.SCENE_MGR.goArena()
  inArena = true
})

export const playButton = new UIImage(menuContainer, uiAtlasTexture)
playButton.height = 72.65
playButton.width = 332 
playButton.sourceHeight = 166.2
playButton.sourceWidth = 766.5
playButton.sourceTop = 738
playButton.sourceLeft = 768
playButton.vAlign = "center"
playButton.hAlign = "center"
playButton.positionX = 0
playButton.positionY = -5
playButton.visible = false
playButton.isPointerBlocker = true
playButton.onClick = playButtonActionOnClick


/*export const playMenuButton = new UIImage(ui.canvas, uiAtlasTexture)
playMenuButton.height = 72.65 * .5
playMenuButton.width = 332 * .4
playMenuButton.sourceHeight = 166.2
playMenuButton.sourceWidth = 766.5
playMenuButton.sourceTop = 738
playMenuButton.sourceLeft = 768
playMenuButton.vAlign = "bottom"
playMenuButton.hAlign = "right"
playMenuButton.positionX = -25// MENU_BOTTOM_POS_X
playMenuButton.positionY = 50//MENU_BOTTOM_POS_Y - 60
playMenuButton.visible = false
playMenuButton.isPointerBlocker = true
playMenuButton.onClick = playButtonActionOnClick*/

//using 1 button instead of a quick and play button seperatly
//so its easier to deal with switching
export const playQuitHudMenuButton = new UIImage(ui.canvas, uiAtlasTexture)
playQuitHudMenuButton.height = (191/8)*2.2
playQuitHudMenuButton.width = (576.5/8)*2.2
playQuitHudMenuButton.sourceHeight = 191
playQuitHudMenuButton.sourceWidth = 576.5
playQuitHudMenuButton.sourceTop = 545
playQuitHudMenuButton.sourceLeft = 766.5
playQuitHudMenuButton.vAlign = "bottom"
playQuitHudMenuButton.hAlign = "right"
playQuitHudMenuButton.positionX = -12// MENU_BOTTOM_POS_X
playQuitHudMenuButton.positionY = 47//MENU_BOTTOM_POS_Y - 60
playQuitHudMenuButton.visible = false
playQuitHudMenuButton.isPointerBlocker = true
playQuitHudMenuButton.onClick = playButtonActionOnClick

export const rewardsButton = new UIImage(menuContainer, uiAtlasTexture)
rewardsButton.height = 72.65
rewardsButton.width = 332 
rewardsButton.sourceHeight = 167
rewardsButton.sourceWidth = 766
rewardsButton.sourceTop = 377
rewardsButton.sourceLeft = 766
rewardsButton.vAlign = "center"
rewardsButton.hAlign = "center"
rewardsButton.positionX = 0
rewardsButton.positionY = -85
rewardsButton.visible = false
rewardsButton.isPointerBlocker = true
rewardsButton.onClick = new OnPointerDown(() => {
  showGameMenu(false)
  if(CONFIG.REWARD_BUTTON_ENABLED){
    REGISTRY.rewardPrompt.show()
  }else{
    ui.displayAnnouncement("Rewards Coming Soon!")
  }
})

const quitButtonOnClick = new OnPointerDown(() => {
  showGameMenu(false)
  REGISTRY.Game_2DUI.hideHowToPlayPrompt();
  //or just put over top of?
  //Constants.Game_2DUI.toggleGameResultsPrompt(false)
  REGISTRY.SCENE_MGR.goLobby()
  //Constants.SCENE_MGR.goLobby();
})

export const quitButton = new UIImage(menuContainer, uiAtlasTexture)
quitButton.height = 72.65
quitButton.width = 332
quitButton.sourceHeight = 166.2
quitButton.sourceWidth = 766.5 
quitButton.sourceTop = 377
quitButton.sourceLeft = 0
quitButton.vAlign = "center"
quitButton.hAlign = "center"
quitButton.positionX = 0
quitButton.positionY = 75
quitButton.visible = false
quitButton.isPointerBlocker = true
quitButton.onClick = quitButtonOnClick


export let gameMenuVisible:boolean = false
export function showGameMenu(val:boolean){
  log("showGameMenu","val",val,"GAME_STATE.gameConnected",GAME_STATE.gameConnected)
  if(!CONFIG.IS_GAME_LIVE){
    log("showGameMenu","CONFIG.IS_GAME_LIVE is off, dont show menu","val",val,"IS_GAME_LIVE",CONFIG.IS_GAME_LIVE)
    val = false


    menuContainer.visible = false
    menuButton.visible = false
    playQuitHudMenuButton.visible = false

    gameMenuVisible = val

    return
  }
  menuContainer.visible = val
  menuButton.visible = !val

  
  playQuitHudMenuButton.visible = !val
  

  gameMenuVisible = val

  REGISTRY.setDialogBoxOpen("showGameMenu",val)
}
 

export function isPlayerInArenaUI(insideArena: boolean){
  inArena = insideArena
}



const myButtons = [
  {button:howToPlayButton,lobby:true,arena:true},
  {button:quitButton,lobby:false,arena:true},
  {button:playButton,lobby:true,arena:false},
  {button:rewardsButton,lobby:true,arena:false},
]

let storedButtonY = 75
let buttonY = 75
let buttonYinc = -75
   
export function adjustPlayQuitButton(scene: 'lobby'|'arena'){
  if(scene === 'arena'){
    //quit button
    //playQuitHudMenuButton.visible = true
    playQuitHudMenuButton.height = (197/8)*2.2
    playQuitHudMenuButton.width = (576/8)*2.2
    playQuitHudMenuButton.sourceHeight = 197
    playQuitHudMenuButton.sourceWidth = 576 
    playQuitHudMenuButton.sourceTop = 540
    playQuitHudMenuButton.sourceLeft = 0
    playQuitHudMenuButton.onClick = quitButtonOnClick
  }else{
    //play
    playQuitHudMenuButton.height = (191/8)*2.2
    playQuitHudMenuButton.width = (576.5/8)*2.2
    playQuitHudMenuButton.sourceHeight = 191
    playQuitHudMenuButton.sourceWidth = 576.5
    playQuitHudMenuButton.sourceTop = 545
    playQuitHudMenuButton.sourceLeft = 766.5
    playQuitHudMenuButton.onClick = playButtonActionOnClick
  }
}

export function createButtonsBaseOnScene(toggleOn: boolean, scene: 'lobby'|'arena'){
  log("createButtonsBaseOnScene",scene,toggleOn)
  if(!CONFIG.IS_GAME_LIVE){
    log("createButtonsBaseOnScene","CONFIG.IS_GAME_LIVE is off, dont show menu","toggleOn",toggleOn,"IS_GAME_LIVE",CONFIG.IS_GAME_LIVE)
    toggleOn = false
  }
  showGameMenu(toggleOn)
  //closeMenuButton.visible = val
  /*
  //put buttons in order u want rendered
  const myButtons = [
    {button:howToPlayButton,lobby:true,arena:true},
    {button:quitButton,lobby:true,arena:true},
    {button:playButton,lobby:true,arena:false},
    {button:rewardsButton,lobby:true,arena:true}
  ]

  let buttonY = -100
  let buttonYInc = 75
  for(let x=0;x<myButtons.length;x++){
    if(
        (scene === 'arena' && myButtons[x].arena)
        || (scene === 'lobby' && myButtons[x].lobby)
        ){//check if should render
      myButtons[x].button.visible = true
      myButtons[x].button.positionY = buttonY

      buttonY+=buttonYInc
    }else{
      myButtons[x].button.visible = false
    }
  }
  */

  buttonY = storedButtonY

  if(scene == "lobby"){
    log("createButtonsBaseOnScene","lobby buttons")
    for (let x=0; x<myButtons.length; x++){
      if(myButtons[x].lobby){
        if(toggleOn){
          myButtons[x].button.visible = toggleOn
          myButtons[x].button.positionY = buttonY

          buttonY+=buttonYinc 
        }
      }else{
        myButtons[x].button.visible = false
      }
      //play
      adjustPlayQuitButton(scene)
    }
    
  }else if( scene == "arena"){
    for (let x=0; x<myButtons.length; x++){
      if(myButtons[x].arena){
        if(toggleOn){
          myButtons[x].button.visible = toggleOn
          myButtons[x].button.positionY = buttonY
    
          buttonY+=buttonYinc  
        }
      }else{
        myButtons[x].button.visible = false
      }
    }

    adjustPlayQuitButton(scene)
  } 
}



//#endregion

export function toggleScoreContainer(val: boolean){
  newTopScoresContainer.visible = val
}