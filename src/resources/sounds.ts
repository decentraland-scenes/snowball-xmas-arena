import * as utils from "@dcl/ecs-scene-utils";
import { REGISTRY } from "src/registry";
//import { Level } from "src/og-decentrally/tracks/levelManager";
import { AbstractSpawner } from "../utils/spawner";

const menuUpClip = new AudioClip("");
export const menuUpSource = new AudioSource(menuUpClip);
menuUpSource.volume = 1;

const menuDownClip = new AudioClip("");
export const menuDownSource = new AudioSource(menuDownClip);
menuDownSource.volume = 1;

const menuScrollEndClip = new AudioClip("");
export const menuScrollEndSource = new AudioSource(menuScrollEndClip);
menuScrollEndSource.volume = 1;

const menuSelectClip = new AudioClip("");
export const menuSelectSource = new AudioSource(menuSelectClip);
menuSelectSource.volume = 1;

const menuDeselectClip = new AudioClip("");
export const menuDeselectSource = new AudioSource(menuDeselectClip);
menuDeselectSource.volume = 1;

//const refreshSuccessClip = new AudioClip("sounds/menu/refresh.mp3");
//export const refreshSource = new AudioSource(refreshSuccessClip);
//refreshSource.volume = 1;

const menuErrorClip = new AudioClip("");
export const menuErrorSource = new AudioSource(menuErrorClip);
menuErrorSource.volume = 0.8;

const themeArenaClip = new AudioClip(""); //FIXME
export const themeArenaSource = new AudioSource(themeArenaClip);
themeArenaSource.volume = 0.1;

// const themeVWTrack1Clip = new AudioClip('sounds/track1Music.mp3')
// export const themeVWTrack1ClipSource = new AudioSource(themeVWTrack1Clip)
// themeVWTrack1ClipSource.volume = 0.1

//tag:TODO-PLACE-AUDIO - better lobby music
const themeLobbyClip = new AudioClip("");
export const themeLobbyClipSource = new AudioSource(themeLobbyClip);
themeLobbyClipSource.volume = 0.3;

/*
const raceCountdownClip = new AudioClip('sounds/racing/raceCountdown.mp3')
export const raceCountdownSource = new AudioSource(raceCountdownClip)
raceCountdownSource.volume = 0.3*/

/*
const boostClip = new AudioClip('sounds/racing/boostClip2.mp3')
export const boostClipSource = new AudioSource(boostClip)
boostClipSource.volume = 0.8

const trapClip = new AudioClip('sounds/racing/trapClip.mp3')
export const trapClipSource = new AudioSource(trapClip)
trapClipSource.volume = 0.8

const skidClip = new AudioClip('sounds/racing/skidClip.mp3')
export const skidClipSource = new AudioSource(skidClip)
skidClipSource.volume = 0.8
*/
export const allMenuAudioSources: AudioSource[] = [
  menuUpSource,
  menuDownSource,
  menuScrollEndSource,
  menuSelectSource,
  menuDeselectSource,
  //refreshSource,
  menuErrorSource,
  themeLobbyClipSource
];
//const AUDIO_SOURCE_ENTITIES:Record<string,Entity>={}

export const raceSoundAudioSources: AudioSource[] = [themeArenaSource];
// export const raceSoundAudioSources: AudioSource[] = [themeVWTrack1ClipSource, themeDesertSource];
export const raceThemeSoundAudioSources: AudioSource[] = [
  //   themeVWTrack1ClipSource,
  themeArenaSource,
  themeLobbyClipSource
];

const FIRST_PERSON_VOLUME_ADJ=-.075
const FIRST_PERSON_VOLUME_ADJ_MIN = .02//if adjust goes below 0, set it just very low

function createEntitySound(name: string, audioClip: AudioClip | AudioSource, volume?: number) {
  const entSound = new Entity(name);
  entSound.addComponent(new Transform());
  if (audioClip instanceof AudioClip) {
    entSound.addComponent(new AudioSource(audioClip));
  } else {
    entSound.addComponent(audioClip);
  }
  entSound.getComponent(AudioSource).volume = volume !== undefined ? volume : 0.5;
  entSound.getComponent(AudioSource).loop = false;
  engine.addEntity(entSound);
  entSound.setParent(Attachable.AVATAR);//default, 

  return entSound;
}

