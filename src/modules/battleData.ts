

export class BattleData {
  //numberOfPlayers:number
  //ranking:number //TODO move to player ?

  //id of the level being played
  id: string;
  name: string;

  maxPlayers: number; //does this belong here?
  minTotalTeamPlayers:number
  totalPlayers: number; //total players
  maxTotalTeamPlayers: number;//maxTotalTeam players

  //nextCheckpointIndex:number
  started: boolean;
  ended: boolean;
  startTime: number;
  endTime: number;

  //lap:number //TODO move to player ?
  //currentCheckpointIndex:number  //TODO move to player ?

  constructor() {
    this.reset();
  }
  reset() {
    this.id = "Demo1";
    this.name = "Snowball Battle"//"_Untitled Race_" + this.id;
    this.started = false;
    this.ended = false;
    this.startTime = -1;
    this.maxPlayers = -1;
    //this.numberOfPlayers = 1
    //this.ranking = 0

  }
  startRace() {
    this.started = true;
    this.startTime = Date.now();
  }
  endRace() {
    this.started = false;
    this.ended = true;
    this.endTime = Date.now();
  }

  init() {
    
  }
}


//const DEBUGGING_ENABLED = CONFIG.DEBUGGING_ENABLED
