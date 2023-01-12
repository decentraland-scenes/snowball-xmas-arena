import { Client, Clock } from "colyseus";
import { CONFIG } from "./config";
import { PlayerHealthDataState, PlayerState, PlayerStatsKillDataState as PlayerStatsDamageDataState, TeamMemberState, TeamState } from "../snowballState/server-state";
import * as serverStateSpec from "../snowballState/server-state-spec";
import { LEVEL_MGR } from "../levelData/levelData";
import { BaseBattleRoom, OnConnectOptions } from "./BaseBattleRoom";
import * as PlayFabHelper from "../playfab/BattlePlayFabWrapper";

function notNull(obj:any){
    return obj !== undefined && obj !== null
}
function isNull(obj:any){
    return obj === undefined && obj === null
}

function logEntry(
    classname: string,
    roomId: string,
    method: string,
    params?: any
) {
    console.log(classname, roomId, method, " ENTRY", params);
}

function logExit(
    classname: string,
    roomId: string,
    method: string,
    params?: any
) {
    console.log(classname, roomId, method, " RETURN", params);
}
function log(
    classname: string,
    roomId: string,
    method: string,
    msg?: string,
    ...args: any[]
) {
    console.log(classname, roomId, method, msg, ...args);
}

const CLASSNAME = "BattleRoom";
const ENTRY = " ENTRY";

class TimeEventsInst {
    id: string;
    time: number;
    callback?: () => void;

    constructor(id: string, time: number) {
        this.id = id;
        this.time = time;
    }
}


const SECONDS_PER_MINUTE = 10//CONFIG.DERBY_DROP_TIME_PER_FLOOR_SECONDS;
export class TimedEventsEnum {
    static SIX_MINUTE = new TimeEventsInst(
        "six-minute",
        1000 * SECONDS_PER_MINUTE * 6
    );
}

//const SUDDEN_DEATH_TIME_EVENT = TimedEventsEnum.FIVE_MINUTE;
const TIMES_UP_END_GAME = TimedEventsEnum.SIX_MINUTE;


const TIME_EVENT_LIST = [
    TimedEventsEnum.SIX_MINUTE
];

const TEAM_BLUE_ID = "blue"
const TEAM_RED_ID = "red"


export class BattleRoom extends BaseBattleRoom {
    //timedEventSystem:TimedEventSystem
    timedEventClocks: Record<string, Clock> = {};
    floorTrackFeatMap: Record<string, serverStateSpec.ITrackFeatureState> = {};

    redTeam:TeamState
    blueTeam:TeamState
    //globalOrientation:OrientationType = {alpha:0,beta:0,gamma:0,absolute:true}

    onCreate(options:OnConnectOptions) {
        const METHOD_NAME = "onCreate";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, options);

        const blueTeam = this.blueTeam = new TeamState(TEAM_BLUE_ID,"Blue Team")
        blueTeam.maxPlayers = CONFIG.BATTLE_MAX_PLAYERS;
        blueTeam.minPlayers = CONFIG.BATTLE_MIN_PLAYERS;

        const redTeam = this.redTeam = new TeamState(TEAM_RED_ID,"Red Team")

        const battleOptions = options.battleDataOptions

        blueTeam.maxPlayers = battleOptions !== undefined && battleOptions.maxPlayers !== undefined ? battleOptions.maxPlayers : CONFIG.BATTLE_MAX_PLAYERS;
        blueTeam.minPlayers = battleOptions !== undefined && battleOptions.maxPlayers !== undefined ? battleOptions.minPlayers : CONFIG.BATTLE_MIN_PLAYERS;
        blueTeam._playFabId = CONFIG.BATTLE_TEAM_BLUE_PLAYFAB_PLAYER_ID

        redTeam.maxPlayers = battleOptions !== undefined && battleOptions.maxPlayers !== undefined ? battleOptions.maxPlayers : CONFIG.BATTLE_MAX_PLAYERS;
        redTeam.minPlayers = battleOptions !== undefined && battleOptions.maxPlayers !== undefined ? battleOptions.minPlayers : CONFIG.BATTLE_MIN_PLAYERS;
        redTeam._playFabId = CONFIG.BATTLE_TEAM_RED_PLAYFAB_PLAYER_ID

        //must set before super.onCreate

        this.maxClients = blueTeam.maxPlayers + redTeam.maxPlayers//CONFIG.DERBY_MAX_PLAYERS;
        this.minClients = blueTeam.minPlayers + redTeam.minPlayers//CONFIG.DERBY_MIN_PLAYERS


        super.onCreate(options);

        this.state.enrollment.teams.set("blue", blueTeam)
        this.state.enrollment.teams.set("red", redTeam)

        //setup game


        // Get secret santa notifications 
        this.presence.subscribe('announce', (msg: {msg:string,duration:number}) => {
            log(CLASSNAME,this.roomId,METHOD_NAME, 'received announce on room ', this.roomId,msg)
            
            this.broadcast("inGameMsg",msg)
        })
        // Get secret santa notifications
        this.presence.subscribe('maintenance', (msg: {msg:string,duration:number}) => {
            log(CLASSNAME,this.roomId,METHOD_NAME, 'received maintenance on room ', this.roomId,msg)
            
            this.broadcast("notifyMaintenance",msg)
        })
        

        this.onMessage('throwBall', (client, throwBallData:serverStateSpec.BallThrowData) => {
            const METHOD_NAME = "player.throwBall";
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,throwBallData]);
 
            if(isNull(throwBallData)){
                log(
                    CLASSNAME, this.roomId, METHOD_NAME,
                    "throwBallData required, should not be null",
                    [client.sessionId, throwBallData]
                );
                return;
            }

            const player = this.state.players.get(client.sessionId)            
            const throwData:serverStateSpec.BallThrowData = {pos:throwBallData.pos, dir: throwBallData.dir, force: throwBallData.force, teamColor:player.battleData.teamId, id:player.id, type: throwBallData.type, playerIdFrom: client.sessionId }

            try{
                this.updatePlayerThrowGameStats(player,throwBallData) 
            }catch(e){
                this.handleUnexpectedError(CLASSNAME,this.roomId,METHOD_NAME,[client.sessionId,throwBallData],"",client,e)
            }
            
