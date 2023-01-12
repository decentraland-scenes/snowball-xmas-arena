import * as ui from '@dcl/ui-scene-utils'
import { signedFetch } from '@decentraland/SignedFetch'
import { ImageSection } from 'node_modules/@dcl/ui-scene-utils/dist/utils/types'
import resources,  { setSection } from 'src/dcl-scene-ui-workaround/resources'
import { custUiAtlas, dispenserInstRecord, dispenserRefIdInstRecord, dispenserSchedule } from 'src/claiming-dropin/claiming/claimResources'
import { CampaignSchedule } from 'src/claiming-dropin/claiming/schedule/claimSchedule'
import { CampaignDayType, ShowResultType } from 'src/claiming-dropin/claiming/schedule/types'
import { ChainId, ClaimCodes, ClaimConfigCampaignType, ClaimState, ClaimTokenRequestArgs, ClaimUIConfig, ClaimUiType, ItemData, RewardData } from './claimTypes'
import { getAndSetUserData, getRealmDataFromLocal, getUserDataFromLocal,setRealm } from 'src/claiming-dropin/claiming/userData'
import { WearableEnum, WearableEnumInst } from './loot-config'
import { closeDialogSound, openDialogSound } from '../booth/sounds'
import { CONFIG } from 'src/config'
import { testForExpression, testForWearable } from './utils'
     
//let bgTexture = new Texture('images/claim/WearablePopUp.png')

export let ClaimMessageConfig={
  OK_PROMPT_BIGGER_THREASHOLD: 95,//4
  OUT_OF_STOCK: "We apologize for the inconvenience.  All items of this type have been claimed.\nThanks for playing!"
}

//export let claimJson: any = null



export type ClaimTokenOptions={
  
}
export type HandleClaimTokenCallbacks={
  onAcknowledge?: (type:ClaimUiType,claimResult:ClaimTokenResult) => void
  //onOK?: (type:string,options:any) => void
  onOpenUI?: (type:ClaimUiType,claimResult?:ClaimTokenResult) => void
  onCloseUI?: (type:ClaimUiType,claimResult?:ClaimTokenResult) => void
}/*
export type HandleUICallbacks={
  onOK?: (type:string,options:any) => void
  onOpenUI?: (type:string,options:any) => void
  onCloseUI?: (type:string,options:any) => void
}*/
export class ClaimTokenResult { 

  json: any
  success: boolean = false
  exception: any
  claimCode: any
  requestArgs?: ClaimTokenRequestArgs

  getClaimCode(): any {
    const claimJson = this.json
    if(this.claimCode && this.claimCode !== undefined){
      return this.claimCode
    }else if (claimJson !== null && claimJson !== undefined) {
      return claimJson.code
    } else {
      return 'unknown'
    }
  }

  isClaimJsonSuccess() {
    return _isClaimJsonSuccess(this.json)
  }
  isClaimJsonOutOfStock(){
    return _isOutOfStock(this.json)
  }
}
export class ClaimTokenRequest{
  claimServer: string
  campaign: string
  campaign_key: string
  claimResult:ClaimTokenResult
  claimConfig?: ClaimConfigCampaignType
  
  constructor(args:ClaimTokenRequestArgs){
    this.claimServer = args.claimServer
    this.campaign = args.campaign
    this.campaign_key = args.campaign_key
    this.claimResult = new ClaimTokenResult()
    this.claimConfig = args.claimConfig
  }

  onFetchError(err:any){
    this.claimResult.success = false
    this.claimResult.exception = err
    
    /*
    let p = new ui.OkPrompt(
      'An unexpected error occurred',
      () => {
        p.close()
        //   representation.vanish()
        PlayCloseSound()
      },
      'OK',
      true
    )*/
  }

  async validate(){
    let userData = getUserDataFromLocal()
    if (userData === undefined) {
      userData = await getAndSetUserData()
    }
    if (!getRealmDataFromLocal()) {
      await setRealm()
    }
  
    if (userData === undefined || userData === null || !userData.hasConnectedWeb3) {
      this.claimResult.success = false
      this.claimResult.claimCode = ClaimCodes.BENEFICIARY_WEB3_CONNECTED
 
      this.onMissingConnectedWeb3()

      return false;
    }

    return true;
  }

