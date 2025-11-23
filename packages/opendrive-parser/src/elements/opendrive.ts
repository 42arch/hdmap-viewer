import type ReferencePoint from '../elements/helpers/referencePoint'
import type { IOpenDrive, ReferenceLine } from '../types'
import type { RawOpenDrive } from '../types/raw'
import { XMLParser } from 'fast-xml-parser'
import Header from '../elements/header'
import Road from '../elements/road'
import arrayize from '../utils/arrayize'
import { Junction } from './junction'

class OpenDrive implements IOpenDrive {
  private step: number
  public header: Header
  public roads: Road[] = []
  public junctions: Junction[] = []

  private referenceLines: ReferencePoint[][] = []

  constructor(xml: string, step: number) {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })
    const rawData = xmlParser.parse(xml).OpenDRIVE as RawOpenDrive
    this.step = step

    this.header = new Header(rawData.header)
    this.parseRoads(rawData)
    this.parseJunctions(rawData)
  }

  private parseRoads(rawData: RawOpenDrive): void {
    for (const rawRoad of arrayize(rawData.road)) {
      const road = new Road(rawRoad)
      this.roads.push(road)
    }
  }

  private parseJunctions(rawData: RawOpenDrive): void {
    for (const rawJunction of arrayize(rawData.junction)) {
      const junction = new Junction(rawJunction)
      this.junctions.push(junction)
    }
  }

  process(): void {
    for (const road of this.roads) {
      road.process(this.step)
      this.referenceLines.push(road.getReferenceLine())
    }
  }

  getReferenceLines(): ReferenceLine[] {
    return this.referenceLines
  }

  getRoads(): Road[] {
    return this.roads
  }

  getRoadById(id: string): Road | undefined {
    return this.roads.find(road => road.id === id)
  }
}

export default OpenDrive
