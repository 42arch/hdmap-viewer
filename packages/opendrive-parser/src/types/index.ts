import type ReferencePoint from '../elements/helpers/referencePoint'
import type { LaneSection, Lane as LaneType } from '../elements/lanes'
import type Road from '../elements/road'
// import type RoadType from '../elements/road'

export type Position = [number, number, number]

export type ReferenceLine = ReferencePoint[]

// export type Road = RoadType
export type Lane = LaneType

export interface Boundary {
  inner: Position[]
  outer: Position[]
}

export interface IRoadLink {
  elementId: string
  elementType: string
  contactPoint?: string
}

export interface ILink {
  predecessor?: IRoadLink
  successor?: IRoadLink
}

export interface IElevation {
  s: number
  a: number
  b: number
  c: number
  d: number
}

export interface IElevationProfile {
  elevations: IElevation[]

  getElevationByS: (s: number) => number
}

export interface ILateralProfile {
  superElevations: IElevation[]
}

export interface IBaseGeometry {
  hdg: number
  length: number
  s: number
  x: number
  y: number
}

export interface ILine extends IBaseGeometry {}
export interface IArc extends IBaseGeometry {
  curvature: number
}
export interface ISpiral extends IBaseGeometry {
  curvStart: number
  curvEnd: number
}

export interface IPlanView {
  length: number
}

export interface ILanes {
  laneOffsets: ILaneOffset[]
  laneSections: ILaneSection[]
}

export interface ILaneSection {
  left: Lane[]
  center?: Lane
  right: Lane[]
  s: number
}

export interface ILaneWidth {
  sOffset: number
  a: number
  b: number
  c: number
  d: number
}

export interface IRoadMark {
  color?: string
  laneChange?: string
  material?: string
  sOffset?: number
  type?: string
  width?: number
}

export interface ILane {
  id: string
  type: string
  level: string
  widths: ILaneWidth[]
  roadMark: IRoadMark[]
}

export interface ILaneOffset {
  s: number
  a: number
  b: number
  c: number
  d: number
}

export interface IRoad {
  id: string
  name: string
  length: number
  junction: string
  link?: ILink
  planView: IPlanView
  lanes: ILanes
  elevationProfile: IElevationProfile
  lateralProfile?: ILateralProfile

  getLaneSections: () => LaneSection[]
}

// Junction
export interface ILaneLink {
  from: string
  to: string
}
export interface IConnection {
  id: string
  incomingRoad: string
  connectingRoad: string
  contactPoint: 'start' | 'end'
  laneLinks: ILaneLink[]
}
export interface IJunction {
  id: string
  name: string
  connections: IConnection[]
}