  onMissingConnectedWeb3(){
    /*
    PlayOpenSound()
      let p = new ui.OkPrompt(
        'You need an in-browser Ethereum wallet (eg: Metamask) to claim this item.',
        () => {
          p.close()
          // representation?.vanish()
          PlayCloseSound()
        },
        'OK',
        true
      )*/
  }

  async processResponse(response:any){
    log('Reward received resp: ', response)

    if (!response || !response.text) {
      throw new Error('Invalid response')
    }
    let json: RewardData = await JSON.parse(response.text) //SIGNED FETCH VERSION
    
    log('Reward received json: ', json)

    //json = {ok:true,data:[]}
    //log('Reward changed  json: ', json)

    this.claimResult.json = json
    
    this.claimResult.success = this.claimResult.isClaimJsonSuccess()

  }

  async claimToken() {
    const METHOD_NAME = "claimToken"
    const claimResult = this.claimResult = new ClaimTokenResult() 
    this.claimResult.requestArgs = {claimServer:this.claimServer,campaign:this.campaign,campaign_key:this.campaign_key}
    
    let userData = getUserDataFromLocal()
    if (userData === undefined) {
      userData = await getAndSetUserData()
    }
    
    let playerRealm = getRealmDataFromLocal()
    if (playerRealm === undefined) {
      
      await setRealm()
      
      playerRealm = getRealmDataFromLocal()
    }
    

    const isValid = await this.validate()
    if(!isValid){
      return this.claimResult 
    }
  
    const url = this.claimServer + '/api/campaigns/' + this.campaign + '/rewards'
    log(METHOD_NAME,'sending req to: ', url) 
  
    
    let body = JSON.stringify({
      campaign_key: this.campaign_key,
      catalyst: playerRealm ? playerRealm.domain : "",
      beneficiary: userData ? userData.publicKey : "",
      //beneficiary: '0xe2b6024873d218B2E83B462D3658D8D7C3f55a18',
    })
  
    try {
      let response = null
      log(METHOD_NAME,'signedFetch')
      response = await signedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      })
      
      log(METHOD_NAME,'Reward received resp: ', response)
  
      this.processResponse(response)
    } catch (error) {
      log(METHOD_NAME,'error fetching from token server ', url)
  
      this.onFetchError(error)
      log(METHOD_NAME,"error",error)
  
    }
  
    return claimResult
  }
}


export async function checkIfPlayerHasAnyWearableByUrn(wearableUrnsToCheck:string[],force?:boolean) {
  const METHOD_NAME = "checkIfPlayerHasAnyWearableByUrn"
  const _force = force !== undefined && force == true
  log(METHOD_NAME,wearableUrnsToCheck,"_force",_force)
  if(!_force && !CONFIG.CLAIM_DO_HAS_WEARABLE_CHECK){
    log(METHOD_NAME,"CONFIG.CLAIM_DO_HAS_CHECK returned false",wearableUrnsToCheck,"force",_force)
    return false;
  }
  let userData = getUserDataFromLocal()
  if (userData === undefined) {
    userData = await getAndSetUserData()
  }
  if (!getRealmDataFromLocal()) {
    await setRealm()
  }
  if(!userData){
    log("checkIfPlayerHasAnyWearableByUrn failed, missing userData!!!",userData)
    return false
  }
  
  let hasWearable = false
 
  //must cal this to get ALL
  //https://docs.decentraland.org/development-guide/user-data/ docs was not working for me
  const url =
    'https://peer.decentraland.org/lambdas/collections/wearables-by-owner/' +
    //'https://peer.decentraland.org/lambdas/profile/' +
    userData.userId 
  try { 
    log(METHOD_NAME,"checkIfPlayerHasWearable calling " + url)
    let response = await fetch(url)
    let json = await response.json()
    log(METHOD_NAME,'checkIfPlayerHasWearable Player progression: ', response.status, json)
   
    main:
    for (const p in json) {
      for(const q in wearableUrnsToCheck){
        //log(METHOD_NAME,json[p].urn,'vs',wearableUrnsToCheck[q]) 
        if( json[p].urn === wearableUrnsToCheck[q]){
          hasWearable = true
          break main
        }
      }
    }
  } catch {
    log(METHOD_NAME,'checkProgression error fetching from token server ', url)
  }

  log(METHOD_NAME,'checkIfPlayerHasWearable.returning',hasWearable,"checked for ",wearableUrnsToCheck)
  return hasWearable
}

