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

  sample(elevationsProfile: IElevationProfile, step: number, extraS: number[] = []): ReferencePoint[] {
    const referencePoints: ReferencePoint[] = []
    
    // Construct sample points
    const sampleS = new Set<number>()
    const nums = Math.ceil(this.length / step)
    for (let i = 0; i <= nums; i++) {
      sampleS.add(Math.min(i * step, this.length))
    }
    extraS.forEach(s => {
        if (s >= 0 && s <= this.length) sampleS.add(s)
    })
    
    const sortedS = Array.from(sampleS).sort((a, b) => a - b)

    for (const s of sortedS) {
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

  sample(elevationsProfile: IElevationProfile, step: number, extraS: number[] = []) {
    const referencePoints: ReferencePoint[] = []
    
    const sampleS = new Set<number>()
    const nums = Math.ceil(this.length / step)
    for (let i = 0; i <= nums; i++) {
      sampleS.add(Math.min(i * step, this.length))
    }
    extraS.forEach(s => {
        if (s >= 0 && s <= this.length) sampleS.add(s)
    })
    const sortedS = Array.from(sampleS).sort((a, b) => a - b)

    const curvature = this.curvature

    for (const s of sortedS) {
      const z = elevationsProfile.getElevationByS(s + this.s)
      
      let nx, ny, nHdg

      if (Math.abs(curvature) < 1e-9) {
        // Treat as line to avoid divide by zero
        nx = this.x + s * Math.cos(this.hdg)
        ny = this.y + s * Math.sin(this.hdg)
        nHdg = this.hdg
      } else {
        const a = (2 / curvature) * Math.sin((s * curvature) / 2)
        const hdg_ = this.hdg - Math.PI / 2
        const alpha = (Math.PI - s * curvature) / 2 - hdg_
  
        const dx = -1 * a * Math.cos(alpha)
        const dy = a * Math.sin(alpha)
        nx = this.x + dx
        ny = this.y + dy
        nHdg = this.hdg + s * curvature
      }

      const point = new ReferencePoint(nx, ny, z, s, nHdg)
      point.setTangent(nHdg)
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

  sample(elevationsProfile: IElevationProfile, step: number, extraS: number[] = []) {
    const { curvStart, curvEnd, hdg, length, x, y, s: startS } = this
    const referencePoints: ReferencePoint[] = []

    const cDot = (curvEnd - curvStart) / (length || 1)
    
    // Construct sample points
    const sampleS = new Set<number>()
    const nums = Math.ceil(length / step)
    for (let i = 0; i <= nums; i++) {
      sampleS.add(Math.min(i * step, length))
    }
    extraS.forEach(s => {
        if (s >= 0 && s <= length) sampleS.add(s)
    })
    const sortedS = Array.from(sampleS).sort((a, b) => a - b)

    // Integration state
    let currentX = 0
    let currentY = 0
    let currentS = 0

    const ds = 0.01

    for (const targetS of sortedS) {
      // Integrate from currentS to targetS
      while (currentS < targetS) {
        let d = ds
        if (currentS + d > targetS) {
          d = targetS - currentS
        }
        if (d < 1e-9) { 
             currentS = targetS
             break
        }

        const sMid = currentS + d / 2
        const thetaMid = curvStart * sMid + 0.5 * cDot * sMid * sMid

        currentX += Math.cos(thetaMid) * d
        currentY += Math.sin(thetaMid) * d

        currentS += d
      }

      const thetaAtS = curvStart * targetS + 0.5 * cDot * targetS * targetS

      const cosH = Math.cos(hdg)
      const sinH = Math.sin(hdg)

      const nx = x + currentX * cosH - currentY * sinH
      const ny = y + currentX * sinH + currentY * cosH
      const nHdg = hdg + thetaAtS

      const z = elevationsProfile.getElevationByS(targetS + startS)

      const point = new ReferencePoint(nx, ny, z, targetS, nHdg)
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

  sample(elevationsProfile: IElevationProfile, step: number, extraS: number[] = []) {
    const {
      aU, bU, cU, dU,
      aV, bV, cV, dV,
      hdg, length,
    } = this
    const referencePoints: ReferencePoint[] = []

    const sampleS = new Set<number>()
    const nums = Math.ceil(length / step)
    for (let i = 0; i <= nums; i++) {
      sampleS.add(Math.min(i * step, length))
    }
    extraS.forEach(s => {
        if (s >= 0 && s <= length) sampleS.add(s)
    })
    const sortedS = Array.from(sampleS).sort((a, b) => a - b)

    const len = Math.max(length, 1e-9)

    for (const s of sortedS) {
      let p: number
      if (this.pRange === 'normalized') {
        p = s / len
      }
      else { 
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