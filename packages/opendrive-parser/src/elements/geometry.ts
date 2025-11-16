import type { IArc, IBaseGeometry, IElevationProfile, ILine, ISpiral } from '../types'
import type { RawGeometry } from '../types/raw'
import ReferencePoint from './helpers/referencePoint'

class BaseGeometry implements IBaseGeometry {
  public hdg: number
  public length: number
  public s: number
  public x: number
  public y: number

  constructor(geometry: RawGeometry) {
    this.hdg = Number(geometry.hdg)
    this.length = Number(geometry.length)
    this.s = Number(geometry.s)
    this.x = Number(geometry.x)
    this.y = Number(geometry.y)
  }
}

export class Line extends BaseGeometry implements ILine {
  constructor(geometry: RawGeometry) {
    super(geometry)
  }

  sample(elevationsProfile: IElevationProfile, step: number): ReferencePoint[] {
    const referencePoints: ReferencePoint[] = []
    const nums = Math.ceil(this.length / step)
    for (let i = 0; i <= nums; i++) {
      const s = Math.min(i * step, this.length)

      const z = elevationsProfile.getElevationByS(s + this.s)
      const x = this.x + s * Math.cos(this.hdg)
      const y = this.y + s * Math.sin(this.hdg)
      const point = new ReferencePoint(x, y, z, s, this.hdg)
      point.setTangent(this.hdg)
      referencePoints.push(point)
    }

    return referencePoints
  }
}

export class Arc extends BaseGeometry implements IArc {
  public curvature: number

  constructor(geometry: RawGeometry) {
    super(geometry)

    this.curvature = Number(geometry.arc?.curvature)
  }

  sample(elevationsProfile: IElevationProfile, step: number) {
    const referencePoints: ReferencePoint[] = []
    const nums = Math.ceil(this.length / step)
    const curvature = this.curvature

    for (let i = 0; i <= nums; i++) {
      const s = Math.min(i * step, this.length)

      const z = elevationsProfile.getElevationByS(s + this.s)
      const a = (2 / curvature) * Math.sin((s * curvature) / 2)
      const hdg_ = this.hdg - Math.PI / 2
      const alpha = (Math.PI - s * curvature) / 2 - hdg_

      const dx = -1 * a * Math.cos(alpha)
      const dy = a * Math.sin(alpha)
      const nx = this.x + dx
      const ny = this.y + dy
      const point = new ReferencePoint(nx, ny, z, s, this.hdg + s * curvature)
      point.setTangent(this.hdg + s * curvature)
      referencePoints.push(point)
    }
    return referencePoints
  }
}

export class Spiral extends BaseGeometry implements ISpiral {
  public curvStart: number
  public curvEnd: number

  constructor(geomtry: RawGeometry) {
    super(geomtry)

    this.curvStart = Number(geomtry.spiral?.curvStart)
    this.curvEnd = Number(geomtry.spiral?.curvEnd)
  }

  sample(elevationsProfile: IElevationProfile, step: number) {
    const { curvStart, curvEnd, hdg } = this
    const referencePoints: ReferencePoint[] = []

    const nums = Math.ceil(this.length / step)
    for (let i = 0; i <= nums; i++) {
      const s = Math.min(i * step, this.length)

      const z = elevationsProfile.getElevationByS(s + this.s)
      const a = (curvEnd - curvStart) / this.length
      const ds = 0.1
      let x_ = 0
      let y_ = 0
      let theta = 0
      let localS = 0
      while (localS < s) {
        const kappa = curvStart + a * localS
        theta += kappa * ds
        x_ += Math.cos(theta) * ds
        y_ += Math.sin(theta) * ds
        localS += ds
      }
      const cosH = Math.cos(hdg)
      const sinH = Math.sin(hdg)
      const nx = this.x + x_ * cosH - y_ * sinH
      const ny = this.y + x_ * sinH + y_ * cosH
      const nHdg = hdg + theta

      const point = new ReferencePoint(nx, ny, z, s, nHdg)
      point.setTangent(nHdg)
      referencePoints.push(point)
    }
    return referencePoints
  }
}
