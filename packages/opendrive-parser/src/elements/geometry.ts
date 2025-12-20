import type { IArc, IBaseGeometry, IElevationProfile, ILine, IParamPoly3, ISpiral } from '../types'
import type { RawGeometry } from '../types/raw'
import ReferencePoint from './helpers/reference-point'

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

export class ParamPoly3 extends BaseGeometry implements IParamPoly3 {
  public aU: number
  public bU: number
  public cU: number
  public dU: number

  public aV: number
  public bV: number
  public cV: number
  public dV: number
  public pRange: 'normalized' | 'arcLength'

  constructor(geometry: RawGeometry) {
    super(geometry)

    this.aU = Number(geometry.paramPoly3?.aU || 0)
    this.bU = Number(geometry.paramPoly3?.bU || 0)
    this.cU = Number(geometry.paramPoly3?.cU || 0)
    this.dU = Number(geometry.paramPoly3?.dU || 0)
    this.aV = Number(geometry.paramPoly3?.aV || 0)
    this.bV = Number(geometry.paramPoly3?.bV || 0)
    this.cV = Number(geometry.paramPoly3?.cV || 0)
    this.dV = Number(geometry.paramPoly3?.dV || 0)

    this.pRange = (geometry.paramPoly3?.pRange as 'normalized' | 'arcLength') || 'normalized'
  }

  private evalPoly(a: number, b: number, c: number, d: number, p: number) {
    return a + b * p + c * p * p + d * p * p * p
  }

  private evalPolyDeriv(a: number, b: number, c: number, d: number, p: number) {
    return b + 2 * c * p + 3 * d * p * p
  }

  sample(elevationsProfile: IElevationProfile, step: number) {
    const {
      aU,
      bU,
      cU,
      dU,
      aV,
      bV,
      cV,
      dV,
      hdg,
      length,
    } = this
    const referencePoints: ReferencePoint[] = []

    const nums = Math.ceil(length / step)
    const len = Math.max(length, 1e-9)

    for (let i = 0; i <= nums; i++) {
      const s = Math.min(i * step, length)

      let p: number
      if (this.pRange === 'normalized') {
        p = s / len
      }
      else { // 'arcLength'
        p = s
      }

      const u = this.evalPoly(aU, bU, cU, dU, p)
      const v = this.evalPoly(aV, bV, cV, dV, p)

      const du_dp = this.evalPolyDeriv(aU, bU, cU, dU, p)
      const dv_dp = this.evalPolyDeriv(aV, bV, cV, dV, p)
      const dp_ds = this.pRange === 'normalized' ? (1 / len) : 1
      const du_ds = du_dp * dp_ds
      const dv_ds = dv_dp * dp_ds

      const cosH = Math.cos(hdg)
      const sinH = Math.sin(hdg)
      const nx = this.x + u * cosH - v * sinH
      const ny = this.y + u * sinH + v * cosH

      const heading = hdg + Math.atan2(dv_ds, du_ds)

      const z = elevationsProfile.getElevationByS(s + this.s)

      const point = new ReferencePoint(nx, ny, z, s, heading)
      point.setTangent(heading)
      referencePoints.push(point)
    }

    return referencePoints
  }
}
