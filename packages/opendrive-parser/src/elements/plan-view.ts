import type { IElevationProfile, IPlanView } from '../types'
import type { RawPlanView } from '../types/raw'
import type ReferencePoint from './helpers/reference-point'
import arrayize from '../utils/arrayize'
import { Arc, Line, ParamPoly3, Spiral } from './geometry'

type Geometry = Arc | Line | Spiral | ParamPoly3

export default class PlanView implements IPlanView {
  public geometries: Geometry[] = []

  public length: number = 0

  constructor(planView: RawPlanView) {
    for (const rawGeometry of arrayize(planView.geometry)) {
      let geometry
      if (rawGeometry.line === '') {
        geometry = new Line(rawGeometry)
      }
      else if (rawGeometry.arc) {
        geometry = new Arc(rawGeometry)
      }
      else if (rawGeometry.spiral) {
        geometry = new Spiral(rawGeometry)
      }
      else if (rawGeometry.paramPoly3) {
        geometry = new ParamPoly3(rawGeometry)
      }

      geometry && this.geometries.push(geometry)
    }
  }

  sample(elevationProfile: IElevationProfile, step: number, extraS: number[] = []): ReferencePoint[] {
    const referencePoints: ReferencePoint[] = []
    
    for (let i = 0; i < this.geometries.length; i++) {
      const geometry = this.geometries[i]
      const sStartRoad = geometry.s
      const sEndRoad = sStartRoad + geometry.length

      // Filter and map extraS to local S coordinates for this geometry
      const localExtraS = extraS
        .filter(s => s >= sStartRoad && s <= sEndRoad)
        .map(s => s - sStartRoad)

      const points = geometry.sample(elevationProfile, step, localExtraS)
      
      points.forEach((p) => {
        const roadS = p.s + sStartRoad
        p.setSOfRoad(roadS)
      })

      if (i !== 0) {
        // Filter out the first point (local s=0) to avoid duplicates with the previous segment's end
        const noZeroSPoints = points.filter(p => p.s !== 0)
        referencePoints.push(...noZeroSPoints)
      }
      else {
        referencePoints.push(...points)
      }
    }

    return referencePoints
  }
}
