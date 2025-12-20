import type { ContactPoint, ElementType, ILink, IRoad, IRoadLink } from '../types'
import type { RawLink, RawRoad, RawRoadLink } from '../types/raw'
import type { LaneSection } from './lanes'
import type OpenDrive from './opendrive'
import ReferenceLine from './helpers/reference-line'
import Lanes from './lanes'
import Objects from './objects'
import PlanView from './plan-view'
import { ElevationProfile, LateralProfile } from './profile'

export class RoadLink implements IRoadLink {
  public elementId: string
  public elementType: ElementType
  public contactPoint?: ContactPoint

  constructor(rawRoadLink: RawRoadLink) {
    this.elementId = rawRoadLink.elementId
    this.elementType = rawRoadLink.elementType
    this.contactPoint = rawRoadLink.contactPoint
  }
}

export class Link implements ILink {
  public predecessor?: RoadLink
  public successor?: RoadLink

  constructor(rawLink: RawLink) {
    if (rawLink.predecessor) {
      this.predecessor = new RoadLink(rawLink.predecessor)
    }
    if (rawLink.successor) {
      this.successor = new RoadLink(rawLink.successor)
    }
  }
}

class Road implements IRoad {
  private openDrive: OpenDrive
  public type: string = 'road'
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

  private referenceLine?: ReferenceLine

  constructor(rawRoad: RawRoad, openDrive: OpenDrive) {
    this.openDrive = openDrive
    this.id = rawRoad.id
    this.name = rawRoad.name
    this.junction = rawRoad.junction
    this.length = Number(rawRoad.length)
    this.planView = new PlanView(rawRoad.planView)
    this.lanes = new Lanes(rawRoad.lanes, this)
    this.elevationProfile = new ElevationProfile(rawRoad.elevationProfile)
    if (rawRoad.link) {
      this.link = new Link(rawRoad.link)
    }
    if (rawRoad.lateralProfile)
      this.lateralProfile = new LateralProfile(rawRoad.lateralProfile)
    if (rawRoad.objects)
      this.objects = new Objects(rawRoad.objects)
  }

  public getReferenceLine(): ReferenceLine | undefined {
    return this.referenceLine
  }

  public getLaneSections(): LaneSection[] {
    if (!this.lanes || !this.lanes.laneSections)
      return []
    return this.lanes.laneSections
  }

  public getFirstLaneSection(): LaneSection | undefined {
    return this.lanes.laneSections[0]
  }

  public getLastLaneSection(): LaneSection | undefined {
    return this.lanes.laneSections[this.lanes.laneSections.length - 1]
  }

  public getLaneSectionByS(s: number): LaneSection | undefined {
    const sortedLaneSections = [...this.getLaneSections()].sort((a, b) => a.s - b.s)
    let targetSection = sortedLaneSections[0]
    for (const laneSection of sortedLaneSections) {
      if (s >= laneSection.s) {
        targetSection = laneSection
      }
      else {
        break
      }
    }
    return targetSection
  }

  public getLink() {
    return this.link
  }

  private addOffsetToReferenceLine() {
    if (!this.referenceLine) {
      return
    }
    for (const point of this.referenceLine.getPoints()) {
      const roadS = point.getSOfRoad()
      const offset = this.lanes.calculateOffsetByS(roadS)
      const [px, py, pz] = this.calculatePositionOfCenterLane(point.x, point.y, point.z, point.hdg, offset)
      const sOfLaneSection = this.calculateSOfLaneSection(roadS)
      point.setPositionOfCenterLane([px, py, pz])
      point.setSOfLaneSection(sOfLaneSection)
      point.shiftOffset(offset)
    }
  }

  private calculateSOfLaneSection(sOfRoad: number) {
    const sortedLaneSections = [...this.getLaneSections()].sort((a, b) => a.s - b.s)

    let targetSection = sortedLaneSections[0]
    for (const laneSection of sortedLaneSections) {
      if (sOfRoad >= laneSection.s) {
        targetSection = laneSection
      }
      else {
        break
      }
    }

    return targetSection ? sOfRoad - targetSection.s : sOfRoad
  }

  private calculatePositionOfCenterLane(x: number, y: number, z: number, tangent: number, offset: number) {
    const normal = tangent + Math.PI / 2
    let px = x
    let py = y
    const pz = z
    px += Math.cos(normal) * offset
    py += Math.sin(normal) * offset

    return [px, py, pz]
  }

  private generateReferenceLine(step: number): void {
    const points = this.planView.sample(this.elevationProfile, step)

    this.referenceLine = new ReferenceLine(points)
  }

  public process(step: number) {
    this.generateReferenceLine(step)
    this.addOffsetToReferenceLine()
    this.referenceLine && this.lanes.processLaneSections(this.referenceLine)
  }
}

export default Road