export async function claimTokenAndHandle(args:ClaimTokenRequestArgs):Promise<ClaimTokenResult>{
  let claimResult = await claimToken( 
    {claimServer: args.claimServer, campaign:args.campaign,campaign_key:args.campaign_key} 
  )
  const claimUI = new ClaimUI()
  claimUI.handleClaimJson(claimResult,
      {
      onOpenUI:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on open",type)
      },
      onAcknowledge:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on ack",type)
      },
      onCloseUI:(type:ClaimUiType,claimResult?:ClaimTokenResult)=>{
        log("on close",type,claimResult)
      }
    })
  return claimResult
}
export async function claimToken( args:ClaimTokenRequestArgs ):Promise<ClaimTokenResult>{
  const claimReq = new ClaimTokenRequest(args)
  
  await claimReq.claimToken()

  return claimReq.claimResult
}



function _isOutOfStock(json: any) {
  return json && json.ok && json.data && !json.data[0] && !json.error
}

function _isClaimJsonSuccess(json: any) {
  //log("_isClaimJsonSuccess " ,json)
  var retVal = false
  if (json && json.ok) {
    retVal = true
  }
  log('_isClaimJsonSuccess ' + retVal, json)
  return retVal
}
function hasRefId(show: ShowResultType,claimConfig?:ClaimConfigCampaignType){
  if(!show || show.show === undefined || !claimConfig){
    log("hasRefId was null",show,claimConfig)
    return false
  } 

  const showToPlay:CampaignDayType = show.show

  
  for(const p in showToPlay.campaigns){
    const camp = showToPlay.campaigns[p]
    const inst = dispenserRefIdInstRecord[camp.refId]
    if(inst !== undefined && inst.length > 0){//inst.dispData.name == claimConfig.refId){
      for(const p in inst){
        if(inst[p].dispData.name == claimConfig.refId){
          log("hasRefId was found",inst,claimConfig)
          return true
        }
      }
      
    }
  }
  log("hasRefId","not found",claimConfig)
  return false;
}
/**
 * 
 * @param json 
 * @param code - can ovveride what is in json
 * @param onCompleteCallback 
 */
