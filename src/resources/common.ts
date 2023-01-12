
const INVISIBLE_MATERIAL = new BasicMaterial()
const INVISIBLE_MATERIAL_texture = new Texture('textures/transparent-texture.png')
INVISIBLE_MATERIAL.texture = INVISIBLE_MATERIAL_texture
INVISIBLE_MATERIAL.alphaTest = 1


const MATERIAL_CACHE:Record<string,ObservableComponent> = {}
const GLTF_CACHE:Record<string,GLTFShape> = {}
const FONT_CACHE:Record<string,Font> = {}


const  customAtlasTexture = new Texture('textures/snowballDialogAtlas.png' )
const newAtlasTexture = new Texture('textures/Atlases/atlas_v7.png') //new Texture('textures/Atlases/atlas_v5.png')
let enemyMarkerTexture = new Texture('textures/enemy_marker.png', {samplingMode: 2})
let markerMat = new Material()

markerMat.albedoTexture = enemyMarkerTexture
markerMat.alphaTexture = enemyMarkerTexture
markerMat.roughness = 1.0
markerMat.metallic = 0.0


let DEBUG_YELLOW = new Material()

DEBUG_YELLOW.albedoColor = Color4.Yellow()
//DEBUG_YELLOW.alphaTexture = enemyMarkerTexture
DEBUG_YELLOW.roughness = 1.0
DEBUG_YELLOW.metallic = 0.0

let DEBUG_RED = new Material()

DEBUG_RED.albedoColor = Color4.Red()
//DEBUG_RED.alphaTexture = enemyMarkerTexture
DEBUG_RED.roughness = 1.0
DEBUG_RED.metallic = 0.0


export class CommonResources {
    static RESOURCES = {
        models:{
          names:{
            
          },
          instances:{
            countdownFrame: new GLTFShape("models/countdown_frame.glb")
          }
        },
        textures: {
          //sprite_sheet: spriteSheetTexture,
          gameAtlas: {
            texture: newAtlasTexture,
            size:{sourceHeight:1,sourceWidth:1} //ImageSection
          },
          transparent: {
            texture: INVISIBLE_MATERIAL_texture,
            size:{sourceHeight:1,sourceWidth:1} //ImageSection
          },
          customAtlas: {
            texture: customAtlasTexture,
            size:{sourceHeight:1,sourceWidth:1} //ImageSection
          },
          closeMenuIconButton: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:335,sourceWidth:335,
              sourceTop:3141,sourceLeft:1199} //ImageSection
          },
          portraitRedTeam: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:381.8,sourceWidth:389.9,
              sourceTop:3476,sourceLeft:1205} //ImageSection
          },

          portraitBlueTeam: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:381.8,sourceWidth:389.9,
              sourceTop:2607,sourceLeft:1016} //ImageSection
          },
          snowballSlot: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:1,sourceWidth:1,
              sourceTop:0,sourceLeft:0} //ImageSection
          },
          snowballEmpty: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:1,sourceWidth:1,
              sourceTop:0,sourceLeft:0} //ImageSection
          },
          snowballWhite: {
            texture: newAtlasTexture,
            size:{
              sourceHeight:264,sourceWidth:264,
              sourceTop:1228,sourceLeft:1270,}
              //height: '120%', width: '120%' } //ImageSection
          },
          snowballYellow: { 
            texture: newAtlasTexture,
            size:{
              sourceHeight:264,sourceWidth:264,
              sourceTop:963,sourceLeft:1270} //ImageSection
          },
          roundedSquareAlpha: {
            texture: undefined //not used but easier to just leave undefined
           // size:{sourceHeight:1,sourceWidth:1} //ImageSection
          },
          /*
          iceDialogBG: {
            texture: new Texture ("textures/Background_Menu_02.png"),
            size:{
              sourceHeight:989,sourceWidth:1330,
              sourceTop:0,sourceLeft:0} //ImageSection
          },*/
          howToPlayTitle: {
            texture: new Texture ("textures/dialog-stuff/How_To_Play.png"),
            size:{
              sourceHeight:211,sourceWidth:839,
              sourceTop:0,sourceLeft:0} //ImageSection
          },
          howToPlay1: {
            texture: new Texture("textures/dialog-stuff/how-to-play-1.png"),
            size:{
              sourceHeight:989,sourceWidth:1330,
              sourceTop:0,sourceLeft:0} //ImageSection
          },
          howToPlay2: {
            texture: new Texture("textures/dialog-stuff/how-to-play-2.png"),
            size:{
              sourceHeight:989,sourceWidth:1330,
              sourceTop:0,sourceLeft:0} //ImageSection
          }
          
        },
        materials: {
          //sprite_sheet: spriteSheetMaterial
          transparent: INVISIBLE_MATERIAL,
          enemyMarkerTexture: enemyMarkerTexture,
          DEBUG_RED: DEBUG_RED,
          DEBUG_YELLOW: DEBUG_YELLOW
        },
        strings:{
           
        },
        images:{
          
        }
      }
}


