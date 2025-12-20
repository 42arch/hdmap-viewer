import type { IReferenceLine } from '../../types'
import type ReferencePoint from './reference-point'

export default class ReferenceLine implements IReferenceLine {
  public points: ReferencePoint[]

  constructor(points: ReferencePoint[]) {
    this.points = points
  }

  getPoints() {
    return this.points
  }

  worldToST(position: { x: number, y: number }) {
    const points = this.points
    let minDistSq = Infinity
    let closestS = 0
    let closestT = 0

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]

      const vx = p2.x - p1.x
      const vy = p2.y - p1.y
      const wx = position.x - p1.x
      const wy = position.y - p1.y

      const lenSq = vx * vx + vy * vy
      const c1 = wx * vx + wy * vy

      const param = lenSq === 0 ? 0 : c1 / lenSq
      let xx, yy
      let sFactor = param

      if (param < 0) {
        xx = p1.x
        yy = p1.y
        sFactor = 0
      }
      else if (param > 1) {
        xx = p2.x
        yy = p2.y
        sFactor = 1
      }
      else {
        xx = p1.x + param * vx
        yy = p1.y + param * vy
      }

      const dx = position.x - xx
      const dy = position.y - yy
      const distSq = dx * dx + dy * dy
      if (distSq < minDistSq) {
        minDistSq = distSq
        closestS = p1.getSOfRoad() + sFactor * (p2.getSOfRoad() - p1.getSOfRoad())

        const crossProduct = vx * wy - vy * wx
        const dist = Math.sqrt(distSq)
        closestT = (crossProduct > 0) ? dist : -dist
      }
    }
    return {
      s: closestS,
      t: closestT,
    }
  }
}