function _handleClaimJson(claimResult:ClaimTokenResult,claimUI:ClaimUI, callbacks?:HandleClaimTokenCallbacks,claimConfig?:ClaimConfigCampaignType):ui.CustomPrompt|ui.OkPrompt {
  const json=claimResult.json
  const overrideCode=claimResult.claimCode
  const error=claimResult.exception
  log("_handleClaimJson",json,overrideCode,callbacks)

  let returnVal:ui.OkPrompt|ui.CustomPrompt|undefined = undefined
  let p: ui.OkPrompt
 
/*
  claimResult.json.ok=false
  claimResult.success = false
  claimResult.claimCode = ClaimCodes.BENEFICIARY_NOT_CONNECTED
  claimResult.json.code = ClaimCodes.BENEFICIARY_NOT_CONNECTED
*/
  const showSchedule = dispenserSchedule

  claimUI.closeClaimInProgress()

  if (json && !json.ok) {
    PlayOpenSound()
    log('ERROR: ', json.code)
    let code = json.code
    if(overrideCode){
      code = overrideCode
    }
    let uiMsg = ''
    
    let tryAgainInMsg = ""
    switch (code) {
      case ClaimCodes.BENEFICIARY_INVALID:
      case ClaimCodes.BENEFICIARY_NOT_CONNECTED:
      case ClaimCodes.BENEFICIARY_POSITION:
        returnVal = claimUI.openNotOnMap(claimResult,callbacks)
        break
      case ClaimCodes.CAMPAIGN_UNINITIATED://'campaign_uninitiated':
      case ClaimCodes.CAMPAIGN_KEY_UNINITIATED://'campaign_key_uninitiated':
        uiMsg = 'This campaign has not started yet.'
        tryAgainInMsg = "This campaign has not started.\nTry back in "
        break
      case ClaimCodes.CAMPAIGN_FINISHED://'campaign_finished':
      case ClaimCodes.CAMPAIGN_KEY_FINISHED://'campaign_key_finished':  
        uiMsg = 'This campaign is over.'
        tryAgainInMsg = "Temporarily of stock.\nNext batch will be available in \n"
        break
      default:
        uiMsg = 'An unexpected error occurred: \n' + json.error
        break
    }

    if(showSchedule && tryAgainInMsg && tryAgainInMsg.length > 0){
      const date = new Date()
      
      const showMatch = showSchedule.findShowToPlayByDate( date )

      log("finished","showMatch",showMatch)
      //debugger
      if(showMatch.nextShow && hasRefId(showMatch.nextShow,claimConfig)){
        if(showMatch.nextShow.offset !== undefined){
          
          const min = showMatch.nextShow.offset/60
          const hours = showMatch.nextShow.offset/ (60*60)
          const minRounded = Math.ceil(min)
          let timeStr = minRounded + " minutes."
          if(hours >= 1){
            timeStr = hours.toFixed(1) + " hours."
          }
          uiMsg = tryAgainInMsg + timeStr
        }
      }
    }

    if(uiMsg.length > 0){
      returnVal = claimUI.openOKPrompt(uiMsg,ClaimUiType.ERROR,claimResult,callbacks)
    }
  }else if (_isOutOfStock(json)) {
    returnVal = claimUI.openOutOfStockPrompt(claimResult,callbacks)
  }else if (!json || !json.data[0]) {
    log('no rewards',overrideCode)
    switch (overrideCode) {
      case ClaimCodes.BENEFICIARY_WEB3_CONNECTED:
        returnVal = claimUI.openRequiresWeb3(claimResult,callbacks)
        break
      case ClaimCodes.ALREADY_HAVE_IT:
          returnVal = claimUI.openYouHaveAlready(claimResult,callbacks)
          break
      default:
        let msg = 'An unexpected error occurred, please try again.'
        if(error && error.message){
          msg += '\n' + error.message
        }
        returnVal = claimUI.openOKPrompt(msg,ClaimUiType.ERROR,claimResult,callbacks)
      
        break 
    }
  } else {
    switch (json.data[0].status) {
      case ClaimState.ASSIGNED:
      case ClaimState.SENDING:
      case ClaimState.SUCCESS:
      case ClaimState.CONFIRMED:
        returnVal= claimUI.openClaimUI(claimResult, callbacks)
        break
      case ClaimState.REJECTED:
        log('player not on map')
        returnVal= claimUI.openNotOnMap(claimResult, callbacks)
        break
      default:
        //   openClaimUI(json.data[0], representation)
        returnVal = claimUI.openClaimUI(claimResult, callbacks)
        break
    }
  }

  if(!returnVal){
    throw Error("someting bad happened. returnVal should not be null:"+returnVal) 
  }

  return returnVal
}


const claimConfigDefaults:ClaimUIConfig = {
  bgTexture: 'images/claim/WearablePopUp.png',
  claimServer: /*TESTING ? */'https://rewards.decentraland.io' /*:  'https://rewards.decentraland.org'*/ //default is non prod to avoid accidents
  ,resolveSourceImageSize:(data:ItemData)=>{return 512}
}

export class ClaimUI {

  lastUI?: ui.CustomPrompt|ui.OkPrompt
  claimUI?: ui.CustomPrompt//ui.CustomPrompt //see src/dcl-scene-ui-workaround/readme.md switch back to normal when fixed
  claimUIConfig:ClaimUIConfig = claimConfigDefaults
  claimConfig?:ClaimConfigCampaignType
  callbacks?:HandleClaimTokenCallbacks

  campaignSchedule?:CampaignSchedule

  claimInformedPending:boolean = false //to know if we showed claimInProgressUI already
  claimInProgressUI?:ui.OkPrompt

  UI_SCALE_MULT = 0.7

  constructor(claimUIConfig?:ClaimUIConfig,claimConfig?:ClaimConfigCampaignType){
    log("ClaimUI.constructor",claimUIConfig)
    this.setClaimUIConfig(claimUIConfig)
    this.claimConfig = claimConfig
  }

