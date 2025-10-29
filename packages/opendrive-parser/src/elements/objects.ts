import type { RawObject, RawObjects } from "../types/raw"
import arrayize from "../utils/arrayize"

export class Object {
  public id?: string
  public name?: string
  public s?: number
  public t?: number
  public zOffset?: number
  public hdg?: number
  public roll?: number
  public pitch?: number
  // public hOffset?: number
  public orientation?: string
  public type?: string
  public height?: number
  public width?: number
  public length?: number


  constructor(rawObject: RawObject) {
    this.id = rawObject.id
    this.name = rawObject.name
    this.type = rawObject.type
    this.s = Number(rawObject.s)
    this.t = Number(rawObject.t)
    this.zOffset = Number(rawObject.zOffset)
    this.hdg = Number(rawObject.hdg)
    this.roll = Number(rawObject.roll)
    this.pitch = Number(rawObject.pitch)
    this.orientation = rawObject.orientation
    this.height = Number(rawObject.height || 0)
    this.width = Number(rawObject.width)
    this.length = Number(rawObject.length)
  }
}

export default class Objects {
  public objects: Object[] = []

  constructor(rawObjects: RawObjects) {
    for(const rawObejct of arrayize(rawObjects.object)) {
      const object = new Object(rawObejct)
      this.objects.push(object)
    }
  }
}