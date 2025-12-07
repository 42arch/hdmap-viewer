export interface RawOpenDrive {
  header: RawHeader
  road: RawRoad[] | RawRoad
  controller: RawController[] | RawController
  junction: RawJunction[] | RawJunction
}

export interface RawHeader {
  geoReference: string
  userData: RawUserData
  revMajor: string
  revMinor: string
  name: string
  version: string
  date: string
  north: string
  south: string
  east: string
  west: string
  vendor: string
}

export interface RawUserData {
  vectorScene: RawVectorScene
}

export interface RawVectorScene {
  program: string
  version: string
}

export interface RawRoad {
  link: RawLink
  type?: RawType[]
  planView: RawPlanView
  elevationProfile: RawElevationProfile
  lateralProfile?: RawLateralProfile
  lanes: RawLanes
  name: string
  length: string
  id: string
  junction: string
  objects?: RawObjects
  signals?: Signals
  userData?: UserData2
}

export interface RawLink {
  predecessor: RawRoadLink
  successor: RawRoadLink
}

export interface RawRoadLink {
  elementType: 'road' | 'junction'
  elementId: string
  contactPoint?: 'start' | 'end'
}

export interface RawType {
  speed: Speed
  s: string
  type: string
}

export interface Speed {
  max: string
  unit: string
}

export interface RawGeometry {
  hdg: string
  length: string
  line?: string
  arc?: {
    curvature: string
  }
  spiral?: {
    curvStart: string
    curvEnd: string
  }
  paramPoly3?: {
    aU: string
    aV: string
    bU: string
    bV: string
    cU: string
    cV: string
    dU: string
    dV: string
    pRange: string
  }
  s: string
  x: string
  y: string
}

export interface RawPlanView {
  geometry: RawGeometry[] | RawGeometry
}

export interface RawElevation {
  s: string
  a: string
  b: string
  c: string
  d: string
}

export interface RawElevationProfile {
  elevation: RawElevation[] | RawElevation
}

export interface RawSuperElevation {
  s: string
  a: string
  b: string
  c: string
  d: string
}

export interface RawLateralProfile {
  superelevation: RawSuperElevation[] | RawSuperElevation
}

export interface RawLaneOffset {
  s: string
  a: string
  b: string
  c: string
  d: string
}

export interface RawLanes {
  laneOffset: RawLaneOffset | RawLaneOffset[]
  laneSection: RawLaneSection
}

export interface RawLaneSection {
  left?: Left
  center?: Center
  right?: Right
  s: string
}

export interface Left {
  lane: RawLane[] | RawLane
}

export interface Center {
  lane: RawLane
}

export interface Right {
  lane: RawLane[] | RawLane
}

export interface RawRoadMark {
  color: string
  laneChange: string
  material: string
  sOffset: string
  type: string
  width: string
}

export interface RawLaneWidth {
  sOffset: string
  a: string
  b: string
  c: string
  d: string
}

export interface RawLane {
  roadMark: RawRoadMark[]
  width: RawLaneWidth[]
  userData: string
  id: string
  type: string
  level: string
  link?: {
    predecessor: { id: string }
    successor: { id: string }
  }
}

export interface RawObject {
  id: string
  name: string
  s: string
  t: string
  zOffset: string
  hdg: string
  roll: string
  pitch: string
  orientation: string
  type: string
  height?: string
  width: string
  length: string
}

export interface RawObjects {
  object: RawObject[] | RawObject
}

export interface Signals {
  signalReference: any
  signal: any
}

export interface UserData2 {
  vectorRoad: RawVectorRoad
}

export interface RawVectorRoad {
  corner: string
}

export interface RawControl {
  signalId: string
  type: string
}

export interface RawController {
  control: RawControl[] | RawControl
  name: string
  id: string
  sequence: string
}

// raw junction
export interface RawJunction {
  connection: RawConnection[] | RawConnection
  controller: any
  userData: UserData3
  id: string
  name: string
}

export interface RawLaneLink {
  from: string
  to: string
}

export interface RawConnection {
  laneLink: RawLaneLink[] | RawLaneLink
  id: string
  incomingRoad: string
  connectingRoad: string
  contactPoint: 'start' | 'end'
}

export interface UserData3 {
  vectorJunction: RawVectorJunction
}

export interface RawVectorJunction {
  junctionId: string
}
