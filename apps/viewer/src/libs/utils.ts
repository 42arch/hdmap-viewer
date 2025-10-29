import type { Boundary } from 'opendrive-parser'
import earcut from 'earcut'

export function boundaryToArea(boundary: Boundary) {
  const { inner, outer } = boundary
  const outerPositions = [...outer]
  const innerPositions = [...inner].reverse()
  const ring = [...outerPositions, ...innerPositions]
  const vertices = ring.flat()
  const indices = earcut(vertices, undefined, 3)
  return {
    vertices,
    indices,
  }
}