//adding entities to engine so can play the audio, must be registered to engine thru entity
const themeDesertSoundEntity = createEntitySound("themeDesertSoundEntity", themeArenaSource);
// const themeVWTrack1SoundEntity = createEntitySound("themeVWTrack1SoundEntity", themeVWTrack1ClipSource);
const themeLobbySoundEntity = createEntitySound("themeLobbySoundEntity", themeLobbyClipSource);

type SoundAbstractSpawnerArgs = {
  audioClipUrl: string;
  clipLen: number;
  replayCooldown?: number;
  volume?: number;
};

class SoundAbstractSpawner extends AbstractSpawner {
  audioClipUrl: string;
  audioClip: AudioClip;
  /**
   * entire len of clip
   */
  clipLen: number;
  /**
   * cooldown till can be reused again (allows sounds to be played ontop of eachother)
   */
  replayCooldown: number;

  volume: number;

  constructor(name: string, maxPoolSize: number, options: SoundAbstractSpawnerArgs) {
    super(name, maxPoolSize);
    this.audioClipUrl = options.audioClipUrl;
    this.clipLen = options.clipLen;
    this.replayCooldown = options.replayCooldown;
    this.volume = options.volume;
  }

  playOnce(attachTo?:IEntity) {
    const ent = this.getEntityFromPool();
    if (ent) {
      let firstPerson = false
      let vol = this.volume
      if(REGISTRY.player !== undefined && REGISTRY.player.cameraMode === CameraMode.FirstPerson){
        firstPerson = true
        
      }
      if(attachTo !== undefined){
        if(ent.getParent() != attachTo) ent.setParent(attachTo)
      }else{
        if(ent.getParent() != Attachable.AVATAR) ent.setParent(Attachable.AVATAR)
        if(firstPerson){
          //adjust volume
          vol = Math.max(FIRST_PERSON_VOLUME_ADJ_MIN,this.volume+FIRST_PERSON_VOLUME_ADJ)//adjust volume
        }
      }
      
      log("SoundAbstractSpawner.playOnce", this.name, " from pool", ent.name,"pool size",this.entityPool.length,"firstPerson",firstPerson,"volume",this.volume,"adjustedVol",vol);
      //ADJUST VOLUME BASED ON CAMERA
      const audioSource:AudioSource = ent.getComponent(AudioSource)
      
      audioSource.volume = vol
      audioSource.playOnce();

      
      this.removeEntityIn(ent, Math.min(this.clipLen, this.replayCooldown));
    } else {
      log("SoundAbstractSpawner.playOnce", this.name, " failed no more in pool", ent,"pool size",this.entityPool.length);
    }
  }

  removeEntityIn(entity: Entity, timeMS: number) {
    entity.addComponentOrReplace(
      new utils.Delay(timeMS, () => {
        this.removeEntity(entity);
      })
    );
  }
}

export class SoundPool extends SoundAbstractSpawner {
  //overloading create entity
  createNewPoolEntity(cnt?: number) {
    const entSound = createEntitySound(this.name + ".pool-ent." + cnt, new AudioClip(this.audioClipUrl), this.volume);

    return entSound;
  }
}

