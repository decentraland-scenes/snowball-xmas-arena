import { isPreviewMode } from "@decentraland/EnvironmentAPI";
import { DispenserPos } from "./claiming-dropin/claiming/claimTypes";
import { ScenePOI, SceneVector3Type, UpdateType } from "./types/types";

//using search service
//https://github.com/decentraland/decentrally-service

const DEFAULT_ENV = "local";

const ParcelCountX:number = 10
const ParcelCountZ:number = 4


const PLAYFAB_ENABLED = false
const PLAYFAB_TITLE_ID: Record<string, string> = {
  local: "TODO",
  dev: "TODO",
  stg: "TODO",
  prd: "TODO",
};

const COLYSEUS_ENDPOINT_URL: Record<string, string> = {
  local: "ws://127.0.0.1:2567",
  dev: "TODO",
  stg: "TODO",
  prd: "TODO",
};

const AUTH_URL: Record<string, string> = {
  local: "http://localhost:5001",//only used if PLAYFAB_ENABLED
  localColyseus: "TODO",//TODO get io
  dev: "TODO",//TODO get io
  stg: "TODO",
  prd: "TODO",
};
 

 
const PLAYER_DATA_ENDPOINT_STATIC_PARAMS_VALS: Record<string, string> = {
  "local": "",
  "localColyseus": "",
  "dev": "",
  "stg": "",
  "prd": "",
  };

const ADMIN_WALLETS_ANYONE = [ 
  "any", //if set to any will allow anyone to see
];

const ADMIN_WALLETS_DEFAULT = [
  "ADMIN-WALLETS-HERE", //x
  "x", //x
  "xany", //if set to any will allow anyone to see
]; 

const ADMIN_WALLETS: Record<string, string[]> = { 
  local: ADMIN_WALLETS_ANYONE,//TODO get  
  localColyseus: ADMIN_WALLETS_ANYONE,//TODO get io
  dev: ADMIN_WALLETS_ANYONE,//TODO get io
  stg: ADMIN_WALLETS_DEFAULT,
  prd: ADMIN_WALLETS_DEFAULT,
};
 

const OFFICAL_START_TIME = Date.UTC(2022, 11, 19, 12+6, 0, 0)
const TESTING_START_TIME_OFFSET = 2000//someting short to see countdown
const GAME_ACTIVE_TIME_VALS: Record<string, number> = { 
    local: new Date(Date.now() + TESTING_START_TIME_OFFSET).getTime(), //Date.UTC(2022, 11, 19, 12+6, 0, 0)
    localColyseus: new Date(Date.now() + TESTING_START_TIME_OFFSET).getTime() ,//Date.UTC(2022, 11, 19, 12+6, 0, 0)
    dev: new Date(Date.now() + TESTING_START_TIME_OFFSET).getTime(), //Date.UTC(2022, 11, 19, 12+6, 0, 0)
    stg: OFFICAL_START_TIME,
    prd: OFFICAL_START_TIME
  };
   

const DEBUG_CLAIMING_FLAGS_VAL: Record<string, boolean> = {
    local: true,//for local testing if u need different value
    localColyseus: true,//TODO get io
    dev: true,//DEV/preview
    stg: false,//DEV/preview
    prd: false,//PROD/live use this for launch
  };

//const SERVICES_DOMAIN = AUTH_URL[DEFAULT_ENV]
//"http://localhost:5001"
// "https://decentrally-service.decentraland.net"

export class Config {
    ENV = DEFAULT_ENV;
    
    IN_PREVIEW = false; // can be used for more debugging of things, not meant to be enabled in prod

    DEBUG_SHOW_CONNECTION_INFO = false;
    DEBUG_SHOW_PLAYER_LOGIN_INFO = false;
    TEST_CONTROLS_ENABLE = true;
    ADMIN_WALLETS: string[]; //see #initForEnv
    TEST_CONTROLS_DEFAULT_EXPANDED = false; //if test controls expanded by default


    sizeX!:number
    sizeY!:number
    sizeZ!:number
    center!:Vector3
    centerGround!:Vector3
    
    //6PM GMT0
    GAME_ACTIVE_TIME= GAME_ACTIVE_TIME_VALS[DEFAULT_ENV]
    IS_GAME_LIVE:boolean = false
    GAME_NOT_ACTIVE_MSG:string = "Game Coming Soon!"

    initAlready:boolean = false 

