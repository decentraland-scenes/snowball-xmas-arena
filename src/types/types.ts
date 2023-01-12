import { GetPlayerCombinedInfoResultPayload } from "src/playfab_sdk/playfab.types";

export interface NoArgCallBack {
	() : void;
}


export type BallType = 'normal'|'yellow'|'empty'


export type CarDataRaceType = 'racing'|'snowball'

export type UpdateType = 'server'|'local'

export type ScenePOIType={
	name?: string
	type?: string
	default?: boolean
	position: SceneVector3Type<number|number[]>
	cameraLookAt?: Vector3
}

export class ScenePOI{
	name?: string
	type?: string
	default?: boolean
	position: SceneVector3Type<number|number[]>
	cameraLookAt?: Vector3
  
	constructor(args:ScenePOIType){
	  if(args && args.position) this.position = args.position
	  if(args && args.default !== undefined) this.default = args.default
	  if(args && args.type !== undefined) this.type = args.type
	  if(args && args.name !== undefined) this.name = args.name
	  if(args && args.cameraLookAt !== undefined) this.cameraLookAt = args.cameraLookAt
  
	}
	
	toTransformConstructorArg(){
	  return {position : this.position.toCenterVector3()}
	}
  }
  
export class SceneVector3Type<T extends number|number[]>  {
	x:T
	y:T
	z:T
  
	_cachedFixedPosition:Vector3
	
	constructor(x:T,y:T,z:T){
	  this.x = x
	  this.y = y
	  this.z = z
	}
  
	toCenterVector3():Vector3{
	  const x:number = this.findCenter(this.x)
	  const y:number = this.findCenter(this.y)
	  const z:number =this.findCenter(this.z)
  
	  return new Vector3(x,y,z)
	}
  
	randomVector3():Vector3{
		const x:number = this.random(this.x)
		const y:number = this.random(this.y)
		const z:number =this.random(this.z)
		return new Vector3(x,y,z)
	  }

	random(val:T):number{
		const retVal = Array.isArray(val) ? (Math.random() * (val[1]-val[0]) + val[0] ) : val
		return retVal as number
	}
	findCenter(val:T):number{
	  return Array.isArray(val) ? (val[0] + val[1])/2 : val
	}
	copyFrom(src:Vector3){
	  if(Array.isArray(this.x)){
		this.x = [src.x] as T
	  }else{
		this.x = src.x as T
	  }
	}
  }
  

export enum RewardType {
	play = 'play',
	team = 'team',
	top3 = 'top3',
	top1 = 'top1',
	ratio = 'ratio'
}
  
  

export interface IRewardsPrompt{
	container:UIContainerRect

	items:any
	//itemList:RewardItemContainer[]


	show():void;

	hide():void;

	setReward(reward:RewardType, amount:number):void;


	updateReward(reward:RewardType):void;
	updateRewards(playerFabUserInfo: GetPlayerCombinedInfoResultPayload):void;
}