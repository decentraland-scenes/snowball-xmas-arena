//import { hideBehaviorCode, showBehaviorCode } from "./behaviorCode"

import { CommonResources } from "src/resources/common"
import { ClaimDataInst } from "./claimTypes"
import { CampaignSchedule } from "./schedule/claimSchedule"


export const sharedClaimBgTexture = 'textures/Background_Menu_02.png'

export const custUiAtlas = CommonResources.RESOURCES.textures.customAtlas.texture//new Texture('src/claiming-dropin/images/DispenserAtlas.png')

export const parcelSizeX = (16*5)
export const parcelSizeZ = 16*4

export const TRANSPARENT_texture = CommonResources.RESOURCES.textures.transparent.texture
 

export const TRANSPARENT_MATERIAL = new BasicMaterial()
TRANSPARENT_MATERIAL.texture = TRANSPARENT_texture
TRANSPARENT_MATERIAL.alphaTest = 1

//workaround moved here to avoid cyclic deps
//track dispensers by campaignId
export const dispenserInstRecord:Record<string,ClaimDataInst>={}
export const dispenserRefIdInstRecord:Record<string,ClaimDataInst[]>={}
export const dispenserSchedule = new CampaignSchedule()

