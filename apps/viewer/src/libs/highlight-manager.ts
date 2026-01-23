import type { Lane } from 'opendrive-parser'
import type { Vector3 } from 'three'
import type { Level, Source } from './types'
import type { RoadMesh } from './viewer'
import type Viewer from './viewer'
import { DoubleSide, Mesh, MeshBasicMaterial } from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js'
import { isValid, xyToLngLat } from './projection'

interface HighlightParams {
  level: Level
  key: string
  source: Source
  predecessors: string[]
  successors: string[]
}

interface MouseMoveParams {
  coordinates?: {
    s: number
    t: number
    x: number
    y: number
    z: number
    longitude?: number
    latitude?: number
  }
}

class HighlightManager {
  private viewer: Viewer
  public highlightRoad: RoadMesh | null = null
  public highlightLane: RoadMesh | null = null
  public highlightSection: RoadMesh | null = null
  public highlightPredecessors: RoadMesh | null = null
  public highlightSuccessors: RoadMesh | null = null

  private currentSource: Source | null = null
  private currentKey: string | null = null
  public highlightCallback: ((params?: HighlightParams) => void) | null = null
  public mouseMoveCallback: ((params?: MouseMoveParams) => void) | null = null

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  private getLaneFromId(laneId: string): Lane | undefined {
    const parts = laneId.split('_')
    if (parts.length < 3) return undefined
    
    // The format is roadId_sectionS_laneId.
    // However, roadId might contain underscores? Assuming standard format.
    // Better logic: last part is laneId, second last is sectionS, rest is roadId.
    const lId = parts.pop()!
    const sS = parts.pop()!
    const rId = parts.join('_')

    const road = this.viewer.openDrive?.getRoadById(rId)
    if (!road) return undefined

    const section = road.getLaneSectionByS(Number(sS))
    if (!section) return undefined

    return section.getLaneById(lId)
  }

  clearHighlightLane() {
    if (this.highlightLane) {
      this.viewer.scene.remove(this.highlightLane)
      this.highlightLane.geometry.dispose()
      this.highlightLane.material.dispose()
      this.highlightLane = null
    }
  }

  setHighlightLane(laneId: string | null) {
    if (!laneId) {
      this.clearHighlightLane()
      return
    }

    const lane = this.getLaneFromId(laneId)
    if (!lane) {
      this.clearHighlightLane()
      return
    }

    const geometry = this.viewer.createLaneGeometry(lane)
    if (!geometry) return

    const [roadKey, sectionKey] = laneId.split('_')
    this.setHighlightRoad(roadKey!)
    this.setHighlightSection(`${roadKey}_${sectionKey}`)

    const material = new MeshBasicMaterial({
      color: 0x0284C7, // #0284c7
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })

    this.highlightLane = new Mesh(geometry, material)
    this.highlightLane.position.y += 0.001
    this.viewer.scene.add(this.highlightLane)
  }

  clearHighlightRoad() {
    if (this.highlightRoad) {
      this.viewer.scene.remove(this.highlightRoad)
      this.highlightRoad.geometry.dispose()
      this.highlightRoad.material.dispose()
      this.highlightRoad = null
    }
  }

  setHighlightRoad(roadId: string | null) {
    if (!roadId) {
      this.clearHighlightRoad()
      return
    }

    const road = this.viewer.openDrive?.getRoadById(roadId)
    if (!road) {
      return
    }

    const laneGeometries = []
    const laneSections = road.getLaneSections()
    
    for (const section of laneSections) {
        for (const lane of section.getLanes()) {
            const geom = this.viewer.createLaneGeometry(lane)
            if (geom) laneGeometries.push(geom)
        }
    }

    if (laneGeometries.length === 0) return

    const merged = BufferGeometryUtils.mergeGeometries(laneGeometries)
    const material = new MeshBasicMaterial({
      color: 0x38BDF8, // #38bdf8
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })
    this.highlightRoad = new Mesh(merged, material)
    this.highlightRoad.name = `${roadId}`
    this.viewer.scene.add(this.highlightRoad)
  }

  clearHighlightSection() {
    if (this.highlightSection) {
      this.viewer.scene.remove(this.highlightSection)
      this.highlightSection.geometry.dispose()
      this.highlightSection.material.dispose()
      this.highlightSection = null
    }
  }

  setHighlightSection(key: string) {
    const parts = key.split('_')
    const sectionS = parts.pop()
    const roadId = parts.join('_')

    if (!roadId) {
      this.clearHighlightSection()
      return
    }
    if (!sectionS) {
      return
    }
    const road = this.viewer.openDrive?.getRoadById(roadId)
    if (!road) {
      return
    }
    const laneSection = road.getLaneSectionByS(Number(sectionS))
    if (!laneSection) {
      return
    }
    const laneGeometries = []
    const lanes = laneSection.getLanes()

    for (const lane of lanes) {
      const geom = this.viewer.createLaneGeometry(lane)
      if (geom) laneGeometries.push(geom)
    }

    if (laneGeometries.length === 0) return

    const merged = BufferGeometryUtils.mergeGeometries(laneGeometries)
    const material = new MeshBasicMaterial({
      color: 0x0EA5E9, // #0ea5e9
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })
    this.highlightSection = new Mesh(merged, material)
    this.highlightSection.position.y += 0.001
    this.highlightSection.name = `${roadId}_${sectionS}`
    this.viewer.scene.add(this.highlightSection)
  }