    COLYSEUS_ENDPOINT_LOCAL = "see #initForEnv";
    COLYSEUS_ENDPOINT_NON_LOCAL = "see #initForEnv"; // prod environment
    //COLYSEUS_ENDPOINT = "wss://TODO"; // production environment

    GAME_LOBBY_ROOM_NAME = "custom_lobby";
    GAME_SNOWBALL_ROOM_NAME = "snowball_room";

    PLAYER_INSTANCE_CHECK_DATA_FREQ_MILLIS = 1000 / 12; // //Note: The Camera.instance data is updated at a throttled rate of 10 times per second so do it a little higher to ensure does not loose any
    SEND_GAME_DATA_FREQ_MILLIS = 1000 / 10; // doing 13 times a second or 76ms (100 or less is considered acceptable for gaming). best i could get locally was ~60ms
    ENTER_CAR_CHECK_FREQ_MILLIS = 1000 / 6; //x times a second, not sure that is needed, but incase they jump out
    GAME_RANK_SORT_FREQ_MILLIS = 1000 / 6; //6 times a second

    GROUND_THICKNESS = 0.3;
    showInivisibleGroundColliders = false;

    LOAD_MODELS_DURING_SCENE_LOAD_ENABLED = true;

    DEBUGGING_ENABLED = true;
    DEBUGGING_LOGS_ENABLED = true;
    DEBUGGING_UI_ENABLED = true;
    DEBUGGING_TRIGGERS_ENABLED = false; 
    DEBUGGING_TRIGGER_FIRE_ENABLED = false 
    DEBUGGING_TRIGGER_FIRE_DUMMY_OBJ_ENABLED = false
    DEBUGGING_TRIGGER_SNOWAREA_ENABLED = false 
    DEBUGGING_TRIGGER_SNOWAREA_DUMMY_OBJ_ENABLED = false

    DEBUGGING_TRIGGER_POWERUP_ENABLED = false 
    DEBUGGING_TRIGGER_POWERUP_DUMMY_OBJ_ENABLED = true
    
    DEBUGGING_LAG_TESTING_ENABLED = false; //will create a ghost image of the player to test lag correction
    DEBUG_SMALLER_AVATAR_HIDE_AREA = false; //how big will hide area to be, if true will be only around car so can see player otherwise
    DEBUGGING_ENEMY_COLLIDER_BOX_VISIBLE_ENABLED = false; //if enemy collider box is visible or not
  
    ENABLE_2D_UI = true

    LOGIN_ENDPOINT = "see #initForEnv";

    TRACK_FEATURE_SLOW_DOWN_RESPAWN = 30000; //long time
    TRACK_FEATURE_DEFAULT_RESPAWN = 3000; //short

    ITEM_RECHARGE_CHECK_FREQ_MILLIS = 1000 / 6; //6 times a second

    TEAM_BLUE_ID = "blue"
    TEAM_RED_ID = "red"

    TEAM_MAX_PER_TEAM = 5

    //TODO enable this, right now need to update server to know when to reset health
    TILE_ENABLE_RESPAWN = true 
    TILE_RESPAWN_TIME = 15000

    POWER_UP_RESPAWN_TIME = 60000//3000

    ALLOW_FRIENDLY_FIRE = false
    
    SNOWBALL_AUTO_COLLECT_ENABLED = true //collect will happen when standing in area
    SNOWBALL_MAX_AMOUNT = 10
    SNOWBALL_COOLDOWN_SECONDS = .75
    SNOWBALL_POWERUP_DURATION_SECONDS = 30
    //https://docs.decentraland.org/creator/development-guide/raycasting/
    //loss queue per ball
    //if true, use lossy queue per ball, rayCastId is undefined, "default" not sure what that does 
    SNOWBALL_USE_RAYCAST_ID_PER_BALL = false 
    
    //disabled for now since doing avatar swap but can be used for where would be triggered
    SNOWBALL_TRIGGER_EMOTES_ENABLED=false

    DEFAULT_LOBBY_SPAWN_POINT_RANGE = new ScenePOI({
        position: new SceneVector3Type([1,2],[1,1],[1,4])
    })

