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
}
