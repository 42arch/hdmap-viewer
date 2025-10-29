import type { FormatedConnection, FormatedControl, FormatedController, FormatedElevation, FormatedGeometry, FormatedLane, FormatedLaneLink, FormatedLanes, FormatedLaneSection, FormatedLaneWidth, FormatedRoad, FormatedRoadLink, FormatedRoadMark, FormatedRoadObject, FormatedRoadType, XODRData } from '../types/format'
import type { RawControl, RawController, RawElevation, RawGeometry, RawJunction, RawLane, RawLaneLink, RawLanes, RawLaneSection, RawLaneWidth, RawLConnection, RawObject, RawOpenDrive, RawRoad, RawRoadLink, RawRoadMark, RawType } from '../types/raw'
import { XMLParser } from 'fast-xml-parser'

function handleNullableObjectOrArray<T>(func: (a: T, idx: number) => any, obj?: T | T[]): any[] {
  if (!obj)
    return []
  return Array.isArray(obj) ? obj.map(func) : [func(obj, 0)]
}

class Formatter {
  private xml: string
  private xmlParser: XMLParser
  private openDrive: RawOpenDrive | null = null

  constructor(xml: string) {
    this.xml = xml
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    })

    this.openDrive = this.xmlParser.parse(this.xml).OpenDRIVE as RawOpenDrive
  }

  private handleGeometry(geometry: RawGeometry): FormatedGeometry {
    if (geometry.line === '') {
      return {
        s: Number(geometry.s),
        x: Number(geometry.x),
        y: Number(geometry.y),
        hdg: Number(geometry.hdg),
        length: Number(geometry.length),
        type: 'line',
      }
    }
    else if (geometry.arc) {
      return {
        s: Number(geometry.s),
        x: Number(geometry.x),
        y: Number(geometry.y),
        hdg: Number(geometry.hdg),
        length: Number(geometry.length),
        type: 'arc',
        curvature: Number(geometry.arc.curvature),
      }
    }
    else if (geometry.spiral) {
      return {
        s: Number(geometry.s),
        x: Number(geometry.x),
        y: Number(geometry.y),
        hdg: Number(geometry.hdg),
        length: Number(geometry.length),
        type: 'spiral',
        curvStart: Number(geometry.spiral.curvStart),
        curvEnd: Number(geometry.spiral.curvEnd),
      }
    }
    throw new Error(`Unknown geometry type: ${JSON.stringify(geometry)}`)
  }

  private handleRoadMark(roadMark: RawRoadMark): FormatedRoadMark {
    return {
      color: roadMark.color || '',
      laneChange: roadMark.laneChange || '',
      material: roadMark.material || '',
      sOffset: Number(roadMark.sOffset || 0),
      type: roadMark.type || '',
      width: Number(roadMark.width || 0),
    }
  }

  private handleWidth(width: RawLaneWidth): FormatedLaneWidth {
    return {
      sOffset: Number(width.sOffset || 0),
      a: Number(width.a || 0),
      b: Number(width.b || 0),
      c: Number(width.c || 0),
      d: Number(width.d || 0),
    }
  }

  private handleLane(lane: RawLane): FormatedLane {
    const widths = handleNullableObjectOrArray(this.handleWidth, lane.width)
    const roadMarks = handleNullableObjectOrArray(this.handleRoadMark, lane.roadMark)

    return {
      id: Number(lane.id),
      level: lane.level === 'true',
      type: lane.type || '',
      widths,
      roadMarks,
      userData: lane.userData || '',
    }
  }

  private handleLanes(lanes: RawLanes, length: number): FormatedLanes {
    const handleOffset = (offset: { s: string, a: string, b: string, c: string, d: string }) => ({
      s: Number(offset.s),
      a: Number(offset.a),
      b: Number(offset.b),
      c: Number(offset.c),
      d: Number(offset.d),
    })

    const handleSection = (section: RawLaneSection, idx: number) => {
      const leftLanes = handleNullableObjectOrArray(this.handleLane.bind(this), section.left?.lane)
      const centerLanes = handleNullableObjectOrArray(this.handleLane.bind(this), section.center?.lane)
      const rightLanes = handleNullableObjectOrArray(this.handleLane.bind(this), section.right?.lane)

      return {
        idx,
        left: leftLanes,
        center: centerLanes,
        right: rightLanes,
        s: Number(lanes.laneSection.s || 0),
        length: 0,
      }
    }

    const laneSections = handleNullableObjectOrArray(handleSection, lanes.laneSection) as FormatedLaneSection[]
    for (const section of laneSections) {
      if (section.idx + 1 >= laneSections.length) {
        section.length = length - section.s
      }
      else {
        section.length = laneSections[section.idx + 1].s - section.s
      }
    }

    return {
      laneOffset: handleNullableObjectOrArray(handleOffset, lanes.laneOffset),
      laneSection: laneSections,
    }
  }

  private handleElevation(elevation: XMLElevation) {
    return {
      s: Number(elevation.s),
      a: Number(elevation.a),
      b: Number(elevation.b),
      c: Number(elevation.c),
      d: Number(elevation.d),
    }
  }

  private handleRoadLink(link: XMLRoadLink) {
    return {
      predecessor: {
        elementId: link.predecessor.elementId,
        elementType: link.predecessor.elementType,
      },
      successor: {
        elementId: link.successor.elementId,
        elementType: link.successor.elementType,
        contactPoint: link.successor.contactPoint,
      },
    } as FormatedRoadLink
  }

  private handleRoadTypes(type: XMLType) {
    return {
      s: Number(type.s),
      speed: {
        max: Number(type.speed.max),
        unit: type.speed.unit,
      },
      type: type.type,
    }
  }

  private handleObjects(object: XMLObject) {
    const { id, name, s, t, zOffset, hdg, roll, pitch, orientation, type, width, length } = object
    return {
      id,
      name,
      s: Number(s),
      t: Number(t),
      zOffset: Number(zOffset),
      hdg: Number(hdg),
      roll: Number(roll),
      pitch: Number(pitch),
      orientation,
      type,
      width: Number(width),
      length: Number(length),
    } as FormatedRoadObject
  }

  private handleRoads(road: XMLRoad) {
    const geometries = handleNullableObjectOrArray(this.handleGeometry, road.planView.geometry) as FormatedGeometry[]
    let length = 0
    for (const geom of geometries) {
      length += geom.length
    }

    const elevations = handleNullableObjectOrArray(this.handleElevation, road.elevationProfile.elevation) as FormatedElevation[]
    const types = handleNullableObjectOrArray(this.handleRoadTypes, road.type) as FormatedRoadType[]
    const objects = handleNullableObjectOrArray(this.handleObjects, road.objects?.object) as FormatedRoadObject[]
    return {
      id: road.id || '',
      name: road.name || '',
      junction: road.junction || '',
      link: this.handleRoadLink(road.link),
      length: Number(road.length || 0),
      types,
      planView: {
        geometries,
        length,
      },
      elevationProfile: {
        elevations,
      },
      lanes: this.handleLanes(road.lanes, length),
      objects,
    } as FormatedRoad
  }

  private handleJunctions(junction: XMLJunction) {
    function handleLaneLink(laneLink: XMLLaneLink) {
      return {
        from: laneLink.from,
        to: laneLink.to,
      } as FormatedLaneLink
    }

    function handleConnection(connection: XMLConnection) {
      return {
        id: connection.id,
        incomingRoad: connection.incomingRoad,
        connectingRoad: connection.connectingRoad,
        contactPoint: connection.contactPoint,
        laneLinks: handleNullableObjectOrArray(handleLaneLink, connection.laneLink) as FormatedLaneLink[],
      } as FormatedConnection
    }

    return {
      id: junction.id,
      name: junction.name,
      connection: handleNullableObjectOrArray(handleConnection, junction.connection) as FormatedConnection[],
    }
  }

  private handleController(controller: XMLController) {
    function handleControl(control: XMLControl) {
      return control as FormatedControl
    }

    return {
      id: controller.id,
      name: controller.name,
      controls: handleNullableObjectOrArray(handleControl, controller.control) as FormatedControl[],
    } as FormatedController
  }

  public toObject() {
    if (!this.openDrive) {
      throw new Error('OpenDrive data is not parsed yet.')
    }

    const opendriveData: XODRData = {
      roads: handleNullableObjectOrArray(this.handleRoads.bind(this), this.openDrive.road),
      junctions: handleNullableObjectOrArray(this.handleJunctions.bind(this), this.openDrive.junction),
      controllers: handleNullableObjectOrArray(this.handleController.bind(this), this.openDrive.controller),
      // roads: this.handleRoads(this.openDrive.road),
    }

    return opendriveData
  }
}

export default Formatter
