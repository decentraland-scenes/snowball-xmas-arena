import { Room, Client, ServerError, Clock } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { CONFIG } from "./config";
import { PlayerButtonState, PlayerServerSideData, PlayerState, BattleState, BattleRoomState, TrackFeatureState, TeamState } from "../snowballState/server-state";
import * as serverStateSpec from "../snowballState/server-state-spec";
import * as PlayFabHelper from "../playfab/PlayFabWrapper";
import { LEVEL_MGR } from "../levelData/levelData";

function logEntry(classname:string,roomId:string,method:string,params?:any){
    console.log(classname,roomId,method," ENTRY",params)
}
function log(classname:string,roomId:string,method:string,msg?:string,...args:any[]){
    console.log(classname,roomId,method,msg,...args)
}

export type OnConnectOptionsPlayfabData={
    id:string
    titleId:string
    sessionId:string
    sessionTicket:string
}
export type OnConnectOptionsUserData={
    displayName:string
    name:string,
    userId:string
    avatar:any //TODO define it

    publicKey: string
    hasConnectedWeb3: boolean
    
    version: string
}
export type OnConnectOptions={
    playerType:"combatant"|"spectator"
    realm:string
    teamIdPref:string
    userData:OnConnectOptionsUserData
    playFabData:OnConnectOptionsPlayfabData
    battleDataOptions:serverStateSpec.BattleDataOptions
}

const CLASSNAME = "BaseBattleRoom"
const ENTRY = " ENTRY"
export class BaseBattleRoom extends Room<BattleRoomState> {
    
    maxClients = 1;//expect parent to override
    minClients = 1;//expect parent to override
    
    roomCreateTime: number
    playerMaxHealth:number = 5
    playFabSettings:PlayFabHelper.PlayFabSettings
    maxWaitTimeToStartMillis: number

    notifiedDisconnectAlready: boolean = false

    //globalOrientation:OrientationType = {alpha:0,beta:0,gamma:0,absolute:true}

    onCreate(options:OnConnectOptions) {
        const METHOD_NAME = "onCreate"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, options);

        this.roomCreateTime = this.getCurrentTime()
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        const state = new BattleRoomState()
        state.enrollment.maxPlayers = this.maxClients
        state.enrollment.minPlayers = this.minClients

        this.setState(state);

