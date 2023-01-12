import { Room } from 'colyseus.js';
import { LoginFlowCallback, LoginFlowResult } from 'src/login/login-types';
import { Player } from './modules/player';

import { IGame2DUI } from './modules/ui/iGame2DUI';
import { ISceneManager } from './snowball-fight/sceneManagerInterface';
import { IRewardsPrompt } from './types/types';

//backflips to avoid cyclic dependencies
//if i register things to this, namly
//interfaces in their own file, we can avoid cycles
export interface IRegistry{

	doLoginFlow?:(callback?:LoginFlowCallback,resultInPlace?:LoginFlowResult) => Promise<LoginFlowResult>
	Game_2DUI?:IGame2DUI
	showedHowToPlayAlready:boolean
	player?:Player
	onConnectActions?:(room:Room<any>,eventName:string)=>void
	SCENE_MGR?:ISceneManager
	getGameTime:()=>number
	rewardPrompt?:IRewardsPrompt
	setDialogBoxOpen?:(id:string,val:boolean) => void
	modArea?:Entity

}

export const REGISTRY:IRegistry = {

	showedHowToPlayAlready: false,
	getGameTime: ()=> { return Date.now() }
}

export function initRegistry(){

}