export function getOrCreateGLTFShape(model:string):GLTFShape{
  let shape:GLTFShape = GLTF_CACHE[model]
  if(!shape){
    log("miss gltf cache",model)
    shape = new GLTFShape(model)
    GLTF_CACHE[model] = shape
  }else{
    log("hit gltf cache",model)
  }
  return shape;
}

export function getOrCreateMaterial(color:Color3,transparent:boolean):ObservableComponent{
  let colorCacheName = color.toHexString();// + "-" + colorOn.toHexString() + "-" + emissiveIntensity
  if(transparent){
      colorCacheName = "transparent"
  }
  let materialComp:ObservableComponent = MATERIAL_CACHE[colorCacheName]
  if(!materialComp){
      if(!transparent){
          const material = new Material()
          material.albedoColor = color
          //barItemMaterial.specularIntensity = 1
          material.roughness = 1
          material.metallic = 0.0
          MATERIAL_CACHE[colorCacheName] = material

          materialComp = material
      }else{
          //do stuff to make transparent
          let material = CommonResources.RESOURCES.materials.transparent
          MATERIAL_CACHE[colorCacheName] = material

          materialComp = material
      }
  }else{
    if(transparent){
      log("hit transparent cache")
    }
  }
  return materialComp;
}

export function getColorFromString(strColor:string,theDefault:Color3){
 
  let color:Color3 = theDefault;
  if(strColor!==null&&strColor!==undefined){
    if(strColor?.indexOf("#")==0){
      color = Color3.FromHexString(strColor)
    }else{
      switch(strColor?.toLowerCase()){
        case 'white': color = Color3.White(); break;
        case 'black': color = Color3.Black(); break;
        case 'blue': color = Color3.Blue(); break;
        case 'green': color = Color3.Green(); break;
        case 'red': color = Color3.Red(); break;
        case 'yellow': color = Color3.Yellow(); break;
        case 'purple': color = Color3.Purple(); break;
        case 'magenta': color = Color3.Magenta(); break;
        case 'gray': color = Color3.Gray(); break;
        case 'teal': color = Color3.Teal(); break;
      }
    }
  }
  //log("getColorFromString " + strColor + ";->" + color)
  return color;
}


export function getOrCreateFont(textFont:string):Font{
  let font = FONT_CACHE[textFont];
  if(!font){
    switch (textFont) {
      case 'SF':
      case 'SanFrancisco':
        font = new Font(Fonts.SanFrancisco)
        break
      case 'SF_Heavy': 
      case 'SanFrancisco_Heavy':
        font = new Font(Fonts.SanFrancisco_Heavy)
        break
      case 'LibSans':
      case 'LiberationSans':
        font = new Font(Fonts.LiberationSans)
        break
    }
    FONT_CACHE[textFont] = font
  }
  return font
}