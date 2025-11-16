import type { IElevation, IElevationProfile, ILateralProfile } from '../types'
import type { RawElevation, RawElevationProfile, RawLateralProfile } from '../types/raw'
import arrayize from '../utils/arrayize'

export class Elevation implements IElevation {
  public s: number = 0
  public a: number
  public b: number
  public c: number
  public d: number

  constructor(rawElevation: RawElevation) {
    this.s = Number(rawElevation.s)
    this.a = Number(rawElevation.a)
    this.b = Number(rawElevation.b)
    this.c = Number(rawElevation.c)
    this.d = Number(rawElevation.d)
  }
}

export class ElevationProfile implements IElevationProfile {
  public elevations: Elevation[] = []

  constructor(rawElevationProfile: RawElevationProfile) {
    for (const rawElevation of arrayize(rawElevationProfile.elevation)) {
      const elevation = new Elevation(rawElevation)
      this.elevations.push(elevation)
    }
  }

  getElevationByS(s: number) {
    const current = [...this.elevations].reverse().find(e => s >= e.s)
    if (!current)
      return 0

    const ds = s - current.s
    const { a, b, c, d } = current
    return a + b * ds + c * ds * ds + d * ds * ds * ds
  }
}

export class LateralProfile implements ILateralProfile {
  public superElevations: Elevation[] = []

  constructor(rawLateralProfile: RawLateralProfile) {
    for (const rawElevation of arrayize(rawLateralProfile.superelevation)) {
      const elevation = new Elevation(rawElevation)
      this.superElevations.push(elevation)
    }
  }
}