  setClaimUIConfig(claimUIConfig?:ClaimUIConfig){
    if(claimUIConfig) this.claimUIConfig = claimUIConfig
  }
  handleClaimJson(claimResult:ClaimTokenResult,callbacks?:HandleClaimTokenCallbacks) {
    this.lastUI = _handleClaimJson(claimResult, this, callbacks,this.claimConfig)
  }

  nothingHere(claimResult?:ClaimTokenResult,_callbacks?:HandleClaimTokenCallbacks){
    const callbacks = _callbacks !== undefined ? _callbacks : this.callbacks
    let p = new ui.OkPrompt(
      'Nothing here.  Keep looking.',
      () => {
        p.close()
        if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(ClaimUiType.NOTHING_TO_CLAIM,claimResult)
      },
      'OK',
      this.getOKPromptUseDarkTheme()
    )
    this.applyCustomAtlas(p)
    this.lastUI = p
    return p
  }
  openClaimInProgress(claimResult?:ClaimTokenResult,_callbacks?:HandleClaimTokenCallbacks){
    const callbacks = _callbacks !== undefined ? _callbacks : this.callbacks
    let p:ui.OkPrompt

    //show not working, so making new instance each time :(
    //for now make new one each time :(
    if(true){//this.claimInProgressUI === undefined ){
      p = new ui.OkPrompt(
        'Claim in progress',
        () => {
          p.close()
          log("close",callbacks)
          if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(ClaimUiType.CLAIM_IN_PROGRESS,claimResult)
        },
        'OK',
        this.getOKPromptUseDarkTheme()
      )
      this.applyCustomAtlas(p)

      this.claimInProgressUI = p
    }/*else{
      p = this.claimInProgressUI  
      log("showClaimPrompt openClaimInProgress.show",p.background.visible,this.claimInProgressUI.text.value)
      this.claimInProgressUI.text.value+="x"
      this.claimInProgressUI.show()
      log("showClaimPrompt openClaimInProgress.show.post",p.background.visible,this.claimInProgressUI.text.value)
    }*/

    this.lastUI = p


    return p
  }
  closeClaimInProgress(claimResult?:ClaimTokenResult,_callbacks?:HandleClaimTokenCallbacks){
    log("showClaimPrompt closeClaimInProgress")
    if(this.claimInProgressUI !== undefined ){
      this.claimInProgressUI.close()
    }
  }
  openYouHaveAlready(claimResult?:ClaimTokenResult,_callbacks?:HandleClaimTokenCallbacks){
    const callbacks = _callbacks !== undefined ? _callbacks : this.callbacks
    let p = new ui.OkPrompt(
      'You already have this wearable.',
      () => {
        p.close()
        log("close",callbacks)
        if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(ClaimUiType.YOU_ALREADY_HAVE_IT,claimResult)
      },
      'OK',
      this.getOKPromptUseDarkTheme()
    )
    this.applyCustomAtlas(p)
    this.lastUI = p
    return p
  }

  openOutOfStockPrompt(claimResult:ClaimTokenResult, _callbacks?:HandleClaimTokenCallbacks){
    const callbacks = _callbacks !== undefined ? _callbacks : this.callbacks
    let msg = ClaimMessageConfig.OUT_OF_STOCK
    
    //const waitForNext = false
    //TODO CONSIDER LOGIC FOR COME BACK TOMRROW vs just out of stock
    if(this.campaignSchedule){
      const date = new Date()
      
      const showMatch = this.campaignSchedule.findShowToPlayByDate( date )
 
      log("openOutOfStockPrompt","showMatch",showMatch)

      if(showMatch.nextShow && hasRefId(showMatch.nextShow,this.claimConfig)){
        if(showMatch.nextShow.offset !== undefined){

          const min = showMatch.nextShow.offset/60
          const hours = showMatch.nextShow.offset/ (60*60)
          const minRounded = Math.ceil(min)
          let timeStr = minRounded + " minute."
          if(hours >= 1){
            timeStr = hours.toFixed(1) + " hours."
          }
          msg = "Temporarily of stock.\nNext batch will be available in \n" + timeStr
        }else{
          //known future time
          //The dispenser has no more wearables to give for today.  Come
          msg = "Temporarily of stock.\nPlease check back later."
        }
      }
    }

    const p = this.openOKPrompt(msg,ClaimUiType.OUT_OF_STOCK,claimResult,callbacks)
    this.lastUI = p

    return p
  }

