import type ReferencePoint from '../elements/helpers/referencePoint'
import type { IOpenDrive, ReferenceLine } from '../types'
import type { RawOpenDrive } from '../types/raw'
import { XMLParser } from 'fast-xml-parser'
import Header from '../elements/header'
import Road from '../elements/road'
import arrayize from '../utils/arrayize'
import { Junction } from './junction'
import RoutingGraph from './routing-graph'

class OpenDrive implements IOpenDrive {
  private step: number
  public header: Header
  public roads: Road[] = []
  public junctions: Junction[] = []
  public graph: RoutingGraph

  private referenceLines: ReferencePoint[][] = []

  constructor(xml: string, step: number) {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })
    const rawData = xmlParser.parse(xml).OpenDRIVE as RawOpenDrive
    this.step = step
    this.graph = new RoutingGraph(this)
    this.header = new Header(rawData.header)
    this.parseRoads(rawData)
    this.parseJunctions(rawData)
  }

  private parseRoads(rawData: RawOpenDrive): void {
    for (const rawRoad of arrayize(rawData.road)) {
      const road = new Road(rawRoad, this)
      this.roads.push(road)
    }
  }

  private parseJunctions(rawData: RawOpenDrive): void {
    for (const rawJunction of arrayize(rawData.junction)) {
      const junction = new Junction(rawJunction, this)
      this.junctions.push(junction)
    }
  }

  process(): void {
    for (const road of this.roads) {
      road.process(this.step)
      this.referenceLines.push(road.getReferenceLine())
    }
    console.log('process')
    this.graph.build()
  }

  getReferenceLines(): ReferenceLine[] {
    return this.referenceLines
  }

  public getRoads(): Road[] {
    return this.roads
  }

  public getRoadById(id: string): Road | undefined {
    return this.roads.find(road => road.id === id)
  }

  public getJunctions(): Junction[] {
    return this.junctions
  }

  public getJunctionById(id: string): Junction | undefined {
    return this.junctions.find(junction => junction.id === id)
  }
}

export default OpenDrive