export class SoundPoolMgr {
  //#region MUSIC
  mainMusic: SoundPool = new SoundPool("player.mainMusic", 1, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  winnersMusic: SoundPool = new SoundPool("player.winnersMusic", 1, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  losersMusic: SoundPool = new SoundPool("player.losersMusic", 1, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  clockTicking: SoundPool = new SoundPool("player.mainMusic", 1, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  //#endregion
                                  //tag:TODO-PLACE-AUDIO - PUT ACTUALY AUDIO LINKS HERE, NO WAVS
  //SFX
  //1
  destructibleHitSound: SoundPool = new SoundPool("ice.hit", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 0.7
  });
  //2
  destructibleBreakSound: SoundPool = new SoundPool("ice.destroyed", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  //3 fireSound in other sound.ts
  //4
  pickUpSound: SoundPool = new SoundPool("powerUp.pickUp", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200, 
    volume: 1
  });
  //1
  outOfAmmo: SoundPool = new SoundPool("player.outOfAmmo", 0, {
    audioClipUrl: "",
    clipLen: 1120,
    replayCooldown: 10,
    volume: 1
  });
  //2,3 in other sound.ts
  //4
  enemyHitSound: SoundPool = new SoundPool("player.enemyHit", 0, {
    audioClipUrl: "",
    clipLen: 1400,
    replayCooldown: 10,
    volume: 0.3
  });
  //5 this sound is for the player that has frozen
  enemyHitFeedbackSound: SoundPool = new SoundPool("player.enemyHitFeedBack", 0, {
    audioClipUrl: "",
    clipLen: 1400,
    replayCooldown: 10,
    volume: 0.5
  });
  //6 
  enemyKillSound: SoundPool = new SoundPool("enemy.enemyFrozen", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  //7 this sound is for the player that has frozen
  enemyKillFeedBackSound: SoundPool = new SoundPool("enemy.enemyFrozenFeedBack", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  //8
  playerHit: SoundPool = new SoundPool("player.playerHit", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });
  //9
  playerDie: SoundPool = new SoundPool("player.playerFrozen", 0, {
    audioClipUrl: "",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 1
  });

  //#region DECENTRALLY
  /*boost: SoundPool = new SoundPool("car.boost", 3, {
    audioClipUrl: "sounds/racing/boostClip2.mp3",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 0.7
  });
  trap: SoundPool = new SoundPool("car.trap", 3, {
    audioClipUrl: "sounds/racing/trapClip.mp3",
    clipLen: 1500,
    replayCooldown: 200,
    volume: 0.8
  });
  raceCountdown: SoundPool = new SoundPool("race.countdown", 0, {
    audioClipUrl: "sounds/racing/raceCountdown.mp3",//REMOVE ME!
    clipLen: 6000,
    replayCooldown: 6000,
    volume: 0.8
  });*/
  gameCountDownBeep: SoundPool = new SoundPool("game.countdown.ping", 0, {
    audioClipUrl: "",
    clipLen: 1000,
    replayCooldown: 300,
    volume: 0.8
  });
  //raceCountDownGo:SoundPool = new SoundPool( "race.countdown.ping.go",1,{audioClipUrl:'sounds/racing/raceCountdownBeep.mp3',clipLen:1000,replayCooldown:800,volume:.8} );
  gameStart: SoundPool = new SoundPool("game.go", 0, {
    audioClipUrl: "",
    clipLen: 2000,
    replayCooldown: 1000,
    volume: 1
  });
  //#endregion
}

export const SOUND_POOL_MGR = new SoundPoolMgr();

//WORKAROUND, must explicity set playing false
//if playOnce is called, on add to scene (again, it plays again)
export function stopAllSources(id: string, src: AudioSource[]) {
  log("audio.stopAllSources", id);
  for (const p in src) {
    if (src[p].playing) {
      log("audio.stopAllSources stopping", src[p].audioClip.url);
      src[p].playing = false;
    } else {
    }
  }
}
let themeLevelVolume=1
let themeSource:AudioSource
export function adjustLevelThemByCameraMode() {
  let volToUse = themeLevelVolume
  let firstPerson = false
  if(REGISTRY.player !== undefined && REGISTRY.player.cameraMode === CameraMode.FirstPerson){
    firstPerson = true
    volToUse = Math.max(FIRST_PERSON_VOLUME_ADJ_MIN,volToUse+FIRST_PERSON_VOLUME_ADJ)
  }
  if(themeSource !== undefined){
    themeSource.volume = volToUse
  }
  log("audio.adjustLevelThemByCameraMode", themeSource !== undefined ? themeSource.audioClip.url : themeSource, volToUse,"firstPerson",firstPerson,"volume",themeLevelVolume,"adjustedVol",volToUse);
}

export function playLevelTheme(level: string, volume?: number) {
  stopAllSources("playLevelTheme.raceThemeSoundAudioSources", raceThemeSoundAudioSources);

  let id = "unknown"; 

  //goal is to normalize volumes since each track may not have same sound level
  let tweakVolume = 0;

    id = level;
   

  //will try to play from local file

  let source;
  let defaultVolume = 0.07;
  
  switch (id) {
    // case "vw_track1":
    //   tweakVolume = -0.01; //little too loud, bring it down
    //   source = themeVWTrack1ClipSource;
    //   break;
    case "arena":
      tweakVolume = 0.02; //little to soft, bring it up
      source = themeArenaSource;
      break;
    case "lobby":
    default:
      source = themeLobbyClipSource;
      break;
  }
  if (source) {
    source.loop = true;
    source.playing = true;
    const vol = (volume !== undefined ? volume : defaultVolume) + tweakVolume;
    themeLevelVolume = vol
    themeSource = source
    let volToUse = vol
 
    source.volume = volToUse;

    adjustLevelThemByCameraMode()

    log("audio.playLevelTheme", id, volToUse,"volume",vol,"adjustedVol",volToUse);
  } else {
    log("audio.playLevelTheme", "DID NOT FIND", id);
  }
}
