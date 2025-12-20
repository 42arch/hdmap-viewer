import type { Boundary, ILane, ILaneOffset, ILanes, ILaneSection, ILaneWidth, IRoadMark, Position } from '../types'
import type { RawLane, RawLaneOffset, RawLanes, RawLaneSection, RawLaneWidth, RawRoadMark } from '../types/raw'
import type ReferenceLine from './helpers/reference-line'
import type Road from './road'
import arrayize from '../utils/arrayize'

type Side = 'left' | 'right' | 'center'
type Direction = 1 | -1

class LaneOffset implements ILaneOffset {
  public s: number
  public a: number
  public b: number
  public c: number
  public d: number

  constructor(rawLaneOffset: RawLaneOffset) {
    this.s = Number(rawLaneOffset.s)
    this.a = Number(rawLaneOffset.a)
    this.b = Number(rawLaneOffset.b)
    this.c = Number(rawLaneOffset.c)
    this.d = Number(rawLaneOffset.d)
  }
}

class LaneWidth implements ILaneWidth {
  public sOffset: number
  public a: number
  public b: number
  public c: number
  public d: number

  constructor(rawLaneWidth: RawLaneWidth) {
    this.sOffset = Number(rawLaneWidth.sOffset)
    this.a = Number(rawLaneWidth.a)
    this.b = Number(rawLaneWidth.b)
    this.c = Number(rawLaneWidth.c)
    this.d = Number(rawLaneWidth.d)
  }
}

class RoadMark implements IRoadMark {
  public color?: string
  public laneChange?: string
  public material?: string
  public sOffset?: number
  public type?: string
  public width?: number

  constructor(rawRoadMark: RawRoadMark) {
    this.color = rawRoadMark.color
    this.laneChange = rawRoadMark.laneChange
    this.material = rawRoadMark.material
    this.sOffset = Number(rawRoadMark.sOffset)
    this.type = rawRoadMark.type
    this.width = Number(rawRoadMark.width)
  }
}

class Link {
  public predecessor: { id: string }
  public successor: { id: string }

  constructor(rawLink: { predecessor: { id: string }, successor: { id: string } }) {
    this.predecessor = rawLink.predecessor
    this.successor = rawLink.successor
  }
}

export class Lane implements ILane {
  public id: string
  public type: string
  public level: string
  public widths: LaneWidth[] = []
  public roadMark: RoadMark[] = []
  public link?: Link

  private road: Road
  private laneSection: LaneSection
  private direction: Direction = 1
  private side: Side = 'left'
  private length: number = 0
  private boundary: Boundary
  private boundaryLine: Position[] = [] // the outer side boundary line
  private centerLine: Position[] = []

  constructor(rawLane: RawLane, side: Side, road: Road, laneSection: LaneSection) {
    this.road = road
    this.laneSection = laneSection
    this.id = rawLane.id
    this.type = rawLane.type
    this.level = rawLane.level

    this.side = side
    this.direction = side === 'left' ? 1 : -1
    this.boundary = {
      inner: [],
      outer: [],
    }

    for (const rawLaneWidth of arrayize(rawLane.width)) {
      const laneWidth = new LaneWidth(rawLaneWidth)
      this.widths.push(laneWidth)
    }

    for (const rawRoadMark of arrayize(rawLane.roadMark)) {
      const roadMark = new RoadMark(rawRoadMark)
      this.roadMark.push(roadMark)
    }

    this.link = rawLane.link ? new Link(rawLane.link) : undefined
  }

  private getWidthByS(sLocal: number): number {
    const widths = this.widths
    if (!widths.length)
      return 0

    let i = widths.findIndex(
      (w, idx) => idx === widths.length - 1 || (sLocal >= w.sOffset && sLocal < widths[idx + 1].sOffset),
    )
    if (i === -1)
      i = widths.length - 1

    const w = widths[i]
    const ds = sLocal - w.sOffset

    return w.a + w.b * ds + w.c * ds * ds + w.d * ds * ds * ds
  }

  generateBoundaries(referenceLine: ReferenceLine, mostSidePositions: Position[]) {
    const innerPositions = [...mostSidePositions]
    const updatedPositions: Position[] = []
    const points = referenceLine.getPoints()

    for (let i = 0; i < points.length; i++) {
      const referencePoint = points[i]
      const innerPosition = innerPositions[i]

      const tangent = referencePoint.getTangent()
      const sOfLaneSection = referencePoint.getSOfLaneSection()
      const laneWidth = this.getWidthByS(sOfLaneSection)
      const normal = this.side === 'left' ? tangent + Math.PI / 2 : tangent - Math.PI / 2

      const [innerX, innerY, z] = innerPosition
      const outerX = innerX + Math.cos(normal) * laneWidth
      const outerY = innerY + Math.sin(normal) * laneWidth

      updatedPositions.push([outerX, outerY, z])
    }

    const outerPositions = [...updatedPositions]
    this.boundary = {
      inner: innerPositions,
      outer: outerPositions,
    }

    return {
      boundary: this.boundary,
      mostSidePositions: [...outerPositions],
    }
  }

