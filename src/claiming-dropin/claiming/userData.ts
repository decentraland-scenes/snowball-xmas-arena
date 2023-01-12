import { Realm } from '@decentraland/EnvironmentAPI';
import { UserData } from '@decentraland/Identity';
import * as userData from 'src/utils/userData';

export function getAndSetUserDataIfNullNoWait(){
  userData.getAndSetUserDataIfNullNoWait()
}

export function getUserDataFromLocal():UserData|null {
  return userData.getUserDataFromLocal()
}
export function getRealmDataFromLocal():Realm|null {

  return userData.getRealmDataFromLocal() 
}

export async function getAndSetUserData() {
  return userData.getAndSetUserData()
}

// fetch the player's realm
export async function setRealm() {
  userData.setRealm()
}