import { FireCamp } from "./fireCamp";
import { SnowyArea } from "./snowyArea";
import { powerupController, PowerUpSpawner } from "./powerUpSpawner";

//#region COORDINATES
//L = Left, C = Center, R = Right, D = Down, U = Up
/*
const fireModelPosition_LD = new Vector3(50, 2, 70)
const fireModelPosition_LU = new Vector3(111, 2, 70)
const fireTriggerOfsetPosition_L = new Vector3(0, 0, 2)
const fireTriggerScale_L = new Vector3(16, 6, 11)

const fireModelPosition_CD = new Vector3(35, 2, 47)
const fireModelPosition_CU = new Vector3(125, 2, 47)
const fireTriggerOfsetPosition_C = new Vector3(0, 0, 1.5)
const fireTriggerScale_C = new Vector3(14, 6, 14)
*/

const snowyAreaPosition_LD = new Vector3(26.5, 2, 69.5)
const snowyAreaPosition_LU = new Vector3(133.5, 2, 69.5)
const snowyAreaScale_L = new Vector3(21, 2, 21)

const snowyAreaPosition_CD = new Vector3(52, 2, 58)
const snowyAreaPosition_CU = new Vector3(107, 2, 58)
const snowyAreaScale_C = new Vector3(21, 2, 12)

const snowyAreaPosition_RD = new Vector3(27.5, 2, 26.5)
const snowyAreaPosition_RU = new Vector3(132.5, 2, 26.5)
const snowyAreaScale_R = new Vector3(23, 2, 21)


const powerUpSpawnerPosition = new Vector3(80, 0, 38)
//#endregion

export function MapSetUp()
{
    const snowyArea_LD = new SnowyArea(snowyAreaPosition_LD, snowyAreaScale_L)
    const snowyArea_LU = new SnowyArea(snowyAreaPosition_LU, snowyAreaScale_L)
    const snowyArea_CD = new SnowyArea(snowyAreaPosition_CD, snowyAreaScale_C)
    const snowyArea_CU = new SnowyArea(snowyAreaPosition_CU, snowyAreaScale_C)
    const snowyArea_RD = new SnowyArea(snowyAreaPosition_RD, snowyAreaScale_R)
    const snowyArea_RU = new SnowyArea(snowyAreaPosition_RU, snowyAreaScale_R)

    //lobby
    //const snowyArea_lobbby1 = new SnowyArea(new Vector3(46,2,8), new Vector3(62, 2, 12))
    const snowyArea_lobbby2 = new SnowyArea(new Vector3(44,2,8), new Vector3(40, 2, 12))
    const snowyArea_lobbby3 = new SnowyArea(new Vector3(123,2,8), new Vector3(47, 2, 12))
    const snowyArea_lobbby4 = new SnowyArea(new Vector3(152,2,19), new Vector3(10, 2, 29))
    const snowyArea_lobbby5 = new SnowyArea(new Vector3(152,2,76), new Vector3(12, 2, 30))
    const snowyArea_lobbby6 = new SnowyArea(new Vector3(123,2,88), new Vector3(44, 2, 13))
    const snowyArea_lobbby7 = new SnowyArea(new Vector3(30,2,87), new Vector3(55, 2, 10))
    const snowyArea_lobbby8 = new SnowyArea(new Vector3(9,2,72), new Vector3(11, 2, 20))
    const snowyArea_lobbby9 = new SnowyArea(new Vector3(8,2,22), new Vector3(14, 2, 24))


    const powerUpSpawner_C = powerupController.createPowerUp(powerUpSpawnerPosition)
}