  /**
   * Every lane has a boundary with one inner side and one outer side.
   * This function returns the boundary.
   * @returns the boundary
   */
  getBoundary(): Boundary {
    return this.boundary
  }

  setBoundaryLine(line: Position[]) {
    this.boundaryLine = line
  }

  /**
   * Every lane has a boundary with one inner side and one outer side.
   * This function returns the outer side boundary line.
   * @returns the outer side boundary line
   */
  getBoundaryLine(): Position[] {
    return this.boundaryLine
  }

  /**
   * Returns the unique id of the lane.
   * @returns the unique id of the lane
   */
  getUserId(): string {
    return `${this.road.id}_${this.laneSection.s}_${this.id}`
  }
}

export class LaneSection implements ILaneSection {
  private road: Road
  public left: Lane[] = []
  public center?: Lane
  public right: Lane[] = []
  public s: number

  private boundaries: Boundary[] = []
  private centerLines: ReferenceLine[] = []

  constructor(rawLaneSection: RawLaneSection, road: Road) {
    this.road = road
    for (const rawLane of arrayize(rawLaneSection.left?.lane)) {
      const lane = new Lane(rawLane, 'left', this.road, this)
      this.left.push(lane)
    }

    const centerRawLane = rawLaneSection.center?.lane
    if (centerRawLane) {
      this.center = new Lane(centerRawLane, 'center', this.road, this)
    }

    for (const rawLane of arrayize(rawLaneSection.right?.lane)) {
      const lane = new Lane(rawLane, 'right', this.road, this)
      this.right.push(lane)
    }

    this.s = Number(rawLaneSection.s)
  }

  /**
   * Returns all lanes in this lane section.
   * @returns all lanes sorted by id in this lane section
   */
  public getLanes(): Lane[] {
    const lanes = this.center ? [...this.left, this.center, ...this.right] : [...this.left, ...this.right]
    return lanes.sort((a, b) => Number(a.id) - Number(b.id))
  }

  /**
   * Returns the lane with the given id.
   * @param id the id of the lane
   * @returns the lane with the given id
   */
  public getLaneById(id: string): Lane | undefined {
    return this.getLanes().find(lane => lane.id === id)
  }

  /**
   * Processes the lanes in this lane section.
   * @param referenceLine the reference line
   */
  public processLanes(referenceLine: ReferenceLine) {
    const points = referenceLine.getPoints()
    const leftLanes = this.left.sort((a, b) => Number(a.id) - Number(b.id))
    const rightLanes = this.right.sort((a, b) => Number(b.id) - Number(a.id))

    let mostLeftPositions = points.map(p => p.getPositionOfCenterLane())
    let mostRightPositions = points.map(p => p.getPositionOfCenterLane())

    for (const lane of leftLanes) {
      const { boundary, mostSidePositions } = lane.generateBoundaries(referenceLine, mostLeftPositions)
      this.boundaries.push(boundary)
      lane.setBoundaryLine(mostSidePositions)
      mostLeftPositions = mostSidePositions
    }

    for (const lane of rightLanes) {
      const { boundary, mostSidePositions } = lane.generateBoundaries(referenceLine, mostRightPositions)
      this.boundaries.push(boundary)
      lane.setBoundaryLine(mostSidePositions)
      mostRightPositions = mostSidePositions
    }

    this.center?.setBoundaryLine(points.map(p => p.getPositionOfCenterLane()))
  }

  public getBoundaries(): Boundary[] {
    return this.boundaries
  }

  public getCenterLines(): ReferenceLine[] {
    return this.centerLines
  }
}

export default class Lanes implements ILanes {
  private road: Road
  public laneOffsets: LaneOffset[] = []
  public laneSections: LaneSection[] = []

  constructor(rawLanes: RawLanes, road: Road) {
    this.road = road
    for (const rawLaneOffset of arrayize(rawLanes.laneOffset)) {
      const laneOffset = new LaneOffset(rawLaneOffset)
      this.laneOffsets.push(laneOffset)
    }

    for (const rawLaneSection of arrayize(rawLanes.laneSection)) {
      const laneSection = new LaneSection(rawLaneSection, this.road)
      this.laneSections.push(laneSection)
    }
  }

  calculateOffsetByS(s: number) {
    const sortedLaneOffsets = [...this.laneOffsets].sort((a, b) => a.s - b.s)

    for (const offset of sortedLaneOffsets) {
      const { s: startS, a, b, c, d } = offset
      if (s >= startS) {
        const ds = s - startS
        const offset = a + b * ds + c * ds ** 2 + d * ds ** 3
        return offset
      }
    }
    return 0
  }

  public processLaneSections(referenceLine: ReferenceLine) {
    if (!this.laneSections.length)
      return
    for (const laneSection of this.laneSections) {
      laneSection.processLanes(referenceLine)
    }
  }
}
