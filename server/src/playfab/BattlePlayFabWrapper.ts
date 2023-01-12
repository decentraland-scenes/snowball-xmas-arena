//import PlayFab from "../playfab_sdk/PlayFabClientApi";
//import * as PlayFabSDK from  '../playfab_sdk/index'
//import { EntityTokenResponse, GetPlayerCombinedInfoResultPayload, LoginResult, TreatmentAssignment, UserSettings } from '../playfab_sdk/playfab.types'; 
import { PlayFab,PlayFabAuthentication, PlayFabServer } from "playfab-sdk";
import { CONFIG } from "../rooms/config";
import { addStat, GetPlayerCombinedInfo, PlayFabSettings, UpdatePlayerStatistics, UpdateUserReadOnlyData } from "./PlayFabWrapper";

//var PlayFab: PlayFab ;//= require("PlayFab-sdk/Scripts/PlayFab/PlayFab");
//var PlayFabClient: PlayFabClientModule.IPlayFabClient ;//= require("PlayFab-sdk/Scripts/PlayFab/PlayFabClient");

//2021-12-10T02:57:57.208Z
//want to match playfab format just for consistancy
//2021-12-09T22:53:34 GMT-0500


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

PlayFab.settings.titleId = CONFIG.BATTLE_PLAYFAB_TITLEID
PlayFab.settings.developerSecretKey = CONFIG.BATTLE_PLAYFAB_DEVELOPER_SECRET

function notNull(val:any){
  return val !== null && val !== undefined
}
function isNull(val:any){
  return val === null && val === undefined
}

