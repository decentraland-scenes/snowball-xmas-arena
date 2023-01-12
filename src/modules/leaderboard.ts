import * as ui from '@dcl/ui-scene-utils'
import { PlayerRankingsType } from 'src/snowball-fight/connection/state-data-utils';

import { LeaderboardItem } from "./leaderboardItem";
import { teamColor } from './teamColors';


let playerNameColors= {
    connected: Color4.White(),
    notConnected: Color4.Red(),
}

export class SnowBallLeaderboard{

    items = 10
    itemHeight= 20
    itemOffset = 25
    leaderboardBG:UIContainerRect
    leaderboardItems:LeaderboardItem[] = []
    headerTexture = new Texture('textures/leaderboardbg.png')
    itemsContainer:UIContainerRect
    constructor(){
        
        this.leaderboardBG = new UIContainerRect(ui.canvas);
        this.leaderboardBG.width = 250;
        this.leaderboardBG.height = 300;
        this.leaderboardBG.opacity = 1
        this.leaderboardBG.hAlign = "center"
        this.leaderboardBG.hAlign = "left"
        this.leaderboardBG.positionX = 0

        let header = new UIImage(this.leaderboardBG, this.headerTexture);
        header.width = 260
        header.height = 380
        header.sourceTop = 0
        header.sourceLeft = 0
        header.sourceWidth = 603
        header.sourceHeight = 780

        let container = this.itemsContainer = new UIContainerRect(this.leaderboardBG);
        container.width = 200;
        container.height = 290;
        container.vAlign = "top"
        container.positionY = 10

        new LeaderboardItem(container, this.itemHeight, 0 * this.itemHeight, true)
        for(let i = 1; i <= this.items; i++){
            this.leaderboardItems.push(new LeaderboardItem(container, this.itemHeight, this.itemOffset))
            this.itemOffset += 30
        }

        this.leaderboardBG.visible = false
    }

    showLeaderboard(val:boolean){
        this.leaderboardBG.visible = val
        this.itemsContainer.visible = val
    }

    useFakeLeaderboard(){
        this.leaderboardBG.visible = true
        //randomize to ensure clear is working
        const arr = fakeLeaderboardData.slice(0, Math.floor(Math.random()*fakeLeaderboardData.length) )
        if(Math.random() > .5){
            arr.reverse()
        }
        this.updateLeaderboard(arr)
    }

    updateLeaderboard(playerDataRanked:PlayerRankingsType[]){
        //log("updateLeaderboard")
        const playerSubStringName = 13
        let counter = 0
        playerDataRanked.forEach((player:PlayerRankingsType, i:number)=>{
            let name = (i+1) + ": " + player.name.substr(0,playerSubStringName)
            

            let playerNameColor = playerNameColors.connected
            if( player.connStatus != "connected" ){
                playerNameColor = playerNameColors.notConnected
                name = (i+1) + ": ~" + player.name.substr(0,playerSubStringName)
            }
            if(this.leaderboardItems[i].name.value !== name ){
                this.leaderboardItems[i].name.value = name
            }
            if(this.leaderboardItems[i].name.color !== playerNameColor){
                this.leaderboardItems[i].name.color = playerNameColor
            }
            //this.leaderboardItems[i].name.color = colors[player.connStatus]
            
            
            this.leaderboardItems[i].updateTeam(player.team)
            this.leaderboardItems[i].health.value = "" + player.health + "/" + player.healthMax
            this.leaderboardItems[i].score.value = "" + player.score
            counter++
        })

        //only clear what we have to
        this.clearLeaderboard(counter)
    }

    hideLeaderboardItems(startIndex:number=0){
        for(let x=startIndex;x<this.leaderboardItems.length;x++){
            const item = this.leaderboardItems[x]
            item.team.visible = false
        }
    }
    clearLeaderboard(startIndex:number=0){
        for(let x=startIndex;x<this.leaderboardItems.length;x++){
            const item = this.leaderboardItems[x]
            if(item.team.visible || item.name.value.length != 0){
                item.team.visible = false
                item.name.value = ""
                item.health.value = ""
                item.score.value = ""
            }else{
                //log("clearLeaderboard already removed",x,item.team.visible)   
            }
        }
    }
}

export let fakeLeaderboardData:PlayerRankingsType[] = [
    {gamePosition: 1, name: "Pla", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.BLUE,connStatus:"connected"},
    {gamePosition: 1, name: "Player Name ###", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.RED,connStatus:"connected"},
    {gamePosition: 1, name: "DPlayer Name ###", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.BLUE,connStatus:"disconnected"},
    {gamePosition: 1, name: "Player Name ###", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.BLUE,connStatus:"reconnecting"},
    {gamePosition: 1, name: "DPlayer Name ###", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.BLUE,connStatus:"lost connection"},
    {gamePosition: 1, name: "Player Name ###", id:"test-id", isPlayer:true, endTime: 5, health: 30, healthMax:40, score:500, team: teamColor.BLUE,connStatus:"connected"},
  
]