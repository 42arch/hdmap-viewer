import type { Position } from "../../types"

export default class ReferencePoint {
  public x: number
  public y: number
  public z: number
  public s: number
  public hdg: number

  private tangent: number
  private sOfRoad: number
  private sOfLaneSection: number
  private offset: number
  private positionOfCenterLane: Position

  constructor(x: number, y: number, z: number, s: number, hdg: number) {
    this.x = x
    this.y = y
    this.z = z
    this.s = s
    this.hdg = hdg

    this.offset = 0
    this.sOfRoad = 0
    this.sOfLaneSection = 0
    this.tangent = 0
    this.positionOfCenterLane = [x, y, z]
  }

  shiftOffset(offset: number) {
    this.offset = offset
  }

  getOffset() {
    return this.offset
  }

  setSOfRoad(sOfRoad: number) {
    this.sOfRoad = sOfRoad
  }

  getSOfRoad() {
    return this.sOfRoad
  }

  setSOfLaneSection(sOfLaneSection: number) {
    this.sOfLaneSection = sOfLaneSection
  }

  getSOfLaneSection() {
    return this.sOfLaneSection
  }

  setTangent(tangent: number) {
    this.tangent = tangent
  }

  getTangent() {
    return this.tangent
  }

  setPositionOfCenterLane(positionOfCenterLane: Position) {
    this.positionOfCenterLane = positionOfCenterLane
  }

  getPositionOfCenterLane() {
    return this.positionOfCenterLane
  }
}