// or re-usable `sleep` function:
const doSleep = (milliseconds:number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//const list = [1, 2, 3, 4, 5]
const sleep = async (val:number) => {
  //for (const item of list) {
    await doSleep(val);
    console.log('slept for ' + val );
  //}
}

const sleepLoop = (seconds:number)=>{
  var waitTill = new Date(new Date().getTime() + seconds * 1000);
  while(waitTill > new Date()){}
}

const CLASSNAME = "BattlePlayFabWrapper"

const TEAM_BLUE_ID = "blue"
const TEAM_RED_ID = "red"

const STATS_PLAYER_PREFIX = "pl"+""//updateStats.levelId.replace(/ /g, "_").toLocaleLowerCase();
const STATS_TEAM_PREFIX = "tm"+""//updateStats.levelId.replace(/ /g, "_").toLocaleLowerCase();

const XMAS_DAYS_PLAYED = "rewards.xmas2022.daysPlayed"

export const EndBattleGivePlayerUpdatePlayerStats = async (settings:PlayFabSettings,roomId:string,updateStats:EndBattleUpdatePlayerStatsRequest):Promise<EndBattleUpdatePlayerStatsResult> => {
  const METHOD_NAME = "EndBattleGivePlayerUpdatePlayerStats"

  logEntry(CLASSNAME, roomId, METHOD_NAME, [settings,roomId,updateStats])

  const results: EndBattleUpdatePlayerStatsResult = {}
  const promises:Promise<any>[] = [];

  const playFabId = updateStats.playFabId
  const now = new Date();

  const dateFormatted = now.getDate()+"."+(now.getMonth()+1)+"."+now.getFullYear()

  var getPlayerCombinedInfoRequestParams: PlayFabServerModels.GetPlayerCombinedInfoRequestParams = {
    // Whether to get character inventories. Defaults to false.
    GetCharacterInventories: false,
    // Whether to get the list of characters. Defaults to false.
    GetCharacterList: false,
    // Whether to get player profile. Defaults to false. Has no effect for a new player.
    GetPlayerProfile: false,
    // Whether to get player statistics. Defaults to false.
    GetPlayerStatistics: false,
    // Whether to get title data. Defaults to false.
    GetTitleData: false,
    // Whether to get the player's account Info. Defaults to false
    GetUserAccountInfo: false,
    // Whether to get the player's custom data. Defaults to false
    GetUserData: false,
    // Whether to get the player's inventory. Defaults to false
    GetUserInventory: false,
    // Whether to get the player's read only data. Defaults to false
    GetUserReadOnlyData: true,
    // Whether to get the player's virtual currency balances. Defaults to false
    GetUserVirtualCurrency: false,
    // Specific statistics to retrieve. Leave null to get all keys. Has no effect if GetPlayerStatistics is false
    //PlayerStatisticNames?: string[];
    // Specifies the properties to return from the player profile. Defaults to returning the player's display name.
    //ProfileConstraints?: PlayerProfileViewConstraints;
    // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetTitleData is false
    //TitleDataKeys?: string[];
    // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserData is false
    //UserDataKeys?: string[];
    // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserReadOnlyData is
    // false
    UserReadOnlyDataKeys: [
      "rewards.xmas2022",XMAS_DAYS_PLAYED
    ]
  }
  var getPlayerCombinedInfoRequest: PlayFabServerModels.GetPlayerCombinedInfoRequest= {
    // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
    //CustomTags?: { [key: string]: string | null };
    // Flags for which pieces of info to return for the user.
    InfoRequestParameters: getPlayerCombinedInfoRequestParams,
    // PlayFabId of the user whose data will be returned
    PlayFabId: playFabId,
  }
  
  const runningGuestGame = false


  let userData:any = {}

  let gameEndResult:GameEndResultType={
    stats:{
      placed: updateStats.place,
      score: updateStats.score,
      teamWin: updateStats.teamWin,
      deaths: updateStats.deaths,
      kills: updateStats.kills,
      //mvp: updateStats.place <= 1,
      throws: updateStats.throws,
      hits: updateStats.hits,
      damageSent: updateStats.damageSent,
      team: updateStats.team,
      stayedTillEnd: updateStats.stayedTillEnd
    },
    rewards: []
    //totalTime: updateStats.totalTime
  }
  

  var getPlayerCombinedInfo = new Promise((mainResolve, reject)=>{
    GetPlayerCombinedInfo(settings,getPlayerCombinedInfoRequest).then(
      function(result:PlayFabServerModels.GetPlayerCombinedInfoResult){
        log(CLASSNAME,roomId,METHOD_NAME, "promise.GetPlayerCombinedInfoResult",result);
        log(CLASSNAME,roomId,METHOD_NAME, "promise.GetPlayerCombinedInfoResult.UserReadOnlyData",result.InfoResultPayload.UserReadOnlyData);
        
        //myRoom.authResult = result;
        results.playerCombinedInfo = result;
        
        
        //let newEpoch = null
        //let userData:any = {}
        //let resetEpoch = false;

        //TODO need to write to guest currency somehow!!!

        let daysPlayed = []

        const resultsUserReadOnlyData = result.InfoResultPayload.UserReadOnlyData
        for(const p in resultsUserReadOnlyData){
          const rec = resultsUserReadOnlyData[p]
          log(CLASSNAME,"--",METHOD_NAME
            , "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"resultsUserReadOnlyData ","p",p,"rec",rec);
          if(p === XMAS_DAYS_PLAYED && rec.Value !== undefined){
            daysPlayed = JSON.parse(rec.Value)
          }
        }
        
        let addedNewDay = !daysPlayed.includes(dateFormatted);
        
        if(addedNewDay && daysPlayed.length > 40){
          log(CLASSNAME,"--",METHOD_NAME
            , "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"did not add, too many days!!!, also past reward window anyway. only need 3");
        }else if(addedNewDay){
          daysPlayed.push(dateFormatted)
        }

        log(CLASSNAME,"--",METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName
          ,"resultsUserReadOnlyData ","daysPlayed",daysPlayed,"addedNewDay",addedNewDay);
        

        let subtractAmount = 0;
 
        const promisesInner:Promise<any>[] = [];

        
        /*const newEpochtime = new Date()

        //because we are doing 24 hour flooring it so it matches utc clock
        newEpochtime.setUTCHours(0,0,0,0);

        currentEpoch = newEpochtime
        newEpoch = date.format(newEpochtime, CONFIG.DATE_FORMAT_PATTERN,true);
        */

        let writeUserData = false
        if(updateStats.playerType == 'player'){
          userData["lastBattleData"] = JSON.stringify({id:updateStats.levelId,"name":updateStats.levelName,"time":Date.now(),"gameEndResult.stats":gameEndResult.stats})

          userData["rewards.xmas2022"] = JSON.stringify( gameEndResult.rewards)

          userData[XMAS_DAYS_PLAYED] = JSON.stringify( daysPlayed )
          
          writeUserData = true
        }else{
          //for now not writing team user data, worried out performance/play fab limits
        }
        
        //write what rewards they earned
        //userData["lastBattleData"] = JSON.stringify({id:updateStats.levelId,"name":updateStats.levelName,"time":Date.now(),"gameEndResult":gameEndResult})
        
        

        const thisGameStats:PlayFabServerModels.StatisticUpdate[] = []

        //only give these out when not a tie?
        

        const statsPrefix = updateStats.playerType == 'team' ? STATS_TEAM_PREFIX : STATS_PLAYER_PREFIX

        const qualifiedForRankStats = statsPrefix == STATS_PLAYER_PREFIX && updateStats.kills >= CONFIG.BATTLE_MIN_KILLS_TO_RECORD_RANK_STATS
        const qualifiedForEndOfGameStats = updateStats.stayedTillEnd

        const SUM_MIN = 1 //0 //should be 1 but to mass make use 0
        //be aware stat name has a 50 char max len
        //totalTime, prefix with the level
        if(updateStats.place >= 0 && updateStats.playedEnoughToSave){
          const workaroundScalar = -1
          //https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
          addStatNReward(thisGameStats,"frags_best",statsPrefix,["xhour","day","week","epoch"],updateStats.kills,[0,999])//max
          //addStatNReward(thisGameStats,"frozen_best",statsPrefix,["xhour","day","week","epoch"],updateStats.deaths,[0,999])//min
          //not tracked for now, want to stay under 25 best we can
          if(updateStats.throws > 0){
            const ratio = Math.floor(updateStats.kills/updateStats.throws)
            addStatNReward(thisGameStats,"hit_ratio_best",statsPrefix,["Xhour","day","week","epoch"],ratio,[0,100])//max
            //addStatNReward(thisGameStats,"hit_ratio_avg",statsPrefix,["Xhour","day","week","epoch"],ratio,[0,100])//avg //CANOT BE DONE, DELETE!!!

            //capture hit ratio
            addStatNReward(thisGameStats,"hit_ratio_above_25",statsPrefix,["Xhour","day","week","epoch"],ratio > .25 ? 1:0,[0,100])//sum
          }

          
          addStatNReward(thisGameStats,"frags",statsPrefix,["Xhour","day","week","epoch"],updateStats.kills,[SUM_MIN,999])//sum
          addStatNReward(thisGameStats,"frozen",statsPrefix,["xhour","day","week","epoch"],updateStats.deaths,[SUM_MIN,999])//sum
          addStatNReward(thisGameStats,"throws",statsPrefix,["xhour","day","week","epoch"],updateStats.throws,[SUM_MIN,9999])//sum
          if(qualifiedForEndOfGameStats) addStatNReward(thisGameStats,"games",statsPrefix,["xhour","day","week","epoch"],1,[0,1])//sum
          //use team_wins if(statsPrefix == STATS_PLAYER_PREFIX) addStatNReward(thisGameStats,"XXXXteam_wins_any",statsPrefix,["xhour","day","week","epoch"],updateStats.teamWin =='win' ?1:0,[0,1])//sum
          //addStatNReward(thisGameStats,"hits",statsPrefix,["xhour","day","week","epoch"],updateStats.hits,[0,1])//sum

          
          if(qualifiedForEndOfGameStats) addStatNReward(thisGameStats,"team_wins",statsPrefix,["Xhour","day","week","epoch"],updateStats.teamWin =='win' ?1:0,[SUM_MIN,1])//sum
          if(statsPrefix == STATS_PLAYER_PREFIX){
            //add blue vs red
            if(updateStats.team.id === TEAM_BLUE_ID ) addStatNReward(thisGameStats,"team_wins_blue",statsPrefix,["Xhour","day","week","epoch"],updateStats.teamWin =='win' ?1:0,[SUM_MIN,1])//sum
            if(updateStats.team.id === TEAM_RED_ID ) addStatNReward(thisGameStats,"team_wins_red",statsPrefix,["Xhour","day","week","epoch"],updateStats.teamWin =='win' ?1:0,[SUM_MIN,1])//sum
          }
            
          
          //not needed for now
          //addStatNReward(thisGameStats,"damange_given",prefix,["xhour","day","week","epoch"],updateStats.damageSent,[0,1])//sum

          //only give if they qualified for ranking positions AKA kills exist
          if(qualifiedForRankStats){
            addStatNReward(thisGameStats,"rank_1",statsPrefix,["Xhour","day","week","epoch"],updateStats.place <= 1 ? 1:0,[SUM_MIN,1])//sum
            addStatNReward(thisGameStats,"rank_top_3",statsPrefix,["Xhour","day","week","epoch"],updateStats.place <= 3 ? 1:0,[SUM_MIN,1])//sum
          }else{
            log(CLASSNAME,"--",METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName
              ,"addStat ","rank_1,rank_top_3",updateStats.playerType ," had ",updateStats.kills," kills, not giving them a rank score","qualifiedForRankStats",qualifiedForRankStats);
          }

          //addStat(thisGameStats,"placedTop3","level_any",["hourly","daily","weekly"],1,[0,1])//makes no sense when not filled with people
          //addStat(thisGameStats,"completed","level_any",["daily","week","epoch"],1,[0,1])
          //addStat(thisGameStats,"trk_feat_destroyed","level_any",["Xhour","day","week","epoch"],Math.min.apply(Math,updateStats.lapTimes)*workaroundScalar,[CONFIG.MAX_POSSIBLE_RACE_TIME*workaroundScalar + 1,1*workaroundScalar])
          //addStat(thisGameStats,"projectiles_fired","level_any",["Xhour","day","week","epoch"],Math.min.apply(Math,updateStats.lapTimes)*workaroundScalar,[CONFIG.MAX_POSSIBLE_RACE_TIME*workaroundScalar + 1,1*workaroundScalar])
          //projectiles_fired_level_any_epoch
          //boost_level_any_epoch
        }else{
          log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName
          ," did not complete battle. finish required stats not added","playedEnoughToSave",updateStats.playedEnoughToSave,thisGameStats)  
        }

        log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName, "thisGameStats",thisGameStats)
        let chunkStats:PlayFabServerModels.StatisticUpdate[] = []
        let statsCounter = 0
        let chunkCounter = 0
        //const promisesStats:Promise<any>[] = [];
        const promisesStats = new Promise<any>((mainResolve, reject) => {
          const statResults:PlayFabServerModels.UpdatePlayerStatisticsResult[] = [];
          const errors:any[] = [];
          (async () => {
            //for now not writing team user data, worried out performance/play fab limits
            if(writeUserData){
              log(CLASSNAME,roomId,METHOD_NAME,"writing user data per writeUserData",writeUserData, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"userData",userData)
              //must write it
              //moved UpdateUserReadOnlyData here so its sequential writes to avoid concurrent write errors to same player
              const updateReadOnlyData = await UpdateUserReadOnlyData(settings,
                {
                  // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
                  //CustomTags?: { [key: string]: string | null };
                  // Key-value pairs to be written to the custom data. Note that keys are trimmed of whitespace, are limited in size, and may
                  // not begin with a '!' character or be null.
                  Data: userData,
                  // Optional list of Data-keys to remove from UserData. Some SDKs cannot insert null-values into Data due to language
                  // constraints. Use this to delete the keys directly.
                  //KeysToRemove?: string[];
                  // Permission to be applied to all user data keys written in this request. Defaults to "private" if not set. private is only readable by player who owns the data
                  Permission: "private",
                  // Unique PlayFab assigned ID of the user on whom the operation will be performed.
                  PlayFabId: playFabId
                }
              ) 
            }else{
              log(CLASSNAME,roomId,METHOD_NAME
                , "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"NOT writing user data per writeUserData",writeUserData, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"userData",userData)
            }

            //promisesInner.push(updateReadOnlyData)
            //chunk it into 25 a peice
            for(let x =0;x<thisGameStats.length;x++){
              statsCounter++
              chunkStats.push(thisGameStats[x]);
              if(x==thisGameStats.length-1 || chunkStats.length >= 25){
                log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName,"calling....","chunkStats.length",chunkStats.length,"statsCounter",statsCounter,"vs",thisGameStats.length)
                
                try{
                  const updatePlayerStats = await UpdatePlayerStatistics(settings,
                    {
                      // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
                      //CustomTags?: { [key: string]: string | null };
                      // Indicates whether the statistics provided should be set, regardless of the aggregation method set on the statistic.
                      // Default is false.
                      //ForceUpdate?: boolean;
                      // Unique PlayFab assigned ID of the user on whom the operation will be performed.
                      PlayFabId: playFabId,
                      // Statistics to be updated with the provided values
                      Statistics: chunkStats
                    }
                  )
                  log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName, 'updatePlayerStats ', updatePlayerStats,"chunkStats.length",chunkStats.length,"statsCounter",statsCounter,"vs",thisGameStats.length)

                  statResults.push( updatePlayerStats )

                  await sleep(50)
                }catch(e){
                  log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName, 'updatePlayerStats ', e,"chunkStats.length",chunkStats.length,"statsCounter",statsCounter,"vs",thisGameStats.length)
                  errors.push(e)
                }

                chunkStats = []

                //promisesStats.push(updatePlayerStats)
              }
            }
            mainResolve( statResults )
          })()
        })//end promisesStats
  
        promisesInner.push(promisesStats)
        
        
        //all settled lets them all complete to ensure saved as much as possible
        Promise.allSettled( promisesInner ).then(()=>{
          
          log(CLASSNAME,roomId,METHOD_NAME, "playerType", updateStats.playerType, "id/name", updateStats.playFabId,updateStats.playerName
            , "promisesInner promised completed " , result)
          //console.log("start  " + 2, Date.now())
          //sleepLoop(2)
          //console.log("returned from " + 2, Date.now())


          results.endGameResult=gameEndResult

          mainResolve(results);
        })
        
    }).catch( (reason:any)=>{
      log(CLASSNAME,roomId,METHOD_NAME, "promisesInner promised FAILED " , reason)
    })
  })
  //promises.push( addCurrencyPromise )
  promises.push( getPlayerCombinedInfo );
  /*
  const allDonePromise = new Promise( function(resolve , reject ){

  }*/

  return Promise.allSettled( promises ).then(function(result){
    log(CLASSNAME,roomId,METHOD_NAME,"all promised completed " , result)
    return results;
  })
};

