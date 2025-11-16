import type { IElevationProfile, IPlanView } from '../types'
import type { RawPlanView } from '../types/raw'
import type ReferencePoint from './helpers/referencePoint'
import arrayize from '../utils/arrayize'
import { Arc, Line, Spiral } from './geometry'

type Geometry = Arc | Line | Spiral

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

      geometry && this.geometries.push(geometry)
    }
  }

  sample(elevationProfile: IElevationProfile, step: number): ReferencePoint[] {
    const line: ReferencePoint[] = []
    let sStartRoad = 0
    for (const geometry of this.geometries) {
      const geometryLength = geometry.length
      const points = geometry.sample(elevationProfile, step)
      points.forEach((p) => {
        const roadS = p.s + sStartRoad
        p.setSOfRoad(roadS)
      })

      line.push(...points)
      sStartRoad += geometryLength
    }

    return line
  }
}
