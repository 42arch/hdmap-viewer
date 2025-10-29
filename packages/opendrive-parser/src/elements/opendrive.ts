import type ReferencePoint from '../elements/helpers/referencePoint'
import type { ReferenceLine } from '../types'
import type { RawOpenDrive } from '../types/raw'
import { XMLParser } from 'fast-xml-parser'
import Header from '../elements/header'
import Road from '../elements/road'
import arrayize from '../utils/arrayize'

class OpenDrive {
  private step: number
  public header?: Header
  public roads: Road[] = []

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
  }

  parseRoads(rawData: RawOpenDrive): void {
    for (const rawRoad of arrayize(rawData.road)) {
      const road = new Road(rawRoad)
      this.roads.push(road)
    }
  }

  process(): void {
    for (const road of this.roads) {
      road.process(1)
      this.referenceLines.push(road.getReferenceLine())
    }
  }

  getReferenceLines(): ReferenceLine[] {
    return this.referenceLines
  }

  getRoads(): Road[] {
    return this.roads
  }
}

export default OpenDrive
