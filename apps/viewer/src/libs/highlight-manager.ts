import type { LaneAreaMesh } from './viewer'
import type Viewer from './viewer'
import { DoubleSide, Group, Mesh, MeshBasicMaterial } from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js'

type Source = 'panel' | 'canvas'

class HighlightManager {
  private viewer: Viewer
  public highlightRoad: LaneAreaMesh | null = null
  public highlightLane: LaneAreaMesh | null = null
  public highlightSection: LaneAreaMesh | null = null

  private currentSource: Source | null = null
  // private highlightGroup: Group

  constructor(viewer: Viewer) {
    this.viewer = viewer
    // this.highlightGroup = new Group()
    // this.highlightGroup.name = 'highlight'
    // this.highlightGroup.renderOrder = 3
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

    const [roadKey, sectionKey] = laneId.split('-')
    this.setHighlightRoad(roadKey!)
    this.setHighlightSection(`${roadKey}-${sectionKey}`)

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

    const road = this.viewer.roads.find(r => r.id === roadId)
    if (!road) {
      return
    }

    const laneGeometries = []
    const laneSections = road.getLaneSections()
    const laneNames = laneSections.flatMap(section => section.getLanes().map(lane => `${roadId}-${section.s}-${lane.id}`))

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
    const [roadId, sectionS] = key.split('-')
    if (!roadId) {
      this.clearHighlightSection()
      return
    }
    if (!sectionS) {
      return
    }
    const road = this.viewer.roads.find(r => r.id === roadId)
    if (!road) {
      return
    }
    const laneSections = road.getLaneSections()
    const laneSection = laneSections.find(section => section.s === Number(sectionS))
    if (!laneSection) {
      return
    }
    const laneGeometries = []
    const lanes = laneSection.getLanes()
    const laneNames = lanes.map(lane => `${roadId}-${sectionS}-${lane.id}`)

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
    this.highlightSection.name = `${roadId}-${sectionS}`
    this.viewer.scene.add(this.highlightSection)
  }

  setHighlight(level: 'road' | 'section' | 'lane', key: string, source: Source) {
    this.clearHighlightLane()
    this.clearHighlightSection()
    this.clearHighlightRoad()

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

    this.currentSource = source

    // ensure group is at the end of render list
    // this.viewer.scene.remove(this.highlightGroup)
    // this.viewer.scene.add(this.highlightGroup)
  }

  clear(source: Source) {
    if (this.currentSource === source) {
      // this.viewer.scene.remove(this.highlightGroup)
      this.clearHighlightRoad()
      this.clearHighlightSection()
      this.clearHighlightLane()
      this.currentSource = null
    }
  }
}

export default HighlightManager
