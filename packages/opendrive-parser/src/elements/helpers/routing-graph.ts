import type { LaneUserId } from '../../types'
import type { Junction } from '../junction'
import type { Lane } from '../lanes'
import type OpenDrive from '../opendrive'
import type { RoadLink } from '../road'
import type Road from '../road'

export interface GraphEdge {
  from: LaneUserId
  to: LaneUserId
  type: 'laneLink' | 'section' | 'junction'
}

class RoutingGraph {
  private openDrive: OpenDrive
  public successors: Map<LaneUserId, LaneUserId[]> = new Map()
  public predecessors: Map<LaneUserId, LaneUserId[]> = new Map()

  constructor(openDrive: OpenDrive) {
    this.openDrive = openDrive
  }

  public addNode(id: LaneUserId) {
    if (!this.successors.has(id))
      this.successors.set(id, [])
    if (!this.predecessors.has(id))
      this.predecessors.set(id, [])
  }

  public addEdge(edge: GraphEdge) {
    this.addNode(edge.from)
    this.addNode(edge.to)

    // 避免重复边
    if (!this.successors.get(edge.from)!.includes(edge.to)) {
      this.successors.get(edge.from)!.push(edge.to)
    }
    if (!this.predecessors.get(edge.to)!.includes(edge.from)) {
      this.predecessors.get(edge.to)!.push(edge.from)
    }
  }

  public getSuccessors(laneId: LaneUserId): LaneUserId[] {
    return this.successors.get(laneId) ?? []
  }

  public getPredecessors(laneId: LaneUserId): LaneUserId[] {
    return this.predecessors.get(laneId) ?? []
  }

  public build() {
    const roads = this.openDrive.getRoads()
    const junctions = this.openDrive.getJunctions()
    // register nodes
    for (const road of roads) {
      for (const laneSection of road.getLaneSections()) {
        for (const lane of laneSection.getLanes()) {
          if (lane.id !== '0') {
            this.addNode(lane.getUserId())
          }
        }
      }
    }
    // 2. Intra-Road (Sections)
    this.processIntraRoads(roads)

    // 3. Lane Link (Road-to-Road via Predecessor/Successor)
    this.processLinkedRoads(roads)

    // 4. Junction (Incomming Road -> Connectiong Road)
    this.processJunctions(junctions)
  }

  public findShortestPath() {
    // todo
  }

  private processIntraRoads(roads: Road[]) {
    for (const road of roads) {
      const sections = road.getLaneSections()
      for (let i = 0; i < sections.length - 1; i++) {
        const sectionA = sections[i]
        const sectionB = sections[i + 1]
        const lanesA = sectionA.getLanes()
        const lanesB = sectionB.getLanes()

        for (const laneA of lanesA) {
          if (laneA.id === '0')
            continue
          // find the successor lane id first
          const successorId = laneA.link?.successor?.id
          let laneB
          if (successorId) {
            laneB = lanesB.find(lb => lb.id === successorId)
          }
          else {
            laneB = lanesB.find(lb => lb.id === laneA.id)
          }
          if (!laneB)
            continue
          // Right Lane (ID < 0): Flow A -> B
          if (Number(laneA.id) < 0 && Number(laneB.id) < 0) {
            this.addEdge({
              from: laneA.getUserId(),
              to: laneB.getUserId(),
              type: 'section',
            })
          }
          // Left Lane (ID > 0): Flow B -> A
          else if (Number(laneA.id) > 0 && Number(laneB.id) > 0) {
            this.addEdge({
              from: laneA.getUserId(),
              to: laneB.getUserId(),
              type: 'section',
            })
          }
        }
      }
    }
  }

  private processLink(currentLanes: Lane[], roadLink: RoadLink, isPredecessor: boolean) {
    const targetRoad = this.openDrive.getRoadById(roadLink.elementId)
    if (!targetRoad)
      return

    const targetLanes = roadLink.contactPoint === 'start'
      ? targetRoad.getFirstLaneSection()?.getLanes()
      : targetRoad.getLastLaneSection()?.getLanes()
    if (!targetLanes)
      return

    for (const lane of currentLanes) {
      if (lane.id === '0')
        continue
      const laneLinkId = isPredecessor ? lane.link?.predecessor?.id : lane.link?.successor?.id
      if (!laneLinkId)
        continue
      const tgt = targetLanes.find(l => l.id === laneLinkId)
      if (!tgt)
        continue
      // Right Lane (ID < 0): 顺着 s 方向 (Predecessor -> Road -> Successor)
      if (Number(lane.id) < 0) {
        if (isPredecessor) {
          // Road Start
          this.addEdge({
            from: tgt.getUserId(),
            to: lane.getUserId(),
            type: 'laneLink',
          })
        }
        else {
          // Road End
          this.addEdge({
            from: lane.getUserId(),
            to: tgt.getUserId(),
            type: 'laneLink',
          })
        }
      }
      // Left Lane (ID > 0): 逆着 s 方向 (Successor -> Road -> Predecessor)
      else {
        if (isPredecessor) {
          // Road Start
          this.addEdge({
            from: lane.getUserId(),
            to: tgt.getUserId(),
            type: 'laneLink',
          })
        }
        else {
          // Road End
          this.addEdge({
            from: tgt.getUserId(),
            to: lane.getUserId(),
            type: 'laneLink',
          })
        }
      }
    }
  }

  private processLinkedRoads(roads: Road[]) {
    for (const road of roads) {
      const sections = road.getLaneSections()
      if (sections.length === 0)
        continue
      const startLanes = road.getFirstLaneSection()?.getLanes() ?? []
      const endLanes = road.getLastLaneSection()?.getLanes() ?? []

      if (road.link?.predecessor && road.link.predecessor.elementType !== 'junction') {
        this.processLink(startLanes, road.link.predecessor, true)
      }
      if (road.link?.successor && road.link.successor.elementType !== 'junction') {
        this.processLink(endLanes, road.link.successor, false)
      }
    }
  }

  private processJunctions(junctions: Junction[]) {
    for (const junction of junctions) {
      for (const connection of junction.connections) {
        const incomingRoad = this.openDrive.getRoadById(connection.incomingRoad)
        const connectingRoad = this.openDrive.getRoadById(connection.connectingRoad)
        if (!incomingRoad || !connectingRoad)
          return

        const incomingSection = connection.contactPoint === 'start'
          ? incomingRoad.getFirstLaneSection()
          : incomingRoad.getLastLaneSection()

        const connectingSection = connectingRoad.getFirstLaneSection()
        if (!incomingSection || !connectingSection)
          return

        const incomingLanes = incomingSection.getLanes()
        const connectingLanes = connectingSection.getLanes()

        for (const link of connection.laneLinks) {
          const fromLane = incomingLanes.find(l => l.id === link.from)
          const toLane = connectingLanes.find(l => l.id === link.to)
          if (!fromLane || !toLane)
            continue

          // validate if the flow direction is valid
          let isValidFlow = false
          if (connection.contactPoint === 'end' && Number(fromLane.id) < 0)
            isValidFlow = true
          if (connection.contactPoint === 'start' && Number(fromLane.id) > 0)
            isValidFlow = true
          if (isValidFlow) {
            this.addEdge({
              from: fromLane.getUserId(),
              to: toLane.getUserId(),
              type: 'junction',
            })
          }
        }
      }
    }
  }
}

export default RoutingGraph