            this.broadcast("throwBall", throwData )//,{except: client})      
            //console.log(player.name, ' threw a snowball ', message.pos, message.dir, message.force)
            log(CLASSNAME,this.roomId,METHOD_NAME, player.sessionId, player.userData.name, ' threw a snowball ', throwBallData.pos, throwBallData.dir, throwBallData.force,"",player.battleData.teamId,player.battleData._teamRef);
        })
    
        this.onMessage('giveHealth', (client, giveHealth:serverStateSpec.PlayerRecieveHealthDataState) => {
            const METHOD_NAME = "giveHealth";
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,giveHealth]);

            if(isNull(giveHealth)){
                log(
                    CLASSNAME, this.roomId, METHOD_NAME,
                    "giveHealth required, should not be null",
                    [client.sessionId, giveHealth]
                );
                return;
            }

            try{
                this.healthGive(client,giveHealth)
            }catch(e){
                this.handleUnexpectedError(CLASSNAME,this.roomId,METHOD_NAME,[client.sessionId,giveHealth],"",client,e)
            }
        })
        this.onMessage('enemyHit', (client, giveDamage:serverStateSpec.PlayerGiveDamageDataState) => {
            const METHOD_NAME = "enemyHit";
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,giveDamage]);
            
            try{
                this.healthHurt(client,giveDamage)
            }catch(e){
                this.handleUnexpectedError(CLASSNAME,this.roomId,METHOD_NAME,[client.sessionId,giveDamage],"",client,e)
            }
        })

    

        this.onMessage(
            "player.battleData.update",
            (
                client: Client,
                battleData: serverStateSpec.PlayerBattleDataState
            ) => {
                const METHOD_NAME = "player.battleData.update";
                //log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,battleData]);

                try{
                    const player = this.state.players.get(client.sessionId);
                    if (player) {
                        player.setBattleData(battleData,this.getCurrentTime()); //replacing entire object as many things can be changing as a set
                    } else {
                        log(
                            CLASSNAME,
                            this.roomId,
                            METHOD_NAME,
                            "WARNING cound not find player",
                            client.sessionId
                        );
                    }

                    this.updateRanks();
                    this.checkIsBattleOver();
                }catch(e){
                    this.handleUnexpectedError(CLASSNAME,this.roomId,METHOD_NAME,[client.sessionId,battleData],"",client,e)
                }
            }
        );

        this.onMessage(
            "player.buttons.update",
            (client: Client, buttons: serverStateSpec.PlayerButtonState) => {
                const METHOD_NAME = "player.buttons.update";
                //log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,buttons]);

                const player = this.state.players.get(client.sessionId);

                if (player) player.setButtons(buttons); //replacing entire object as many things can be changing as a set
            }
        );
        this.onMessage(
            "player.userData.name.update",
            (client: Client, name: string) => {
                const METHOD_NAME = "player.userData.name.update";
                log(CLASSNAME, this.roomId, METHOD_NAME, "", [
                    client.sessionId,
                    name,
                ]);

                const player = this.state.players.get(client.sessionId);
                player.userData.updateName(name);
            }
        );
        //let them pass lots of stuff
        this.onMessage(
            "player.userData.update",
            (client: Client, playerData: serverStateSpec.PlayerState) => {
                const METHOD_NAME = "player.update";
                log(CLASSNAME, this.roomId, METHOD_NAME, "", [
                    client.sessionId,
                    playerData,
                ]);

                const player = this.state.players.get(client.sessionId);
                //player.update(player)
            }
        );
        this.onMessage(
            "enrollment.extendTime",
            (client: Client, amount?: number) => {
                this.extendEnrollmentTime(amount);
            }
        );
        this.onMessage("battle.start", (client: Client) => {
            this.start();
        });


        this.onMessage("levelData.trackFeature.adjustHealth", (client, adjustHealth:serverStateSpec.AlterHealthDataState) => {
            const METHOD_NAME = "levelData.trackFeature.adjustHealth"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,adjustHealth]);
            //find it and update it
            const trackToUpdate = this.state.levelData.trackFeatures.get( adjustHealth.playerIdTo )

            if(isNull(adjustHealth)){
                log(
                    CLASSNAME, this.roomId, METHOD_NAME,
                    "adjustHealth required, should not be null",
                    [client.sessionId, adjustHealth]
                );
                return;
            }

            if (!this.state.battleData.hasBattleStarted()) {
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "battle not started, cannot adjust health yet",
                    [client.sessionId, adjustHealth]
                );
                return;
            }

            if(trackToUpdate){
                log(CLASSNAME,this.roomId,METHOD_NAME, "updating",trackToUpdate)
                //trackToUpdate.health.current += adjustHealth.amount
                
                let oldVal = trackToUpdate.health.current
                let newVal = trackToUpdate.health.current - adjustHealth.amount
                if(newVal>trackToUpdate.health.max){
                    newVal = trackToUpdate.health.max
                }
                if(newVal<0){
                    newVal = 0
                }
                trackToUpdate.health.current = newVal
                trackToUpdate.health.updateServerTime(this.getCurrentTime())

                if(newVal <= 0){
                    if(adjustHealth.respawnTime !== undefined){
                        trackToUpdate.activateTime = this.getCurrentTime() + adjustHealth.respawnTime
                        //TODO sync this better
                        trackToUpdate.lastTouchTime = this.getCurrentTime()
                    }
                    this.clock.setTimeout(()=>{
                        log(CLASSNAME,this.roomId,METHOD_NAME, "respawn fired",trackToUpdate.name,adjustHealth.playerIdTo)
                        trackToUpdate.health.current = trackToUpdate.health.max
                    },adjustHealth.respawnTime)
                }

                trackToUpdate.updateServerTime(this.getCurrentTime()) 

                log(CLASSNAME,this.roomId,METHOD_NAME, "health",adjustHealth,"oldVal",oldVal,"newVal",newVal)
                //if(!trackToUpdate.isReUsable){
                    //remove it??
                //}
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "could not find track to update",adjustHealth.playerIdTo)
            }
        })

        this.onMessage("levelData.trackFeature.update", (client: Client, trackFeatUpdate: serverStateSpec.TrackFeatureConstructorArgs) => {
            const METHOD_NAME = "levelData.trackFeature.update"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,trackFeatUpdate]);
            //find it and update it
            const trackToUpdate = this.state.levelData.trackFeatures.get( trackFeatUpdate.name )

            if(trackToUpdate){
                log(CLASSNAME,this.roomId,METHOD_NAME, "updating",trackToUpdate.activateTime,trackFeatUpdate.activateTime)
                
                if(trackFeatUpdate.activateTime !== undefined){
                    trackToUpdate.activateTime = trackFeatUpdate.activateTime
                    //TODO sync this better
                    trackToUpdate.lastTouchTime = this.getCurrentTime()
                }
                trackToUpdate.updateServerTime(this.getCurrentTime())
                //trackToUpdate.health.current = trackToUpdate.health.current + trackFeatUpdate.health
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "could not find track to update",trackFeatUpdate.name)
            }
        })
        
        const battleDataOptions: serverStateSpec.BattleDataOptions =
            options.battleDataOptions;

        // set-up the game!
        this.setup(battleDataOptions);
    }
    _healthHurt(client: Client,origin: PlayerState,target: PlayerState, giveDamage: serverStateSpec.PlayerGiveDamageDataState) {
        const METHOD_NAME = "_healthHurt";
        let damageAmount = giveDamage.amount; //*Math.random()
        

        //TODO check if friendly fire enabled

        const prevDamage:serverStateSpec.PlayerGiveDamageDataState = {
            amount:target.healthData.lastDamageAmount,
            time:target.healthData.lastDamageTime,
            playerIdFrom:target.healthData.lastDamageFrom,
            desc:target.healthData.lastDamageDesc,
            playerIdTo:target.sessionId,
            //position:val.healthData.lastDamageAmount
        } 
        const oldVal = target.healthData.current;

        let hitCount = false

        if(target.healthData.current>0){
            target.healthData.current -= damageAmount;
            target.healthData.updateServerTime(this.getCurrentTime())
            this.updatePlayerDamageGameStats(target,giveDamage,prevDamage)

            hitCount = true

            target.healthData.lastDamageAmount = giveDamage.amount;
            target.healthData.lastDamageDesc = giveDamage.desc;

            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                target.userData.name,
                "old",
                oldVal,
                "damageAmount",
                damageAmount,
                "new",
                target.healthData.current
            );

            //val.battleData._teamRef.score++
        }else{
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                target.userData.name,
                "player already dead. cannot take on more damage",
                oldVal,
                "damageAmount",
                damageAmount,
                "new",
                target.healthData.current
            );
        }
    }
    healthHurt(client: Client, giveDamage: serverStateSpec.PlayerGiveDamageDataState) {
        const METHOD_NAME = "healthHurt";
        log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,giveDamage]);
        

        if(isNull(giveDamage)){
            log(
                CLASSNAME, this.roomId, METHOD_NAME,
                "giveDamage required, should not be null",
                [client.sessionId, giveDamage]
            );
            return;
        }

        if(giveDamage.playerIdFrom !== client.sessionId){
            //log why from does not the client sending it
            log(CLASSNAME,this.roomId,METHOD_NAME, "damage from does not match client, is that expected???",giveDamage.playerIdFrom,client.sessionId,giveDamage);
        }

        if (!this.state.battleData.hasBattleStarted()) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "battle not started, cannot damage yet",
                [client.sessionId, giveDamage]
            );
            return;
        }


        const thrower:PlayerState = this.state.players.get(giveDamage.playerIdFrom)
        const playerHit:PlayerState = this.state.players.get(giveDamage.playerIdTo)
        //const player = this.state.players.get(client.sessionId)  
        //console.log("enemy hit: "+ giveDamage  )
        
       
        if (giveDamage.playerIdTo == "all") {
            const damageAmount = giveDamage.amount * Math.random();
            this.state.players.forEach((val: PlayerState) => {
                giveDamage.amount = damageAmount
                this._healthHurt(client,thrower,playerHit,giveDamage)
            });
        } else {
            if(playerHit !== undefined){
                this._healthHurt(client,thrower,playerHit,giveDamage)
            }else{
                //log can't find person hit!?!?
                log(CLASSNAME,this.roomId,METHOD_NAME, "cannot find person to hit, no damange given",giveDamage);
            }
        }
        
        this.updateRanks();
        this.checkIsBattleOver();
    }

    _healthGive(client: Client,val: PlayerState, giveHealth: serverStateSpec.PlayerRecieveHealthDataState) {
        const METHOD_NAME = "_healthGive";
        
        let hitCount = true

        let healthAmount = giveHealth.amount; //*Math.random()
            if (giveHealth.playerIdTo == "all") {
                healthAmount = giveHealth.amount * Math.random();
            } else if (giveHealth.playerIdTo != val.sessionId) {
                return;
            }
            const oldVal = val.healthData.current;

            
            let newVal = val.healthData.current + healthAmount;
            if(newVal>val.healthData.max){
                newVal = val.healthData.max
            }
            val.healthData.current = newVal
            val.healthData.updateServerTime(this.getCurrentTime())
            //this.updatePlayerDamageGameStats(val,giveHealth)

            hitCount = true

            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                val.userData.name,
                "old",
                oldVal,
                "healthAmount",
                healthAmount,
                "new",
                val.healthData.current
            );

    }
    healthGive(client: Client, giveHealth: serverStateSpec.PlayerRecieveHealthDataState) {
        const METHOD_NAME = "healthGive";
        log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,giveHealth]);


        if(isNull(giveHealth)){
            log(
                CLASSNAME, this.roomId, METHOD_NAME,
                "giveHealth required, should not be null",
                [client.sessionId, giveHealth]
            );
            return;
        }

        if (!this.state.battleData.hasBattleStarted()) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "battle not started, cannot give health yet",
                [client.sessionId, giveHealth]
            );
            return;
        }
    

        //const giver:PlayerState = this.state.players.get(giveHealth.playerIdFrom)
        const playerHit:PlayerState = this.state.players.get(giveHealth.playerIdTo)

    
        if (giveHealth.playerIdTo == "all") {
            const damageAmount = giveHealth.amount * Math.random();
            this.state.players.forEach((val: PlayerState) => {
                giveHealth.amount = damageAmount
                this._healthGive(client,playerHit,giveHealth)
            });
        } else {
            if(playerHit !== undefined){
                this._healthGive(client,playerHit,giveHealth)
            }else{
                //log can't find person hit!?!?
                log(CLASSNAME,this.roomId,METHOD_NAME, "cannot find person to hit, no damange given",giveHealth);
            }
        }


        this.updateRanks();
        this.checkIsBattleOver();
    }
    updatePlayerThrowGameStats(player: PlayerState,message:serverStateSpec.BallThrowData) {
        const METHOD_NAME = "updatePlayerThrowGameStats";
        player.statsData.shotsFired++
    }
    updatePlayerDamageGameStats(val: PlayerState,giveDamage: serverStateSpec.PlayerGiveDamageDataState, prevDamage: serverStateSpec.PlayerGiveDamageDataState) {
        const METHOD_NAME = "updatePlayerDamageGameStats";
       
        //died, do stuff?
        //currently updatePlayerRanks() tracks the offical death. this method just handles death events
        const giveDamagePlayer = this.state.players.get(giveDamage.playerIdFrom);
        const prevDamagePlayer = prevDamage.playerIdFrom && prevDamage.playerIdFrom.length >0 ? this.state.players.get(prevDamage.playerIdFrom) : null;
        const playerGivingDamage = giveDamagePlayer ? giveDamagePlayer : prevDamagePlayer
        
        const hit = new PlayerStatsDamageDataState()
        hit.playerIdAffected = val.sessionId
        hit.playerIdCredited = playerGivingDamage.sessionId
        hit.time = this.getCurrentTime()
    
        //compute kills
        if(val.healthData.current <= 0){
            val.statsData.deaths.push( hit )
            if(playerGivingDamage){
                //console.log("XXXXX",playerGivingDamage.sessionId,playerGivingDamage.battleData.cameraDirection,playerGivingDamage.battleData.teamId,playerGivingDamage.battleData._teamRef)
                playerGivingDamage.battleData._teamRef.score++
                playerGivingDamage.statsData.kills.push(hit);
            }else{
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "unable to credit death", giveDamage
                );
            }
            val.healthData.current = this.playerMaxHealth

            //notify of kill  
            this.broadcast("player.death", giveDamage )
            //this.broadcast(,{ex})
        }
        
        //compute damange
        if(giveDamagePlayer){
            giveDamagePlayer.statsData.damageGiven += giveDamage.amount
            giveDamagePlayer.statsData.hitsGiven.push( hit )
        }else{
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "unable to credit damage to", giveDamage.playerIdFrom, giveDamage
            );
        }
            
    }/*
    sendToClient(sessionId: string, msg: string, payload: any) {
        const METHOD_NAME = "sentToClient"
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, [sessionId,msg,payload]);
        
        //not working, it is sending to self somehow
        const client = this.clients.find((val:Client)=>{
            return val.sessionId = sessionId
        } )

        if(client !== undefined){
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "found client for session",sessionId,client.sessionId,"will send",msg,payload
            );
            client.send(msg,payload);
        }else{
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "unable to send to client ", sessionId, msg,payload
            );
        }
    }*/
    //override custom impl
    checkIsBattleOver() {
        const METHOD_NAME = "checkIsBattleOver";
        //logEntry(CLASSNAME, this.roomId, METHOD_NAME);
        if (
            !this.state.battleData.hasBattleStarted() ||
            this.state.battleData.isBattleOver()
        ) {
            //log(CLASSNAME,this.roomId,METHOD_NAME,"checkIsRaceOver race not started/over",this.state.battleData.status)
            return false;
        }
        //(lap + 1) * closestSegId + percentOfSeg }

        let countPlayersDone = 0;
        let totalPlayers = 0;
        let playersConnected = 0;
        let playersGone = 0;
        //const playerData:PlayerRankingsType[] = []
        this.state.players.forEach((val: PlayerState) => {
            if (val.battleData.hasFinishedBattle()) {
                countPlayersDone++;
            }
            if (val.connStatus == "connected" && val.type == "combatant") {
                playersConnected++;
            }
            if (val.connStatus != "connected" && val.type == "combatant") {
                playersGone++;
            }
            if (val.type == "combatant") {
                totalPlayers++;
            }
        });

        let battleOver = false;

        //if we have 3 players
        //1 disconnected
        //1 finished
        //1 last standing
        //playersGone = 1
        //countPlayersDone = 1
        //totaly players - 1 === last standing wins
        if (totalPlayers - 1 <= countPlayersDone + playersGone) {
            battleOver = true;

            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "players done",
                "totalPlayers",
                totalPlayers,
                "playersGone",
                playersGone,
                "countPlayersDone",
                countPlayersDone,
                "playersConnected",
                playersConnected,
                "battleOver",
                battleOver,
                "battleData.status",
                this.state.battleData.status,
                "battleData.hasBattleStarted()",
                this.state.battleData.hasBattleStarted(),
                "battleData.isBattleOver",
                this.state.battleData.isBattleOver()
            );
            /*
            // find last player and give them an end time so they win
            this.state.players.forEach((val: PlayerState) => {
                const hasNoEndTime =
                    val.battleData.endTime === undefined ||
                    val.battleData.endTime <= 0;
                if (val.connStatus == "connected" && hasNoEndTime) {
                    log(
                        CLASSNAME,
                        this.roomId,
                        METHOD_NAME,
                        "player WON",
                        val.userData.name,
                        val.sessionId
                    );
                    //give the last player an end time so they can be ranked longest surival time
                    val.battleData.endTime = Date.now();
                }
            });*/

            log(CLASSNAME, this.roomId, METHOD_NAME,"no more players, end battle" );
            this.endBattle();
        }
        //const playerDataRanked = playerData.sort((n1,n2) => (n1.totalProgress > n2.totalProgress) ? -1 : 1);

        //log(CLASSNAME,this.roomId,METHOD_NAME,"players done",countPlayersDone,playersConnected,raceOver,this.state.battleData.status,this.state.battleData.hasBattleStarted(),this.state.battleData.isRaceOver())
        return battleOver;
    } 
 
    getTeamsSorted():TeamState[]{
        const teamsRanked:TeamState[] = []
        this.state.enrollment.teams.forEach((team: serverStateSpec.TeamState) => {
            teamsRanked.push(team as TeamState)
        })
        teamsRanked.sort((a:TeamState,b:TeamState)=>{
            //2(b)-4 = -2 a is higher score
            //4(b)-2 = 2 b i bigger
            return b.score - a.score
          })
        
        return teamsRanked;
    }
    getWinningTeam():TeamState[]{
        const METHOD_NAME = "getWinningTeam"
        const winner:TeamState[] = []
        const teamsRanked:TeamState[] = this.getTeamsSorted()
        let topScore = teamsRanked.length > 0 ? teamsRanked[0].score : 0
        if(teamsRanked.length > 0){
            winner.push(teamsRanked[0])
        }
        let counter = 0
    
        log(CLASSNAME,this.roomId,METHOD_NAME,"",topScore,teamsRanked)
        
        for(const p in teamsRanked){
            const teamState:TeamState = teamsRanked[p]
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
  
        //log(CLASSNAME,this.roomId,METHOD_NAME,"RETURN",winner)
        return winner
    }
    updateTeamRanks() {
        const METHOD_NAME = "updateTeamRanks";
        
        const teamsRanked:TeamState[] = this.getTeamsSorted()
        //const winningTeam:serverStateSpec.TeamState[] = this.getWinningTeam()
        //const teamsTied = winningTeam.length > 1

        this.state.enrollment.teams.forEach((team: serverStateSpec.TeamState) => {
            //TODO update team ranks
            team.gamePosition
        })
        let counter = 1;
        for (const p in teamsRanked) {
            const player = teamsRanked[p];
            this.state.enrollment.teams.get(player.id).gamePosition = counter;
            
            counter++;
        }
    }
    updateTeamStats() {
        const METHOD_NAME = "updateTeamStats";
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);


        //TODO
        //ONLY CALL ONCE AT END!

        const winningTeam:serverStateSpec.TeamState[] = this.getWinningTeam()
        log(CLASSNAME,this.roomId,METHOD_NAME,"winningTeam",winningTeam)

        const teamsTied = winningTeam.length > 1

        this.state.enrollment.teams.forEach((_team: serverStateSpec.TeamState) => {
            const team = _team as TeamState
            //aggregate player stats
            team.members.forEach( (player:serverStateSpec.TeamMemberState)=>{
                
                team._statsData.addFrom( player._player.statsData)
            })

            log(CLASSNAME,this.roomId,METHOD_NAME,"team stats",team.name
                ,"kills",team._statsData.kills.length
                ,"deaths",team._statsData.deaths.length
                ,"hitsGiven",team._statsData.hitsGiven.length
                ,"shotsFired",team._statsData.shotsFired
                ,"damageGiven",team._statsData.damageGiven)
        })
    }
    updatePlayerRanks() {
        const METHOD_NAME = "updatePlayerRanks";
        //logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        type PlayerRankingsType = {
            totalProgress: number;
            id: string; 
            name: string;
            raceTime: number;
        };
        const now = this.getCurrentTime()

        //FIXME consider caching somehow?
        const playerData: PlayerRankingsType[] = [];

        let rankChanges = false;

        this.state.players.forEach((val: PlayerState) => {
            let totalProg = 0;

            //who ever has most health
            const playerHealth = val.healthData.current;
            const playerHealthPercent = playerHealth / val.healthData.max;

            //log(CLASSNAME,this.roomId,METHOD_NAME,"playerHealthPercent",playerHealth,playerHealthPercent)

            const connectinStatus = val.connStatus; // != 'connected'
            let raceTime = 0;

            if (
                this.state.battleData.status != "not-started" &&
                !val.battleData.hasFinishedBattle()
            ) {
                //log(CLASSNAME,this.roomId,METHOD_NAME,"",val.userData.name,totalProg,lap,"closestSegId",closestSegId,"val.battleData.visitedSegment0",val.battleData.visitedSegment0,"maxlaps" , this.state.battleData.maxLaps,val.battleData.hasFinishedRace(),val.battleData.endTime)
                //mark race is over for player
                //val.battleData.endTime = now;

                rankChanges = true;
                /*
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "player",
                    val.sessionId,
                    val.userData.name,
                    val.sessionId,
                    val.userPrivateData.playFabData,
                    "val.battleData.endTime",
                    val.battleData.endTime - this.state.battleData.startTime,
                    "playerHealthPercent",
                    playerHealthPercent,
                    "val.battleData.lapTimes",
                    val.battleData.lapTimes.toArray()
                );*/
            }

            const hasNoEndTime =
                val.battleData.endTime === undefined ||
                val.battleData.endTime <= 0;

            //if they dont have a end time use current progress
            ////1000000(~16 minutes)
            
                //once you have an end time drop the ranking
                raceTime = val.statsData.kills.length
                //if completed the race use their finish time
                // anyone with an end time you finished, maybe one, maybe lost
                totalProg = 1000000 + raceTime + playerHealthPercent; //9999999999999 - val.battleData.endTime
            
            //prevent reranking based on progress when race not started
            if (
                !this.state.battleData.isBattleOver() &&
                !this.state.battleData.hasBattleStarted()
            ) {
                totalProg = val.battleData.enrollTime - this.roomCreateTime;
            }

            if (connectinStatus != "connected" && hasNoEndTime) {
                totalProg = -1; //not capable of winning
            }

            //build a short term array list to compute player ranks
            playerData.push({
                id: val.sessionId,
                name: val.userData.name,
                totalProgress: totalProg,
                raceTime: raceTime,
            });

            //log(CLASSNAME,this.roomId,METHOD_NAME,"",val.userData.name,"totalProg",totalProg,val.battleData.hasFinishedRace(),val.battleData.endTime)
            /*
                if(!val.battleData.hasFinishedRace()){
                    //mark race is over for player
                    val.battleData.endTime = now
                    log(CLASSNAME,this.roomId,METHOD_NAME,"player",val.userData.userId,val.userPrivateData.playFabData,"finished the race"
                    ,"battleData.lastKnownLap",val.battleData.lastKnownLap
                    ,"val.battleData.lapTimes",val.battleData.lapTimes.toArray()) 
                }
                */

            //log(CLASSNAME,this.roomId,METHOD_NAME,"","lap",lap,"lastKnownLap",val.battleData.lastKnownLap,"lastLapStartTime",val.battleData.lastLapStartTime,"now",now)
        });

        //bigger the score the higher you are ranked
        const playerDataRanked = playerData.sort((n1, n2) =>
            n1.totalProgress > n2.totalProgress ? -1 : 1
        );

        if (false){//rankChanges) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "playerDataRanked",
                playerDataRanked
            );
        }
        //TODO add tiebreaker?  will enforce order based on playerDataRanked array results. do we risk ties and unstable sort order?
        //check for TIE? !?!?!

        let counter = 1;
        for (const p in playerDataRanked) {
            const player = playerDataRanked[p];
            this.state.players.get(player.id).battleData.racePosition = counter;
            this.state.players.get(
                player.id
            ).battleData._racePositionScoreUsed = player.totalProgress;
            counter++;
        }
    }

    addPlayer(client: Client, options: any) {
        const METHOD_NAME = "addPlayer";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, [
            client.sessionId,
            options,
        ]);

        //client.send("hello", "world");
        const player = super.addPlayer(client, options);

        //TODO set real values
        player.healthData.current = this.playerMaxHealth;
        player.healthData.max = this.playerMaxHealth;
        player.healthData.updateServerTime(this.getCurrentTime())
        player.healthData.lastDamageDesc = "";
        //player.healthData.healthTotal = -1

        return player;
    }

    async onAuth(client: Client, options: any): Promise<any> {
        const METHOD_NAME = "onAuth()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, [
            client.sessionId,
            options,
        ]);

        return super.onAuth(client, options);
    }

    onJoin(client: Client) {
        const METHOD_NAME = "onJoin()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, client.sessionId);

        super.onJoin(client);

        //this.onJoinSendLevelData(client)
    }

    preventNewPlayers() {
        super.preventNewPlayers();
    }

    async onLeave(client: Client, consented: boolean) {
        const METHOD_NAME = "onLeave()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, [
            client.sessionId,
            consented,
        ]);

        return super.onLeave(client, consented);
    }

    onDispose() {
        const METHOD_NAME = "onDispose()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        super.onDispose();
    }
    hasMinPlayers(){
        const METHOD_NAME = "hasMinPlayers";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);
        let hasMins = true
        this.state.enrollment.teams.forEach((val: serverStateSpec.TeamState) => {
            if(val.members.size < val.minPlayers){
                hasMins = false
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "team",val.id,val.name,"not enough places",val.members.size,"vs",val.minPlayers
                );
            }else{
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "team",val.id,val.name,"has enough places",val.members.size,"vs",val.minPlayers
                );
            }
        });
        //log spectator data
        log(
            CLASSNAME,
            this.roomId,
            METHOD_NAME,
            "team",this.state.enrollment.spectators.id
            ,this.state.enrollment.spectators.name
            ,"count:"
            ,this.state.enrollment.spectators.members.size
            ,"minPlayers"
            ,"vs",this.state.enrollment.spectators.minPlayers
        );
        logExit(CLASSNAME, this.roomId, METHOD_NAME,hasMins);
        return hasMins
    }
    doEnrollment() {
        super.doEnrollment()
    }
    extendEnrollmentTime(amount?: number) {
        const METHOD_NAME = "extendEnrollment";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, amount);

        super.extendEnrollmentTime();
    }
    //GAMELOOP
    update(dt: number) {
        const METHOD_NAME = "update()";
        //logEntry(CLASSNAME,this.roomId,METHOD_NAME,dt);
        const now = this.getCurrentTime()
        if (this.state.battleData.hasBattleStarted()) {
            const timeSinceRaceStartedMS = now - this.state.battleData.startTime;

            //log(CLASSNAME,this.roomId,METHOD_NAME,"run time",(now-this.state.battleData.startTime),this.timedEventClocks[TimedEventsEnum.ONE_MINUTE.id].elapsedTime,this.timedEventClocks[TimedEventsEnum.ONE_MINUTE.id].currentTime);
        }
        //trying without the game loop
        /*
        switch(this.state.battleData.status){
            case "not-started":
                this.doEnrollment()
                break;
            case "started":

                break;

        }*/
    } //END GAMELOOP

    onEndBattle(): void {
        const METHOD_NAME = "endBattle()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

             
        //loop over players and see if they are "done
        this.state.players.forEach((val: PlayerState) => {
            if (val.battleData.hasFinishedBattle()) {
                return
            }
            if (val.connStatus == "connected" && val.type == "combatant") {
                //stayed entire time give them end values
                val.battleData._stayedTillTheEnd = true
                val.battleData.endTime = this.state.battleData.endTimeActual
            }
            if (val.connStatus != "connected" && val.type == "combatant") {
                //did not stay entire time, check when they ended
                //quit mid game
                //no end time == did not finish
            }
            
        });
        //check team if still has players
        this.state.enrollment.teams.forEach(
            (val:serverStateSpec.TeamState)=>{
            }
        )

    }
    endBattle() {
        const METHOD_NAME = "endBattle()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        //clear timers
        for (const p in TIME_EVENT_LIST) {
            this.timedEventClocks[TIME_EVENT_LIST[p].id].clear();
        }   

        super.endBattle();
    }
    async updatePlayerStats(): Promise<any[]> {
        const METHOD_NAME = "updatePlayerStats()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        if (this.state.battleData.savedPlayerStats) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "updatePlayerStats already called, not executing again"
            );
            return;
        }
        this.state.battleData.savedPlayerStats = true;

        const roomId = this.roomId;

        const promises: Promise<any>[] = [];

        //increment games played
        //increment games won if won
        //increment mvp if top player

        if(!CONFIG.BATTLE_PLAYFAB_ENABLED){
            log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFab not enabled.  Not saving player stats CONFIG.BATTLE_PLAYFAB_ENABLED",CONFIG.BATTLE_PLAYFAB_ENABLED)    
            return Promise.all( promises ).then(function(result){
                log(CLASSNAME,roomId,METHOD_NAME,"XXXXXX PlayFab not enabled.  Not saving player stats " , result)
                return result;
              })
        }
        let loopCount = 0


        //determine which team won
        let topScore = -1
        //TODO check for TIE
        const winningTeam:serverStateSpec.TeamState[] = this.getWinningTeam()
        log(CLASSNAME,this.roomId,METHOD_NAME,"winningTeam",winningTeam)
        
        const teamsTied = winningTeam.length > 1

        this.updateTeamStats()

        loopCount = 0
        if(true){
            this.state.enrollment.teams.forEach((_team:serverStateSpec.TeamState) => {
                log(CLASSNAME,this.roomId,METHOD_NAME," looping" + loopCount ,"team count", this.state.enrollment.teams.size)
                //this.state.players.forEach((player) => {
        
                const team:TeamState = _team as TeamState

                //CHECK IF ANY OF ITS PLAYERS FINISH
                if(  !team._statsData.hasActivePlayerStats() ){
                    log(CLASSNAME,this.roomId,METHOD_NAME," did not finish battle, skipping stats" + loopCount, 
                    "team.statsData.hasActivePlayerStats()",team._statsData.hasActivePlayerStats()
                    )
                    return
                }

                //player.id
                //const playerData:PlayerState = player

                const playerDebugId =  "team."+loopCount + " " + (team.name) + " " + team._playFabId
                
                const playFabId = team._playFabId

                if(playFabId === undefined || playFabId === null || playFabId == '' || playFabId == 'playfabData.id'){
                    log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId +  " was missing playFabId",playFabId)
                    return
                }
                //const player = playerData.clientSide
        
                const teamData = team
                
        
                const updatePlayerStats: PlayFabHelper.EndBattleUpdatePlayerStatsRequest = {
                    levelName: this.state.battleData.name,
                    levelId: this.state.battleData.id,
                    playerName: teamData.name,
                    playerType: 'team',
                    //player data
                    playFabId: playFabId,
                    //totalTime: (playerData.racingData.endTime > -1 && playerData.racingData.endTime !== undefined ) ? (playerData.racingData.endTime - this.state.raceData.startTime) : CONFIG.MAX_POSSIBLE_RACE_TIME,
                    //lapTimes: playerData.racingData.lapTimes.toArray(),
                    //trk_feat_destroyed
                    //trackFeaturesDestroyed
                    place: teamData.gamePosition,//check for TIE
                    //placeTie: ,//check for TIE
                    score: teamData._statsData.kills.length,
                    team: { id: teamData.id ,name: teamData.id ,score: teamData.score, place:0 }, //GameEndResultTeamType
                    teamWin: teamsTied ? "tie" : winningTeam[0].id == teamData.id ? 'win' : 'lose',
                    kills: teamData._statsData.kills.length,
                    stayedTillEnd: teamData.hasFinishedBattle(),
                    deaths: teamData._statsData.deaths.length,
                    hits:teamData._statsData.hitsGiven.length,
                    damageSent:teamData._statsData.damageGiven,//.length,
                    throws: teamData._statsData.shotsFired,
                    playedEnoughToSave: true
                //playerCombinedInfo: getPlayerCombinedInfo
                }
        
                const promise = PlayFabHelper.EndBattleGivePlayerUpdatePlayerStats(this.playFabSettings,this.roomId,updatePlayerStats)
                
                promise.then(function(result:PlayFabHelper.EndBattleUpdatePlayerStatsResult){
                    log(CLASSNAME,roomId,METHOD_NAME,"XXXXX updatePlayerStats promise.EndLevelGivePlayerUpdatePlayerStats " + playerDebugId + " " + teamData.name,result);
                    //myRoom.authResult = result;
        
                    //where to put this?
                    //playerData.serverSide.endGameResult = result.endGameResult
                    //client.send("announce",'TODO show game finished stats')
                }).catch(function(error:PlayFabServerModels.ModifyUserVirtualCurrencyResult){
                    log(CLASSNAME,roomId,METHOD_NAME,"promise.EndLevelGivePlayerUpdatePlayerStats failed",error);
                })
        
                promises.push(promise)
        
                loopCount++;
            })
        }
        if(true){
            loopCount = 0
            this.state.players.forEach((player) => {
                log(CLASSNAME,this.roomId,METHOD_NAME," looping" + loopCount , "player count", this.state.players.size)
                //this.state.players.forEach((player) => {
        
                if( !player.battleData.hasFinishedBattle() || !player.statsData.hasActivePlayerStats() ){
                    log(CLASSNAME,this.roomId,METHOD_NAME," did not finish battle, skipping stats" + loopCount, player.userData.name
                    ,"player.battleData.hasFinishedBattle()",player.battleData.hasFinishedBattle()
                    ,"player.statsData.hasActivePlayerStats()",player.statsData.hasActivePlayerStats()
                    )
                    return
                }

                //player.id
                const playerData:PlayerState = player

                const playerDebugId =  loopCount + " " + (playerData.userData ? playerData.userData.name : "") + " " + playerData.sessionId
                
                if(!playerData.userPrivateData){
                    //warn and continue
                    log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId +  " was missing userPrivateData")
                    return
                }
                const playFabId = playerData.userPrivateData.playFabData.id;

                if(playFabId === undefined || playFabId === null || playFabId == '' || playFabId == 'playfabData.id'){
                    log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId +  " was missing playFabId",playFabId)
                    return
                }
                //const player = playerData.clientSide
        
                log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId + "  "+ playerData)
                if(playerData === undefined){
                    log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId + " was nulll")
                return
                }
            
                const updatePlayerStats: PlayFabHelper.EndBattleUpdatePlayerStatsRequest = {
                    levelName: this.state.battleData.name,
                    levelId: this.state.battleData.id,
                    playerName: playerData.userData.name,
                    playerType: 'player',
                    //player data
                    playFabId: playFabId,
                    //totalTime: (playerData.racingData.endTime > -1 && playerData.racingData.endTime !== undefined ) ? (playerData.racingData.endTime - this.state.raceData.startTime) : CONFIG.MAX_POSSIBLE_RACE_TIME,
                    //lapTimes: playerData.racingData.lapTimes.toArray(),
                    //trk_feat_destroyed
                    //trackFeaturesDestroyed
                    place: playerData.battleData.racePosition,//check for TIE
                    //placeTie: ,//check for TIE
                    score: playerData.statsData.kills.length,
                    team: { id: playerData.battleData._teamRef.id ,name: playerData.battleData._teamRef.id ,score: playerData.battleData._teamRef.score, place:0 }, //GameEndResultTeamType
                    teamWin: teamsTied ? "tie" : winningTeam[0].id == playerData.battleData.teamId ? 'win' : 'lose',
                    kills: playerData.statsData.kills.length,
                    stayedTillEnd: playerData.battleData.hasFinishedBattle(),
                    deaths: playerData.statsData.deaths.length,
                    hits:playerData.statsData.hitsGiven.length,
                    damageSent:playerData.statsData.damageGiven,//.length,
                    throws: playerData.statsData.shotsFired,
                    playedEnoughToSave: true
                //playerCombinedInfo: getPlayerCombinedInfo
                }
        
                const promise = PlayFabHelper.EndBattleGivePlayerUpdatePlayerStats(this.playFabSettings,this.roomId,updatePlayerStats)
                
                promise.then(function(result:PlayFabHelper.EndBattleUpdatePlayerStatsResult){
                    log(CLASSNAME,roomId,METHOD_NAME,"XXXXX updatePlayerStats promise.EndLevelGivePlayerUpdatePlayerStats " + playerDebugId + " " + playerData.sessionId,result);
                    //myRoom.authResult = result;
        
                    //where to put this?
                    //playerData.serverSide.endGameResult = result.endGameResult
                    //client.send("announce",'TODO show game finished stats')
                }).catch(function(error:PlayFabServerModels.ModifyUserVirtualCurrencyResult){
                    log(CLASSNAME,roomId,METHOD_NAME,"promise.EndLevelGivePlayerUpdatePlayerStats failed",error);
                })
        
                promises.push(promise)
        
                loopCount++;
            })
        }

        //log(CLASSNAME, this.roomId, METHOD_NAME, "IMPLEMENT ME");

        return Promise.all(promises).then(function (result) {
            log(
                CLASSNAME,
                roomId,
                METHOD_NAME,
                "XXXXXX all promised completed ",
                result
            );
            return result;
        });
    }

    onStartUpdatePlayerData() {
        const METHOD_NAME = "onStartUpdatePlayerData()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        super.onStartUpdatePlayerData();

        //ensure unique player positions per team
        const teams = [this.redTeam,this.blueTeam]
        for(const p in teams){
            const teamMem:serverStateSpec.TeamMemberState[] = []
            teams[p].members.forEach(
                (val:serverStateSpec.TeamMemberState)=>{
                    teamMem.push(val)
                }
            )
            teamMem.sort( (a:serverStateSpec.TeamMemberState,b:serverStateSpec.TeamMemberState)=>{
                return a._player.battleData.enrollTime - b._player.battleData.enrollTime
            } )
            let counter=0
            for(const m in teamMem){
                teamMem[m].position = counter++
            }
        }
    }
    createTimedEventClock(timeInst: TimeEventsInst, callback: () => void) {
        const METHOD_NAME = "createTimedEventClock()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, timeInst);
        this.timedEventClocks[timeInst.id].setTimeout(() => {
            callback();
        }, timeInst.time);
    }
    removeTrackByEvent(eventId: string) {
        const METHOD_NAME = "removeTrackByEvent()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, eventId);

        //TODO this should be from state, maybe not safe to track this way?
        const trackFeat: serverStateSpec.ITrackFeatureState =
            this.floorTrackFeatMap[eventId];
        if (trackFeat === undefined) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "failed to find ",
                eventId,
                trackFeat
            );
            return;
        }
        const trackToUpdate = this.state.levelData.trackFeatures.get(
            trackFeat.name
        );

        if (trackToUpdate) {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "updating",
                eventId,
                trackToUpdate.name,
                trackToUpdate.activateTime
            );

            //workaround, mark -1 as removed
            //trackToUpdate.activateTime = -1
            trackToUpdate.activateTime = -1;
        } else {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "could not find track to update",
                trackToUpdate.name
            );
        }

        log(
            CLASSNAME,
            this.roomId,
            METHOD_NAME,
            "for event",
            eventId,
            "updated track feature ",
            trackToUpdate.name,
            "activateTime",
            trackToUpdate.activateTime
        );
    }
    /*
    startSuddenDeath() {
        const METHOD_NAME = "startSuddenDeath()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);
        //this.removeTrackByEvent(SUDDEN_DEATH_TIME_EVENT.id);

        this.state.players.forEach((val: PlayerState) => {
            //TODO ASSIGN NEW VALUE TO TRIGGER CHANGE
            if (!val.battleData.hasFinishedBattle()) {
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    val.userData.name,
                    "changing health to 1",
                    "old",
                    val.healthData.current
                );
                val.healthData.current = 1;
                val.healthData.lastDamageDesc = "Sudden Death";
            } else {
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    val.userData.name,
                    "alread out of race",
                    "old",
                    val.healthData.current
                );
            }
            //val.healthData.lastDamageFrom = "server"
        });
    }*/
    start() {
        const METHOD_NAME = "start()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        //once started kicks off then start the timers
        for (const p in TIME_EVENT_LIST) {
            this.timedEventClocks[TIME_EVENT_LIST[p].id].clear();
            this.timedEventClocks[TIME_EVENT_LIST[p].id].start();
        }

        super.start()
    }
    starting() {
        const METHOD_NAME = "starting()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        super.starting()
    }

    setup(battleDataOptions: serverStateSpec.BattleDataOptions) {
        const METHOD_NAME = "setup()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, battleDataOptions);

        const now = this.getCurrentTime()

        this.maxWaitTimeToStartMillis = 
            battleDataOptions !== undefined && battleDataOptions.waitTimeToStart !== undefined ? battleDataOptions.waitTimeToStart : CONFIG.BATTLE_MAX_WAIT_TO_START_TIME_MILLIS
        
        this.state.enrollment.startTime = now
        
        // setup round countdown
        //this.state.countdown = this.levelDuration;

        for (const p in TIME_EVENT_LIST) {
            this.timedEventClocks[TIME_EVENT_LIST[p].id] = new Clock(true);
            this.timedEventClocks[TIME_EVENT_LIST[p].id].clear();
        }

        // make sure we clear previous interval
        this.clock.clear();

        //log("pausing for a few seconds to give sdk time to place items")
        //set timer to start

        this.setupBattleField(battleDataOptions);

        this.state.enrollment.updateServerTime(this.getCurrentTime());
 
        if(false){//dont start enrollment till min met
            this.state.enrollment.endTime =
                now + CONFIG.BATTLE_MAX_WAIT_TO_START_TIME_MILLIS;
            this.startEnrollTimer();
        }
    }

    setupBattleField(battleDataOptions: serverStateSpec.BattleDataOptions) {
        const METHOD_NAME = "setupBattleField()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME, battleDataOptions);

        log(CLASSNAME, this.roomId, METHOD_NAME, "this.getCurrentTime()",this.getCurrentTime(),Date.now(),(this.getCurrentTime()-Date.now()));
        

        if (battleDataOptions) {

            this.state.battleData.timeLimit = battleDataOptions.timeLimit !== undefined ? battleDataOptions.timeLimit : CONFIG.BATTLE_MAX_GAME_TIME_MILLIS
            this.state.battleData.id = battleDataOptions.levelId;
            this.state.levelData.id = battleDataOptions.levelId;

            //TODO WIRE THIS INTO TRACK DATA TO BROADCAST BACK BEFORE START!
            if (battleDataOptions.levelId == "custom") {
                if (battleDataOptions.name)
                    this.state.battleData.name = battleDataOptions.name;
                if (battleDataOptions.maxLaps)
                    this.state.battleData.maxLaps = battleDataOptions.maxLaps;
                //if(raceDataOptions.maxPlayers) this.state.battleData.m = raceDataOptions.maxPlayers
            } else {
                const level = LEVEL_MGR.getLevel(battleDataOptions.levelId);
                if (level !== undefined) {
                    //loop up from table
                    if (level.name) {
                        this.state.battleData.name = level.name;
                    } else {
                        this.state.battleData.name =
                            battleDataOptions.levelId + " name not set";
                    }
                } else {
                    log(
                        CLASSNAME,
                        this.roomId,
                        METHOD_NAME,
                        "WARNING level not found ",
                        battleDataOptions.levelId,
                        battleDataOptions
                    );
                    //this.state.battleData.name = "TODO pull race config from server file"
                    this.state.battleData.name = "Demo Derby";
                }
            }
        } else {
            log(
                CLASSNAME,
                this.roomId,
                METHOD_NAME,
                "WARNING raceDataOptions not provided!!!! ",
                battleDataOptions
            );
            this.state.battleData.name = "Unnamed Track";
        }

        const trackFeatures = this.setupBattleTrackFeatures();

        const retval: serverStateSpec.LevelDataState = {
            id: this.state.battleData.id,
            name: this.state.battleData.name,
            trackFeatures: new Map(),
            localTrackFeatures: trackFeatures,
            maxLaps: this.state.battleData.maxLaps,
            //trackPath: [],
        };

        this.state.levelData.copyFrom(retval,this.getCurrentTime());

        this.state.levelData.trackFeatures.forEach(
            (val: serverStateSpec.ITrackFeatureState) => {
                  
            }
        );

        //this.state.levelData = retval

        //TODO higher level logging return 'retval' itself
        log(CLASSNAME, this.roomId, METHOD_NAME, "created level");
    }
    setupBattleTrackFeatures() {
        const METHOD_NAME = "setupBattleTrackFeatures()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        const trackFeatures: serverStateSpec.TrackFeatureConstructorArgs[] = [];

        //for quick testing could spawn some at very beginning
        
        let counter=0


        //make ice tiles
        const blocksX = 12
        const blocksZ = 6
        counter=0
        for(let i=0; i< blocksX; i++){
            for(let j=0; j< blocksZ; j++){
                //id synced with server and client, do not change without also updating server and client
                const blockId =  "ice-tile."+counter+"."+(i+","+j)
                trackFeatures.push( {name:blockId,type:"ice-tile", position:new serverStateSpec.TrackFeaturePosition({}),health:{current:3,max:3,serverTime:-1} } )

                counter++
            }
        }

        //make fire places
        counter=0
        const firePlaceNumber=4
        for(let i=0; i< firePlaceNumber; i++){
            //id synced with server and client, do not change without also updating server and client
            const blockId =  "fireplace."+counter+""
            trackFeatures.push( {name:blockId,type:"fireplace", position:new serverStateSpec.TrackFeaturePosition({}),health:{current:3,max:3,serverTime:-1} } )

            counter++
        }
        
        //make trenches
        counter=0
        const trenchAmount=14 + 6 //number needed + room to grow for quick and dirty adds
        for(let i=0; i< trenchAmount; i++){
            //id synced with server and client, do not change without also updating server and client
            const blockId =  "trench."+counter+""
            trackFeatures.push( {name:blockId,type:"trench", position:new serverStateSpec.TrackFeaturePosition({}),health:{current:3,max:3,serverTime:-1} } )

            counter++
        }


        //make powerups
        counter=0
        const powerupAmount=3//number needed + room to grow for quick and dirty adds
        for(let i=0; i< powerupAmount; i++){
            //id synced with server and client, do not change without also updating server and client
            const blockId =  "powerup."+counter+""
            trackFeatures.push( {name:blockId,type:"powerup", position:new serverStateSpec.TrackFeaturePosition({}),activateTime:this.getCurrentTime(),health:{current:3,max:3,serverTime:-1} } )

            counter++
        }



        

        //trackFeatures.push( {name:"floor.2",type:"inert", position:new serverStateSpec.TrackFeaturePosition({startSegment:2,endSegment:0, centerOffset:0}) } )
        //trackFeatures.push( {name:"floor.3",type:"inert", position:new serverStateSpec.TrackFeaturePosition({startSegment:3,endSegment:0, centerOffset:0}) } )

        log(CLASSNAME, this.roomId, METHOD_NAME, "results ", trackFeatures);

        return trackFeatures;
    }
}
