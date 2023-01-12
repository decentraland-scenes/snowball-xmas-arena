import { REGISTRY } from "src/registry"
import { scene } from "./sceneData"

const barrier = 16
const height = 50
const modArea = new Entity()



modArea.addComponent(
  new AvatarModifierArea({
    area: { box: new Vector3(scene.sizeX - 2 * barrier, 50, scene.sizeZ- 2*barrier)},
    modifiers: [
        AvatarModifiers.HIDE_AVATARS,
        AvatarModifiers.DISABLE_PASSPORTS],
        //excludeIds:
  })
)
modArea.addComponent(
  new Transform({
    position: new Vector3(scene.center.x, scene.center.y, scene.center.z),
  })
)
engine.addEntity(modArea)

 
REGISTRY.modArea = modArea