  openSuccessMsg(claimResult:ClaimTokenResult, callbacks?:HandleClaimTokenCallbacks){
    this.openClaimUI(claimResult,callbacks)
  }
  openNotOnMap(claimResult:ClaimTokenResult, callbacks?:HandleClaimTokenCallbacks){
    PlayOpenSound()
    const p = this.openOKPrompt('We can`t validate the authenticity of your request.  If you just arrived please wait a few moments and try again.',ClaimUiType.ERROR_NOT_ON_MAP,claimResult,callbacks)
    return p
  }
  openRequiresWeb3(claimResult:ClaimTokenResult, callbacks?:HandleClaimTokenCallbacks){
    const mmPrompt = new ui.CustomPrompt( this.getCustomPromptStyle() )
    this.applyCustomAtlas(mmPrompt)

      mmPrompt.addText(
        'A MetaMask Digital wallet\nis required to claim this token.',
        0,
        45,
        this.getCustomPromptFontColor(),
        20
      )
      mmPrompt.addButton(
        'GET MetaMask',
        -100,
        -100,
        () => {
          openExternalURL('https://metamask.io/')
        },
        ui.ButtonStyles.RED
      )
    
      mmPrompt.addButton(
        'Cancel'.toUpperCase(),
        100,
        -100,
        () => {
          PlayCloseSound()
          mmPrompt.hide()
          if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(ClaimUiType.REQUIRES_WEB3,claimResult)
        },
        ui.ButtonStyles.F
      )

      if(callbacks && callbacks.onOpenUI) callbacks.onOpenUI(ClaimUiType.REQUIRES_WEB3,claimResult)
      this.lastUI = mmPrompt

      return mmPrompt
  }

  getCustomPromptStyle(): ui.PromptStyles {
    return this.claimUIConfig.customPromptStyle ? this.claimUIConfig.customPromptStyle : ui.PromptStyles.DARKLARGE
  } 

  getCustomBGImageSection(): ImageSection {
    const style = this.getCustomPromptStyle()
    switch(style){
      case ui.PromptStyles.LIGHTLARGE: 
      case ui.PromptStyles.DARKLARGE: 
        return resources.backgrounds.promptLargeBackground
      default:
        return resources.backgrounds.promptBackground
    }
  }
  
  

  getCustomPromptFontColor(): Color4 | undefined {
    const style = this.getCustomPromptStyle()
    switch(style){
      case ui.PromptStyles.DARK: 
      case ui.PromptStyles.DARKLARGE: 
        return Color4.White()  
      default:
        return Color4.Black()
    }
  }

  getOKPromptUseDarkTheme(): boolean {
    const style = this.getCustomPromptStyle()
    switch(style){
      case ui.PromptStyles.DARK: 
      case ui.PromptStyles.DARKLARGE: 
        return true
      default:
        return false
    }
  }

  openOKPrompt(uiMsg:string,type:ClaimUiType,claimResult:ClaimTokenResult, callbacks?:HandleClaimTokenCallbacks): ui.OkPrompt | ui.CustomPrompt {
    PlayOpenSound()
    let result: ui.OkPrompt | ui.CustomPrompt

    if(uiMsg.length > ClaimMessageConfig.OK_PROMPT_BIGGER_THREASHOLD){

      //agePrompt = new CustomPrompt(RESOURCES.textures.uiPromptsWaterMarked.src,agePromptDimsSource.sourceWidth*promptScale,agePromptDimsSource.sourceHeight*promptScale)
      //agePrompt.background.source = RESOURCES.textures.uiPromptsWaterMarked

      //const custUiTexture = new Texture('images/DispenserAtlas.png')
      const mmPrompt = new ui.CustomPrompt( this.getCustomPromptStyle() )
      this.applyCustomAtlas(mmPrompt)
      
      result = mmPrompt 
        
        let height = 300/2 + 10
        if(uiMsg.length > 200){
          height = 300/2 - 50
        }
        
        const uiText = mmPrompt.addText(
          uiMsg,
          0,
          height,
          this.getCustomPromptFontColor(),
          20
        )

        uiText.text.width=350
        uiText.text.height=300
        uiText.text.textWrapping=true
        uiText.text.vAlign = 'center' 
        uiText.text.hAlign = 'center' 

        mmPrompt.addButton(
          'OK',
          0,
          -100,
          () => {
            mmPrompt.hide()
            //   representation.vanish()
            PlayCloseSound()
            if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(type,claimResult)
          },
          ui.ButtonStyles.E
        )
      
    }else{
        
        let p = new ui.OkPrompt(
        uiMsg,
        () => {
          p.close()
          //   representation.vanish()
          PlayCloseSound()
          if(callbacks && callbacks.onCloseUI) callbacks.onCloseUI(type,claimResult)
        },
        'OK',
        this.getOKPromptUseDarkTheme()
      )
      this.applyCustomAtlas(p)
      
      //p.background.width = 500

      result = p
    }
    if(callbacks && callbacks.onOpenUI) callbacks.onOpenUI(type,claimResult)
    this.lastUI = result
  
    return result
  
  }

