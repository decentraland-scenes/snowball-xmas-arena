import { teamColor } from "./teamColors"


let atlas = new Texture('textures/Atlas.png')

export class LeaderboardItem{

    wrapper:UIContainerRect
    name:UIText
    team:UIImage
    health:UIText
    score:UIText
    imageHeight = 15

    constructor(parent:any, height:number,yOffset:number, label?:boolean){
        this.wrapper = new UIContainerRect(parent)
        this.wrapper.vAlign = "top"
        this.wrapper.hAlign = "center"
        this.wrapper.width = 200
        this.wrapper.height = height
        this.wrapper.positionY =-yOffset

        let bg = new UIContainerRect(this.wrapper)
        bg.width= 210
        bg.height = height
        bg.vAlign = "top"
        bg.hAlign = "center"

        this.name = new UIText(this.wrapper)
        this.name.paddingLeft = 5
        this.name.value = "Ranking"
        this.name.fontSize = 10
        this.name.vTextAlign = "center"
        this.name.hAlign = "left"

        if(label){
            let team  = new UIText(this.wrapper)
            team.value = "Team"
            team.fontSize = 10
            team.vTextAlign = "center"
            team.hAlign = "center"
            team.hTextAlign = "center"
        }
        else{
            bg.color = Color4.Black()
            bg.opacity = .8

            this.team = new UIImage(this.wrapper, atlas)
            this.team.height = this.imageHeight
            this.team.width = this.imageHeight
            this.team.vAlign = "center"
            this.team.positionX = 15
            this.team.visible = false
        }

        this.health = new UIText(this.wrapper)
        this.health.value = "Health"
        this.health.fontSize = 10
        this.health.vTextAlign = "center"
        this.health.hAlign = "center"
        this.health.hTextAlign = "center"
        this.health.positionX = 45

        this.score = new UIText(this.wrapper)
        this.score.value = "Score"
        this.score.fontSize = 10
        this.score.vTextAlign = "center"
        this.score.hTextAlign = "center"
        this.score.hAlign = "center"
        this.score.positionX = 90
    }

    updateTeam(team:teamColor){
        switch(team){
            case teamColor.RED:
                this.team.sourceTop = 64
                break;

            case teamColor.BLUE:
                this.team.sourceTop = 0

                break;

            case teamColor.NEUTRAL:
                break
        }
        this.team.sourceLeft = 937
        this.team.sourceHeight = 63
        this.team.sourceWidth = 63
        this.team.height = this.imageHeight
        this.team.width = this.imageHeight
        this.team.vAlign = "center"
        this.team.positionX = 5
        this.team.visible = true
    }
}
