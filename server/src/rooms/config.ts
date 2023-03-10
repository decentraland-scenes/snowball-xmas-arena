
const EPOCH_HOURS = 24 ;// 10/60 //1 minute

export class Config{
  DATE_FORMAT_PATTERN = 'YYYY-MM-DDTHH:mm:ss [GMT]Z'

 
  RECONNECT_WAIT_TIME = 1
  RECONNECT_WAIT_ENABLED = true

  MAX_WAIT_TO_START_TIME_MILLIS=parseInt(process.env.MAX_WAIT_TO_START_TIME_MILLIS)
  STARTING_COUNTDOWN_TIME_MILLIS = 3000 
  MAX_GAME_TIME_MILLIS = parseInt(process.env.MAX_RACE_TIME_MILLIS) //60 * 1000 * 6 //6 min max?
  MAX_POSSIBLE_RACE_TIME = 9999 * 1000 //9999 seconds

  //if true, will catch and log them but not bomb the game out
  SILENCE_UNHANDLED_ERRORS = process.env.SILENCE_UNHANDLED_ERRORS === undefined || (process.env.SILENCE_UNHANDLED_ERRORS !== undefined && process.env.SILENCE_UNHANDLED_ERRORS === 'true')

  BATTLE_MAX_WAIT_TO_START_TIME_MILLIS=parseInt(process.env.BATTLE_MAX_WAIT_TO_START_TIME_MILLIS)
  BATTLE_STARTING_COUNTDOWN_TIME_MILLIS = process.env.BATTLE_STARTING_COUNTDOWN_TIME_MILLIS !== undefined ? parseInt(process.env.BATTLE_STARTING_COUNTDOWN_TIME_MILLIS) : 3000
  BATTLE_MAX_GAME_TIME_MILLIS = parseInt(process.env.BATTLE_MAX_GAME_TIME_MILLIS) //60 * 1000 * 6 //6 min max?

  BATTLE_MAX_PLAYERS=process.env.BATTLE_MAX_PLAYERS !== undefined ? parseInt(process.env.BATTLE_MAX_PLAYERS) : 5
  BATTLE_MIN_PLAYERS=process.env.BATTLE_MIN_PLAYERS !== undefined ? parseInt(process.env.BATTLE_MIN_PLAYERS) : 3
  
  //repesenting the teams as players so can track stats
  BATTLE_TEAM_BLUE_PLAYFAB_PLAYER_ID=process.env.BATTLE_TEAM_BLUE_PLAYFAB_PLAYER_ID
  BATTLE_TEAM_RED_PLAYFAB_PLAYER_ID=process.env.BATTLE_TEAM_RED_PLAYFAB_PLAYER_ID

  BATTLE_PLAYFAB_ENABLED = process.env.BATTLE_PLAYFAB_ENABLED === undefined || (process.env.BATTLE_PLAYFAB_ENABLED !== undefined && process.env.BATTLE_PLAYFAB_ENABLED === 'true')
  BATTLE_PLAYFAB_TITLEID = process.env.BATTLE_PLAYFAB_TITLEID
  BATTLE_PLAYFAB_DEVELOPER_SECRET = process.env.BATTLE_PLAYFAB_DEVELOPER_SECRET

  BATTLE_MIN_KILLS_TO_RECORD_RANK_STATS = process.env.BATTLE_MIN_KILLS_TO_RECORD_RANK_STATS !== undefined ? parseInt(process.env.BATTLE_MIN_KILLS_TO_RECORD_RANK_STATS) : 1
  BATTLE_MIN_SHOTS_TO_CONSIDER_ACTIVE = process.env.BATTLE_MIN_SHOTS_TO_CONSIDER_ACTIVE !== undefined ? parseInt(process.env.BATTLE_MIN_SHOTS_TO_CONSIDER_ACTIVE) : 1
  
  //default is true
  BATTLE_ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS = process.env.BATTLE_ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS === undefined || (process.env.BATTLE_ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS !== undefined && process.env.BATTLE_ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS === 'true')
}

export const CONFIG = new Config()

//console.log("CONFIG",CONFIG)