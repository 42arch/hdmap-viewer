import type { ReferenceLine } from '../types'
import type { RawLink, RawRoad, RawRoadLink } from '../types/raw'
import type ReferencePoint from './helpers/referencePoint'
import type { Lane, LaneSection } from './lanes'
import Lanes from './lanes'
import Objects from './objects'
import PlanView from './plan-view'
import { ElevationProfile, LateralProfile } from './profile'

class RoadLink {
  public elementId?: string
  public elementType?: string
  public contactPoint?: string

  constructor(link: RawRoadLink) {
    this.elementId = link.elementId
    this.elementType = link.elementType
    this.contactPoint = link.contactPoint
  }
}

class Link {
  public predecessor?: RoadLink
  public successor?: RoadLink

  constructor(link: RawLink) {
    if (link.predecessor) {
      this.predecessor = new RoadLink(link.predecessor)
    }
    if (link.successor) {
      this.successor = new RoadLink(link.successor)
    }
  }
}

class Road {
  public id: string
  public name: string
  public length: number
  public junction: string
  public link?: Link
  public planView: PlanView
  public lanes: Lanes
  public elevationProfile: ElevationProfile
  public lateralProfile?: LateralProfile
  public objects?: Objects

  private referenceLine: ReferencePoint[] = []

  constructor(rawRoad: RawRoad) {
    this.id = rawRoad.id
    this.name = rawRoad.name
    this.junction = rawRoad.junction
    this.length = Number(rawRoad.length)
    this.link = new Link(rawRoad.link)
    this.planView = new PlanView(rawRoad.planView)
    this.lanes = new Lanes(rawRoad.lanes)
    this.elevationProfile = new ElevationProfile(rawRoad.elevationProfile)
    if (rawRoad.lateralProfile)
      this.lateralProfile = new LateralProfile(rawRoad.lateralProfile)
    if (rawRoad.objects)
      this.objects = new Objects(rawRoad.objects)

  }

  generateReferenceLine(step: number): void {
    const line = this.planView.sample(this.elevationProfile, step)

    this.referenceLine = line
  }

  getReferenceLine(): ReferenceLine {
    return this.referenceLine
  }
    

  getLaneSections(): LaneSection[] {
    if (!this.lanes || !this.lanes.laneSections)
      return []
    return this.lanes.laneSections
  }

  addOffsetToReferenceLine() {
    for(const point of this.referenceLine) {
      const roadS = point.getSOfRoad()
      const offset = this.lanes.calculateOffsetByS(roadS)
      const [px, py, pz] = this.addPostionOfCenterLaneToReferencePoint(point.x, point.y, point.z, point.hdg, offset)
      const sOfLaneSection = this.addSOfLaneSectionToReferenceLine(roadS)
      point.setPositionOfCenterLane([px, py, pz])
      point.setSOfLaneSection(sOfLaneSection)
      point.shiftOffset(offset)
    }
  }

addSOfLaneSectionToReferenceLine(sOfRoad: number) {
    const sortedLaneSections = [...this.getLaneSections()].sort((a, b) => a.s - b.s)
    
    let targetSection = sortedLaneSections[0]
    for(const laneSection of sortedLaneSections) {
      if(sOfRoad >= laneSection.s) {
        targetSection = laneSection
      } else {
        break
      }
    }
    
    return targetSection ? sOfRoad - targetSection.s : sOfRoad
  }

  addPostionOfCenterLaneToReferencePoint(x: number, y:number, z: number, tangent: number, offset: number) {
    const normal = tangent + Math.PI / 2
    let px = x
    let py =y
    let pz =z
    px += Math.cos(normal) * offset
    py += Math.sin(normal) * offset
    
    return [px, py, pz]
  }

  process(step: number) {
    this.generateReferenceLine(step)
    this.addOffsetToReferenceLine()
    this.lanes.processLaneSections(this.referenceLine)
  }

}

export default Road
