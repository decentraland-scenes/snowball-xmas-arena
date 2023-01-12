//cannot import this or will cause cylic depedency
//import { CONFIG, initConfig } from "src/config"

//import { CONFIG } from "src/config"


//initConfig()  
 

export function initClaimConfig(){
  
}

const PROD_PARCHUTE_CAMP_KEY = "PROVIDE_PRODUCTION_KEY_HERE"
const PROD_PARCHUTE_CAMP_KEY_KRAKEN = "PROVIDE_PRODUCTION_KEY_HERE"


function toStringURLArray(wearableInstArr: WearableEnumInst[]): string[] {
  const urnArr: string[] = []
  for (const p in wearableInstArr) {
    const urn = wearableInstArr[p].urn
    if (urn !== undefined) {
      urnArr.push(urn)
    }
  }
  return urnArr
}

export type WearableEnumConstructorArg = {
  address?: string
  urn?: string
  name?: string
  itemId?: string
}
export class WearableEnumInst {
  name?: string
  address?: string
  urn?: string
  itemId?: string

  constructor(args: WearableEnumConstructorArg) {
    if (args && args.name) this.name = args.name
    if (args && args.address) this.address = args.address
    if (args && args.itemId) this.itemId = args.itemId
    if (args && args.urn) this.urn = args.urn
    if (this.address && this.itemId && this.urn) {
      if (this.urn.indexOf(this.address + ":" + this.itemId)) {
        log("WARNING address + itemId vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
        log("WARNING address + itemId vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
        log("WARNING address + itemId vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
      }
    } else if (this.address && this.urn) {
      if (this.urn.indexOf(this.address)) {
        log("WARNING address  vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
        log("WARNING address  vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
        log("WARNING address  vs urn missmatch!!", this.urn, "vs", this.address, this.itemId, "for", this.name)
      }
    }
  }
}
//json is json copied from reward server UI
function createWerableEnumInst(json:{collectionAddress:string,collectionName:string,itemName:string,itemId:string,rarity:string}){
  return new WearableEnumInst({ name: json.itemName, address: json.collectionAddress, itemId: json.itemName, urn: 'urn:decentraland:matic:collections-v2:'+json.collectionAddress+':'+json.itemId+'' })
}
export class WearableEnum {
  //0 is bucket hat
  //2 is raincoat

  static PLACEHOLDER_TODO_NEED_ACTUAL_WEARBLE_DATA_HERE = new WearableEnumInst({ name: "PLACEHOLDER_TODO_NEED_ACTUAL_WEARBLE_DATA_HERE", address: "0xa4a345afb8fa378cdabc68e83e1a578c810f0abb", itemId: "5", urn: 'urn:decentraland:matic:collections-v2:0xa4a345afb8fa378cdabc68e83e1a578c810f0abb:5' })
  static PANTS_ADDRESS = new WearableEnumInst({ name: "polygon pants", address: "0xa4a345afb8fa378cdabc68e83e1a578c810f0abb", itemId: "5", urn: 'urn:decentraland:matic:collections-v2:0xa4a345afb8fa378cdabc68e83e1a578c810f0abb:5' })
  static PARCEL_WEARABLE_URN = new WearableEnumInst({ name: "parcel goggles", address: "0x26676a456bca88e418f9ea4b33a707364c0b5876", itemId: "1", urn: 'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:1' })
  static PARCEL_WEARABLE_SUIT_URN = new WearableEnumInst({ name: "parcel suit", address: "0x26676a456bca88e418f9ea4b33a707364c0b5876", itemId: "1", urn: 'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:1' })


  //{"collectionAddress":"0x6804ac297f50a099c454a1d3cef2e5a97ddb93f2","collectionName":"Party Degens","itemName":"Woodstock 3.0","itemId":"0","rarity":"epic"}
  static PLAY_GAMES = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Reindeer Helmet","itemId":"1","rarity":"common"})
  static WINNING_TEAM = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Snowball Xmas Pants ","itemId":"5","rarity":"common"})
  static WINNING_TEAM_RED = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Santa Vest ","itemId":"2","rarity":"uncommon"})
  static WINNING_TEAM_BLUE = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Krampus Sweater","itemId":"0","rarity":"uncommon"})
  static RANK_TOP3 = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Snowball Fight Boots ","itemId":"3","rarity":"rare"})
  static RANK1 = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Xmas Jacket ","itemId":"4","rarity":"rare"})
  static PLAY_DAYS = createWerableEnumInst({"collectionAddress":"0x304a2d14b22801dafee057629627d5c51ddbaa8f","collectionName":"Snowball Fight - Xmas 2022","itemName":"Snowball Xmas Pants ","itemId":"5","rarity":"common"})

  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 Symbiotic Hat","itemId":"18","rarity":"legendary"}

  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 T-Shirt","itemId":"1","rarity":"common"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 T-Shirt Day 1","itemId":"3","rarity":"common"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 T-Shirt Day 2","itemId":"4","rarity":"common"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 T-Shirt Day 3","itemId":"5","rarity":"common"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 T-Shirt Day 4","itemId":"6","rarity":"common"}
  static MVMF_SHIRT_ALL_DAY= new WearableEnumInst({ name: "MVMF22 T-Shirt", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "1", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:1' })
  static MVMF_SHIRT_D1 = new WearableEnumInst({ name: "T-Shirt Day 1", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "3", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:3' })
  static MVMF_SHIRT_D2 = new WearableEnumInst({ name: "T-Shirt Day 2", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "4", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:4' })
  static MVMF_SHIRT_D3 = new WearableEnumInst({ name: "T-Shirt Day 3", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "5", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:5' })
  static MVMF_SHIRT_D4 = new WearableEnumInst({ name: "T-Shirt Day 4", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "6", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:6' })

  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 White Rabbit Earphones","itemId":"9","rarity":"uncommon"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 White Rabbit Legs","itemId":"11","rarity":"rare"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 White Rabbit Shoes","itemId":"12","rarity":"uncommon"}
  //{"collectionAddress":"0x956b8d57066fc3d2562de22efd63624a1ba56e35","collectionName":"Metaverse Music Festival 2022","itemName":"MVMF22 White Rabbit Coat","itemId":"8","rarity":"uncommon"}
  static MVMF_WHITE_RABBIT_D1 = new WearableEnumInst({ name: "MVMF22 White Rabbit Earphones", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "9", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:9' })
  static MVMF_WHITE_RABBIT_D2 = new WearableEnumInst({ name: "MVMF22 White Rabbit Legs", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "11", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:11' })
  static MVMF_WHITE_RABBIT_D3 = new WearableEnumInst({ name: "MVMF22 White Rabbit Shoes", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "12", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:12' })
  static MVMF_WHITE_RABBIT_D4 = new WearableEnumInst({ name: "MVMF22 White Rabbit Coat", address: "0x956b8d57066fc3d2562de22efd63624a1ba56e35", itemId: "8", urn: 'urn:decentraland:matic:collections-v2:0x956b8d57066fc3d2562de22efd63624a1ba56e35:8' })
 
  //https://peer-lb.decentraland.org/lambdas/collections/contents/urn:decentraland:matic:collections-v2:0xaca87498d8eb13c1209373bf5bfcf98a55c24b3a:1/thumbnail
  static ARTNET_HAT_URN = new WearableEnumInst({ name: "Artnet Hat", address: "0xaca87498d8eb13c1209373bf5bfcf98a55c24b3a", itemId: "1", urn: 'urn:decentraland:matic:collections-v2:0xaca87498d8eb13c1209373bf5bfcf98a55c24b3a:1' })
  
}

const dcl_artweek={
  "refId": "dcl_artweek",
  "campaignId": "PROVIDE PRODUCTION KEY HERE",
  "campaignKey": "PROVIDE PRODUCTION KEY HERE"
}
const dcl_artweek_px = {
  "refId": "dcl_artweek_px",
  "campaignId": "PROVIDE PRODUCTION KEY HERE",
  "campaignKey": "PROVIDE PRODUCTION KEY HERE"
}

const TEST_CAMPAIGN_ID = "PROVIDE_PRODUCTION_KEY_HERE"
const TEST_CAMPAIGN_KEY = "PROVIDE_PRODUCTION_KEY_HERE"

const PROVIDE_PRODUCTION_KEY_HERE = "PROVIDE_PRODUCTION_KEY_HERE"
/**
 * artnet
 * burton
 * dcl_artweek
 * dcl_artweek_px
 */

//workaround will rewrite in booststrap
const CONFIG_CLAIM_TESTING_ENABLED = false



export type ClaimConfigInstType = {
  refId: string,
  //https://rewards.decentraland.org/campaign/?id=00453f70-d663-42bb-9c41-65f0c9c6ed37
  campaign: string,
  campaignKeys: Record<string,string> 
  wearableUrnsToCheck: string[]
}


export const ClaimConfig = { 
  //rewardsServer: CONFIG_CLAIM_TESTING_ENABLED ? 'https://rewards.decentraland.io' : 'https://rewards.decentraland.org',
  rewardsServer: CONFIG_CLAIM_TESTING_ENABLED ? 'https://rewards.decentraland.io' : 'https://rewards.decentraland.org',
  campaign: {

    PLAY_GAMES: {
      refId: "PLAY_GAMES",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE_PRODUCTION_KEY_HERE"
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.PLAY_GAMES
      ])
    },
    WINNING_TEAM: {
      refId: "WINNING_TEAM",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE PRODUCTION KEY HERE",
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.WINNING_TEAM
      ])
    },
    WINNING_TEAM_RED: {
      refId: "WINNING_TEAM_RED",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE_PRODUCTION_KEY_HERE"
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.WINNING_TEAM_RED
      ])
    },

    WINNING_TEAM_BLUE: {
      refId: "WINNING_TEAM_BLUE",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE_PRODUCTION_KEY_HERE"
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.WINNING_TEAM_BLUE
      ])
    },
    RANK_TOP3: {
        refId: "RANK_TOP3",
        //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
        campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
        campaignKeys: {
          key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
            : "PROVIDE_PRODUCTION_KEY_HERE"
        },
        wearableUrnsToCheck: toStringURLArray([
          WearableEnum.RANK_TOP3
        ])
      },
    RANK1: {
        refId: "RANK1",
        //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
        campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
        campaignKeys: {
          key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
            : "PROVIDE_PRODUCTION_KEY_HERE"
        },
        wearableUrnsToCheck: toStringURLArray([
          WearableEnum.RANK1
        ])
      },
    HIT_RATIO: {
      refId: "HIT_RATIO",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE PRODUCTION KEY HERE",
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.PLAY_DAYS
      ])
    },

    PLAY_DAYS: {
      refId: "PLAY_DAYS",
      //https://rewards.decentraland.org/campaign/?id=ce1acf52-bc28-47f7-b3a5-1fe6859e2f40
      campaign: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_ID : PROVIDE_PRODUCTION_KEY_HERE,
      campaignKeys: {
        key1: CONFIG_CLAIM_TESTING_ENABLED ? TEST_CAMPAIGN_KEY
          : "PROVIDE_PRODUCTION_KEY_HERE"
      },
      wearableUrnsToCheck: toStringURLArray([
        WearableEnum.PLAY_DAYS
      ])
    }
  }
}

export function updateConfigToTesting(testing:boolean){
  if(testing==false){
    return; 
  }
  log("updateConfigToTesting in testing rewriting all")
  ClaimConfig.rewardsServer = 'https://rewards.decentraland.io'
  for(const p in ClaimConfig.campaign){
    const obj = (ClaimConfig.campaign as any)[p]

    if(obj !== undefined){
      obj.campaign = TEST_CAMPAIGN_ID
      if(obj.campaignKeys !== undefined){
        for(const q in obj.campaignKeys){
          obj.campaignKeys[q] = TEST_CAMPAIGN_KEY
        }
      }
    }
  }
}
