import type ReferencePoint from '../elements/helpers/referencePoint'
import type { Lane as LaneType } from '../elements/lanes'
import type RoadType from '../elements/road'

export type Position = [number, number, number]

export type ReferenceLine = ReferencePoint[]

export type Road = RoadType
export type Lane = LaneType

export interface Boundary {
  inner: Position[]
  outer: Position[]
}
