import type { OpenDrive } from '..'
import type { IConnection, IJunction, ILaneLink } from '../types'
import type { RawConnection, RawJunction } from '../types/raw'
import type { Lane } from './lanes'
import arrayize from '../utils/arrayize'

export class Connection implements IConnection {
  public id: string
  public incomingRoad: string
  public connectingRoad: string
  public contactPoint: 'start' | 'end'
  public laneLinks: ILaneLink[]

  constructor(rawConnection: RawConnection) {
    this.id = rawConnection.id
    this.incomingRoad = rawConnection.incomingRoad
    this.connectingRoad = rawConnection.connectingRoad
    this.contactPoint = rawConnection.contactPoint
    this.laneLinks = arrayize(rawConnection.laneLink)
  }
}

export class Junction implements IJunction {
  private openDrive: OpenDrive
  public type: string = 'junction'
  public id: string
  public name: string
  public connections: Connection[]

  constructor(rawJunction: RawJunction, openDrive: OpenDrive) {
    this.openDrive = openDrive
    this.id = rawJunction.id
    this.name = rawJunction.name
    this.connections = arrayize(rawJunction.connection).map(c => new Connection(c))
  }

  getConnectionsByConnectingRoad(connectingRoad: string): Connection[] {
    return this.connections.filter(c => c.connectingRoad === connectingRoad)
  }

  getConnectionsByIncommingRoad(incomingRoad: string): Connection[] {
    return this.connections.filter(c => c.incomingRoad === incomingRoad)
  }

  getPrecessorLanes(roadId: string, laneId: string): Lane[] {
    const road = this.openDrive.getRoadById(roadId)
    if (!road) {
      return []
    }
    const lanes: Lane[] = []
    const connections = this.connections.filter(c => c.connectingRoad === roadId && c.laneLinks.some(l => l.to === laneId))

    for (const connection of connections) {
      const road = this.openDrive.getRoadById(connection.incomingRoad)
      if (!road) {
        continue
      }
      const laneSection = road.getLastLaneSection()
      if (!laneSection) {
        continue
      }
      for (const lanelink of connection.laneLinks) {
        const lane = laneSection.getLaneById(lanelink.from)
        if (!lane) {
          continue
        }
        lanes.push(lane)
      }
    }
    return lanes
  }

  getSuccessorLanes(roadId: string, laneId: string): Lane[] {
    const road = this.openDrive.getRoadById(roadId)
    if (!road) {
      return []
    }
    const lanes: Lane[] = []
    const connections = this.connections.filter(c => c.incomingRoad === roadId && c.laneLinks.some(l => l.from === laneId))

    for (const connection of connections) {
      const road = this.openDrive.getRoadById(connection.connectingRoad)
      if (!road) {
        continue
      }
      const laneSection = road.getFirstLaneSection()
      if (!laneSection) {
        continue
      }
      for (const lanelink of connection.laneLinks) {
        const lane = laneSection.getLaneById(lanelink.to)
        if (!lane) {
          continue
        }
        lanes.push(lane)
      }
    }
    return lanes
  }
}