const reward_prefix = "rwd_"+"xmas22"
//will check if reward is active and add as a stat too
export function addStatNReward(thisGameStats:PlayFabServerModels.StatisticUpdate[],stat: string, prefix:string, statFrequency: string[], value: number,range:number[]) {
  const METHOD_NAME="addStatNReward"
  if(value === undefined || value < range[0] || value > range[1]){
    log(CLASSNAME,"--",METHOD_NAME,"addStat ",stat," out of range, not recording ",value,range);
    return
  }
  addStat(thisGameStats,stat,prefix,statFrequency,value,range)
  //TODO add a check if start tracking reward
  if(prefix == STATS_PLAYER_PREFIX){
    addStat(thisGameStats,stat,reward_prefix,["epoch"],value,range)
  }
}


export type GameEndResultTeamType={
  id:string
  name:string
  place: number
  score: number
}
export type GameEndTeamResult='win'|'lose'|'tie'
export type EndBattleUpdatePlayerStatsRequest= {

  levelName: string
  levelId:string

  playerName:string

  playerType:'player'|'team'

  playedEnoughToSave:boolean
  
  playFabId: string
  //totalTime: number
  //lapTimes: number[]
  place: number
  score: number
  team: GameEndResultTeamType
  teamWin: GameEndTeamResult
  kills: number
  deaths: number
  hits:number
  damageSent:number
  throws: number
  stayedTillEnd:boolean
  //mvp: boolean
  //playerCombinedInfo?: PlayFabServerModels.GetPlayerCombinedInfoRequest
}

export type GameEndResultStatsType={
  placed:number
  score:number
  teamWin:GameEndTeamResult
  team: GameEndResultTeamType
  kills:number 
  deaths:number 
  hits:number
  damageSent:number
  throws:number 
  //mvp:boolean //0 or 1
  stayedTillEnd:boolean
  //teams:[]
}


export type GameEndResultRewardsType={
  id:string
  name:string
  earned:boolean
  claimed:boolean
  claimDate:number
  earnedThisGame?:boolean //if true was earned this game
}

export type GameEndResultType={
  stats:GameEndResultStatsType
  rewards:GameEndResultRewardsType[]
}

export type EndBattleUpdatePlayerStatsResult= {
  playerCombinedInfo?: PlayFabServerModels.GetPlayerCombinedInfoResult
  endGameResult?: GameEndResultType
}
  