  applyCustomAtlas(modal:ui.OkPrompt | ui.CustomPrompt){
    if(custUiAtlas !== undefined){
      modal.background.source
      
      modal.background.source = custUiAtlas

      if( modal instanceof ui.CustomPrompt){
        modal.texture = custUiAtlas
      }
    }
    /*setSection(mmPrompt.background, this.getCustomBGImageSection())
      mmPrompt.background.source
      mmPrompt.texture = custUiTexture
      mmPrompt.background.source = custUiTexture*/
  }
  
  //data: ItemData,
  openClaimUI(claimResult:ClaimTokenResult, callbacks?:HandleClaimTokenCallbacks):ui.CustomPrompt {
    const data: ItemData = claimResult.json.data[0]
    PlayOpenSound()

    if (this.claimUI && this.claimUI.background.visible) {
      this.claimUI.hide()
    }

    const offsetY = 40
    const UI_SCALE_MULT = this.UI_SCALE_MULT
    const claimUI = this.claimUI = new ui.CustomPrompt(//new ui.CustomPrompt(
      ui.PromptStyles.LIGHTLARGE,
      640 * (UI_SCALE_MULT + .1),
      512 * (UI_SCALE_MULT + .1)
    )
    //this.applyCustomAtlas(claimUI)
    //claimUI = new ui.CustomPrompt('images/WearablePopUp.png', 640, 512)
    
    if(callbacks && callbacks.onOpenUI) callbacks.onOpenUI(ClaimUiType.CLAIM_RESULT,claimResult)
    this.lastUI = claimUI
    
    if(this.claimUIConfig){
      let bgTexture = this.claimUIConfig.bgTextureInst
      if(!bgTexture && this.claimUIConfig.bgTexture){
        bgTexture = new Texture( this.claimUIConfig.bgTexture )
        this.claimUIConfig.bgTextureInst = bgTexture
      }

      claimUI.background.source = bgTexture
    }
 
    claimUI.background.sourceWidth = 1330//640
    claimUI.background.sourceHeight = 989//512
    claimUI.background.sourceTop = 0
    claimUI.background.sourceLeft = 0
    claimUI.background.opacity = 1 //want it solid
    
    const fontColor = Color4.White() //this.getCustomPromptFontColor()

    claimUI.addText(
      data.status == ClaimState.SUCCESS
        ? 'You now own this item!'
        : data.status == ClaimState.SENDING || ClaimState.CONFIRMED
        ? 'This item is on its way!'
        : 'This item will be sent to you soon!',
      0,
      (158+offsetY) * UI_SCALE_MULT,//188 * UI_SCALE_MULT,
      fontColor,
      34 * UI_SCALE_MULT
    )

    claimUI.addText(
      data.token,
      0,
      (118+offsetY) * UI_SCALE_MULT,
      fontColor,
      24 * UI_SCALE_MULT
    ) // wearable name

    let sourceSize = 512

    if( this.claimUIConfig.resolveSourceImageSize ) sourceSize = this.claimUIConfig.resolveSourceImageSize(data)
    
    //sourceSize = 1024
    ////get a diff backdrop black on black hard to see
    if(true){
      /*
      const backDrop = claimUI.addIcon(
        'images/TutorialImages_template.png',
        0,
        0 * UI_SCALE_MULT,
        180 * 180 * (UI_SCALE_MULT + .05) ,
        180 * 180 * (UI_SCALE_MULT + .05) ,
        {
          sourceHeight: 256,
          sourceWidth: 256,
          sourceLeft: 0,
          sourceTop: 0,
        }
      )
      backDrop.image.opacity = .8*/

      let shadow = new UIContainerRect(claimUI.background)
      shadow.hAlign = "center"
      shadow.vAlign = "center"
      shadow.width = 180 * (UI_SCALE_MULT + .05) 
      shadow.height = 180 * (UI_SCALE_MULT + .05)
      shadow.color = Color4.Black()
      shadow.opacity = .4
      shadow.positionX = 0
      shadow.positionY = 0
    }
    //setSection(backDrop.image,resources.backgrounds.NPCDialog)
    //https://peer-lb.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:0x016a61feb6377239e34425b82e5c4b367e52457f:1/thumbnail
    //"https://peer-lb.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:0x016a61feb6377239e34425b82e5c4b367e52457f:3/thumbnail"
    const wearalbeThumbnail = claimUI.addIcon(
      data.image,
      0,
      0 * UI_SCALE_MULT,
      180 * UI_SCALE_MULT,
      180 * UI_SCALE_MULT,
      {
        sourceHeight: sourceSize,
        sourceWidth: sourceSize,
        sourceLeft: 0,
        sourceTop: 0,
      }
    )

    wearalbeThumbnail.image.opacity = 1.1

    let okButton = claimUI.addButton(
      'OK',
      134 * UI_SCALE_MULT,
      -155 * UI_SCALE_MULT,
      () => {
        claimUI.hide()
        PlayCloseSound()
        claimUI.hide()
        if(callbacks && callbacks.onAcknowledge) callbacks.onAcknowledge(ClaimUiType.CLAIM_RESULT,claimResult)
        //   representation.openUi = false
      },
      ui.ButtonStyles.E
    )
    //   okButton.image.positionX = -100
    okButton.label.positionX = 30 * UI_SCALE_MULT
    okButton.image.width = 238 * UI_SCALE_MULT
    okButton.image.height = 64 * UI_SCALE_MULT
    if (okButton.icon) {
      okButton.icon.width = 36 * UI_SCALE_MULT
      okButton.icon.height = 36 * UI_SCALE_MULT
    }
    okButton.label.fontSize = 24 * UI_SCALE_MULT

    let txButton = claimUI.addButton(
      'Details'.toUpperCase(),
      -134 * UI_SCALE_MULT, 
      //-175 * UI_SCALE_MULT,
      -155 * UI_SCALE_MULT,
      () => {
        let baseUrl = this.claimUIConfig.claimServer
        if(claimResult && claimResult.requestArgs && claimResult.requestArgs.claimServer){
          baseUrl = claimResult.requestArgs.claimServer
        }
        openExternalURL(baseUrl + '/reward/?id=' + data.id)
      },
      ui.ButtonStyles.F
    )
    txButton.image.width = 238 * UI_SCALE_MULT
    txButton.image.height = 64 * UI_SCALE_MULT
    if (txButton.icon) {
      txButton.icon.width = 36 * UI_SCALE_MULT
      txButton.icon.height = 36 * UI_SCALE_MULT
    }
    txButton.label.fontSize = 24 * UI_SCALE_MULT
    txButton.label.positionX = 30 * UI_SCALE_MULT

    return claimUI
  }
}
export function openTxLink(chain_id: ChainId, transaction_hash: string) {
  switch (chain_id) {
    case ChainId.ETHEREUM_MAINNET:
      openExternalURL('https://etherscan.io/tx/' + transaction_hash)
      break
    case ChainId.ETHEREUM_ROPSTEN:
      openExternalURL('https://ropsten.etherscan.io/tx/' + transaction_hash)
      break
    case ChainId.MATIC_MAINNET:
      openExternalURL('https://polygonscan.com/tx/' + transaction_hash)
      break
    case ChainId.MATIC_MUMBAI:
      openExternalURL('https://mumbai.polygonscan.com/tx/' + transaction_hash)
      break
  }
}




export function PlayOpenSound() {
  openDialogSound.getComponent(AudioSource).playOnce()
}

export function PlayCloseSound() {
  closeDialogSound.getComponent(AudioSource).playOnce()
}



