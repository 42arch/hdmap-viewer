import type { Level, Source } from './types'
import type { LaneAreaMesh } from './viewer'
import type Viewer from './viewer'
import { DoubleSide, Mesh, MeshBasicMaterial } from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js'

class HighlightManager {
  private viewer: Viewer
  public highlightRoad: LaneAreaMesh | null = null
  public highlightLane: LaneAreaMesh | null = null
  public highlightSection: LaneAreaMesh | null = null
  public highlightPredecessors: LaneAreaMesh | null = null
  public highlightSuccessors: LaneAreaMesh | null = null

  private currentSource: Source | null = null
  private currentKey: string | null = null
  public highlightCallback: ((level: Level, key: string, source: Source) => void) | null = null

  constructor(viewer: Viewer) {
    this.viewer = viewer
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

    const mesh = this.viewer.laneGroup.getObjectByName(laneId) as LaneAreaMesh
    if (!mesh) {
      this.clearHighlightLane()
      return
    }

    const [roadKey, sectionKey] = laneId.split('_')
    this.setHighlightRoad(roadKey!)
    this.setHighlightSection(`${roadKey}_${sectionKey}`)

    this.highlightLane = mesh.clone()
    this.highlightLane.material = this.highlightLane.material.clone()
    this.highlightLane.material.color.set(0x0284C7) // #0284c7
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
    const laneNames = laneSections.flatMap(section => section.getLanes().map(lane => `${roadId}_${section.s}_${lane.id}`))

    for (const laneName of laneNames) {
      const mesh = this.viewer.laneGroup.getObjectByName(laneName) as LaneAreaMesh
      const clonedMesh = mesh.clone()
      clonedMesh.position.y += 0.001
      laneGeometries.push(clonedMesh.geometry)
    }

    const merged = BufferGeometryUtils.mergeGeometries(laneGeometries)
    const material = new MeshBasicMaterial({
      color: 0x38BDF8, // #38bdf8
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
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
    const [roadId, sectionS] = key.split('_')
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
    const laneNames = lanes.map(lane => `${roadId}_${sectionS}_${lane.id}`)

    for (const laneName of laneNames) {
      const mesh = this.viewer.laneGroup.getObjectByName(laneName) as LaneAreaMesh
      const clonedMesh = mesh.clone()
      laneGeometries.push(clonedMesh.geometry)
    }

    const merged = BufferGeometryUtils.mergeGeometries(laneGeometries)
    const material = new MeshBasicMaterial({
      color: 0x0EA5E9, // #0ea5e9
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
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
      const mesh = this.viewer.laneGroup.getObjectByName(laneId) as LaneAreaMesh
      const clonedMesh = mesh.clone()
      clonedMesh.position.y += 0.001
      geometries.push(clonedMesh.geometry)
    }

    const merged = BufferGeometryUtils.mergeGeometries(geometries)
    const material = new MeshBasicMaterial({
      color: 0xEDCC0D, // #edcc0d
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
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
      const mesh = this.viewer.laneGroup.getObjectByName(laneId) as LaneAreaMesh
      const clonedMesh = mesh.clone()
      clonedMesh.position.y += 0.001
      geometries.push(clonedMesh.geometry)
    }

    const merged = BufferGeometryUtils.mergeGeometries(geometries)
    const material = new MeshBasicMaterial({
      color: 0x09DA2F, // #09da2f
      side: DoubleSide,
      depthWrite: false,
      depthTest: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    this.highlightSuccessors = new Mesh(merged, material)
    this.highlightSuccessors.position.y += 0.001
    this.highlightSuccessors.name = `${laneIds.join('_')}`
    this.viewer.scene.add(this.highlightSuccessors)
  }

  clearHighlightSuccessors() {
    if (this.highlightSuccessors) {
      this.viewer.scene.remove(this.highlightSuccessors)
      this.highlightSuccessors.geometry.dispose()
      this.highlightSuccessors.material.dispose()
      this.highlightSuccessors = null
    }
  }

  setHighlight(level: Level, key: string, source: Source) {
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

    const predecessors = this.viewer.openDrive?.graph.getPredecessors(key)
    const successors = this.viewer.openDrive?.graph.getSuccessors(key)
    console.log('+++++++lane+++++++', key)
    console.log('predecessors', predecessors)
    console.log('successors', successors)
    this.setHighlightPredecessors(predecessors ?? [])
    this.setHighlightSuccessors(successors ?? [])

    // const [roadKey, sectionKey, laneKey] = key?.split('_') || []
    // if (roadKey) {
    //   const road = this.viewer.openDrive?.getRoadById(roadKey)
    //   if (!road)
    //     return
    //   const link = road.getLink()
    //   if (!link)
    //     return

    //   if (sectionKey && road) {
    //     const section = road.getLaneSectionByS(Number(sectionKey))

    //     if (laneKey && section) {
    //       const lane = section.getLaneById(laneKey)
    //       const predecessors = lane?.getPredecessors()
    //       const successors = lane?.getSuccessors()
    //       console.log('+++++++lane+++++++', lane?.getUserId())
    //       console.log('predecessor', predecessors?.map(lane => lane.getUserId()))
    //       console.log('successor', successors?.map(lane => lane.getUserId()))
    //       this.setHighlightPredecessors(predecessors?.map(lane => lane.getUserId()) || [])
    //       this.setHighlightSuccessors(successors?.map(lane => lane.getUserId()) || [])
    //     }
    //   }
    // }

    this.highlightCallback?.(level, key, source)

    this.currentSource = source
    this.currentKey = key
  }

  onHighlight(callback: (level: Level, key: string | null, source: Source) => void) {
    this.highlightCallback = callback
  }

  clear(source: Source) {
    if (this.currentSource === source) {
      // this.viewer.scene.remove(this.highlightGroup)
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
