export class Scene {
    sizeX:number = 10 * 16
    sizeZ:number = 6 * 16
    
    center:Vector3 = new Vector3(this.sizeX/2 ,0, this.sizeZ/2)
  
  
  }
  
  export const scene = new Scene()