//import { player } from "./player"

import { REGISTRY } from "src/registry"

const sceneX = 10 * 16
const sceneZ = 6 * 16

const count = 100
let material = new Material()
material.albedoColor = Color4.Gray()
material.specularIntensity = 0
material.roughness = 1
material.metallic = 0

// for(let i=0; i< count; i++){

//     let sizeX = Math.random()*20
//     let sizeZ = Math.random()*20
//     let sizeY = Math.random()*30
    
//     let box = new Entity()
//     box.addComponent(new Transform({
//             position: new Vector3(sizeX + Math.random() * (sceneX-2*sizeX), sizeY/2, sizeZ + Math.random() * (sceneZ - 2*sizeZ)),
//             scale: new Vector3(sizeX, sizeY, sizeZ)
//         }))
//     box.addComponent(new BoxShape())
//     box.addComponent(material)
//     engine.addEntity(box)
// }

//export const modArea = new Entity()
export function initModeArea(){
  const modArea = new Entity()

  modArea.addComponent(
    new AvatarModifierArea({
      area: { box: new Vector3(20, 10, 20)},
      modifiers: [AvatarModifiers.DISABLE_PASSPORTS],
    })
  )
  modArea.addComponent(
    new Transform({
      position: new Vector3(0, 0, 0),
    })
  )
  engine.addEntity(modArea)
    
  class ModAreaUpdateSys {
    modAreaRef:Entity

    constructor(_modArea:Entity){
      this.modAreaRef = _modArea
    }
    update(dt:number){
        this.modAreaRef.getComponent(Transform).position.copyFrom(REGISTRY.player.cam.feetPosition)
    }
  }
  engine.addSystem(new ModAreaUpdateSys(modArea))
}