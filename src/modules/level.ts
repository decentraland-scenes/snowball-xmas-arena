
const useStaticTrees = false
export const fenceGLB = new GLTFShape("models/BlockOut/fence.glb")
export const baseMapGLB = new GLTFShape("models/BlockOut/baseMap.glb")
export const treeGLB = useStaticTrees ? new BoxShape() : new GLTFShape("models/BlockOut/treesAnim.glb")
export const treeStaticGLB = useStaticTrees ? new GLTFShape("models/BlockOut/treesStatic.glb") : new BoxShape()
export const lobbyGLB = new GLTFShape("models/BlockOut/lobby.glb")
export const fireGLB = new GLTFShape("models/BlockOut/fireParticles.glb")
export const comingSoonGLB = new GLTFShape("models/BlockOut/comingSoon.glb")


export const level = new Entity()


level.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
level.addComponent(baseMapGLB)
engine.addEntity(level)



export const fence = new Entity()

fence.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
fence.addComponent(fenceGLB)
engine.addEntity(fence)
 


export const lobby = new Entity()

lobby.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
lobby.addComponent(lobbyGLB)
engine.addEntity(lobby)


//if using assign to sharedTreeEntity so debugger can toggle
export const treeAnim = new Entity()

treeAnim.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
treeAnim.addComponent(treeGLB)
if(treeAnim) engine.addEntity(treeAnim)



//if using assign to sharedTreeEntity so debugger can toggle
export const treeStatic = new Entity()

treeStatic.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
treeStatic.addComponent(treeStaticGLB)
if(useStaticTrees) engine.addEntity(treeStatic) 



export const signsAnim = new Entity()

signsAnim.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
signsAnim.addComponent(new GLTFShape("models/BlockOut/signsAnim.glb"))
engine.addEntity(signsAnim)



export const fire = new Entity()

fire.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
fire.addComponent(fireGLB)
engine.addEntity(fire)



export const comingSoon = new Entity()

comingSoon.addComponent(new Transform({
    position: new Vector3(0,0,0)
}))
comingSoon.addComponent(comingSoonGLB)
//engine.addEntity(comingSoon) //will be added by game.ts determinIfGameLive



//do not change this name!!!
export const sharedTreeEntity= useStaticTrees ? treeStatic : treeAnim 