  setHighlightPredecessors(laneIds: string[]) {
    if (laneIds.length === 0)
      return
    const geometries = []
    for (const laneId of laneIds) {
      const lane = this.getLaneFromId(laneId)
      if (lane) {
          const geom = this.viewer.createLaneGeometry(lane)
          if (geom) geometries.push(geom)
      }
    }

    if (geometries.length === 0) return

    const merged = BufferGeometryUtils.mergeGeometries(geometries)
    const material = new MeshBasicMaterial({
      color: 0xEDCC0D, // #edcc0d
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })
    this.highlightPredecessors = new Mesh(merged, material)
    this.highlightPredecessors.position.y += 0.001
    this.highlightPredecessors.name = `${laneIds.join('_')}`
    this.viewer.scene.add(this.highlightPredecessors)
  }

  clearHighlightPredecessors() {
    if (this.highlightPredecessors) {
      this.viewer.scene.remove(this.highlightPredecessors)
      this.highlightPredecessors.geometry.dispose()
      this.highlightPredecessors.material.dispose()
      this.highlightPredecessors = null
    }
  }

  setHighlightSuccessors(laneIds: string[]) {
    if (laneIds.length === 0)
      return
    const geometries = []
    for (const laneId of laneIds) {
      const lane = this.getLaneFromId(laneId)
      if (lane) {
          const geom = this.viewer.createLaneGeometry(lane)
          if (geom) geometries.push(geom)
      }
    }

    if (geometries.length === 0) return

    const merged = BufferGeometryUtils.mergeGeometries(geometries)
    const material = new MeshBasicMaterial({
      color: 0x09DA2F, // #09da2f
      side: DoubleSide,
      depthTest: true,
      depthWrite: false,
    })
    this.highlightSuccessors = new Mesh(merged, material)
    this.highlightSuccessors.position.y += 0.001
    this.highlightSuccessors.name = `${laneIds.join('_')}`
    this.viewer.scene.add(this.highlightSuccessors)
  }

  getCoordinates(key: string, position: Vector3 | undefined) {
    if (!position || !this.viewer.openDrive)
      return
    const roadKey = key.split('_')[0]
    const road = this.viewer.openDrive?.getRoadById(roadKey!)
    if (!road)
      return
    const referenceLine = road.getReferenceLine()
    if (!referenceLine)
      return

    const xy = {
      x: position.x,
      y: -position.z, // Notice Here!
    }

    const { s, t } = referenceLine.worldToST(xy)!
    const coordinates = {
      s,
      t,
      x: position.x,
      y: -position.z,
      z: position.y,
    }

    const geoReference = this.viewer.openDrive?.header?.geoReference
    if (geoReference && isValid(geoReference)) {
      const { lng, lat } = xyToLngLat(xy, geoReference)
      return {
        ...coordinates,
        longitude: lng,
        latitude: lat,
      }
    }

    return coordinates
  }

  clearHighlightSuccessors() {
    if (this.highlightSuccessors) {
      this.viewer.scene.remove(this.highlightSuccessors)
      this.highlightSuccessors.geometry.dispose()
      this.highlightSuccessors.material.dispose()
      this.highlightSuccessors = null
    }
  }

  setHighlight(level: Level, key: string, source: Source, position?: Vector3) {
    const coordinates = this.getCoordinates(key, position)
    this.mouseMoveCallback?.({
      coordinates,
    })

    if (this.currentKey === key && this.currentSource === source) {
      return
    }

    this.clearHighlightLane()
    this.clearHighlightSection()
    this.clearHighlightRoad()
    this.clearHighlightPredecessors()
    this.clearHighlightSuccessors()

    switch (level) {
      case 'road':
        this.setHighlightRoad(key)
        break
      case 'section':
        this.setHighlightSection(key)
        break
      case 'lane':
        this.setHighlightLane(key)
        break
    }

    const predecessors = this.viewer.openDrive?.graph.getPredecessors(key) ?? []
    const successors = this.viewer.openDrive?.graph.getSuccessors(key) ?? []
    this.setHighlightPredecessors(predecessors)
    this.setHighlightSuccessors(successors)

    this.highlightCallback?.({
      level,
      key,
      source,
      predecessors,
      successors,
    })

    this.currentSource = source
    this.currentKey = key
  }

  onHighlight(callback: (params?: HighlightParams) => void) {
    this.highlightCallback = callback
  }

  onMouseMove(callback: (params?: MouseMoveParams) => void) {
    this.mouseMoveCallback = callback
  }

  clear(source: Source) {
    if (this.currentSource === source) {
      // this.viewer.scene.remove(this.highlightGroup)
      this.highlightCallback?.()
      this.clearHighlightRoad()
      this.clearHighlightSection()
      this.clearHighlightLane()
      this.clearHighlightPredecessors()
      this.clearHighlightSuccessors()
      this.currentSource = null
    }
  }
}

export default HighlightManager