    //with how we compute latency do we need to fudge it anymore?
    //with avg latancey of ~160ms a value of 50 was about 1.5 car lengths behind real so trying 99
    //curious if it relates to how frequent we update server though that should be accounted for in the
    //end to end calculation
    //will be a fuge value added onto latancey calculated to account for other drift
    //maybe better name LATENCY_MISC_FACTOR
    LATENCY_MISC_FACTOR = 99; //millis
    //how many latency datapoints to keep and average them
    LATENCY_AVERAGE_WINDOW_SIZE = 20; //try to keep 1 second.  assume latency is ~100ms 20 would be 2 seconds
    //works with how we lerp.  since we lerp fast when far, slow when near target pos. maybe we assume latency a little higher so it
    //pushes a little closer to player better
    LATENCY_LEADING_FACTOR = 1.2; //knowing there is lag + we lerp. consider lerping ahead of likely position

    ENABLE_DEBUGGER_BREAK_POINTS = true; //change to false to force all debugger break points to off

    PLAYFAB_ENABLED: boolean; //see #initForEnv
    PLAYFAB_TITLEID = "see #initForEnv";

    GAME_LEADEBOARD_MAX_RESULTS = 10;
    //need to give playfab time to get updated before calling
    GAME_LEADEBOARD_END_GAME_RELOAD_DELAY_MILLIS = 1000;

    ACTIVATE_PLAYER_HIT_UPDATE_TYPE:UpdateType = 'server'
    ACTIVATE_PLAYER_DIE_UPDATE_TYPE:UpdateType = 'server'

    REWARD_BUTTON_ENABLED = true
    //START claiming/dispensers
    CLAIM_TESTING_ENABLED = DEBUG_CLAIMING_FLAGS_VAL[DEFAULT_ENV]
    CLAIM_DO_HAS_WEARABLE_CHECK = false
    CLAIM_DATE_TESTING_ENABLED = DEBUG_CLAIMING_FLAGS_VAL[DEFAULT_ENV]
    DISPENSER_POSITIONS:DispenserPos[] = [] 
    //END claiming/dispensers
    
    initForEnv() {
        if(this.initAlready) return;

        log('stage',"initConfig() running with " + DEFAULT_ENV)

        const env = DEFAULT_ENV;

        this.COLYSEUS_ENDPOINT_LOCAL = COLYSEUS_ENDPOINT_URL[env]
        this.COLYSEUS_ENDPOINT_NON_LOCAL = COLYSEUS_ENDPOINT_URL[env]; // prod environment
        this.PLAYFAB_ENABLED = PLAYFAB_ENABLED
        this.PLAYFAB_TITLEID = PLAYFAB_TITLE_ID[env]
        this.LOGIN_ENDPOINT = AUTH_URL[env] + '/player/auth' + PLAYER_DATA_ENDPOINT_STATIC_PARAMS_VALS[env]
        this.ADMIN_WALLETS = ADMIN_WALLETS[env]

        this.sizeX = ParcelCountX*16
        this.sizeZ = ParcelCountZ*16 
        this.sizeY = (Math.log((ParcelCountX*ParcelCountZ) + 1) * Math.LOG2E) * 20// log2(n+1) x 20 //Math.log2( ParcelScale + 1 ) * 20
        this.center = new Vector3(this.sizeX/2,this.sizeY/2,this.sizeZ/2)
        this.centerGround = new Vector3(this.sizeX/2,0,this.sizeZ/2)
    
        this.initAlready = true

        
    }
    ////.io (development), .net (staging), and .org (production).
    getAuthEnv() {
        if (this.LOGIN_ENDPOINT.indexOf("localhost") > -1 || this.LOGIN_ENDPOINT.indexOf("127.0.0.1") > -1) {
            return "LOCAL";
        }
        if (this.LOGIN_ENDPOINT.indexOf(".io") > -1) {
            return "DEV";
        }
        if (this.LOGIN_ENDPOINT.indexOf(".net") > -1) {
            return "STG";
        }
        if (this.isAuthEnvProd()) {
            return "PROD";
        }
        log("getAuthEnv unrecognized env", this.LOGIN_ENDPOINT);
    }

    isAuthEnvProd() {
        if (this.LOGIN_ENDPOINT.indexOf(".org") > -1) {
            //org is the external facing cloudflare end point
            return true;
        }
        return false;
    }

    getAuthEnvSingleLetter() {
        return this.getAuthEnv().substr(0, 1);
    }
}

export const CONFIG = new Config();
CONFIG.initForEnv();

export function initConfig(){
    
}

//set in preview mode from env, local == preview
isPreviewMode().then(function (val: boolean) {
    setInPreview(val);
});

export function setInPreview(val: boolean) {
    log("setInPreview " + val);
    CONFIG.IN_PREVIEW = val;

    //var console: any
}