        this.playFabSettings = {
            titleId:CONFIG.BATTLE_PLAYFAB_TITLEID,
            developerSecretKey:CONFIG.BATTLE_PLAYFAB_DEVELOPER_SECRET
        }
        //setup game
        
        
    }

    getCurrentTime(){
        return this.clock.currentTime
    }
    handleUnexpectedError(CLASSNAME: string, roomId: string, METHOD_NAME: string, args:any, msg: string, client: Client, e: any) {
        log(CLASSNAME,roomId,METHOD_NAME, "UNHANDLED ERROR OCCURED!!!", "CLASSNAME",CLASSNAME, "roomId", roomId, "METHOD_NAME",METHOD_NAME)
        log(CLASSNAME,roomId,METHOD_NAME, "UNHANDLED ERROR OCCURED!!!", "CLASSNAME",CLASSNAME, "roomId", roomId, "METHOD_NAME",METHOD_NAME, "args",args, "msg", msg, "client",client.sessionId, "error", e);
        log(CLASSNAME,roomId,METHOD_NAME, "UNHANDLED ERROR OCCURED!!!", "CLASSNAME",CLASSNAME, "roomId", roomId, "METHOD_NAME",METHOD_NAME)
        if(!CONFIG.SILENCE_UNHANDLED_ERRORS){
            throw e
        }
    }
    checkIsBattleOver(){
        const METHOD_NAME = "checkIsBattleOver"
        if(!this.state.battleData.hasBattleStarted() || this.state.battleData.isBattleOver()){
            //log(CLASSNAME,this.roomId,METHOD_NAME,"checkIsBattleOver race not started/over",this.state.battleData.status)
            return false
        }

        //if all but 1 team has players left, game is over
        
        log(CLASSNAME,this.roomId,METHOD_NAME,"IMPLEMENT ME")
        //log(CLASSNAME,this.roomId,METHOD_NAME,"players done",countPlayersDone,playersConnected,BattleOver,this.state.battleData.status,this.state.battleData.hasBattleStarted(),this.state.battleData.isBattleOver())
        return true
    }
    updateRanks() {
        const METHOD_NAME = "updateRanks"
        this.updatePlayerRanks()
        this.updateTeamRanks()
    }
    updatePlayerRanks() {
        const METHOD_NAME = "updatePlayerRanks"

        
        log(CLASSNAME,this.roomId,METHOD_NAME,"IMPLEMENT ME")

        //log(CLASSNAME,this.roomId,METHOD_NAME,"new ranks",playerDataRanked)
    }


    updateTeamRanks() {
        const METHOD_NAME = "updateTeamRanks";
        
        log(CLASSNAME,this.roomId,METHOD_NAME,"IMPLEMENT ME")
    }

    assignTeam(player:PlayerState,client:Client, options:OnConnectOptions) { 
        const METHOD_NAME = "assignTeam"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [player,client.sessionId,options]);

        if(player.type == "combatant"){
            log(CLASSNAME,this.roomId,METHOD_NAME, "is ",player.type,"assigning to team");
            //assign team
            let teamWithLeastPlayers:TeamState|undefined = undefined
            let teamPref:TeamState|undefined = undefined

            this.state.enrollment.teams.forEach(
                (val:serverStateSpec.TeamState)=>{
                    if(teamWithLeastPlayers === undefined || val.members.size < teamWithLeastPlayers.members.size){
                        teamWithLeastPlayers = val as TeamState
                    }
                    if(options.teamIdPref !== undefined && val.id == options.teamIdPref){
                        teamPref = val as TeamState
                    }
                }
            )
 
            log(CLASSNAME,this.roomId,METHOD_NAME, "lowest team count", teamWithLeastPlayers.id);
            log(CLASSNAME,this.roomId,METHOD_NAME, "team pref", teamPref !== undefined ? teamPref.id : undefined);
            if(teamPref !== undefined && teamPref.maxPlayers < teamPref.members.size){
                log(CLASSNAME,this.roomId,METHOD_NAME, "adding to team pref", teamWithLeastPlayers.id);
                this.state.enrollment.addPlayer(player,teamPref)
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "adding to team with lowest", teamWithLeastPlayers.id);
                this.state.enrollment.addPlayer(player,teamWithLeastPlayers)
            }
        }else{
            log(CLASSNAME,this.roomId,METHOD_NAME, "is ",player.type,"assigning to spectators");
            this.state.enrollment.spectators.addPlayer(player)
        }
    }
    addPlayer(client:Client, options:OnConnectOptions) { 
        const METHOD_NAME = "addPlayer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,options]);

        client.send("hello", "world");
        const player = this.state.createPlayer(client.sessionId);

        //update enrollment status?? 
        //workaround, not sure can trust client time is update enrollment servertime
        if(this.state.enrollment.open){
            this.state.enrollment.serverTime = this.getCurrentTime()
        }

        player.connStatus = "connected"
        player.type = (options.playerType !== undefined) ? options.playerType : "spectator"


        this.assignTeam( player,client,options )
        
        if(options.userData){
            log(CLASSNAME,this.roomId,METHOD_NAME, "snapshot", [client.sessionId,options.userData.avatar]);
            if(options.userData.displayName) player.userData.name = options.userData.displayName
            if(options.userData.userId) player.userData.userId = options.userData.userId
            /*if(options.userData.avatar && options.userData.avatar.snapshots){
                log(CLASSNAME,this.roomId,METHOD_NAME, "snapshot", [client.sessionId,options.userData.avatar.snapshots]);
                player.userData.snapshotFace128 = options.userData.avatar.snapshots.face128
            } */
        } 

        //TODO verify on map

        this.checkEnrollmentMet()

        return player
    }
    
    async onAuth(client:Client, options:OnConnectOptions):Promise<any> { 
        const METHOD_NAME = "onAuth()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,options]);

        const promises:Promise<any>[] = [];

        const retData:PlayerServerSideData = {playFabData:undefined}

        const userData = options.userData
        const playfabData = options.playFabData

        const userDataForDebug = 
        {
          displayName: userData ? userData.displayName : "",
          publicKey: userData ? userData.publicKey : "",
          hasConnectedWeb3: userData ? userData.hasConnectedWeb3 : "",
          userId: userData ? userData.userId : "",
          version: userData ? userData.version : ""
        }

        if(CONFIG.BATTLE_PLAYFAB_ENABLED){
            if(playfabData && CONFIG.BATTLE_PLAYFAB_TITLEID !== playfabData.titleId){
                log(CLASSNAME,this.roomId,METHOD_NAME," joined with wrong titleId " , CONFIG.BATTLE_PLAYFAB_TITLEID , "vs",playfabData.titleId)
                //this.broadcast("showError",{title:"Error","message":"Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.PLAYFAB_TITLEID});
                
                const playFabAuth = new Promise((resolve, reject) => {
                    reject(new ServerError(4401, "Failed to Authenticate Session:" + "Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.BATTLE_PLAYFAB_TITLEID))
                    return false
                })
                
                promises.push(playFabAuth)
            }else if(CONFIG.BATTLE_ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS  && (!userData || !playfabData)){
                log(CLASSNAME,this.roomId,METHOD_NAME," joined with no playfab data " , playfabData)
                //this.broadcast("showError",{title:"Error","message":"Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.PLAYFAB_TITLEID});
                
                const playFabAuth = new Promise((resolve, reject) => {
                    reject(new ServerError(4401, "Failed to Authenticate Session:" + "Playfab Options Data is required"))
                    return false
                })
                
                promises.push(playFabAuth)
            }else if(userData && playfabData){
                if(playfabData.sessionId){
                    throw new ServerError(4401, "Failed to Authenticate Session")
                }
                const playFabAuth = new Promise((resolve, reject) => {
                    PlayFabHelper.AuthenticateSessionTicket( this.playFabSettings,{"SessionTicket":playfabData.sessionTicket} ).then(
                    (result:PlayFabServerModels.AuthenticateSessionTicketResult)=>{
                        log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFabHelper.AuthenticateSessionTicket.result",result)
                        //TODO set player id to something? wallet? fab id does not seem safe  
                        
                
                
                        if(result && result.IsSessionTicketExpired !== undefined && result.IsSessionTicketExpired === false){
                            const player = this.addPlayer(client,options)
                                
                            //const data:PlayerServerSideData = retData// = {sessionId:client.sessionId,playFabData:options.playFabData}
                            //retData.sessionId = client.sessionId
                            retData.playFabData = playfabData
                
                            player.userPrivateData = {
                                playFabData:{id:playfabData.id,sessionTicket:playfabData.sessionTicket}
                                }
                            
                                log(CLASSNAME,this.roomId,METHOD_NAME,"client.sessionId " + client.sessionId)
                    
                            //not map it both ways sessionId and playfabId 
                            //only map session id, keep it secret? can just loop serverside data object
                            //this.playerServerSideData[client.sessionId] = retData
                            //this.playerServerSideData[options.playFabData] = data
                            
                            log(CLASSNAME,this.roomId,METHOD_NAME,player.userData.name, "authed! => ", options.realm,userDataForDebug,playfabData);
                    
                            log(CLASSNAME,this.roomId,METHOD_NAME,player.userData.name, "authed! returning => ", retData);
                    
                            resolve(retData)
                    
                        }else{
                            console.log( "failed to auth player, did not join => ", result, options.realm,userDataForDebug,options.playFabData);
                    
                            //when in onJoin it tells them to leave
                            //4000 range, 401 for unauthorized
                            //client.leave(4401,"Failed to Authenticate Session")
                    
                            reject(new ServerError(4401, "Failed to Authenticate Session"));
                            return false;
                
                        //dispose room?
                        }
                    }
                    ).catch( (reason:any) => {
                        log(CLASSNAME,roomId,METHOD_NAME,"playFabAuth promise FAILED " , reason)
                        //TODO tack on server errors
                        reject(new ServerError(4401, "Failed to Authenticate Session"));
                        return false;
                    })
                })//end promise


                promises.push(playFabAuth)
            }else{
                //add observer???
                log(CLASSNAME,this.roomId,METHOD_NAME,"playing joined but no playfab/dcl data???",CONFIG.BATTLE_PLAYFAB_ENABLED,options)    
                const player = this.addPlayer(client,options)
                player.userPrivateData = {
                    playFabData:{id:"playfabData.id",sessionTicket:"playfabData.sessionTicket"}
                    }
            }
        }else{
            log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFab not enabled.  Not authenticating player",options)    
            const player = this.addPlayer(client,options)
            player.userPrivateData = {
                playFabData:{id:"playfabData.id",sessionTicket:"playfabData.sessionTicket"}
                }
        }
        
        const roomId = this.roomId
        return Promise.all( promises ).then(function(result){
            log(CLASSNAME,roomId,METHOD_NAME,"all promised completed " , result)
            return retData;
        }).catch( (reason:any) =>{
            log(CLASSNAME,roomId,METHOD_NAME,"all promised FAILED " , reason)
            if(reason instanceof Error){
                throw reason
            }
            return false;
        } )

        //options.userData.displayName ||
        //return true;
    }

    onJoin(client: Client) {
        const METHOD_NAME = "onJoin()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, client.sessionId);


        //this.onJoinSendLevelData(client)
    }

    //not needed, promoted levelData to state
    /*onJoinSendLevelData(client: Client){
        const METHOD_NAME = "onJoinSendLevelData()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, client.sessionId);


        const retval:serverStateSpec.LevelDataState = { 
            id: this.state.battleData.id,
            name: this.state.battleData.name,
            trackFeatures: [],
            maxLaps: this.state.battleData.maxLaps,
            trackPath: []
        }

        this.state.levelData.copyTo( retval )

        const initLevelData = retval//JSON.stringify(retval)
        log(CLASSNAME,this.roomId,METHOD_NAME,"sending initLevelData")//,initLevelData)
        client.send("setup.initLevelData",initLevelData)
    }*/

    preventNewPlayers(){
        const METHOD_NAME = "preventNewPlayers()"
        if(!this.state.enrollment.open){
            log(CLASSNAME,this.roomId,METHOD_NAME,"room already locked",this.roomId)    
            return
        }
        log(CLASSNAME,this.roomId,METHOD_NAME,"no more racers allowed",this.roomId)
        this.lock()
        //lock prevents anyone else from joining
        this.state.enrollment.open=false
        this.state.enrollment.endTime = this.getCurrentTime()
        this.setPrivate(true) //will let you join if u know the room ID
    }


    async onLeave(client: Client, consented: boolean) {
        const METHOD_NAME = "onLeave()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,consented]);
        
        const player = this.state.players.get(client.sessionId);

        if(player === undefined){
            log(CLASSNAME,this.roomId,METHOD_NAME,"WARNING!!! player null, already left?", client.sessionId,player)
            //return;
        }

        const playerWasCreated = player !== undefined
        /*
        try {
        client.send("onLeave","consented:"+consented) 
        } catch (e) {
        console.log("failed sending onLeave event",player.name,client.sessionId,e)
        }*/
        let removePlayer = this.state.battleData.status == "not-started"

        const waitForReconnect = CONFIG.RECONNECT_WAIT_ENABLED && !consented

        log(CLASSNAME,this.roomId,METHOD_NAME,"waitForReconnect:"+waitForReconnect,"playerWasCreated:"+playerWasCreated)
    
        if (waitForReconnect) {
            if(playerWasCreated) player.connStatus = "reconnecting"
            try {
                log(CLASSNAME,this.roomId,METHOD_NAME, "try for a reconnect!!!", [player.userData.name,this.roomName,this.roomId])
                // allow disconnected client to reconnect into this room until 20 seconds
                await this.allowReconnection(client, CONFIG.RECONNECT_WAIT_TIME);
 
                log(CLASSNAME,this.roomId,METHOD_NAME,"reconnnected!!!", player.userData.name)
                // client returned! let's re-activate it.
                //this.state.players.get(client.sessionId).connected = true;
                removePlayer = false

                if(playerWasCreated) player.connStatus = "connected"
            } catch (e) {
                log(CLASSNAME,this.roomId,METHOD_NAME,"reconnect failed!!!", [player.userData.name, client.sessionId, e])

                if(playerWasCreated) player.connStatus = "lost connection"
                this.checkIsBattleOver()
            }
        }else{
            if(playerWasCreated) player.connStatus = "disconnected"
            this.checkIsBattleOver()
        }

        if (removePlayer) {
            // 20 seconds expired. let's remove the client.
            if (playerWasCreated) {
                this.state.removePlayer(player);

                this.checkEnrollmentMet()
                //not removing player because need to rank them at the end
            } else {
                log(CLASSNAME,this.roomId,METHOD_NAME,"already gone? / cound not find " + client.sessionId);
            }
            //this.state.players.delete(client.sessionId);
        }

    }

    onDispose() {
        const METHOD_NAME = "onDispose()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        if(!this.state.battleData.isBattleOver()){
            //end the battle to clean up anything needs cleaning up
            this.endBattle()
        }

        this.notifyAndDisconnectClientsIn(0);
        
        //choosing endBattle over manual save here 
        //
    }
    hasMinPlayers(){
        const METHOD_NAME = "hasMinPlayers";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);
        return this.state.players.size >= this.minClients
    }
    checkEnrollmentMet(){
        const METHOD_NAME = "doEnrollment()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        if(this.hasMinPlayers()){
            
            if(!this.canAdjustEnrollmentTime()
                || (this.state.enrollment.endTime !== undefined && this.state.enrollment.endTime > 0)
                    ){
                log(CLASSNAME,this.roomId,METHOD_NAME, "has enough players, but already started","this.state.enrollment.open",this.state.enrollment.open,"this.state.battleData.status",this.state.battleData.status,"this.state.enrollment.endTime",this.state.enrollment.endTime);
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "has enough players, starting timer","this.state.enrollment.open",this.state.enrollment.open,"this.state.battleData.status",this.state.battleData.status,"this.state.enrollment.endTime",this.state.enrollment.endTime);
                
                this.setEnrollmentEndTimeAndTimer(this.getCurrentTime() + this.maxWaitTimeToStartMillis)
            }
            
        }else{
            log(CLASSNAME,this.roomId,METHOD_NAME, "not enough players yet");
            this.cleartEnrollmentEndTimeAndTimer()
        }

        if(this.state.players.size > this.maxClients){
            this.preventNewPlayers()
        }
    }
    doEnrollment(){
        const METHOD_NAME = "doEnrollment()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);
        const now = this.getCurrentTime()
        //i dont know why but seeing precision issues with clock checking.  8 ms off?? 
        //this.state.enrollment.endTime <= now
        const paddingMS = 20
        if(this.state.enrollment.endTime - now <= paddingMS){
            if (this.hasMinPlayers()) {
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "starting battle",
                    this.state.enrollment.endTime,
                    now,
                    this.state.enrollment.endTime - now,
                    paddingMS
                );
                //start race
                this.starting();
            } else {
                log(
                    CLASSNAME,
                    this.roomId,
                    METHOD_NAME,
                    "not enough players yet",
                    this.state.players.size,
                    "vs",
                    this.minClients,
                    this.state.enrollment.endTime,
                    now,
                    this.state.enrollment.endTime - now,
                    paddingMS
                );
                this.extendEnrollmentTime();
            }
        }else{
            //race not started yet 1655999493364-1655999493356
            log(CLASSNAME,this.roomId,METHOD_NAME,"battle not started yet",this.state.enrollment.endTime , now,(this.state.enrollment.endTime - now),paddingMS)
        }
    }

    canAdjustEnrollmentTime(){
        //const retVal = false
        if(!this.state.enrollment.open){
            console.log("enrollment is closed")
            return false
        }
        if(!this.state.enrollment.open || this.state.battleData.status != "not-started"){
            console.log("race started cannot extend enrollment")
            return false
        }
        return true
    }

    cleartEnrollmentEndTimeAndTimer(){
        const METHOD_NAME = "cleartEnrollmentEndTimeAndTimer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        
        if(!this.canAdjustEnrollmentTime()){
            log(CLASSNAME,this.roomId,METHOD_NAME,"cannot adjust enrollment time anymore")
            return
        }
         
        this.state.enrollment.endTime = -1
        this.state.enrollment.serverTime = this.getCurrentTime()

        // make sure we clear previous interval
        this.clock.clear();
    }

    setEnrollmentEndTimeAndTimer(time:number){
        const METHOD_NAME = "setEnrollmentEndTimeAndTimer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,time);

        if(!this.canAdjustEnrollmentTime()){
            log(CLASSNAME,this.roomId,METHOD_NAME,"cannot adjust enrollment time anymore")
            return
        }
            
        this.state.enrollment.endTime = time
        this.state.enrollment.serverTime = this.getCurrentTime()

        this.startEnrollTimer()
    }
    extendEnrollmentTime(amount?:number){
        const METHOD_NAME = "extendEnrollment"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,amount);

        let endTime = this.state.enrollment.endTime
        if(endTime <= 0){
            endTime = this.getCurrentTime()
        }
        const newVal = endTime + (amount && amount > 0 ? amount : CONFIG.BATTLE_MAX_WAIT_TO_START_TIME_MILLIS)
        
        this.setEnrollmentEndTimeAndTimer(newVal)
    }
    //GAMELOOP
    update(dt:number){

        
        //trying without the game loop
        /*
        switch(this.state.battleData.status){
            case "not-started":
                this.doEnrollment()
                break;
            case "started":

                break;

        }*/
    }//END GAMELOOP
    
    onEndBattle(){

    }
    endBattle(){
        const METHOD_NAME = "endRace()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        if(this.state.battleData.isBattleOver()){
            log(CLASSNAME,this.roomId,METHOD_NAME,"battle already over, skipping ")
            return
        }
        this.state.battleData.endTimeActual = this.getCurrentTime()
        this.state.battleData.updateServerTime(this.getCurrentTime()) 
        
        this.state.battleData.status = "ended"
        //broadcast to players?

        this.onEndBattle()

        //force terminate connection in X seconds
        //const clock = new Clock()
        this.clock.clear();
 
        const waitToCloseTime = 3*1000
        log(CLASSNAME,this.roomId,METHOD_NAME,"will close room in " +waitToCloseTime + " ms")
        
        if(!this.state.battleData.savedPlayerStats){
            //one last rank update
            this.updateRanks()

            this.updatePlayerStats().then((result)=>{
                log(CLASSNAME,this.roomId,METHOD_NAME,"XXXXX endBattle all promised completed " , result)                
                this.notifyAndDisconnectClientsIn(waitToCloseTime)
            })
        }else{
            this.notifyAndDisconnectClientsIn(waitToCloseTime)
        } 
    }
    notifyAndDisconnectClientsIn(waitToCloseTime:number){
        const METHOD_NAME = "notifyAndDisconnectClientsIn()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,[waitToCloseTime]);

        if(this.notifiedDisconnectAlready){
            log(CLASSNAME,this.roomId,METHOD_NAME,"notified already skipping " , this.notifiedDisconnectAlready)                
            return
        }
        this.notifiedDisconnectAlready = true

        //adding back notify
        this.broadcast("ended.roomAboutToDisconnect");

        this.clock.setTimeout(
            ()=>{
                log(CLASSNAME,this.roomId,METHOD_NAME,"force closing room now ")
                this.disconnect()
            },waitToCloseTime
        )
        
    }
    async updatePlayerStats():Promise<any[]>{
        const METHOD_NAME = "updatePlayerStats()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        if(this.state.battleData.savedPlayerStats){
            log(CLASSNAME,this.roomId,METHOD_NAME,"updatePlayerStats already calld, not executing again")    
            return
        }
        this.state.battleData.savedPlayerStats = true

        const roomId = this.roomId

        const promises:Promise<any>[] = [];
    
        log(CLASSNAME,this.roomId,METHOD_NAME,"IMPLEMENT ME")

        return Promise.all( promises ).then(function(result){
        log(CLASSNAME,roomId,METHOD_NAME,"XXXXXX all promised completed " , result)
        return result;
        })
    }

    onStartUpdatePlayerData(){
        const METHOD_NAME = "onStartUpdatePlayerData()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME)

        this.state.players.forEach(
            (val:PlayerState)=>{
             
            }
        )
    }
    start(){
        const METHOD_NAME = "start()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        this.state.battleData.status = "started";

        log(
            CLASSNAME, this.roomId, METHOD_NAME,
            "setting new clock timeout to start"
        );

        //MOVE THIS INTO a game loop if need more than 1 timer?
        this.clock.setTimeout(() => {
            log(CLASSNAME, this.roomId, METHOD_NAME,"timer expired, end battle!","this.state.battleData.timeLimit",this.state.battleData.timeLimit );
            this.endBattle();
        },this.state.battleData.timeLimit);
    }
    starting() {
        const METHOD_NAME = "starting()";
        logEntry(CLASSNAME, this.roomId, METHOD_NAME);

        if(this.state.battleData.status == "started"){
            log(CLASSNAME,this.roomId,METHOD_NAME,"already started!!!!")
            return;
        }
        if(this.state.battleData.status == "ended"){
            log(CLASSNAME,this.roomId,METHOD_NAME,"battle is over, cannot start again")
            return;
        }
        this.preventNewPlayers()

        this.clock.clear();

        this.state.battleData.status = "starting";
        this.state.battleData.updateServerTime(this.getCurrentTime());
        this.state.battleData.startTime =
            this.getCurrentTime() + CONFIG.BATTLE_STARTING_COUNTDOWN_TIME_MILLIS;
        this.state.battleData.endTime = this.state.battleData.startTime + this.state.battleData.timeLimit
        
        //MOVE THIS INTO a game loop if need more than 1 timer?
        this.clock.setTimeout(() => {
            this.start()
        }, CONFIG.BATTLE_STARTING_COUNTDOWN_TIME_MILLIS);
    }

    startEnrollTimer(){
        const METHOD_NAME = "startEnrollTimer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME)
    
        // make sure we clear previous interval
        this.clock.clear();

        const time = this.state.enrollment.endTime - this.getCurrentTime()//this.state.enrollment.serverTime
        log(CLASSNAME,this.roomId,METHOD_NAME,"setting new clock timeout for " + time + "ms")

        this.clock.setTimeout(()=>{
            log(CLASSNAME,this.roomId,METHOD_NAME,"calling doEnrollment/start")
            this.doEnrollment()
        },time)
    }

}
